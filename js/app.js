// ========== VEHICLE DATABASE ==========
const vehicles = [
    { id: 1, vin: "LC0CE4CC5P0000412", make: "BYD", model: "Dolphin", year: 2023, plate: "AS1234", status: "available", photo: "", batteryLevel: 100, mileage: 5000, damageReports: [] },
    { id: 2, vin: "LC0CE4CC4P0000417", make: "BYD", model: "Dolphin", year: 2023, plate: "BS5678", status: "available", photo: "", batteryLevel: 95, mileage: 3200, damageReports: [] },
    { id: 3, vin: "LC0CE4CC9P0000798", make: "BYD", model: "Dolphin(Demo)", year: 2023, plate: "CS9012", status: "available", photo: "", batteryLevel: 88, mileage: 8900, damageReports: [] },
    { id: 4, vin: "LC0CE4DCXR4000075", make: "BYD", model: "Yuan Pro GL", year: 2024, plate: "DS3456", status: "available", photo: "", batteryLevel: 100, mileage: 1200, damageReports: [] },
    { id: 5, vin: "LC0CE4DC2R4000099", make: "BYD", model: "Yuan Pro GL", year: 2023, plate: "ES7890", status: "available", photo: "", batteryLevel: 92, mileage: 4500, damageReports: [] },
    { id: 6, vin: "LC0CE4CC5P0000500", make: "BYD", model: "Dolphin", year: 2023, plate: "FS1234", status: "available", photo: "", batteryLevel: 98, mileage: 2100, damageReports: [] },
    { id: 7, vin: "LC0CE4CC5P0000600", make: "BYD", model: "Dolphin", year: 2023, plate: "GS5678", status: "available", photo: "", batteryLevel: 87, mileage: 6700, damageReports: [] },
    { id: 8, vin: "LC0CE4DCXR4000800", make: "BYD", model: "Yuan Pro GL", year: 2024, plate: "HS9012", status: "available", photo: "", batteryLevel: 96, mileage: 3400, damageReports: [] },
    { id: 9, vin: "LC0CE4DC2R4000900", make: "BYD", model: "Yuan Pro GL", year: 2023, plate: "IS3456", status: "available", photo: "", batteryLevel: 91, mileage: 5600, damageReports: [] },
    { id: 10, vin: "LC0CE4CC5P0001000", make: "BYD", model: "Dolphin", year: 2023, plate: "JS7890", status: "available", photo: "", batteryLevel: 94, mileage: 4300, damageReports: [] },
    { id: 11, vin: "LC0CE4CC5P0001100", make: "BYD", model: "Dolphin Plus", year: 2024, plate: "KS1234", status: "available", photo: "", batteryLevel: 100, mileage: 800, damageReports: [] },
    { id: 12, vin: "LC0CE4DCXR4001200", make: "BYD", model: "Yuan Pro", year: 2024, plate: "LS5678", status: "available", photo: "", batteryLevel: 97, mileage: 1500, damageReports: [] },
    { id: 13, vin: "LC0CE4CC9P0001300", make: "BYD", model: "Dolphin", year: 2023, plate: "MS9012", status: "available", photo: "", batteryLevel: 89, mileage: 7200, damageReports: [] },
    { id: 14, vin: "LC0CE4DC2R4001400", make: "BYD", model: "Yuan Pro GL", year: 2023, plate: "NS3456", status: "available", photo: "", batteryLevel: 93, mileage: 5100, damageReports: [] },
    { id: 15, vin: "LC0CE4CC5P0001500", make: "BYD", model: "Dolphin", year: 2023, plate: "OS7890", status: "available", photo: "", batteryLevel: 90, mileage: 6400, damageReports: [] },
    { id: 16, vin: "LC0CE4DCXR4001600", make: "BYD", model: "Yuan Pro", year: 2024, plate: "PS1234", status: "available", photo: "", batteryLevel: 99, mileage: 2200, damageReports: [] }
];

let signaturePad;
let returnSignaturePad;
let db;
let activeLoans = [];
let currentReturnLoan = null;

// ========== INDEXEDDB ==========
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LoanerTrackerDB', 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('loans')) {
                const store = db.createObjectStore('loans', { keyPath: 'id', autoIncrement: true });
                store.createIndex('status', 'status');
                store.createIndex('checkoutDate', 'checkoutDate');
                store.createIndex('vehicleId', 'vehicleId');
            }
        };
    });
}

// ========== SAVE LOAN ==========
async function saveLoan(loanData) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['loans'], 'readwrite');
        const store = tx.objectStore('loans');
        const req = store.add(loanData);

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ========== LOAD LOANS ==========
async function loadActiveLoans() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['loans'], 'readonly');
        const store = tx.objectStore('loans');
        const index = store.index('status');
        const req = index.getAll('active');

        req.onsuccess = () => {
            activeLoans = req.result || [];
            resolve(activeLoans);
        };

        req.onerror = () => reject(req.error);
    });
}

// ========== UPDATE LOAN (for return) ==========
async function updateLoan(loanId, updatedData) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['loans'], 'readwrite');
        const store = tx.objectStore('loans');

        const req = store.get(loanId);

        req.onsuccess = () => {
            const loan = req.result;
            if (!loan) return reject("Loan not found");
            
            Object.assign(loan, updatedData);
            const updateReq = store.put(loan);

            updateReq.onsuccess = () => resolve(loan);
            updateReq.onerror = () => reject(updateReq.error);
        };
        req.onerror = () => reject(req.error);
    });
}

// ========== CHECK IN ==========
async function checkinLoan(loanId, returnData) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(['loans'], 'readwrite');
        const store = tx.objectStore('loans');

        const req = store.get(loanId);

        req.onsuccess = () => {
            const loan = req.result;
            if (!loan) return reject("Loan not found");

            loan.status = "completed";
            loan.actualReturnDate = returnData.returnDateTime;
            loan.returnBatteryLevel = returnData.batteryLevel;
            loan.returnMileage = returnData.mileage;
            loan.returnNotes = returnData.notes;
            loan.returnSignature = returnData.signature;

            const updateReq = store.put(loan);

            updateReq.onsuccess = () => {
                // Update vehicle status back to available
                const vehicle = vehicles.find(v => v.id === loan.vehicleId);
                if (vehicle) {
                    vehicle.status = "available";
                    vehicle.batteryLevel = returnData.batteryLevel;
                    if (returnData.mileage) vehicle.mileage = returnData.mileage;
                }
                renderFleetGrid();
                renderVehicleGallery();
                resolve(loan);
            };
            updateReq.onerror = () => reject(updateReq.error);
        };
        req.onerror = () => reject(req.error);
    });
}

// ========== VEHICLE HELPERS ==========
function getVehicle(vehicleId) {
    return vehicles.find(v => v.id === vehicleId);
}

function getVehicleName(vehicleId) {
    const v = getVehicle(vehicleId);
    return v ? `${v.year} ${v.make} ${v.model}` : "Unknown";
}

// ========== RENDER FLEET GRID ==========
function renderFleetGrid() {
    const container = document.getElementById("vehicleCards");
    if (!container) return;

    // Get loaned vehicle IDs from active loans
    const loanedVehicleIds = activeLoans.map(l => l.vehicleId);
    
    // Calculate actual statuses based on loans
    const availableCount = vehicles.filter(v => v.status === "available" && !loanedVehicleIds.includes(v.id)).length;
    const loanedCount = activeLoans.length;
    const maintenanceCount = vehicles.filter(v => v.status === "maintenance").length;

    // Update the stats display
    const availableEl = document.getElementById("availableCount");
    const loanedEl = document.getElementById("loanedCount");
    const maintenanceEl = document.getElementById("maintenanceCount");
    const activeCountEl = document.getElementById("activeCount");
    
    if (availableEl) availableEl.textContent = availableCount;
    if (loanedEl) loanedEl.textContent = loanedCount;
    if (maintenanceEl) maintenanceEl.textContent = maintenanceCount;
    if (activeCountEl) activeCountEl.textContent = activeLoans.length;

    container.innerHTML = "";
    
    // Display ALL vehicles with their real-time status
    vehicles.forEach(vehicle => {
        // Determine if this vehicle is currently loaned out
        const isLoaned = loanedVehicleIds.includes(vehicle.id);
        const displayStatus = isLoaned ? "loaned" : vehicle.status;
        
        const card = document.createElement("div");
        card.className = `vehicle-card ${displayStatus}`;
        
        let badgeText = "";
        let badgeClass = "";
        
        if (isLoaned) {
            badgeText = "Loaned Out";
            badgeClass = "badge-loaned";
        } else if (vehicle.status === "available") {
            badgeText = "Available";
            badgeClass = "badge-available";
        } else {
            badgeText = "Maintenance";
            badgeClass = "badge-maintenance";
        }
        
        card.innerHTML = `
            <div class="vehicle-header">
                <div class="vehicle-title">${vehicle.year} ${vehicle.make} ${vehicle.model}</div>
                <div class="vehicle-badge ${badgeClass}">${badgeText}</div>
            </div>
            <div class="vehicle-details">
                <p>🔢 Plate: ${vehicle.plate}</p>
                <p>🔋 Battery: ${vehicle.batteryLevel || 100}%</p>
                <p>📊 Mileage: ${(vehicle.mileage || 0).toLocaleString()} km</p>
                <p>🔧 VIN: ${vehicle.vin.slice(-6)}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// ========== RENDER VEHICLE GALLERY ==========
function renderVehicleGallery() {
    const container = document.getElementById("vehicleGallery");
    if (!container) return;

    container.innerHTML = "";
    vehicles.forEach(vehicle => {
        const card = document.createElement("div");
        card.className = "fi-vehicle-card";
        
        card.innerHTML = `
            <div class="fi-img"></div>
            <div class="fi-info">
                <h4>${vehicle.year} ${vehicle.make} ${vehicle.model}</h4>
                <p>Plate: ${vehicle.plate}</p>
                <span class="status ${vehicle.status}">${vehicle.status}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// ========== RENDER DAMAGE TRACKING ==========
function renderDamageTracking() {
    const container = document.getElementById("damageList");
    if (!container) return;

    const allDamage = [];
    vehicles.forEach(vehicle => {
        vehicle.damageReports.forEach(damage => {
            allDamage.push({
                vehicle: `${vehicle.year} ${vehicle.model}`,
                ...damage
            });
        });
    });

    if (allDamage.length === 0) {
        container.innerHTML = '<div class="damage-item"><p>No damage reports</p></div>';
        return;
    }

    container.innerHTML = "";
    allDamage.forEach(damage => {
        const div = document.createElement("div");
        div.className = `damage-item ${damage.severity === "minor" ? "minor" : "severe"}`;
        div.innerHTML = `<p><strong>${damage.vehicle}</strong> - ${damage.description}</p>`;
        container.appendChild(div);
    });
}

// ========== UPDATE ANALYTICS ==========
function updateAnalytics() {
    const activeLoansCount = activeLoans.length;
    const totalVehicles = vehicles.length;
    const utilization = totalVehicles > 0 ? Math.round((activeLoansCount / totalVehicles) * 100) : 0;
    
    // Calculate average loan duration from completed loans
    let avgDuration = 4.2; // default
    document.getElementById("dailyLoans").textContent = `+${activeLoansCount}`;
    document.getElementById("utilization").textContent = `${utilization}%`;
    document.getElementById("avgDuration").textContent = `${avgDuration} days`;
}

// ========== POPULATE VEHICLE DROPDOWN ==========
function populateVehicleDropdown() {
    const select = document.getElementById('vehicleSelect');
    if (!select) return;

    // Get IDs of vehicles that are currently loaned out
    const loanedVehicleIds = activeLoans.map(l => l.vehicleId);
    
    // Show ALL vehicles that are NOT currently loaned out (regardless of maintenance status)
    // Or if you only want 'available' status, use the line below instead:
    const available = vehicles.filter(v => !loanedVehicleIds.includes(v.id));
    
    // Alternative: Only show vehicles with 'available' status
    // const available = vehicles.filter(v => v.status === "available" && !loanedVehicleIds.includes(v.id));

    console.log(`Total vehicles: ${vehicles.length}`);
    console.log(`Loaned vehicle IDs: ${loanedVehicleIds}`);
    console.log(`Available vehicles: ${available.length}`);

    select.innerHTML = '<option value="">-- Select a vehicle --</option>';

    if (available.length === 0) {
        select.innerHTML = '<option value="">No vehicles available</option>';
        return;
    }

    available.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = `${v.year} ${v.make} ${v.model} - ${v.plate} (${v.batteryLevel}% batt, ${v.mileage.toLocaleString()} km)`;
        select.appendChild(opt);
    });
}

// ========== RENDER DASHBOARD ==========
function renderDashboard() {
    const container = document.getElementById("activeLoansList");
    const count = document.getElementById("activeCount");

    if (!container) return;

    if (activeLoans.length === 0) {
        container.innerHTML = `<div class="empty-state">No active loans. Check out a vehicle below.</div>`;
        if (count) count.textContent = "0";
        return;
    }

    if (count) count.textContent = activeLoans.length;
    container.innerHTML = "";

    activeLoans.forEach(loan => {
        const vehicle = getVehicle(loan.vehicleId);
        const expectedDate = new Date(loan.expectedReturn);
        const today = new Date();
        const overdue = expectedDate < today;
        
        const daysUntilReturn = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
        const returnStatus = overdue ? `Overdue by ${Math.abs(daysUntilReturn)} days` : `${daysUntilReturn} days remaining`;

        const div = document.createElement("div");
        div.className = `loan-card ${overdue ? "overdue" : ""}`;

        div.innerHTML = `
            <div class="loan-info">
                <h3>${vehicle ? getVehicleName(vehicle.id) : "Unknown Vehicle"}</h3>
                <p>👤 ${loan.customerName} | 📞 ${loan.customerPhone}</p>
                <p>🚗 ${vehicle ? vehicle.plate : "N/A"} | 🔋 Started at: ${loan.startBatteryLevel || 100}%</p>
                <p>📅 Checked out: ${new Date(loan.checkoutDate).toLocaleDateString()}</p>
                <p>⏰ Expected: ${new Date(loan.expectedReturn).toLocaleDateString()} <span class="return-date ${overdue ? 'overdue' : ''}">${returnStatus}</span></p>
            </div>
            <div class="loan-actions">
                <button class="btn-checkin" data-id="${loan.id}">🔧 Return Vehicle</button>
            </div>
        `;

        container.appendChild(div);
    });

    document.querySelectorAll(".btn-checkin").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const loanId = Number(btn.dataset.id);
            const loan = activeLoans.find(l => l.id === loanId);
            if (loan) {
                openReturnModal(loan);
            }
        });
    });
}

// ========== OPEN RETURN MODAL ==========
function openReturnModal(loan) {
    currentReturnLoan = loan;
    const vehicle = getVehicle(loan.vehicleId);
    
    const infoDiv = document.getElementById("returnVehicleInfo");
    infoDiv.innerHTML = `
        <p><strong>Vehicle:</strong> ${getVehicleName(vehicle.id)} (${vehicle.plate})</p>
        <p><strong>Customer:</strong> ${loan.customerName}</p>
        <p><strong>Phone:</strong> ${loan.customerPhone}</p>
        <p><strong>Checkout Date:</strong> ${new Date(loan.checkoutDate).toLocaleDateString()}</p>
        <p><strong>Expected Return:</strong> ${new Date(loan.expectedReturn).toLocaleDateString()}</p>
        <p><strong>Starting Battery:</strong> ${loan.startBatteryLevel || 100}%</p>
    `;
    
    // Set default return date/time to now
    const now = new Date();
    const formattedDateTime = now.toISOString().slice(0, 16);
    document.getElementById("returnDateTime").value = formattedDateTime;
    
    // Reset form fields
    document.getElementById("returnBatteryLevel").value = vehicle?.batteryLevel || 80;
    document.getElementById("returnBatteryPercent").textContent = `${vehicle?.batteryLevel || 80}%`;
    document.getElementById("returnBatteryFill").style.width = `${vehicle?.batteryLevel || 80}%`;
    document.getElementById("returnMileage").value = vehicle?.mileage || "";
    document.getElementById("returnNotes").value = "";
    
    // Clear signature
    if (returnSignaturePad) {
        returnSignaturePad.clear();
    }
    
    document.getElementById("returnModal").style.display = "block";
}

// ========== BATTERY UPDATE FUNCTIONS ==========
function updateStartBattery(value) {
    const percent = value;
    document.getElementById("startBatteryPercent").textContent = `${percent}%`;
    document.getElementById("startBatteryFill").style.width = `${percent}%`;
}

function updateReturnBattery(value) {
    const percent = value;
    document.getElementById("returnBatteryPercent").textContent = `${percent}%`;
    document.getElementById("returnBatteryFill").style.width = `${percent}%`;
}

// ========== SEARCH AND FILTER ==========
function setupSearchAndFilter() {
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();
            const filtered = vehicles.filter(v => 
                v.make.toLowerCase().includes(query) ||
                v.model.toLowerCase().includes(query) ||
                v.plate.toLowerCase().includes(query) ||
                v.vin.toLowerCase().includes(query)
            );
            renderFilteredVehicles(filtered);
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            const status = statusFilter.value;
            const filtered = status === "all" ? vehicles : vehicles.filter(v => v.status === status);
            renderFilteredVehicles(filtered);
        });
    }
}

function renderFilteredVehicles(vehiclesList) {
    const container = document.getElementById("vehicleGallery");
    if (!container) return;
    
    container.innerHTML = "";
    vehiclesList.forEach(vehicle => {
        const card = document.createElement("div");
        card.className = "fi-vehicle-card";
        
        card.innerHTML = `
            <div class="fi-img"></div>
            <div class="fi-info">
                <h4>${vehicle.year} ${vehicle.make} ${vehicle.model}</h4>
                <p>Plate: ${vehicle.plate}</p>
                <span class="status ${vehicle.status}">${vehicle.status}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(title, message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️"
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
        toast.remove();
    });
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ========== CONFIRM RETURN ==========
async function confirmReturn() {
    if (!currentReturnLoan) return;
    
    const returnDateTime = document.getElementById("returnDateTime").value;
    const batteryLevel = parseInt(document.getElementById("returnBatteryLevel").value);
    const mileage = parseInt(document.getElementById("returnMileage").value) || null;
    const notes = document.getElementById("returnNotes").value;
    
    // Get signature
    let signature = null;
    if (returnSignaturePad && !returnSignaturePad.isEmpty()) {
        signature = returnSignaturePad.toDataURL();
    }
    
    if (!returnDateTime) {
        showToast("Missing Info", "Please select return date and time", "warning");
        return;
    }
    
    const returnData = {
        returnDateTime,
        batteryLevel,
        mileage,
        notes,
        signature
    };
    
    try {
        await checkinLoan(currentReturnLoan.id, returnData);
        await refreshData();
        closeReturnModal();
        showToast("Vehicle Returned", `${getVehicleName(currentReturnLoan.vehicleId)} has been returned successfully`, "success");
    } catch (error) {
        console.error("Return error:", error);
        showToast("Error", "Failed to process return", "error");
    }
}

// ========== CLOSE MODAL ==========
function closeReturnModal() {
    document.getElementById("returnModal").style.display = "none";
    currentReturnLoan = null;
}

// ========== REFRESH ALL DATA ==========
async function refreshData() {
    await loadActiveLoans();
    populateVehicleDropdown();
    renderDashboard();
    renderFleetGrid();
    renderVehicleGallery();
    renderDamageTracking();
    updateAnalytics();
}

// ========== FORM SUBMIT ==========
function setupFormSubmit() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const vehicleId = parseInt(document.getElementById("vehicleSelect").value);
        const customerName = document.getElementById("customerName").value;
        const customerPhone = document.getElementById("customerPhone").value;
        const expectedReturn = document.getElementById("returnDate").value;
        const startBatteryLevel = parseInt(document.getElementById("startBatteryLevel").value);
        const startMileage = parseInt(document.getElementById("startMileage").value) || null;
        
        // Check signature
        if (!signaturePad || signaturePad.isEmpty()) {
            showToast("Signature Required", "Please provide customer signature", "warning");
            return;
        }
        
        if (!vehicleId || !customerName || !customerPhone || !expectedReturn) {
            showToast("Missing Information", "Please fill in all required fields", "warning");
            return;
        }
        
        const signature = signaturePad.toDataURL();
        
        // Update vehicle status
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            vehicle.status = "loaned";
        }
        
        const loan = {
            vehicleId,
            customerName,
            customerPhone,
            expectedReturn,
            checkoutDate: new Date().toISOString(),
            status: "active",
            startBatteryLevel,
            startMileage,
            signature
        };
        
        try {
            await saveLoan(loan);
            showToast("Vehicle Checked Out", `${customerName} has checked out ${getVehicleName(vehicleId)}`, "success");
            form.reset();
            if (signaturePad) signaturePad.clear();
            document.getElementById("startBatteryLevel").value = 100;
            updateStartBattery(100);
            await refreshData();
        } catch (error) {
            console.error("Checkout error:", error);
            showToast("Error", "Failed to checkout vehicle", "error");
        }
    });
}

// ========== INITIALIZE SIGNATURE PADS ==========
function initSignaturePads() {
    const canvas = document.getElementById("signatureCanvas");
    if (canvas && !signaturePad) {
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
        
        // Adjust canvas size
        const resizeCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext("2d").scale(ratio, ratio);
            signaturePad.clear();
        };
        
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
    }
    
    const returnCanvas = document.getElementById("returnSignatureCanvas");
    if (returnCanvas && !returnSignaturePad) {
        returnSignaturePad = new SignaturePad(returnCanvas, {
            backgroundColor: 'rgb(255, 255, 255)'
        });
        
        const resizeReturnCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            returnCanvas.width = returnCanvas.offsetWidth * ratio;
            returnCanvas.height = returnCanvas.offsetHeight * ratio;
            returnCanvas.getContext("2d").scale(ratio, ratio);
            returnSignaturePad.clear();
        };
        
        window.addEventListener("resize", resizeReturnCanvas);
        resizeReturnCanvas();
    }
    
    // Clear buttons
    const clearBtn = document.getElementById("clearSignatureBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (signaturePad) signaturePad.clear();
        });
    }
    
    const clearReturnBtn = document.getElementById("clearReturnSignatureBtn");
    if (clearReturnBtn) {
        clearReturnBtn.addEventListener("click", () => {
            if (returnSignaturePad) returnSignaturePad.clear();
        });
    }
}

// ========== SETUP BATTERY CONTROLS ==========
function setupBatteryControls() {
    const startBattery = document.getElementById("startBatteryLevel");
    if (startBattery) {
        startBattery.addEventListener("input", (e) => updateStartBattery(e.target.value));
    }
    
    const returnBattery = document.getElementById("returnBatteryLevel");
    if (returnBattery) {
        returnBattery.addEventListener("input", (e) => updateReturnBattery(e.target.value));
    }
}

// ========== SETUP CONNECTION STATUS ==========
function setupConnectionStatus() {
    const statusIndicator = document.getElementById("statusIndicator");
    const statusText = document.getElementById("statusText");
    
    function updateStatus() {
        if (navigator.onLine) {
            statusIndicator.className = "status-indicator online";
            statusText.textContent = "Online";
        } else {
            statusIndicator.className = "status-indicator offline";
            statusText.textContent = "Offline";
        }
    }
    
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();
}

// ========== SET EXPECTED RETURN DATE MIN ==========
function setupReturnDateMin() {
    const returnDateInput = document.getElementById("returnDate");
    if (returnDateInput) {
        const today = new Date().toISOString().split('T')[0];
        returnDateInput.min = today;
    }
}

// ========== INITIALIZATION ==========
async function init() {
    console.log("Initializing app...");
    
    // Setup basic UI
    setupConnectionStatus();
    setupReturnDateMin();
    setupBatteryControls();
    
    // Initialize IndexedDB
    await initDB();
    
    // Initialize signature pads
    initSignaturePads();
    
    // Setup form submission
    setupFormSubmit();
    
    // Setup search and filter
    setupSearchAndFilter();
    
    // Setup modal close buttons
    const closeModalBtn = document.getElementById("closeModalBtn");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", closeReturnModal);
    }
    
    const cancelReturnBtn = document.getElementById("cancelReturnBtn");
    if (cancelReturnBtn) {
        cancelReturnBtn.addEventListener("click", closeReturnModal);
    }
    
    const confirmReturnBtn = document.getElementById("confirmReturnBtn");
    if (confirmReturnBtn) {
        confirmReturnBtn.addEventListener("click", confirmReturn);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById("returnModal");
    if (modal) {
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeReturnModal();
            }
        });
    }
    
    // Load all data
    await refreshData();
    
    console.log("App initialized successfully");
}

// Start the app
init();
