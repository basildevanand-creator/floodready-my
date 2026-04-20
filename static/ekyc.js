const scanBtn = document.getElementById("scanBtn");
const ekycStatus = document.getElementById("ekycStatus");
const citizenResult = document.getElementById("citizenResult");
const icNumberInput = document.getElementById("ic_number");

const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const cameraPreview = document.getElementById("cameraPreview");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const captureCanvas = document.getElementById("captureCanvas");
const capturedImage = document.getElementById("capturedImage");
const icUpload = document.getElementById("ic_upload");

let currentStream = null;

function fillCitizenData(citizen) {
    document.getElementById("citizenName").textContent = citizen.full_name || "-";
    document.getElementById("citizenId").textContent = citizen.citizen_id || "-";
    document.getElementById("fieldIcNumber").textContent = citizen.ic_number || "-";
    document.getElementById("fieldDob").textContent = citizen.date_of_birth || "-";
    document.getElementById("fieldState").textContent = citizen.state || "-";
    document.getElementById("fieldDistrict").textContent = citizen.district || "-";
    document.getElementById("fieldAddress").textContent = citizen.address || "-";
    document.getElementById("fieldPhone").textContent = citizen.phone || "-";
    document.getElementById("fieldHouseholdStatus").textContent = citizen.household_status || "-";
    document.getElementById("fieldAidStatus").textContent = citizen.aid_status || "-";
}

function clearCitizenData() {
    document.getElementById("citizenName").textContent = "-";
    document.getElementById("citizenId").textContent = "-";
    document.getElementById("fieldIcNumber").textContent = "-";
    document.getElementById("fieldDob").textContent = "-";
    document.getElementById("fieldState").textContent = "-";
    document.getElementById("fieldDistrict").textContent = "-";
    document.getElementById("fieldAddress").textContent = "-";
    document.getElementById("fieldPhone").textContent = "-";
    document.getElementById("fieldHouseholdStatus").textContent = "-";
    document.getElementById("fieldAidStatus").textContent = "-";
}

async function startCamera() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            ekycStatus.textContent = "This browser does not support camera access. You can still upload an IC image.";
            return;
        }

        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
        });

        cameraPreview.srcObject = currentStream;
        cameraPreview.classList.remove("hidden");
        cameraPlaceholder.classList.add("hidden");
        capturedImage.classList.add("hidden");
        ekycStatus.textContent = "Camera preview started. Position the IC inside the frame.";
    } catch (error) {
        console.error("Camera error:", error);
        ekycStatus.textContent = "Unable to access the camera. You can still upload an image of the IC below.";
    }
}

function captureFromCamera() {
    try {
        if (!cameraPreview.srcObject) {
            ekycStatus.textContent = "Start the camera first before capturing an IC image.";
            return;
        }

        const width = cameraPreview.videoWidth || 640;
        const height = cameraPreview.videoHeight || 360;

        captureCanvas.width = width;
        captureCanvas.height = height;

        const context = captureCanvas.getContext("2d");
        context.drawImage(cameraPreview, 0, 0, width, height);

        const imageDataUrl = captureCanvas.toDataURL("image/png");
        capturedImage.src = imageDataUrl;
        capturedImage.classList.remove("hidden");
        cameraPreview.classList.add("hidden");
        ekycStatus.textContent = "IC image captured successfully. You can now verify the citizen record.";
    } catch (error) {
        console.error("Capture error:", error);
        ekycStatus.textContent = "Unable to capture the IC image from camera preview.";
    }
}

function previewUploadedImage(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
        capturedImage.src = event.target.result;
        capturedImage.classList.remove("hidden");
        cameraPreview.classList.add("hidden");
        cameraPlaceholder.classList.add("hidden");
        ekycStatus.textContent = "IC image uploaded successfully. You can now verify the citizen record.";
    };
    reader.readAsDataURL(file);
}

if (startCameraBtn) {
    startCameraBtn.addEventListener("click", startCamera);
}

if (captureBtn) {
    captureBtn.addEventListener("click", captureFromCamera);
}

if (icUpload) {
    icUpload.addEventListener("change", event => {
        const file = event.target.files[0];
        previewUploadedImage(file);
    });
}

if (scanBtn) {
    scanBtn.addEventListener("click", async () => {
        try {
            const ic_number = icNumberInput.value.trim();

            if (!ic_number) {
                ekycStatus.textContent = "Please enter an IC number before verification.";
                citizenResult.classList.add("hidden");
                return;
            }

            scanBtn.disabled = true;
            scanBtn.textContent = "Verifying...";
            ekycStatus.textContent = "Verifying citizen record against the mock e-KYC service...";
            citizenResult.classList.add("hidden");
            clearCitizenData();

            const response = await fetch("/api/mock-ekyc", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ic_number })
            });

            const data = await response.json();

            console.log("e-KYC response:", data);

            if (!response.ok || !data.success) {
                ekycStatus.textContent = data.error || "Verification failed.";
                return;
            }

            fillCitizenData(data.citizen);
            citizenResult.classList.remove("hidden");
            ekycStatus.textContent = "Citizen verified successfully.";
            citizenResult.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
            console.error("Verification error:", error);
            ekycStatus.textContent = "Unable to connect to the verification service.";
        } finally {
            scanBtn.disabled = false;
            scanBtn.textContent = "Verify Citizen Record";
        }
    });
}

window.addEventListener("beforeunload", () => {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
});