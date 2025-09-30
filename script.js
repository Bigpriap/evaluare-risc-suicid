'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('riskForm');
    const resultDiv = document.getElementById('result');

    // Scorurile maxime brute, recalculate pentru 100% fidelitate
    const MAX_SCORES = {
        psychiatric: 95, // 20+30+15+8+12+10
        history: 54,     // 25 + 11 (5+3+3) + 10 + 8
        socio: 33,       // 5+5+10+8+5 (protectorii nu afectează maximul)
        contextual: 36   // 10+8+7+6+5
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Funcție ajutătoare pentru a citi datele
        const getVal = (id) => (document.getElementById(id).type === 'checkbox' ? (document.getElementById(id).checked ? parseFloat(document.getElementById(id).value) : 0) : parseFloat(document.getElementById(id).value));

        // --- 1. Flag de Iminență ---
        if (getVal('flag_imminence') === 1) {
            displayResult(-1, 'IMINENT', 'Protocol de criză cu supraveghere 1:1 și evaluare psihiatrică de urgență.', '#e74c3c');
            return;
        }

        // --- 2. Calcul Scoruri Detaliate ---
        // Psihiatric
        const rawPsychiatric = getVal('depresie') + getVal('bipolar') + getVal('psihotic') + getVal('intoxicatie') + getVal('tp') + getVal('tnc');
        
        // Istoric (cu logica detaliată pentru NSSI)
        let nssiScore = 0;
        if (getVal('nssi_base') > 0) {
            nssiScore = getVal('nssi_base') + Math.max(getVal('nssi_freq'), getVal('nssi_freq2'), getVal('nssi_freq3')) + Math.max(getVal('nssi_sev'), getVal('nssi_sev2'), getVal('nssi_sev3'));
        }
        const rawHistory = getVal('tentative') + nssiScore + getVal('familial') + getVal('trauma');

        // Socio-demografic (cu toți protectorii și factorii de risc)
        const riskSocio = getVal('gen') + getVal('varsta') + getVal('izolare') + getVal('financiar');
        const protectiveSocio = getVal('protector_copii') + getVal('protector_suport') + getVal('protector_religie');
        const rawSocio = riskSocio + protectiveSocio;

        // Contextual (cu stresori multipli)
        const alpha = getVal('stresor_timp');
        let rawContextual = 0;
        if (alpha > 0) {
            rawContextual = (getVal('stresor1') + getVal('stresor2') + getVal('stresor3') + getVal('stresor4') + getVal('stresor5')) * alpha;
        }

        // Normalizare
        const normPsychiatric = Math.min(1, Math.max(0, rawPsychiatric / MAX_SCORES.psychiatric));
        const normHistory = Math.min(1, Math.max(0, rawHistory / MAX_SCORES.history));
        const normSocio = Math.min(1, Math.max(0, rawSocio / MAX_SCORES.socio));
        const normContextual = Math.min(1, Math.max(0, rawContextual / MAX_SCORES.contextual));

        // --- 3. Calcul Scor Final ---
        const totalScore = 100 * ((normPsychiatric * 0.40) + (normHistory * 0.30) + (normSocio * 0.20) + (normContextual * 0.10));
        const finalScore = Math.round(totalScore);

        // --- 4. Afișare Rezultat ---
        if (finalScore <= 25) {
            displayResult(finalScore, 'SCĂZUT', 'Recomandare: Externare cu plan de siguranță și follow-up în 7 zile.', '#2ecc71');
        } else if (finalScore <= 50) {
            displayResult(finalScore, 'MEDIU', 'Recomandare: Evaluare psihiatrică extinsă, posibil observație pe termen scurt și follow-up în 48-72 ore.', '#f1c40f');
        } else if (finalScore <= 75) {
            displayResult(finalScore, 'ÎNALT', 'Recomandare: Evaluare psihiatrică urgentă și considerarea internării voluntare.', '#e67e22');
        } else {
            displayResult(finalScore, 'IMINENT', 'Recomandare: Protocol de criză cu supraveghere 1:1 și evaluare psihiatrică de urgență.', '#e74c3c');
        }
    });

    function displayResult(score, level, recommendation, color) {
        resultDiv.style.backgroundColor = color;
        resultDiv.style.color = (level === 'MEDIU' || level === 'SCĂZUT') ? '#333' : '#fff';
        let scoreText = score === -1 ? '' : `<h3>Scor Total: ${score} / 100</h3>`;
        resultDiv.innerHTML = `${scoreText}<h2>Nivel de Risc: ${level}</h2><p>${recommendation}</p>`;
    }
});