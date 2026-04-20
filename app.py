import os
import json
from datetime import datetime, timezone, timedelta
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing. Create a .env file and add your real API key.")

genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.5-flash"
MALAYSIA_TZ = timezone(timedelta(hours=8))


def get_current_malaysia_time():
    return datetime.now(MALAYSIA_TZ).strftime("%d/%m/%Y %H:%M")


def load_citizens():
    data_path = os.path.join("mock_data", "citizens.json")
    with open(data_path, "r", encoding="utf-8") as file:
        return json.load(file)


def save_citizens(citizens):
    data_path = os.path.join("mock_data", "citizens.json")
    with open(data_path, "w", encoding="utf-8") as file:
        json.dump(citizens, file, indent=2)


def load_flood_sensor_data():
    data_path = os.path.join("mock_data", "flood_sensor.json")
    with open(data_path, "r", encoding="utf-8") as file:
        sensors = json.load(file)

    current_time = get_current_malaysia_time()

    for sensor in sensors:
        sensor["last_updated"] = current_time

    return sensors


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/ekyc")
def ekyc_page():
    return render_template("ekyc.html")


@app.route("/relief-trigger")
def relief_trigger_page():
    return render_template("relief_trigger.html")


@app.route("/profile/citizen")
def citizen_profile_page():
    return render_template("citizen_profile.html")


@app.route("/profile/household")
def household_profile_page():
    return render_template("household_profile.html")


@app.route("/profile/documents")
def document_status_page():
    return render_template("document_status.html")


@app.route("/api/flood-dashboard", methods=["GET"])
def flood_dashboard():
    sensors = load_flood_sensor_data()
    return jsonify({
        "success": True,
        "stations": sensors
    })


@app.route("/api/mock-ekyc", methods=["POST"])
def mock_ekyc():
    data = request.get_json()
    ic_number = data.get("ic_number", "").strip()

    if not ic_number:
        return jsonify({"error": "IC number is required."}), 400

    citizens = load_citizens()

    for citizen in citizens:
        if citizen["ic_number"] == ic_number:
            return jsonify({
                "success": True,
                "citizen": citizen
            })

    return jsonify({
        "success": False,
        "error": "Citizen record not found in the mock verification database."
    }), 404


@app.route("/api/trigger-relief", methods=["POST"])
def trigger_relief():
    data = request.get_json()
    station_id = data.get("station_id", "").strip()

    if not station_id:
        return jsonify({"error": "Station ID is required."}), 400

    flood_sensor_data = load_flood_sensor_data()
    citizens = load_citizens()

    matching_sensor = None
    for sensor in flood_sensor_data:
        if sensor["station_id"] == station_id:
            matching_sensor = sensor
            break

    if not matching_sensor:
        return jsonify({
            "success": False,
            "error": "No flood station data found for the selected station."
        }), 404

    triggered = matching_sensor["water_level"] > 2.0

    matched_count = 0
    updated_count = 0

    for citizen in citizens:
        if citizen["district"].lower() == matching_sensor["district"].lower():
            matched_count += 1
            if triggered:
                if citizen["aid_status"] != "Eligible for Aid":
                    citizen["aid_status"] = "Eligible for Aid"
                updated_count += 1

    save_citizens(citizens)

    return jsonify({
        "success": True,
        "station_id": matching_sensor["station_id"],
        "station_name": matching_sensor["station_name"],
        "district": matching_sensor["district"],
        "state": matching_sensor["state"],
        "latitude": matching_sensor["latitude"],
        "longitude": matching_sensor["longitude"],
        "water_level": matching_sensor["water_level"],
        "risk_status": matching_sensor["risk_status"],
        "rainfall_mm": matching_sensor["rainfall_mm"],
        "trend": matching_sensor["trend"],
        "last_updated": matching_sensor["last_updated"],
        "triggered": triggered,
        "matched_count": matched_count,
        "updated_count": updated_count
    })


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()

    stage = data.get("stage", "").strip()
    need = data.get("need", "").strip()
    household_needs = data.get("household_needs", [])
    additional_context = data.get("additional_context", "").strip()
    use_profile = data.get("use_profile", False)
    citizen_profile = data.get("citizen_profile", {})
    household_profile = data.get("household_profile", {})
    document_status = data.get("document_status", {})

    if not stage or not need:
        return jsonify({"error": "Please select a flood stage and primary need."}), 400

    household_text = ", ".join(household_needs) if household_needs else "None selected"

    citizen_profile_text = "No saved citizen profile used."
    if use_profile and citizen_profile:
        citizen_profile_text = json.dumps(citizen_profile, ensure_ascii=False)

    household_profile_text = "No saved household profile used."
    if use_profile and household_profile:
        household_profile_text = json.dumps(household_profile, ensure_ascii=False)

    document_status_text = "No saved document status used."
    if use_profile and document_status:
        document_status_text = json.dumps(document_status, ensure_ascii=False)

    prompt = f"""
You are an AI assistant for FloodReady MY, a Malaysian citizen flood readiness support system.

Your job is to reduce friction for flood-affected users. The response must be short, practical, and easy to act on.
Assume users may be stressed, tired, or in urgent situations.

Selected flood stage:
{stage}

Primary need:
{need}

Quick-selected household needs:
{household_text}

Use saved profile data:
{"Yes" if use_profile else "No"}

Saved citizen profile:
{citizen_profile_text}

Saved household profile:
{household_profile_text}

Saved document status:
{document_status_text}

Additional context:
{additional_context if additional_context else "None provided"}

Return valid JSON only. Do not include markdown fences. Do not include explanations outside JSON.

Use this exact structure:
{{
  "situation_summary": "1-2 sentence summary.",
  "top_actions_now": ["action 1", "action 2", "action 3"],
  "quick_documents_needed": ["doc 1", "doc 2", "doc 3"],
  "aid_status_hint": "A short sentence describing whether aid or official follow-up may be relevant.",
  "detailed_guidance": ["step 1", "step 2", "step 3", "step 4"],
  "common_mistakes": ["mistake 1", "mistake 2", "mistake 3"],
  "final_checklist": ["check 1", "check 2", "check 3"]
}}

Rules:
- Keep top_actions_now to exactly 3 items.
- Keep quick_documents_needed to 3 to 5 items only.
- Keep everything concise and citizen-friendly.
- Prioritise safety first for during-flood situations.
- For before-flood situations, prioritise preparation and readiness.
- For after-flood situations, prioritise safe recovery and documentation.
- For aid-related situations, prioritise low-friction preparation and official next steps.
- Use saved citizen, household, and document information where helpful.
- Do not mention MyDIGITAL in the response.
- Do not write long paragraphs.
"""

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(raw_text)
        return jsonify(parsed)

    except json.JSONDecodeError:
        return jsonify({
            "error": "The AI returned an invalid response format. Please try again."
        }), 500
    except Exception as e:
        return jsonify({
            "error": f"Server error: {str(e)}"
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)