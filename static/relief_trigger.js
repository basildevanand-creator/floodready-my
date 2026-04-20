const stationTableBody = document.getElementById("stationTableBody");

let dashboardStations = [];
const aidCheckState = {};

function getWaterLevelClass(status) {
    const value = (status || "").toLowerCase();
    if (value.includes("danger")) return "status-danger";
    if (value.includes("critical")) return "status-warning";
    if (value.includes("warning")) return "status-warning";
    if (value.includes("alert")) return "status-alert";
    return "status-normal";
}

function getRainfallStatus(mm) {
    const value = Number(mm || 0);
    if (value <= 0) return { label: "No Rainfall", css: "status-no-rain" };
    if (value <= 10) return { label: "Light", css: "status-light-rain" };
    if (value <= 30) return { label: "Moderate", css: "status-moderate-rain" };
    if (value <= 60) return { label: "Heavy", css: "status-heavy-rain" };
    return { label: "Very Heavy", css: "status-very-heavy-rain" };
}

function formatWaterLevelCell(station) {
    return `
        <div class="portal-cell-stack">
            <div class="portal-main-line">
                <span class="status-dot ${getWaterLevelClass(station.risk_status)}"></span>
                <strong>${station.water_level} m</strong>
                <span class="portal-status-text">${station.risk_status}</span>
            </div>
            <div class="portal-sub-line">Trend: ${station.trend}</div>
            <div class="portal-sub-line">Updated: ${station.last_updated}</div>
        </div>
    `;
}

function formatRainfallCell(station) {
    const rainfall = getRainfallStatus(station.rainfall_mm);
    return `
        <div class="portal-cell-stack">
            <div class="portal-main-line">
                <span class="status-dot ${rainfall.css}"></span>
                <strong>${station.rainfall_mm} mm</strong>
                <span class="portal-status-text">${rainfall.label}</span>
            </div>
            <div class="portal-sub-line">Updated: ${station.last_updated}</div>
        </div>
    `;
}

function formatAidStatusCell(station) {
    const checkedData = aidCheckState[station.station_id];

    if (!checkedData) {
        return `
            <div class="portal-aid-cell">
                <button class="table-trigger-btn" data-station-id="${station.station_id}">
                    Check Aid Status
                </button>
            </div>
        `;
    }

    return `
        <div class="portal-aid-cell">
            <div class="portal-cell-stack">
                <div class="portal-main-line">
                    <span class="status-dot ${checkedData.triggered ? "status-danger" : "status-normal"}"></span>
                    <strong>${checkedData.triggered ? "Aid Likely Available" : "Aid Not Triggered"}</strong>
                </div>
                <div class="portal-sub-line">
                    ${checkedData.triggered
                        ? `People in ${checkedData.district} may receive aid support.`
                        : `This area does not currently exceed the threshold for aid activation.`}
                </div>
                <div class="portal-sub-line">
                    Threshold Check: ${checkedData.water_level} m ${checkedData.triggered ? ">" : "≤"} 2.0 m
                </div>
            </div>
            <button class="table-trigger-btn" data-station-id="${station.station_id}">
                Check Aid Status
            </button>
        </div>
    `;
}

function createStateRow(stateName) {
    const row = document.createElement("tr");
    row.className = "portal-state-row";
    row.innerHTML = `
        <td colspan="4">
            <div class="portal-state-label">State: ${stateName}</div>
        </td>
    `;
    return row;
}

function createStationRow(station) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <div class="portal-station-name">${station.station_name}</div>
            <div class="portal-station-meta">${station.state} • ${station.district}</div>
        </td>
        <td>${formatWaterLevelCell(station)}</td>
        <td>${formatRainfallCell(station)}</td>
        <td>${formatAidStatusCell(station)}</td>
    `;

    return row;
}

function attachAidButtons() {
    document.querySelectorAll(".table-trigger-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const stationId = button.getAttribute("data-station-id");
            await runTrigger(stationId);
        });
    });
}

function renderStations(stations) {
    stationTableBody.innerHTML = "";

    if (!Array.isArray(stations) || stations.length === 0) {
        stationTableBody.innerHTML = `
            <tr>
                <td colspan="4">No station data available.</td>
            </tr>
        `;
        return;
    }

    const sortedStations = [...stations].sort((a, b) => {
        if (a.state === b.state) {
            return a.station_name.localeCompare(b.station_name);
        }
        return a.state.localeCompare(b.state);
    });

    let currentState = "";

    sortedStations.forEach(station => {
        if (station.state !== currentState) {
            currentState = station.state;
            stationTableBody.appendChild(createStateRow(currentState));
        }

        stationTableBody.appendChild(createStationRow(station));
    });

    attachAidButtons();
}

async function runTrigger(stationId) {
    try {
        const response = await fetch("/api/trigger-relief", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ station_id: stationId })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            alert(data.error || "Unable to check aid status for the selected station.");
            return;
        }

        aidCheckState[stationId] = data;
        renderStations(dashboardStations);
    } catch (error) {
        alert("Unable to connect to the flood monitoring service.");
    }
}

async function loadDashboard() {
    try {
        const response = await fetch("/api/flood-dashboard");
        const data = await response.json();

        if (!response.ok || !data.success) {
            stationTableBody.innerHTML = `
                <tr>
                    <td colspan="4">Unable to load station data.</td>
                </tr>
            `;
            return;
        }

        dashboardStations = data.stations;
        renderStations(dashboardStations);
    } catch (error) {
        stationTableBody.innerHTML = `
            <tr>
                <td colspan="4">Unable to connect to the dashboard service.</td>
            </tr>
        `;
    }
}

loadDashboard();