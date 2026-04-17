// ========== VEHICLE DATABASE (Replace with Mr. Johnson's VINs) ==========
        const vehicles = [
            { id: 1, vin: "1HGBH41JXMN109186", make: "Toyota", model: "Corolla", year: 2022, plate: "AS1234", status: "available" },
            { id: 2, vin: "2FMDK3GC3DBA12345", make: "Honda", model: "Civic", year: 2021, plate: "BS5678", status: "available" },
            { id: 3, vin: "3N1AB7AP0HY123456", make: "Nissan", model: "Altima", year: 2020, plate: "CS9012", status: "available" },
            { id: 4, vin: "4T1BF1FK0HU123456", make: "Toyota", model: "Camry", year: 2019, plate: "DS3456", status: "available" },
            { id: 5, vin: "5J6RM4H59FL123456", make: "Honda", model: "CR-V", year: 2018, plate: "ES7890", status: "available" },
            { id: 6, vin: "1FTFW1ET1FK123456", make: "Ford", model: "F-150", year: 2020, plate: "FS1234", status: "available" },
            { id: 7, vin: "2GCEC19T6H1123456", make: "Chevrolet", model: "Silverado", year: 2019, plate: "GS5678", status: "available" },
            { id: 8, vin: "3VW2K7AJ3JM123456", make: "Volkswagen", model: "Jetta", year: 2018, plate: "HS9012", status: "available" },
            { id: 9, vin: "4S4BRBLC7C3123456", make: "Subaru", model: "Outback", year: 2017, plate: "IS3456", status: "available" },
            { id: 10, vin: "5NPD84LF8JH123456", make: "Hyundai", model: "Elantra", year: 2019, plate: "JS7890", status: "available" },
            { id: 11, vin: "1C4RJFBG2KC123456", make: "Jeep", model: "Grand Cherokee", year: 2020, plate: "KS1234", status: "available" },
            { id: 12, vin: "2FMPK3J99KBA12345", make: "Ford", model: "Edge", year: 2019, plate: "LS5678", status: "available" },
            { id: 13, vin: "3FA6P0H78JR123456", make: "Ford", model: "Fusion", year: 2018, plate: "MS9012", status: "available" },
            { id: 14, vin: "4T1G11AK2LU123456", make: "Toyota", model: "Avalon", year: 2020, plate: "NS3456", status: "available" },
            { id: 15, vin: "5UXCR6C06L9B12345", make: "BMW", model: "X3", year: 2021, plate: "OS7890", status: "available" }
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