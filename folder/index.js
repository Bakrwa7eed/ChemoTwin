// script.js - Complete ChemoTwin RAG System with Digital Twin Simulation

// ==================== GLOBAL STATE ====================
let currentPatient = null;
let patientDatabase = {};
let currentView = 'doctor';
let charts = {};

// ==================== RAG KNOWLEDGE BASE ====================
class RAGSystem {
    constructor() {
        this.knowledgeBase = {
            cardiotoxicity: {
                studies: [
                    {
                        title: "Lipshultz et al. (1995) - Doxorubicin Cardiotoxicity in Children",
                        findings: "Cumulative doses exceeding 550 mg/m² resulted in 36% cardiotoxicity risk. Subclinical cardiac changes detected via echocardiography at doses as low as 200 mg/m². Anthracycline-induced cardiomyopathy is dose-dependent and can manifest years after treatment.",
                        dosage: 550,
                        risk: 36,
                        citation: "Lipshultz SE, et al. N Engl J Med. 1995;332(25):1738-1743.",
                        url: "https://pubmed.ncbi.nlm.nih.gov/7760889/"
                    },
                    {
                        title: "Swain et al. (2003) - Cardioprotection with Dexrazoxane",
                        findings: "Risk of cardiotoxicity increases exponentially above 450 mg/m². Dexrazoxane reduces cardiotoxicity risk by approximately 50% without compromising antitumor efficacy. Recommended for cumulative doses >300 mg/m².",
                        dosage: 450,
                        risk: 18,
                        citation: "Swain SM, et al. Cancer. 2003;97(11):2869-2879.",
                        url: "https://pubmed.ncbi.nlm.nih.gov/12767102/"
                    },
                    {
                        title: "Cardinale et al. (2015) - Early Detection with Troponin",
                        findings: "Troponin I elevation during chemotherapy predicts future left ventricular dysfunction. Early intervention with ACE inhibitors prevents progression to heart failure in 90% of cases.",
                        dosage: 300,
                        risk: 8,
                        citation: "Cardinale D, et al. Circulation. 2015;131(20):1981-1988.",
                        url: "https://pubmed.ncbi.nlm.nih.gov/25948538/"
                    }
                ],
                mechanisms: "Doxorubicin generates reactive oxygen species (ROS) through redox cycling. Iron chelation forms doxorubicin-iron complexes that produce superoxide radicals. Mitochondrial DNA damage and membrane disruption lead to cardiomyocyte apoptosis. Topoisomerase-2β inhibition in cardiac cells causes DNA damage.",
                management: "Cardioprotection: Dexrazoxane (ICRF-187) 10:1 ratio to doxorubicin. Monitoring: Baseline and periodic ECHO/MUGA scans, troponin levels. Treatment: ACE inhibitors (enalapril), beta-blockers (carvedilol), diuretics for heart failure. Dose limitation: Maximum 450-550 mg/m²."
            },
            hematotoxicity: {
                studies: [
                    {
                        title: "Crawford et al. (2004) - Neutropenia and G-CSF",
                        findings: "Grade 3-4 neutropenia occurs in 60-80% of patients receiving standard doxorubicin regimens. Prophylactic G-CSF reduces febrile neutropenia incidence by 46% and infection-related mortality. Nadir occurs 10-14 days post-administration.",
                        risk: 60,
                        citation: "Crawford J, et al. Cancer. 2004;100(2):228-237.",
                        url: "https://pubmed.ncbi.nlm.nih.gov/14716756/"
                    },
                    {
                        title: "Groopman & Itri (1999) - Anemia Management with ESAs",
                        findings: "Chemotherapy-induced anemia affects 75% of patients. Erythropoiesis-stimulating agents (ESAs) reduce transfusion requirements by 50%. Target hemoglobin: 10-12 g/dL.",
                        risk: 75,
                        citation: "Groopman JE, Itri LM. J Natl Cancer Inst. 1999;91(19):1616-1634.",
                        url: "https://pubmed.ncbi.nlm.nih.gov/10511589/"
                    }
                ],
                mechanisms: "Direct toxicity to rapidly dividing bone marrow stem cells, particularly myeloid precursors. Disruption of DNA synthesis in hematopoietic cells. Peak myelosuppression 10-14 days post-dose, recovery by day 21.",
                management: "G-CSF (filgrastim/pegfilgrastim) for neutropenia <1500/μL. Dose delays if ANC <1000/μL. Prophylactic antibiotics (fluoroquinolones). ESAs for hemoglobin <10 g/dL. Platelet transfusions if <10,000/μL or bleeding."
            },
            gastrointestinal: {
                studies: [
                    {
                        title: "Hesketh et al. (2017) - Antiemetic Guidelines",
                        findings: "Doxorubicin classified as highly emetogenic (>90% emesis without prophylaxis). Triple therapy (5-HT3 antagonist + NK1 antagonist + dexamethasone) provides complete response in 70-80% of patients.",
                        risk: 90,
                        citation: "Hesketh PJ, et al. J Clin Oncol. 2017;35(28):3240-3261.",
                        url: "https://pubmed.ncbi.nlm.nih.gov/28759346/"
                    }
                ],
                mechanisms: "Serotonin release from enterochromaffin cells in GI tract. Direct CTZ (chemoreceptor trigger zone) stimulation. Delayed nausea (24-120 hours) via substance P pathways.",
                management: "Acute: Ondansetron 8mg + aprepitant 125mg + dexamethasone 12mg. Delayed: Aprepitant 80mg days 2-3 + dexamethasone 8mg. Breakthrough: Metoclopramide or olanzapine 5-10mg."
            },
            mucositis: {
                studies: [
                    {
                        title: "Sonis et al. (2004) - Oral Mucositis Pathobiology",
                        findings: "Occurs in 40-60% of patients receiving anthracyclines. Cryotherapy (ice chips) during infusion reduces incidence by 50%. Palifermin decreases severe mucositis in high-dose regimens.",
                        risk: 50,
                        citation: "Sonis ST. Nat Rev Cancer. 2004;4(4):277-284.",
                        url: "https://pubmed.ncbi.nlm.nih.gov/15057287/"
                    }
                ],
                mechanisms: "Direct DNA damage to basal epithelial cells. ROS generation causing cellular injury. Inflammatory cytokine release (IL-1β, TNF-α). Ulceration 5-10 days post-treatment.",
                management: "Prevention: Cryotherapy during infusion (30 min before to 30 min after). Oral care: Chlorhexidine or saline rinses. Pain control: Magic mouthwash (lidocaine/diphenhydramine/antacid). Severe cases: Palifermin 60 μg/kg."
            }
        };
    }

    query(topic, patientData) {
        const dose = patientData.cumulativeDose;
        let relevantStudies = [];
        
        // Query based on dose and topic
        if (topic.includes('cardio') || topic.includes('heart')) {
            relevantStudies = this.knowledgeBase.cardiotoxicity.studies.filter(s => 
                dose >= s.dosage
            );
        }
        
        if (topic.includes('neutro') || topic.includes('blood') || topic.includes('infection')) {
            relevantStudies = [...relevantStudies, ...this.knowledgeBase.hematotoxicity.studies];
        }
        
        if (topic.includes('nausea') || topic.includes('vomit')) {
            relevantStudies = [...relevantStudies, ...this.knowledgeBase.gastrointestinal.studies];
        }
        
        if (topic.includes('mucositis') || topic.includes('mouth')) {
            relevantStudies = [...relevantStudies, ...this.knowledgeBase.mucositis.studies];
        }
        
        return {
            studies: relevantStudies,
            mechanisms: this.getRelevantMechanisms(topic),
            management: this.getRelevantManagement(topic),
            synthesis: this.synthesizeResponse(relevantStudies, patientData)
        };
    }

    getRelevantMechanisms(topic) {
        let mechanisms = [];
        if (topic.includes('cardio')) mechanisms.push(this.knowledgeBase.cardiotoxicity.mechanisms);
        if (topic.includes('neutro') || topic.includes('blood')) mechanisms.push(this.knowledgeBase.hematotoxicity.mechanisms);
        if (topic.includes('nausea')) mechanisms.push(this.knowledgeBase.gastrointestinal.mechanisms);
        if (topic.includes('mucositis')) mechanisms.push(this.knowledgeBase.mucositis.mechanisms);
        return mechanisms.join(' | ');
    }

    getRelevantManagement(topic) {
        let management = [];
        if (topic.includes('cardio')) management.push(this.knowledgeBase.cardiotoxicity.management);
        if (topic.includes('neutro') || topic.includes('blood')) management.push(this.knowledgeBase.hematotoxicity.management);
        if (topic.includes('nausea')) management.push(this.knowledgeBase.gastrointestinal.management);
        if (topic.includes('mucositis')) management.push(this.knowledgeBase.mucositis.management);
        return management.join(' | ');
    }

    synthesizeResponse(studies, patientData) {
        if (studies.length === 0) return "No specific high-risk factors identified at current dose level.";
        
        const dose = patientData.cumulativeDose;
        const age = patientData.age;
        const sex = patientData.sex;
        
        let synthesis = `Based on ${studies.length} clinical studies for patient (${age}yo ${sex}, ${dose} mg/m²): `;
        
        studies.forEach((study, idx) => {
            synthesis += `${study.findings.substring(0, 150)}... `;
        });
        
        synthesis += `Recommend close monitoring and consider prophylactic interventions.`;
        
        return synthesis;
    }
}

// Initialize RAG System
const ragSystem = new RAGSystem();

// ==================== DIGITAL TWIN RISK CALCULATOR ====================
function calculateDigitalTwinRisks(patient) {
    const { age, sex, cumulativeDose, chronicDiseases, vitals, cancer } = patient;
    const dose = cumulativeDose;
    
    // === CARDIOTOXICITY RISK (Evidence-based from Lipshultz, Swain) ===
    let cardioRisk = 0;
    if (dose > 550) cardioRisk = 36;
    else if (dose > 450) cardioRisk = 18;
    else if (dose > 300) cardioRisk = 8;
    else if (dose > 200) cardioRisk = 3;
    else cardioRisk = 1;
    
    // Risk modifiers
    if (age < 18 || age > 65) cardioRisk += 6;
    if (sex === 'female') cardioRisk += 3;
    if (chronicDiseases.includes('diabetes')) cardioRisk += 10;
    if (chronicDiseases.includes('hypertension')) cardioRisk += 8;
    
    // Vital sign modifiers
    const systolic = parseInt(vitals.bloodPressure.split('/')[0]);
    if (systolic > 140) cardioRisk += 5;
    if (vitals.heartRate > 100) cardioRisk += 4;
    
    // === HEMATOLOGIC TOXICITY (Crawford study) ===
    let neutroRisk = 40 + (dose / 600 * 40); // Peaks at 80% at max dose
    if (age > 65) neutroRisk += 10;
    if (chronicDiseases.includes('diabetes')) neutroRisk += 5;
    if (cancer === 'leukemia') neutroRisk += 15; // Already compromised marrow
    
    let anemiaRisk = 35 + (dose / 600 * 40); // Up to 75%
    let thrombRisk = 25 + (dose / 600 * 30); // Up to 55%
    
    // === GI TOXICITY (Hesketh guidelines) ===
    let nauseaRisk = 85; // Highly emetogenic baseline
    if (sex === 'female') nauseaRisk += 8;
    if (age < 50) nauseaRisk += 5;
    if (vitals.temperature > 37.5) nauseaRisk += 5;
    
    // === OTHER TOXICITIES ===
    let fatigueRisk = 60 + (dose / 600 * 30);
    let mucositisRisk = 30 + (dose / 600 * 30); // Sonis study
    let alopeciaRisk = 95; // Nearly universal
    let hepatoRisk = dose > 400 ? 15 + (dose / 600 * 15) : 8;
    let nephroRisk = dose > 450 ? 12 + (dose / 600 * 10) : 5;
    let neuroRisk = dose > 300 ? 20 + (dose / 600 * 15) : 8;
    
    // === RECOVERY/QUALITY OF LIFE SCORE ===
    const overallScore = Math.round(100 - ((cardioRisk + neutroRisk + fatigueRisk) / 3));
    
    return {
        cardioRisk: Math.min(100, Math.round(cardioRisk)),
        neutroRisk: Math.min(100, Math.round(neutroRisk)),
        anemiaRisk: Math.min(100, Math.round(anemiaRisk)),
        thrombRisk: Math.min(100, Math.round(thrombRisk)),
        nauseaRisk: Math.min(100, Math.round(nauseaRisk)),
        fatigueRisk: Math.min(100, Math.round(fatigueRisk)),
        mucositisRisk: Math.min(100, Math.round(mucositisRisk)),
        alopeciaRisk: Math.min(100, Math.round(alopeciaRisk)),
        hepatoRisk: Math.min(100, Math.round(hepatoRisk)),
        nephroRisk: Math.min(100, Math.round(nephroRisk)),
        neuroRisk: Math.min(100, Math.round(neuroRisk)),
        overallScore: Math.max(0, overallScore)
    };
}

// ==================== PREDICTIVE MODELING ====================
function generatePredictions(currentRisks, dose) {
    // Predict risk progression at 1 year and 5 years
    // Based on literature showing late cardiotoxicity emergence
    
    const predictions = {
        now: { ...currentRisks, timepoint: 'Current' },
        oneYear: {
            timepoint: '1 Year',
            cardioRisk: Math.min(100, currentRisks.cardioRisk * 1.15),
            neutroRisk: Math.max(0, currentRisks.neutroRisk * 0.9), // Recovery
            anemiaRisk: Math.max(0, currentRisks.anemiaRisk * 0.85),
            fatigueRisk: Math.max(0, currentRisks.fatigueRisk * 0.8),
            mucositisRisk: Math.max(0, currentRisks.mucositisRisk * 0.3)
        },
        fiveYears: {
            timepoint: '5 Years',
            cardioRisk: Math.min(100, currentRisks.cardioRisk * 1.35), // Late cardiotoxicity
            neutroRisk: Math.max(0, currentRisks.neutroRisk * 0.6),
            anemiaRisk: Math.max(0, currentRisks.anemiaRisk * 0.5),
            fatigueRisk: Math.max(0, currentRisks.fatigueRisk * 0.6),
            mucositisRisk: 0
        }
    };
    
    return predictions;
}

// ==================== PATIENT INITIALIZATION ====================
function initializePatient(id) {
    return {
        id: id,
        age: 45,
        sex: 'male',
        cancer: 'lymphoma',
        chronicDiseases: [],
        vitals: {
            temperature: 37.0,
            bloodPressure: '120/80',
            heartRate: 75
        },
        cumulativeDose: 0,
        sessions: [],
        createdAt: new Date().toISOString()
    };
}

// ==================== CORE FUNCTIONS ====================

function loadPatient() {
    const patientId = document.getElementById('patientId').value.trim();
    
    if (!patientId) {
        alert('Please enter a Patient ID');
        return;
    }
    
    if (patientDatabase[patientId]) {
        // Load existing patient
        currentPatient = patientDatabase[patientId];
        alert(`Patient ${patientId} loaded successfully! Sessions: ${currentPatient.sessions.length}`);
    } else {
        // Create new patient
        currentPatient = initializePatient(patientId);
        patientDatabase[patientId] = currentPatient;
        alert(`New patient ${patientId} created!`);
    }
    
    updateUIWithPatientData();
}

function generateVirtualPatient() {
    // Generate random patient ID
    const randomId = 'PT-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    document.getElementById('patientId').value = randomId;
    
    // Generate random patient data
    const patient = initializePatient(randomId);
    patient.age = Math.floor(Math.random() * 60) + 20; // 20-80
    patient.sex = Math.random() > 0.5 ? 'male' : 'female';
    patient.cancer = Math.random() > 0.5 ? 'leukemia' : 'lymphoma';
    
    // Random chronic diseases
    if (Math.random() > 0.7) patient.chronicDiseases.push('diabetes');
    if (Math.random() > 0.6) patient.chronicDiseases.push('hypertension');
    
    // Random vitals
    patient.vitals.temperature = (36.5 + Math.random() * 1.5).toFixed(1);
    patient.vitals.bloodPressure = `${Math.floor(Math.random() * 40) + 110}/${Math.floor(Math.random() * 30) + 70}`;
    patient.vitals.heartRate = Math.floor(Math.random() * 40) + 60;
    
    currentPatient = patient;
    patientDatabase[randomId] = patient;
    
    updateUIWithPatientData();
    alert(`Virtual patient ${randomId} generated!\nAge: ${patient.age}, Sex: ${patient.sex}, Cancer: ${patient.cancer}`);
}

function updateUIWithPatientData() {
    if (!currentPatient) return;
    
    // Show form
    document.getElementById('patientForm').style.display = 'block';
    document.getElementById('resultsArea').style.display = 'block';
    
    // Update form fields
    document.getElementById('currentPatientId').textContent = currentPatient.id;
    document.getElementById('displayPatientId').textContent = currentPatient.id;
    document.getElementById('age').value = currentPatient.age;
    document.getElementById('sex').value = currentPatient.sex;
    document.getElementById('cancer').value = currentPatient.cancer;
    document.getElementById('temperature').value = currentPatient.vitals.temperature;
    document.getElementById('bloodPressure').value = currentPatient.vitals.bloodPressure;
    document.getElementById('heartRate').value = currentPatient.vitals.heartRate;
    
    // Update chronic diseases
    const chronicSelect = document.getElementById('chronicDiseases');
    Array.from(chronicSelect.options).forEach(option => {
        option.selected = currentPatient.chronicDiseases.includes(option.value);
    });
    
    // Update dose display
    updateDoseDisplay();
    
    // Update session count
    document.getElementById('sessionCount').textContent = currentPatient.sessions.length;
    
    // If patient has sessions, run simulation
    if (currentPatient.sessions.length > 0) {
        runDigitalTwinSimulation();
    }
}

function updatePatientRealtime() {
    if (!currentPatient) return;
    
    // Update patient object with form values
    currentPatient.age = parseInt(document.getElementById('age').value) || 45;
    currentPatient.sex = document.getElementById('sex').value;
    currentPatient.cancer = document.getElementById('cancer').value;
    currentPatient.vitals.temperature = parseFloat(document.getElementById('temperature').value) || 37.0;
    currentPatient.vitals.bloodPressure = document.getElementById('bloodPressure').value || '120/80';
    currentPatient.vitals.heartRate = parseInt(document.getElementById('heartRate').value) || 75;
    
    // Update chronic diseases
    const chronicSelect = document.getElementById('chronicDiseases');
    currentPatient.chronicDiseases = Array.from(chronicSelect.selectedOptions).map(opt => opt.value);
    
    // Re-run simulation if sessions exist
    if (currentPatient.sessions.length > 0) {
        runDigitalTwinSimulation();
    }
}

function updateDoseDisplay() {
    if (!currentPatient) return;
    
    const dose = currentPatient.cumulativeDose;
    const maxDose = 550;
    const percentage = Math.min(100, (dose / maxDose) * 100);
    
    document.getElementById('cumulativeDoseDisplay').textContent = `${dose} mg/m²`;
    document.getElementById('cumulativeDose').value = `${dose} mg/m²`;
    document.getElementById('doseProgressBar').style.width = `${percentage}%`;
    
    // Change color based on risk
    const progressBar = document.getElementById('doseProgressBar');
    if (percentage < 60) {
        progressBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
    } else if (percentage < 80) {
        progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    }
}

function addTreatmentSession() {
    if (!currentPatient) {
        alert('Please load or create a patient first!');
        return;
    }
    
    const sessionDose = 60; // Standard doxorubicin dose
    
    if (currentPatient.cumulativeDose + sessionDose > 600) {
        if (!confirm(`Warning: This will exceed recommended maximum dose (550 mg/m²). Cumulative dose will be ${currentPatient.cumulativeDose + sessionDose} mg/m². Continue?`)) {
            return;
        }
    }
    
    // Update cumulative dose
    currentPatient.cumulativeDose += sessionDose;
    
    // Calculate risks with new dose
    const risks = calculateDigitalTwinRisks(currentPatient);
    
    // Query RAG for relevant studies
    const ragInsights = ragSystem.query('cardio neutro nausea mucositis', currentPatient);
    
    // Create session record
    const session = {
        date: new Date().toISOString(),
        sessionNumber: currentPatient.sessions.length + 1,
        dose: sessionDose,
        cumulativeDose: currentPatient.cumulativeDose,
        vitals: { ...currentPatient.vitals },
        risks: risks,
        ragInsights: ragInsights.studies,
        predictions: generatePredictions(risks, currentPatient.cumulativeDose)
    };
    
    currentPatient.sessions.push(session);
    
    // Update UI
    updateDoseDisplay();
    document.getElementById('sessionCount').textContent = currentPatient.sessions.length;
    
    // Run full simulation
    runDigitalTwinSimulation();
    
    alert(`✅ Session ${session.sessionNumber} added!\nDose: ${sessionDose} mg/m²\nCumulative: ${currentPatient.cumulativeDose} mg/m²`);
}

// ==================== DIGITAL TWIN SIMULATION ENGINE ====================
function runDigitalTwinSimulation() {
    if (!currentPatient || currentPatient.sessions.length === 0) return;
    
    const latestSession = currentPatient.sessions[currentPatient.sessions.length - 1];
    const risks = latestSession.risks;
    const ragInsights = latestSession.ragInsights;
    
    // Update metrics
    updateMetricsDisplay(risks);
    
    // Update charts
    updateAllCharts();
    
    // Update RAG insights
    displayRAGInsights(ragInsights);
    
    // Update session history
    displaySessionHistory();
    
    // Update clinical alerts
    displayClinicalAlerts(risks, ragInsights);
    
    // Update patient view
    updatePatientView(risks);
}

function updateMetricsDisplay(risks) {
    document.getElementById('cardioRisk').textContent = risks.cardioRisk + '%';
    document.getElementById('neutroRisk').textContent = risks.neutroRisk + '%';
    document.getElementById('anemiaRisk').textContent = risks.anemiaRisk + '%';
    document.getElementById('qualityScore').textContent = risks.overallScore;
}

function displayClinicalAlerts(risks, ragStudies) {
    const alertsContainer = document.getElementById('clinicalAlerts');
    alertsContainer.innerHTML = '';
    
    // High cardiotoxicity alert
    if (risks.cardioRisk > 20) {
        const relevantStudy = ragStudies.find(s => s.title.includes('Cardio')) || ragStudies[0];
        const alert = document.createElement('div');
        alert.className = 'alert';
        alert.innerHTML = `
            <h4>⚠️ High Cardiotoxicity Risk</h4>
            <p><strong>Risk Level: ${risks.cardioRisk}%</strong></p>
            <p>Immediate Actions: Consider dexrazoxane cardioprotection. Schedule echocardiogram. Monitor troponin levels.</p>
            ${relevantStudy ? `<cite>Evidence: ${relevantStudy.citation}</cite>` : ''}
        `;
        alertsContainer.appendChild(alert);
    }
    
    // Neutropenia alert
    if (risks.neutroRisk > 60) {
        const alert = document.createElement('div');
        alert.className = 'alert';
        alert.innerHTML = `
            <h4>⚠️ High Neutropenia Risk</h4>
            <p><strong>Risk Level: ${risks.neutroRisk}%</strong></p>
            <p>Immediate Actions: Prophylactic G-CSF recommended. Monitor CBC closely. Consider antibiotic prophylaxis.</p>
        `;
        alertsContainer.appendChild(alert);
    }
}

function displayRAGInsights(studies) {
    const container = document.getElementById('ragStudiesContainer');
    container.innerHTML = '';
    
    if (studies.length === 0) {
        container.innerHTML = '<p>No high-risk factors identified at current dose level.</p>';
        return;
    }
    
    studies.forEach(study => {
        const card = document.createElement('div');
        card.className = 'study-card';
        card.innerHTML = `
            <h5>${study.title}</h5>
            <p>${study.findings}</p>
            <cite>${study.citation}</cite>
            ${study.url ? `<br><a href="${study.url}" target="_blank">View Study →</a>` : ''}
        `;
        container.appendChild(card);
    });
}

function displaySessionHistory() {
    const container = document.getElementById('sessionHistoryList');
    container.innerHTML = '';
    
    currentPatient.sessions.forEach((session, idx) => {
        const item = document.createElement('div');
        item.className = 'session-item';
        const date = new Date(session.date).toLocaleDateString();
        item.innerHTML = `
            <h4>
                <span>Session ${session.sessionNumber}</span>
                <span style="font-size: 0.9em; color: #666;">${date}</span>
            </h4>
            <p><strong>Dose:</strong> ${session.dose} mg/m² | <strong>Cumulative:</strong> ${session.cumulativeDose} mg/m²</p>
            <p><strong>Vitals:</strong> BP: ${session.vitals.bloodPressure} | HR: ${session.vitals.heartRate} | Temp: ${session.vitals.temperature}°C</p>
            <p><strong>Key Risks:</strong> Cardio: ${session.risks.cardioRisk}% | Neutro: ${session.risks.neutroRisk}% | Recovery Score: ${session.risks.overallScore}</p>
        `;
        container.appendChild(item);
    });
}

// ==================== CHART FUNCTIONS ====================
function updateAllCharts() {
    updateRiskChart();
    updateProgressChart();
    updateRiskProgressionChart();
    updateRadarChart();
    updatePatientJourneyChart();
}

function updateRiskChart() {
    const ctx = document.getElementById('riskChart');
    if (!ctx) return;
    
    const latestSession = currentPatient.sessions[currentPatient.sessions.length - 1];
    const risks = latestSession.risks;
    
    if (charts.riskChart) charts.riskChart.destroy();
    
    charts.riskChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Cardio', 'Neutro', 'Anemia', 'Thromb', 'Nausea', 'Fatigue', 'Mucositis'],
            datasets: [{
                label: 'Risk (%)',
                data: [risks.cardioRisk, risks.neutroRisk, risks.anemiaRisk, risks.thrombRisk, 
                       risks.nauseaRisk, risks.fatigueRisk, risks.mucositisRisk],
                backgroundColor: ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#f97316']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Risk (%)' }
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Current Risk Profile' }
            }
        }
    });
}

function updateProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    const progressData = currentPatient.sessions.map((session, idx) => ({
        session: `S${idx + 1}`,
        cardio: session.risks.cardioRisk,
        neutro: session.risks.neutroRisk,
        score: session.risks.overallScore,
        dose: session.cumulativeDose
    }));
    
    if (charts.progressChart) charts.progressChart.destroy();
    
    charts.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: progressData.map(d => d.session),
            datasets: [
                {
                    label: 'Recovery Score',
                    data: progressData.map(d => d.score),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cardiotoxicity Risk',
                    data: progressData.map(d => d.cardio),
                    borderColor: '#ef4444',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative Dose',
                    data: progressData.map(d => d.dose),
                    borderColor: '#8b5cf6',
                    borderDash: [5, 5],
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Risk/Score (%)' }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    title: { display: true, text: 'Dose (mg/m²)' },
                    grid: { drawOnChartArea: false }
                }
            },
            plugins: {
                title: { display: true, text: 'Treatment Progress Over Time' }
            }
        }
    });
}

function updateRiskProgressionChart() {
    const ctx = document.getElementById('riskProgressionChart');
    if (!ctx) return;
    
    const progressData = currentPatient.sessions.map((session, idx) => ({
        session: `S${idx + 1}`,
        cardio: session.risks.cardioRisk,
        neutro: session.risks.neutroRisk,
        anemia: session.risks.anemiaRisk,
        fatigue: session.risks.fatigueRisk
    }));
    
    if (charts.riskProgressionChart) charts.riskProgressionChart.destroy();
    
    charts.riskProgressionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: progressData.map(d => d.session),
            datasets: [
                {
                    label: 'Cardiotoxicity',
                    data: progressData.map(d => d.cardio),
                    borderColor: '#ef4444',
                    tension: 0.4
                },
                {
                    label: 'Neutropenia',
                    data: progressData.map(d => d.neutro),
                    borderColor: '#3b82f6',
                    tension: 0.4
                },
                {
                    label: 'Anemia',
                    data: progressData.map(d => d.anemia),
                    borderColor: '#f59e0b',
                    tension: 0.4
                },
                {
                    label: 'Fatigue',
                    data: progressData.map(d => d.fatigue),
                    borderColor: '#ec4899',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Risk (%)' }
                }
            },
            plugins: {
                title: { display: true, text: 'Risk Evolution Across Sessions' }
            }
        }
    });
}

function updateRadarChart() {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    
    const latestSession = currentPatient.sessions[currentPatient.sessions.length - 1];
    const risks = latestSession.risks;
    
    if (charts.radarChart) charts.radarChart.destroy();
    
    charts.radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Cardio', 'Hemato', 'GI', 'Fatigue', 'Mucositis', 'Hepato', 'Neuro'],
            datasets: [{
                label: 'Risk Profile',
                data: [risks.cardioRisk, risks.neutroRisk, risks.nauseaRisk, 
                       risks.fatigueRisk, risks.mucositisRisk, risks.hepatoRisk, risks.neuroRisk],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                title: { display: true, text: 'Multi-Dimensional Risk Assessment' }
            }
        }
    });
}

function updatePatientJourneyChart() {
    const ctx = document.getElementById('patientJourneyChart');
    if (!ctx) return;
    
    const journeyData = currentPatient.sessions.map((session, idx) => ({
        session: `Session ${idx + 1}`,
        overall: session.risks.overallScore,
        heart: 100 - session.risks.cardioRisk,
        blood: 100 - session.risks.neutroRisk,
        energy: 100 - session.risks.fatigueRisk
    }));
    
    if (charts.patientJourneyChart) charts.patientJourneyChart.destroy();
    
    charts.patientJourneyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: journeyData.map(d => d.session),
            datasets: [{
                label: 'Overall Health',
                data: journeyData.map(d => d.overall),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: { display: false },
                title: { display: false }
            }
        }
    });
}

// ==================== PATIENT VIEW FUNCTIONS ====================
function updatePatientView(risks) {
    const noData = document.getElementById('noDataMessage');
    const dataContent = document.getElementById('patientDataContent');
    
    if (currentPatient.sessions.length === 0) {
        noData.style.display = 'block';
        dataContent.style.display = 'none';
        return;
    }
    
    noData.style.display = 'none';
    dataContent.style.display = 'block';
    
    // Update recovery score
    updateRecoveryCircle(risks.overallScore);
    
    // Update metric cards
    updatePatientMetricCards(risks);
    
    // Update patient advice
    updatePatientAdvice(risks);
}

function updateRecoveryCircle(score) {
    const svg = document.getElementById('recoveryCircleSVG');
    const numberDisplay = document.getElementById('recoveryScoreNumber');
    const messageDisplay = document.getElementById('recoveryMessage');
    
    // Create SVG circle
    const radius = 85;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    let color = '#10b981'; // Green
    if (score < 40) color = '#ef4444'; // Red
    else if (score < 70) color = '#f59e0b'; // Orange
    
    svg.innerHTML = `
        <circle cx="100" cy="100" r="85" fill="none" stroke="#e5e7eb" stroke-width="12"/>
        <circle cx="100" cy="100" r="85" fill="none" stroke="${color}" stroke-width="12"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                transform="rotate(-90 100 100)" stroke-linecap="round"/>
    `;
    
    numberDisplay.textContent = score;
    
    if (score > 70) {
        messageDisplay.innerHTML = '🟢 <strong>Great Recovery!</strong> Your body is responding well to treatment.';
    } else if (score > 40) {
        messageDisplay.innerHTML = '🟡 <strong>Moderate Strain.</strong> Rest and hydration are important.';
    } else {
        messageDisplay.innerHTML = '🔴 <strong>High Strain Detected.</strong> Please consult your care team.';
    }
}

function updatePatientMetricCards(risks) {
    // Heart Health
    const heartScore = 100 - risks.cardioRisk;
    document.getElementById('patientHeartScore').textContent = Math.round(heartScore);
    document.getElementById('heartBar').style.width = heartScore + '%';
    
    // Blood Health
    const bloodScore = 100 - risks.neutroRisk;
    document.getElementById('patientBloodScore').textContent = Math.round(bloodScore);
    document.getElementById('bloodBar').style.width = bloodScore + '%';
    
    // Energy Level
    const energyScore = 100 - risks.fatigueRisk;
    document.getElementById('patientEnergyScore').textContent = Math.round(energyScore);
    document.getElementById('energyBar').style.width = energyScore + '%';
    
    // Treatment Progress
    const progressPercent = Math.round((currentPatient.cumulativeDose / 550) * 100);
    document.getElementById('patientProgressPercent').textContent = progressPercent + '%';
    document.getElementById('progressBar').style.width = Math.min(100, progressPercent) + '%';
}

function updatePatientAdvice(risks) {
    const adviceSection = document.getElementById('patientAdviceSection');
    
    let html = '<div style="padding: 20px; line-height: 1.8;">';
    html += '<h3 style="color: #0066cc; margin-bottom: 15px;">📋 Your Personalized Care Guide</h3>';
    
    // Vital signs advice
    const systolic = parseInt(currentPatient.vitals.bloodPressure.split('/')[0]);
    const hr = currentPatient.vitals.heartRate;
    const temp = currentPatient.vitals.temperature;
    
    if (systolic > 140 || hr > 100 || temp > 37.5) {
        html += '<div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin-bottom: 15px;">';
        html += '<h4 style="color: #856404;">⚠️ Current Health Status</h4>';
        if (systolic > 140) {
            html += `<p>• Your blood pressure (${currentPatient.vitals.bloodPressure}) is elevated. Try to relax, reduce salt, and eat heart-healthy foods.</p>`;
        }
        if (hr > 100) {
            html += `<p>• Your heart rate (${hr} bpm) is high. Stay hydrated, rest, and practice deep breathing.</p>`;
        }
        if (temp > 37.5) {
            html += `<p>• Your temperature (${temp}°C) is slightly elevated. Stay cool, drink fluids, and monitor closely.</p>`;
        }
        html += '</div>';
    }
    
    // Risk-specific advice
    if (risks.cardioRisk > 20) {
        html += '<div style="background: #f8d7da; padding: 15px; border-radius: 10px; margin-bottom: 15px;">';
        html += '<h4 style="color: #721c24;">❤️ Heart Health Alert</h4>';
        html += `<p>Your heart risk is ${risks.cardioRisk}%. Important steps:</p>`;
        html += '<ul><li>Eat oatmeal, fish, nuts, and leafy greens</li>';
        html += '<li>Avoid smoking and limit alcohol</li>';
        html += '<li>Watch for chest pain or shortness of breath</li>';
        html += '<li>Keep all cardiology appointments</li></ul>';
        html += '</div>';
    }
    
    if (risks.nauseaRisk > 70) {
        html += '<div style="background: #d4edda; padding: 15px; border-radius: 10px; margin-bottom: 15px;">';
        html += '<h4 style="color: #155724;">🤢 Managing Nausea</h4>';
        html += '<ul><li>Sip ginger tea slowly</li>';
        html += '<li>Eat small, frequent meals</li>';
        html += '<li>Avoid strong smells and greasy foods</li>';
        html += '<li>Try crackers, toast, or bananas</li>';
        html += '<li>Take anti-nausea meds as prescribed</li></ul>';
        html += '</div>';
    }
    
    if (risks.fatigueRisk > 70) {
        html += '<div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin-bottom: 15px;">';
        html += '<h4 style="color: #856404;">😴 Fighting Fatigue</h4>';
        html += '<ul><li>Drink 8-10 glasses of water daily</li>';
        html += '<li>Take short naps (20-30 minutes)</li>';
        html += '<li>Do light exercises like gentle walking</li>';
        html += '<li>Get 15-20 minutes of sunlight daily</li>';
        html += '<li>Practice meditation or relaxation</li></ul>';
        html += '</div>';
    }
    
    if (risks.neutroRisk > 60) {
        html += '<div style="background: #cce5ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">';
        html += '<h4 style="color: #004085;">🛡️ Infection Prevention</h4>';
        html += '<ul><li>Wash hands frequently with soap</li>';
        html += '<li>Avoid crowds and sick people</li>';
        html += '<li>Cook meat thoroughly, avoid raw foods</li>';
        html += '<li>Call doctor if fever >38°C (100.4°F)</li>';
        html += '<li>Keep cuts clean and covered</li></ul>';
        html += '</div>';
    }
    
    // Emergency signs
    html += '<div style="background: #f8d7da; padding: 15px; border-radius: 10px; border-left: 4px solid #dc3545;">';
    html += '<h4 style="color: #721c24;">🚨 Call Your Doctor Immediately If:</h4>';
    html += '<ul><li>Fever ≥38°C (100.4°F)</li>';
    html += '<li>Severe chest pain or difficulty breathing</li>';
    html += '<li>Uncontrolled bleeding or bruising</li>';
    html += '<li>Severe vomiting (can\'t keep fluids down)</li>';
    html += '<li>Confusion or severe dizziness</li>';
    html += '<li>Any symptom that worries you!</li></ul>';
    html += '</div>';
    
    // Encouragement
    html += '<div style="background: #e7f3ff; padding: 20px; border-radius: 10px; text-align: center; margin-top: 15px;">';
    html += '<h4 style="color: #004085;">💪 You\'ve Got This!</h4>';
    html += '<p>You\'re not alone. Your healthcare team is here to support you. Take it one day at a time!</p>';
    html += '</div>';
    
    html += '</div>';
    
    adviceSection.innerHTML = html;
}

// ==================== VIEW SWITCHING ====================
function switchView(mode) {
    currentView = mode;
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide views
    const doctorView = document.getElementById('doctorView');
    const patientView = document.getElementById('patientView');
    
    if (mode === 'patient') {
        doctorView.style.display = 'none';
        patientView.style.display = 'block';
        if (currentPatient && currentPatient.sessions.length > 0) {
            const latestRisks = currentPatient.sessions[currentPatient.sessions.length - 1].risks;
            updatePatientView(latestRisks);
        }
    } else {
        doctorView.style.display = 'block';
        patientView.style.display = 'none';
    }
}

// ==================== TAB SWITCHING ====================
function switchTab(tabName) {
    // Remove active from all tabs and contents
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active to clicked tab and corresponding content
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// ==================== PARTICLES ANIMATION ====================
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (20 + Math.random() * 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// ==================== INITIALIZATION ====================
window.onload = function() {
    createParticles();
    
    // Set default view
    document.getElementById('doctorView').style.display = 'block';
    document.getElementById('patientView').style.display = 'none';
    
    console.log('ChemoTwin RAG System initialized!');
    console.log('RAG Knowledge Base loaded with studies from:');
    console.log('- Lipshultz et al. (1995) - Cardiotoxicity');
    console.log('- Swain et al. (2003) - Dexrazoxane');
    console.log('- Crawford et al. (2004) - Neutropenia');
    console.log('- Cardinale et al. (2015) - Troponin monitoring');
    console.log('- Hesketh et al. (2017) - Antiemetic guidelines');
    console.log('- Sonis et al. (2004) - Mucositis');
};

// Make functions globally accessible
window.loadPatient = loadPatient;
window.generateVirtualPatient = generateVirtualPatient;
window.updatePatientRealtime = updatePatientRealtime;
window.addTreatmentSession = addTreatmentSession;
window.switchView = switchView;
window.switchTab = switchTab;