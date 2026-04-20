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


def build_fallback_response(stage, need, household_needs, additional_context, citizen_profile, household_profile, document_status):
    household_text = ", ".join(household_needs) if household_needs else "your household"
    district = citizen_profile.get("district", "your area") if citizen_profile else "your area"
    state = citizen_profile.get("state", "your state") if citizen_profile else "your state"

    fallback_map = {
        ("Before Flood", "Prepare Documents"): {
            "situation_summary": f"You are preparing important documents before possible flooding in {district}, {state}. The priority is to organise and protect essential records early.",
            "top_actions_now": [
                "Place your most important documents in one waterproof folder or bag.",
                "Keep digital copies of IDs, medical records, and key bills in one safe location.",
                "Make sure every household member knows where the documents are stored."
            ],
            "quick_documents_needed": [
                "MyKad / identity documents",
                "Birth certificates",
                "Medical records or prescriptions",
                "Utility bill or proof of address"
            ],
            "aid_status_hint": "Prepared documents can make later aid or recovery support much easier.",
            "detailed_guidance": [
                "Collect the most important identity, household, and medical documents first.",
                "Separate original documents from copies and keep both in protected storage.",
                "Store one document pack near your emergency bag for quick access.",
                "Check that documents for children, elderly family members, or medical needs are included."
            ],
            "common_mistakes": [
                "Leaving documents in different rooms instead of one safe place.",
                "Forgetting medical papers or prescriptions.",
                "Waiting until floodwater is already near before packing documents."
            ],
            "final_checklist": [
                "Important documents packed",
                "Waterproof storage prepared",
                "All household members informed"
            ]
        },
        ("Before Flood", "Prepare Emergency Bag"): {
            "situation_summary": f"You are preparing an emergency bag for {household_text} before flooding. The goal is to make fast evacuation easier.",
            "top_actions_now": [
                "Pack one easy-to-carry emergency bag with essential items.",
                "Include medicine, phone chargers, water, and small cash.",
                "Keep the bag in a place that can be reached quickly."
            ],
            "quick_documents_needed": [
                "Identity documents",
                "Medical records or medicine list",
                "Emergency contact list"
            ],
            "aid_status_hint": "A ready emergency bag reduces delay if evacuation or relief support becomes necessary.",
            "detailed_guidance": [
                "Pack enough basics for at least short-term movement or evacuation.",
                "Include household-specific items for elderly people, children, or pets if needed.",
                "Check the bag regularly so expired items are replaced.",
                "Keep the emergency bag near the exit or another easy-access location."
            ],
            "common_mistakes": [
                "Making the bag too heavy to carry quickly.",
                "Forgetting medicine or phone charging items.",
                "Packing the bag but storing it somewhere hard to reach."
            ],
            "final_checklist": [
                "Emergency bag packed",
                "Essential medicine included",
                "Bag placed in quick-access location"
            ]
        },
        ("During Flood", "Immediate Safety Steps"): {
            "situation_summary": f"You need immediate flood safety support in {district}, {state}. The priority is protecting people first, especially vulnerable household members.",
            "top_actions_now": [
                "Move everyone to the highest safe area immediately.",
                "Take identity documents, medicine, and phones with you.",
                "Call emergency services if water rises quickly or evacuation is needed."
            ],
            "quick_documents_needed": [
                "MyKad / identity documents",
                "Medical records or prescriptions",
                "Emergency contact list"
            ],
            "aid_status_hint": "If your area is seriously affected, saved identity and household details can help later support steps.",
            "detailed_guidance": [
                "Focus on people, not possessions, if water is entering the home.",
                "Keep children, elderly family members, and anyone with medical needs close together.",
                "Avoid walking or driving through unsafe floodwater.",
                "Monitor official updates and be ready to move if instructed."
            ],
            "common_mistakes": [
                "Trying to save too many household items first.",
                "Separating from family members during urgent movement.",
                "Waiting too long before moving to higher ground."
            ],
            "final_checklist": [
                "All household members gathered",
                "Documents and medicine taken",
                "Emergency contact decision made"
            ]
        },
        ("During Flood", "Evacuation Help"): {
            "situation_summary": f"You need evacuation guidance during active flooding. The focus is moving safely and taking only the most essential items.",
            "top_actions_now": [
                "Prepare to leave with only essential people, documents, medicine, and phones.",
                "Use a safe official evacuation route if available.",
                "Contact emergency services or local responders if transport is needed."
            ],
            "quick_documents_needed": [
                "Identity documents",
                "Medical records",
                "Proof of address if available"
            ],
            "aid_status_hint": "Evacuation records and saved household details may help with later support or shelter registration.",
            "detailed_guidance": [
                "Keep the household together and assign one adult to watch children or elderly family members.",
                "Do not delay evacuation to collect non-essential property.",
                "Turn off electricity only if it is safe to do so.",
                "Move to the nearest safe shelter or instructed location."
            ],
            "common_mistakes": [
                "Taking too many items during evacuation.",
                "Using unsafe routes through deep water.",
                "Leaving medicine behind."
            ],
            "final_checklist": [
                "Essential items packed",
                "Safe route identified",
                "Household ready to move"
            ]
        },
        ("After Flood", "Safe Cleaning"): {
            "situation_summary": "You are starting post-flood cleanup. The priority is safe recovery, health protection, and careful handling of damaged areas.",
            "top_actions_now": [
                "Check that the area is safe before starting cleanup.",
                "Wear protective items such as gloves, boots, and masks if available.",
                "Separate damaged items and begin only basic safe cleaning first."
            ],
            "quick_documents_needed": [
                "Identity documents",
                "Medical records",
                "Utility bill or address proof",
                "Photos of damage if possible"
            ],
            "aid_status_hint": "Documented damage and organised records can support later aid or claims.",
            "detailed_guidance": [
                "Do not switch on electrical items until the area is checked and dry.",
                "Take photos of major damage before throwing items away.",
                "Clean and dry important areas first to reduce health risks.",
                "Keep records of major losses and essential repairs."
            ],
            "common_mistakes": [
                "Throwing away damaged items before recording them.",
                "Cleaning unsafe areas too early.",
                "Ignoring electrical or contamination risks."
            ],
            "final_checklist": [
                "Safety checked",
                "Damage documented",
                "Basic cleaning started carefully"
            ]
        },
        ("After Flood", "Damage Documentation"): {
            "situation_summary": "You are preparing damage records after flooding. The priority is clear documentation for support, claims, or follow-up.",
            "top_actions_now": [
                "Take clear photos of damaged rooms and major items.",
                "List the most important damaged household items first.",
                "Keep all photos and notes in one place."
            ],
            "quick_documents_needed": [
                "Identity documents",
                "Utility bill or proof of address",
                "Bank details if support may be needed",
                "Photos or videos of damage"
            ],
            "aid_status_hint": "Clear damage records can speed up later support or application steps.",
            "detailed_guidance": [
                "Start with high-value or essential household damage first.",
                "Record damaged appliances, furniture, medical items, and children's essentials if relevant.",
                "Keep a dated list of losses and urgent repair needs.",
                "Store copies of all submitted information for follow-up."
            ],
            "common_mistakes": [
                "Taking unclear or incomplete photos.",
                "Failing to keep a written damage list.",
                "Losing track of submitted documents later."
            ],
            "final_checklist": [
                "Damage photos captured",
                "Loss list prepared",
                "Records stored safely"
            ]
        },
        ("Aid Support", "Check Eligibility"): {
            "situation_summary": f"You want to understand possible aid readiness for {district}, {state}. The priority is making sure your key details and supporting records are ready.",
            "top_actions_now": [
                "Check that your saved profile and household details are complete.",
                "Prepare key identity and address documents.",
                "Keep flood impact evidence ready if your household is affected."
            ],
            "quick_documents_needed": [
                "MyKad / identity documents",
                "Utility bill or address proof",
                "Bank details",
                "Flood damage photos if available"
            ],
            "aid_status_hint": "Prepared household and document information can reduce delay when aid-related steps are needed.",
            "detailed_guidance": [
                "Review whether your household information is complete and accurate.",
                "Check that saved document status matches what you actually have ready.",
                "Keep records of damage, evacuation, or disruption if relevant.",
                "Use the relief monitoring page to understand area conditions."
            ],
            "common_mistakes": [
                "Waiting to prepare documents until the last minute.",
                "Forgetting proof of address or bank details.",
                "Not keeping evidence of flood impact."
            ],
            "final_checklist": [
                "Profile reviewed",
                "Documents prepared",
                "Support records ready"
            ]
        },
        ("Aid Support", "Prepare Required Documents"): {
            "situation_summary": "You are preparing documents for possible aid-related steps. The priority is keeping the most relevant records complete and easy to access.",
            "top_actions_now": [
                "Gather identity, address, and household-related documents in one place.",
                "Check that document file names and copies are clear.",
                "Keep digital and physical versions where possible."
            ],
            "quick_documents_needed": [
                "MyKad / identity documents",
                "Utility bill or address proof",
                "Bank details",
                "Medical records if relevant",
                "Flood damage evidence"
            ],
            "aid_status_hint": "Ready documents reduce follow-up delay if support is requested later.",
            "detailed_guidance": [
                "Focus first on identity and address documents since they are commonly needed.",
                "Add medical or dependent-related records if your household has special needs.",
                "Keep document copies in a safe folder for fast reuse.",
                "Review missing items and prepare them early."
            ],
            "common_mistakes": [
                "Uploading unclear document files.",
                "Not checking whether essential records are missing.",
                "Keeping documents scattered across different places."
            ],
            "final_checklist": [
                "Essential documents gathered",
                "Copies prepared",
                "Missing items identified"
            ]
        }
    }

    default_response = {
        "situation_summary": f"You are using FloodReady MY for {stage.lower()} support with a focus on {need.lower()}. The goal is to provide simple next steps for {household_text}.",
        "top_actions_now": [
            "Focus on the most urgent household need first.",
            "Keep essential documents and phones ready and accessible.",
            "Use the saved profile information to reduce repeated preparation."
        ],
        "quick_documents_needed": [
            "Identity documents",
            "Medical records if relevant",
            "Proof of address",
            "Emergency contact details"
        ],
        "aid_status_hint": "Prepared records and clear household information can make later support steps easier.",
        "detailed_guidance": [
            "Review your immediate situation and focus on the safest next action.",
            "Use saved household and document details where possible.",
            "Keep all essential records together and easy to access.",
            "Monitor local flood conditions and act early when needed."
        ],
        "common_mistakes": [
            "Waiting too long before preparing essentials.",
            "Keeping key records in different places.",
            "Focusing on non-essential tasks before urgent needs."
        ],
        "final_checklist": [
            "Immediate need identified",
            "Essential records ready",
            "Next action confirmed"
        ]
    }

    return fallback_map.get((stage, need), default_response)


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

    citizen_profile_text = "No saved citizen profile used."
    if use_profile and citizen_profile:
        citizen_profile_text = json.dumps(citizen_profile, ensure_ascii=False)

    household_profile_text = "No saved household profile used."
    if use_profile and household_profile:
        household_profile_text = json.dumps(household_profile, ensure_ascii=False)

    document_status_text = "No saved document status used."
    if use_profile and document_status:
        document_status_text = json.dumps(document_status, ensure_ascii=False)

    household_text = ", ".join(household_needs) if household_needs else "None selected"

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

    except Exception as e:
        error_text = str(e)

        if "429" in error_text or "quota" in error_text.lower():
            fallback_response = build_fallback_response(
                stage,
                need,
                household_needs,
                additional_context,
                citizen_profile,
                household_profile,
                document_status
            )
            fallback_response["aid_status_hint"] = (
                fallback_response["aid_status_hint"] +
                " Live guidance is temporarily busy, so a backup response is being shown."
            )
            return jsonify(fallback_response)

        return jsonify({
            "error": "The guidance service is temporarily unavailable. Please try again shortly."
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)