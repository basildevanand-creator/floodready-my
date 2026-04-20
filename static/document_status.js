const saveDocumentStatusBtn = document.getElementById("saveDocumentStatusBtn");
const documentStatusMessage = document.getElementById("documentStatusMessage");

const fileFieldMap = [
    { inputId: "doc_mykad", nameId: "doc_mykad_name", previewId: "preview_doc_mykad", key: "doc_mykad" },
    { inputId: "doc_birth", nameId: "doc_birth_name", previewId: "preview_doc_birth", key: "doc_birth" },
    { inputId: "doc_medical", nameId: "doc_medical_name", previewId: "preview_doc_medical", key: "doc_medical" },
    { inputId: "doc_utility", nameId: "doc_utility_name", previewId: "preview_doc_utility", key: "doc_utility" },
    { inputId: "doc_bank", nameId: "doc_bank_name", previewId: "preview_doc_bank", key: "doc_bank" },
    { inputId: "doc_other", nameId: "doc_other_name", previewId: "preview_doc_other", key: "doc_other" }
];

function getSavedDocumentStatus() {
    try {
        return JSON.parse(localStorage.getItem("floodreadyDocumentStatus") || "null");
    } catch {
        return null;
    }
}

function updateFileNameDisplay(inputId, nameId) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(nameId);

    if (input.files && input.files[0]) {
        label.textContent = input.files[0].name;
    } else {
        label.textContent = "No file selected";
    }
}

function buildDocumentStatusData() {
    const saved = getSavedDocumentStatus() || {};

    const data = {
        doc_mykad: saved.doc_mykad || "Not Uploaded",
        doc_birth: saved.doc_birth || "Not Uploaded",
        doc_medical: saved.doc_medical || "Not Uploaded",
        doc_utility: saved.doc_utility || "Not Uploaded",
        doc_bank: saved.doc_bank || "Not Uploaded",
        doc_other: saved.doc_other || "Not Uploaded",
        profile_status: "Completed"
    };

    fileFieldMap.forEach(field => {
        const input = document.getElementById(field.inputId);
        if (input.files && input.files[0]) {
            data[field.key] = input.files[0].name;
        }
    });

    return data;
}

function fillPreview(data) {
    document.getElementById("preview_doc_mykad").textContent = data?.doc_mykad || "-";
    document.getElementById("preview_doc_birth").textContent = data?.doc_birth || "-";
    document.getElementById("preview_doc_medical").textContent = data?.doc_medical || "-";
    document.getElementById("preview_doc_utility").textContent = data?.doc_utility || "-";
    document.getElementById("preview_doc_bank").textContent = data?.doc_bank || "-";
    document.getElementById("preview_doc_other").textContent = data?.doc_other || "-";
    document.getElementById("preview_document_status").textContent = data?.profile_status || "Not Saved";
}

function fillLabelsFromSaved(data) {
    if (!data) return;

    fileFieldMap.forEach(field => {
        const label = document.getElementById(field.nameId);
        label.textContent = data[field.key] && data[field.key] !== "Not Uploaded" ? data[field.key] : "No file selected";
    });
}

fileFieldMap.forEach(field => {
    const input = document.getElementById(field.inputId);
    input.addEventListener("change", () => updateFileNameDisplay(field.inputId, field.nameId));
});

saveDocumentStatusBtn.addEventListener("click", () => {
    const data = buildDocumentStatusData();
    localStorage.setItem("floodreadyDocumentStatus", JSON.stringify(data));
    fillPreview(data);
    fillLabelsFromSaved(data);
    documentStatusMessage.textContent = "Document status saved successfully.";
});

(function loadSavedDocumentStatus() {
    const saved = getSavedDocumentStatus();
    fillPreview(saved);
    fillLabelsFromSaved(saved);
})();