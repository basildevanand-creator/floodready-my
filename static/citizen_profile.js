const saveCitizenProfileBtn = document.getElementById("saveCitizenProfileBtn");
const citizenProfileStatus = document.getElementById("citizenProfileStatus");

function getCitizenProfileData() {
    return {
        full_name: document.getElementById("full_name").value.trim(),
        ic_number: document.getElementById("ic_number").value.trim(),
        phone_number: document.getElementById("phone_number").value.trim(),
        address: document.getElementById("address").value.trim(),
        state: document.getElementById("state").value.trim(),
        district: document.getElementById("district").value.trim(),
        profile_status: "Completed"
    };
}

function fillPreview(profile) {
    document.getElementById("preview_full_name").textContent = profile?.full_name || "-";
    document.getElementById("preview_ic_number").textContent = profile?.ic_number || "-";
    document.getElementById("preview_phone_number").textContent = profile?.phone_number || "-";
    document.getElementById("preview_address").textContent = profile?.address || "-";
    document.getElementById("preview_state").textContent = profile?.state || "-";
    document.getElementById("preview_district").textContent = profile?.district || "-";
    document.getElementById("preview_status").textContent = profile?.profile_status || "Not Saved";
}

function fillForm(profile) {
    if (!profile) return;

    document.getElementById("full_name").value = profile.full_name || "";
    document.getElementById("ic_number").value = profile.ic_number || "";
    document.getElementById("phone_number").value = profile.phone_number || "";
    document.getElementById("address").value = profile.address || "";
    document.getElementById("state").value = profile.state || "";
    document.getElementById("district").value = profile.district || "";
}

function loadSavedProfile() {
    try {
        const profile = JSON.parse(localStorage.getItem("floodreadyCitizenProfile") || "null");
        fillForm(profile);
        fillPreview(profile);
    } catch {
        fillPreview(null);
    }
}

saveCitizenProfileBtn.addEventListener("click", () => {
    const profile = getCitizenProfileData();

    if (!profile.full_name || !profile.ic_number || !profile.phone_number || !profile.address || !profile.state || !profile.district) {
        citizenProfileStatus.textContent = "Please complete all fields before saving the profile.";
        return;
    }

    localStorage.setItem("floodreadyCitizenProfile", JSON.stringify(profile));
    fillPreview(profile);
    citizenProfileStatus.textContent = "Citizen profile saved successfully.";
});

loadSavedProfile();