// ========== VEHICLE DATABASE (Replace with Mr. Johnson's VINs) ==========
        const vehicles = [
            { id: 1, vin: "LC0CE4CC5P0000412", make: "BYD", model: "Dolphin", year: 2023, plate: "AS1234", status: "available" },
            { id: 2, vin: "LC0CE4CC4P0000417", make: "BYD", model: "Dolphin", year: 2023, plate: "BS5678", status: "available" },
            { id: 3, vin: "LC0CE4CC9P0000798", make: "BYD", model: "Dolphin(Demo)", year: 2023, plate: "CS9012", status: "available" },
            { id: 4, vin: "LC0CE4DCXR4000075", make: "BYD", model: "Yuan Pro GL", year: 2024, plate: "DS3456", status: "available" },
            { id: 5, vin: "LC0CE4DC2R4000099", make: "BYD", model: "Yuan Pro GL", year: 2023, plate: "ES7890", status: "available" },
            { id: 6, vin: "LC0CE4DC0R4000036", make: "BYD", model: "Yuan Pro GL", year: 2024, plate: "FS1234", status: "available" },
            { id: 7, vin: "LC0CE4DB8P0083355", make: "BYD", model: "T3 Cargo Van", year: 2023, plate: "GS5678", status: "available" },
            { id: 8, vin: "LC0CE4DB8K0044130", make: "BYD", model: "T3 Cargo Van", year: 2018, plate: "HS9012", status: "available" },
            { id: 9, vin: "LC0CE4DB7K0044121", make: "BYD", model: "T3 Cargo Van", year: 2019, plate: "IS3456", status: "available" },
            { id: 10, vin: "LGXCE4DB3R2000273", make: "BYD", model: "Yuan Plus GL", year: 2023, plate: "JS7890", status: "available" },
            { id: 11, vin: "LGXCE4DB5R2000212", make: "BYD", model: "Yuan Plus GL", year: 2023, plate: "KS1234", status: "available" },
            { id: 12, vin: "LGXCE4DB3P2000478", make: "BYD", model: "Yuan Plus GL(Demo)", year: 2023, plate: "LS5678", status: "available" },
            { id: 13, vin: "LC0CF4CD6R0025408", make: "BYD", model: "TANG", year: 2024, plate: "MS9012", status: "available" },
            { id: 14, vin: "LC0CF4CD5P0020651", make: "BYD", model: "TANG", year: 2023, plate: "NS3456", status: "available" },
            { id: 15, vin: "LGXCE4CB3S0081262", make: "BYD", model: "Song Plus(Demo)", year: 2021, plate: "OS7890", status: "available" },
            { id: 16, vin: "LGXCE4DB3R2000273", make: "BYD", model: "Yuan Plus", year: 2023, plate: "OS7890", status: "available" },
            { id: 17, vin: "LJ1EEASR4R4701005", make: "JAC", model: "E-JS4(Demo)", year: 2024, plate: "OS7890", status: "available" },
            { id: 18, vin: "LJ1EFATR6P4016741", make: "JAC", model: "E-J7(Demo)", year: 2023, plate: "OS7890", status: "available" },
            { id: 19, vin: "LJ1EEASRXR4701395", make: "JAC", model: "E-JS4(Demo)", year: 2024, plate: "OS7890", status: "available" },
            { id: 20, vin: "LJ1EEASR6R4701393", make: "JAC", model: "E-JS4", year: 2024, plate: "OS7890", status: "available" },
            { id: 21, vin: "LJ1EEASR8P4711159", make: "JAC", model: "E-JS4", year: 2024, plate: "OS7890", status: "available" },
            { id: 22, vin: "LJ1EFATR0R7402170", make: "JAC", model: "E-J7", year: 2024, plate: "OS7890", status: "available" },
            { id: 23, vin: "LJ1EFATR9R7402152", make: "JAC", model: "E-J7", year: 2024, plate: "OS7890", status: "available" }
        ];

        // ========== GLOBAL VARIABLES ==========
        let signaturePad;
        let db;
        let activeLoans = [];

        // ========== INITIALIZE INDEXEDDB ==========
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

        // ========== SAVE LOAN TO INDEXEDDB ==========
        async function saveLoan(loanData) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['loans'], 'readwrite');
                const store = transaction.objectStore('loans');
                const request = store.add(loanData);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        // ========== LOAD ACTIVE LOANS FROM INDEXEDDB ==========
        async function loadActiveLoans() {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['loans'], 'readonly');
                const store = transaction.objectStore('loans');
                const index = store.index('status');
                const request = index.getAll('active');
                
                request.onsuccess = () => {
                    activeLoans = request.result;
                    resolve(activeLoans);
                };
                request.onerror = () => reject(request.error);
            });
        }

        // ========== UPDATE LOAN STATUS (CHECK-IN) ==========
        async function checkinLoan(loanId) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['loans'], 'readwrite');
                const store = transaction.objectStore('loans');
                const getRequest = store.get(loanId);
                
                getRequest.onsuccess = () => {
                    const loan = getRequest.result;
                    if (loan) {
                        loan.status = 'completed';
                        loan.actualReturnDate = new Date().toISOString();
                        const putRequest = store.put(loan);
                        putRequest.onsuccess = () => resolve(loan);
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        reject('Loan not found');
                    }
                };
                getRequest.onerror = () => reject(getRequest.error);
            });
        }

        // ========== POPULATE VEHICLE DROPDOWN ==========
        function populateVehicleDropdown() {
            const select = document.getElementById('vehicleSelect');
            select.innerHTML = '<option value="">-- Select a vehicle --</option>';
            
            // Get vehicles that are NOT currently loaned out
            const loanedVehicleIds = activeLoans.map(loan => loan.vehicleId);
            const availableVehicles = vehicles.filter(v => !loanedVehicleIds.includes(v.id));
            
            availableVehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.plate} (VIN: ${vehicle.vin.slice(-6)})`;
                select.appendChild(option);
            });
        }

        // ========== RENDER DASHBOARD ==========
        function renderDashboard() {
            const container = document.getElementById('activeLoansList');
            const activeCountSpan = document.getElementById('activeCount');
            
            if (activeLoans.length === 0) {
                container.innerHTML = '<div class="empty-state">✅ No active loans. All vehicles available.</div>';
                activeCountSpan.textContent = '0';
                return;
            }
            
            activeCountSpan.textContent = activeLoans.length;
            
            container.innerHTML = '';
            activeLoans.forEach(loan => {
                const vehicle = vehicles.find(v => v.id === loan.vehicleId);
                const today = new Date();
                const expectedReturn = new Date(loan.expectedReturn);
                const isOverdue = expectedReturn < today;
                
                const card = document.createElement('div');
                card.className = `loan-card ${isOverdue ? 'overdue' : ''}`;
                
                card.innerHTML = `
                    <div class="loan-info">
                        <h3>${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}</h3>
                        <p>Customer: ${loan.customerName} | Phone: ${loan.customerPhone}</p>
                        <p>Checked out: ${new Date(loan.checkoutDate).toLocaleDateString()} | Expected: ${new Date(loan.expectedReturn).toLocaleDateString()}</p>
                        ${isOverdue ? '<p style="color:#dc2626; font-weight:bold;">🔴 OVERDUE</p>' : ''}
                    </div>
                    <div class="loan-actions">
                        <button class="btn-checkin" data-id="${loan.id}">✓ Check In</button>
                    </div>
                `;
                
                container.appendChild(card);
            });
            
            // Add event listeners to check-in buttons
            document.querySelectorAll('.btn-checkin').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const loanId = Number(btn.dataset.id);
                    await checkinLoan(loanId);
                    await refreshData();
                });
            });
        }

        // ========== REFRESH ALL DATA ==========
        async function refreshData() {
            await loadActiveLoans();
            populateVehicleDropdown();
            renderDashboard();
        }

        // ========== INITIALIZE SIGNATURE PAD ==========
        function initSignaturePad() {
            const canvas = document.getElementById('signatureCanvas');
            
            // Handle high DPI screens
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext('2d').scale(ratio, ratio);
            
            signaturePad = new SignaturePad(canvas, {
                penColor: '#1e2a3e',
                backgroundColor: '#ffffff',
                minWidth: 1,
                maxWidth: 3
            });
            
            // Clear button
            document.getElementById('clearSignatureBtn').addEventListener('click', () => {
                signaturePad.clear();
            });
        }

        // ========== HANDLE FORM SUBMISSION ==========
        document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const vehicleId = parseInt(document.getElementById('vehicleSelect').value);
            const customerName = document.getElementById('customerName').value.trim();
            const customerPhone = document.getElementById('customerPhone').value.trim();
            const expectedReturn = document.getElementById('returnDate').value;
            
            // Validation
            if (!vehicleId || !customerName || !customerPhone || !expectedReturn) {
                alert('Please fill in all required fields');
                return;
            }
            
            if (signaturePad.isEmpty()) {
                alert('Please capture customer signature');
                return;
            }
            
            // Get signature as image
            const signatureDataURL = signaturePad.toDataURL('image/png');
            
            // Create loan record
            const loanRecord = {
                vehicleId: vehicleId,
                customerName: customerName,
                customerPhone: customerPhone,
                expectedReturn: expectedReturn,
                checkoutDate: new Date().toISOString(),
                signature: signatureDataURL,
                status: 'active'
            };
            
            // Save to IndexedDB
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
            
            try {
                await saveLoan(loanRecord);
                
                // Reset form
                document.getElementById('customerName').value = '';
                document.getElementById('customerPhone').value = '';
                document.getElementById('returnDate').value = '';
                signaturePad.clear();
                
                // Refresh dashboard
                await refreshData();
                
                alert('✓ Vehicle checked out successfully! Signature saved.');
                
            } catch (error) {
                console.error('Save error:', error);
                alert('Error saving. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '✓ Check Out Vehicle';
            }
        });

        // ========== INITIALIZE APP ==========
        async function init() {
            await initDB();
            await refreshData();
            initSignaturePad();
            
            // Set minimum date for return date picker
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('returnDate').min = today;
        }
        
        // Start the app
        init();