const saveHouseholdProfileBtn = document.getElementById("saveHouseholdProfileBtn");
const householdProfileStatus = document.getElementById("householdProfileStatus");

function getHouseholdProfileData() {
    return {
        adults_count: document.getElementById("adults_count").value.trim(),
        children_count: document.getElementById("children_count").value.trim(),
        elderly_present: document.getElementById("elderly_present").value.trim(),
        medical_needs: document.getElementById("medical_needs").value.trim(),
        disabled_person: document.getElementById("disabled_person").value.trim(),
        pregnant_person: document.getElementById("pregnant_person").value.trim(),
        pets_present: document.getElementById("pets_present").value.trim(),
        transport_available: document.getElementById("transport_available").value.trim(),
        profile_status: "Completed"
    };
}

function fillPreview(profile) {
    document.getElementById("preview_adults_count").textContent = profile?.adults_count || "-";
    document.getElementById("preview_children_count").textContent = profile?.children_count || "-";
    document.getElementById("preview_elderly_present").textContent = profile?.elderly_present || "-";
    document.getElementById("preview_medical_needs").textContent = profile?.medical_needs || "-";
    document.getElementById("preview_disabled_person").textContent = profile?.disabled_person || "-";
    document.getElementById("preview_pregnant_person").textContent = profile?.pregnant_person || "-";
    document.getElementById("preview_pets_present").textContent = profile?.pets_present || "-";
    document.getElementById("preview_transport_available").textContent = profile?.transport_available || "-";
    document.getElementById("preview_household_status").textContent = profile?.profile_status || "Not Saved";
}

function fillForm(profile) {
    if (!profile) return;

    document.getElementById("adults_count").value = profile.adults_count || "";
    document.getElementById("children_count").value = profile.children_count || "";
    document.getElementById("elderly_present").value = profile.elderly_present || "";
    document.getElementById("medical_needs").value = profile.medical_needs || "";
    document.getElementById("disabled_person").value = profile.disabled_person || "";
    document.getElementById("pregnant_person").value = profile.pregnant_person || "";
    document.getElementById("pets_present").value = profile.pets_present || "";
    document.getElementById("transport_available").value = profile.transport_available || "";
}

function loadSavedHouseholdProfile() {
    try {
        const profile = JSON.parse(localStorage.getItem("floodreadyHouseholdProfile") || "null");
        fillForm(profile);
        fillPreview(profile);
    } catch {
        fillPreview(null);
    }
}

saveHouseholdProfileBtn.addEventListener("click", () => {
    const profile = getHouseholdProfileData();

    if (
        profile.adults_count === "" ||
        profile.children_count === "" ||
        !profile.elderly_present ||
        !profile.medical_needs ||
        !profile.disabled_person ||
        !profile.pregnant_person ||
        !profile.pets_present ||
        !profile.transport_available
    ) {
        householdProfileStatus.textContent = "Please complete all fields before saving the household details.";
        return;
    }

    localStorage.setItem("floodreadyHouseholdProfile", JSON.stringify(profile));
    fillPreview(profile);
    householdProfileStatus.textContent = "Household details saved successfully.";
});

loadSavedHouseholdProfile();