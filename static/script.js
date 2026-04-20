const generateBtn = document.getElementById("generateBtn");
const statusText = document.getElementById("status");
const resultSection = document.getElementById("result");
const needOptionsContainer = document.getElementById("needOptions");
const citizenProfileBadge = document.getElementById("citizenProfileBadge");
const householdProfileBadge = document.getElementById("householdProfileBadge");
const documentStatusBadge = document.getElementById("documentStatusBadge");
const profileSummaryBox = document.getElementById("profileSummaryBox");
const householdSummaryBox = document.getElementById("householdSummaryBox");
const documentSummaryBox = document.getElementById("documentSummaryBox");

const stateConfig = {
    "Before Flood": [
        { title: "Prepare Documents", text: "Get essential IDs, records, and important papers ready.", value: "Prepare Documents" },
        { title: "Prepare Emergency Bag", text: "Pack key items for fast evacuation or urgent movement.", value: "Prepare Emergency Bag" },
        { title: "Protect Home", text: "Reduce damage risk to important household items.", value: "Protect Home" },
        { title: "Plan Evacuation", text: "Check routes, shelters, transport, and family contact plans.", value: "Plan Evacuation" }
    ],
    "During Flood": [
        { title: "Immediate Safety Steps", text: "Get urgent actions to protect yourself and your household.", value: "Immediate Safety Steps" },
        { title: "Evacuation Help", text: "Know what to take and where to move safely.", value: "Evacuation Help" },
        { title: "Emergency Contacts", text: "Get the right support and response contacts quickly.", value: "Emergency Contacts" },
        { title: "Protect Important Documents", text: "Secure IDs, medicine, and critical items immediately.", value: "Protect Important Documents" }
    ],
    "After Flood": [
        { title: "Safe Cleaning", text: "Start safe cleanup with health and electrical risks in mind.", value: "Safe Cleaning" },
        { title: "Damage Documentation", text: "Record losses and damage for support, aid, or claims.", value: "Damage Documentation" },
        { title: "Recovery Checklist", text: "See the most important next steps after water recedes.", value: "Recovery Checklist" },
        { title: "Aid Preparation", text: "Prepare the right information for post-flood assistance.", value: "Aid Preparation" }
    ],
    "Aid Support": [
        { title: "Check Eligibility", text: "Understand whether your area or situation may qualify.", value: "Check Eligibility" },
        { title: "Prepare Required Documents", text: "Get the minimum documents ready with less confusion.", value: "Prepare Required Documents" },
        { title: "Submission Guidance", text: "Know the next steps for support requests and assistance.", value: "Submission Guidance" },
        { title: "Follow-Up Steps", text: "Understand what to do after you submit or request help.", value: "Follow-Up Steps" }
    ]
};

let selectedStage = "";
let selectedNeed = "";
const selectedHouseholdNeeds = new Set();

function getSavedCitizenProfile() {
    try {
        return JSON.parse(localStorage.getItem("floodreadyCitizenProfile") || "null");
    } catch {
        return null;
    }
}

function getSavedHouseholdProfile() {
    try {
        return JSON.parse(localStorage.getItem("floodreadyHouseholdProfile") || "null");
    } catch {
        return null;
    }
}

function getSavedDocumentStatus() {
    try {
        return JSON.parse(localStorage.getItem("floodreadyDocumentStatus") || "null");
    } catch {
        return null;
    }
}

function updateProfileCard() {
    const profile = getSavedCitizenProfile();

    if (!profile || !profile.full_name) {
        citizenProfileBadge.textContent = "Set Up";
        citizenProfileBadge.className = "profile-status-badge neutral-badge";
        profileSummaryBox.textContent = "No saved citizen profile has been set up yet.";
        return;
    }

    citizenProfileBadge.textContent = "Completed";
    citizenProfileBadge.className = "profile-status-badge";
    profileSummaryBox.innerHTML = `
        <strong>${profile.full_name}</strong><br>
        ${profile.ic_number}<br>
        ${profile.district}, ${profile.state}
    `;
}

function updateHouseholdCard() {
    const profile = getSavedHouseholdProfile();

    if (!profile || !profile.profile_status) {
        householdProfileBadge.textContent = "Set Up";
        householdProfileBadge.className = "profile-status-badge neutral-badge";
        householdSummaryBox.textContent = "No saved household details have been set up yet.";
        return;
    }

    householdProfileBadge.textContent = "Completed";
    householdProfileBadge.className = "profile-status-badge";
    householdSummaryBox.innerHTML = `
        <strong>${profile.adults_count} adult(s)</strong>, ${profile.children_count} child(ren)<br>
        Elderly: ${profile.elderly_present} • Medical Needs: ${profile.medical_needs}<br>
        Transport: ${profile.transport_available}
    `;
}

function updateDocumentCard() {
    const docs = getSavedDocumentStatus();

    if (!docs || !docs.profile_status) {
        documentStatusBadge.textContent = "Set Up";
        documentStatusBadge.className = "profile-status-badge neutral-badge";
        documentSummaryBox.textContent = "No saved document status has been set up yet.";
        return;
    }

    const uploadedCount = [
        docs.doc_mykad,
        docs.doc_birth,
        docs.doc_medical,
        docs.doc_utility,
        docs.doc_bank,
        docs.doc_other
    ].filter(value => value && value !== "Not Uploaded").length;

    documentStatusBadge.textContent = "Completed";
    documentStatusBadge.className = "profile-status-badge";
    documentSummaryBox.innerHTML = `
        <strong>${uploadedCount} document(s) marked ready</strong><br>
        MyKad: ${docs.doc_mykad !== "Not Uploaded" ? "Ready" : "Missing"} •
        Medical: ${docs.doc_medical !== "Not Uploaded" ? "Ready" : "Missing"}<br>
        Utility / Address Proof: ${docs.doc_utility !== "Not Uploaded" ? "Ready" : "Missing"}
    `;
}

function renderNeedOptions(stage) {
    needOptionsContainer.innerHTML = "";
    const options = stateConfig[stage] || [];

    options.forEach(option => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-card";
        button.dataset.group = "need";
        button.dataset.value = option.value;
        button.innerHTML = `
            <span class="choice-title">${option.title}</span>
            <span class="choice-text">${option.text}</span>
        `;

        button.addEventListener("click", () => {
            selectedNeed = option.value;
            document.querySelectorAll('[data-group="need"]').forEach(el => el.classList.remove("active-choice"));
            button.classList.add("active-choice");
        });

        needOptionsContainer.appendChild(button);
    });
}

function renderList(elementId, items) {
    const element = document.getElementById(elementId);
    element.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No information provided.";
        element.appendChild(item);
        return;
    }

    items.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        element.appendChild(li);
    });
}

function clearResults() {
    document.getElementById("situation_summary").textContent = "";
    document.getElementById("top_actions_now").innerHTML = "";
    document.getElementById("quick_documents_needed").innerHTML = "";
    document.getElementById("aid_status_hint").textContent = "";
    document.getElementById("detailed_guidance").innerHTML = "";
    document.getElementById("common_mistakes").innerHTML = "";
    document.getElementById("final_checklist").innerHTML = "";
}

document.querySelectorAll('[data-group="stage"]').forEach(button => {
    button.addEventListener("click", () => {
        selectedStage = button.dataset.value;
        selectedNeed = "";

        document.querySelectorAll('[data-group="stage"]').forEach(el => el.classList.remove("active-choice"));
        button.classList.add("active-choice");

        renderNeedOptions(selectedStage);
    });
});

document.querySelectorAll('[data-group="household"]').forEach(button => {
    button.addEventListener("click", () => {
        const value = button.dataset.value;

        if (selectedHouseholdNeeds.has(value)) {
            selectedHouseholdNeeds.delete(value);
            button.classList.remove("active-chip");
        } else {
            selectedHouseholdNeeds.add(value);
            button.classList.add("active-chip");
        }
    });
});

generateBtn.addEventListener("click", async () => {
    const additional_context = document.getElementById("additionalContext").value.trim();
    const use_profile = document.getElementById("useProfile").checked;
    const citizen_profile = getSavedCitizenProfile();
    const household_profile = getSavedHouseholdProfile();
    const document_status = getSavedDocumentStatus();

    if (!selectedStage || !selectedNeed) {
        statusText.textContent = "Please select a flood stage and primary need first.";
        resultSection.classList.add("hidden");
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    statusText.textContent = "Generating your guided support...";
    clearResults();
    resultSection.classList.add("hidden");

    try {
        const response = await fetch("/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                stage: selectedStage,
                need: selectedNeed,
                household_needs: Array.from(selectedHouseholdNeeds),
                additional_context,
                use_profile,
                citizen_profile,
                household_profile,
                document_status
            })
        });

        const data = await response.json();

        if (!response.ok) {
            statusText.textContent = data.error || "Something went wrong while generating the guided support.";
            return;
        }

        document.getElementById("situation_summary").textContent = data.situation_summary || "No summary provided.";
        renderList("top_actions_now", data.top_actions_now);
        renderList("quick_documents_needed", data.quick_documents_needed);
        document.getElementById("aid_status_hint").textContent = data.aid_status_hint || "No aid hint provided.";
        renderList("detailed_guidance", data.detailed_guidance);
        renderList("common_mistakes", data.common_mistakes);
        renderList("final_checklist", data.final_checklist);

        resultSection.classList.remove("hidden");
        statusText.textContent = "Guided support generated successfully.";
        resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        statusText.textContent = "Error connecting to the server. Please try again.";
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Get Guided Support";
    }
});

updateProfileCard();
updateHouseholdCard();
updateDocumentCard();