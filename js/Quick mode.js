// ABGen 1.0 Quick Mode Analysis
// JavaScript implementation of blood gas analysis
class ABGData {
    constructor(ph, pco2, hco3, be) {
        this.pH = ph;
        this.pCO2 = pco2;
        this.hCO3 = hco3;
        this.BE = be;
    }
}

function validateInputs(phValue, pco2Value, hco3Value, beValue) {
    if (!phValue || !pco2Value || !hco3Value || !beValue) {
        return { isValid: false, errorMessage: "Please fill in all fields😴" };
    }
    return { isValid: true, errorMessage: "" };
}

function parseValues(phValue, pco2Value, hco3Value, beValue) {
    try {
        const ph = parseFloat(phValue.replace(',', '.'));
        const pco2 = parseFloat(pco2Value.replace(',', '.'));
        const hco3 = parseFloat(hco3Value.replace(',', '.'));
        const be = parseFloat(beValue.replace(',', '.'));

        return { 
            success: true, 
            data: new ABGData(ph, pco2, hco3, be), 
            error: "" 
        };
    } catch {
        return { 
            success: false, 
            data: new ABGData(0, 0, 0, 0), 
            error: "Please enter valid numbers" 
        };
    }
}

function validateRanges(data) {
    if (data.pH < 6.8 || data.pH > 7.8) {
        return { isValid: false, errorMessage: "pH value is outside physiological range (6.8-7.8)" };
    }
    
    if (data.pCO2 < 10 || data.pCO2 > 130) {
        return { isValid: false, errorMessage: "PCO₂ value is outside physiological range (10-130 mmHg)" };
    }
    
    if (data.hCO3 < 5 || data.hCO3 > 60) {
        return { isValid: false, errorMessage: "HCO₃ value is outside physiological range (5-60 mEq/L)" };
    }
    
    if (data.BE < -30 || data.BE > 30) {
        return { isValid: false, errorMessage: "Base Excess value is outside physiological range (-30 to +30 mEq/L)" };
    }
    
    return { isValid: true, errorMessage: "" };
}

function calculateHendersonHasselbalch(pco2, hco3) {
    if (pco2 <= 0 || hco3 <= 0) {
        throw new Error("PCO2 and HCO3 must be greater than 0");
    }
    return 6.1 + Math.log10(hco3 / (0.03 * pco2));
}

function calculateExpectedPCO2(hco3, ph) {
    if (hco3 <= 0)
        throw new Error("HCO3 must be greater than 0");
    if (ph < 6.8 || ph > 7.8)
        throw new Error("pH must be between 6.8 and 7.8");

    if (ph < 7.35) {
        return hco3 < 12 ? (1.5 * hco3) + 6 : (1.5 * hco3) + 8;
    } else if (ph > 7.45) {
        return hco3 > 40 ? (0.7 * hco3) + 20 : (0.9 * hco3) + 16;
    } else {
        let expectedPCO2 = 40;

        if (hco3 < 24)
            expectedPCO2 = 38 + ((hco3 - 22) * 0.5);
        else if (hco3 > 26)
            expectedPCO2 = 42 + ((hco3 - 26) * 0.5);

        return expectedPCO2;
    }
}

function determineAcidBaseDisorder(pH, pCO2, HCO3, BE) {
    let disorders = [];
    const isAcidemia = pH < 7.35;
    const isAlkalemia = pH > 7.45;
    const isMetabolicAcidosis = HCO3 < 22 || BE < -2;
    const isMetabolicAlkalosis = HCO3 > 26 || BE > 2;
    const isRespiratoryAcidosis = pCO2 > 45;
    const isRespiratoryAlkalosis = pCO2 < 35;

    // Step 1: Detect acidemia/alkalemia
    disorders.push(isAcidemia ? "• Acidemia detected." :
                  isAlkalemia ? "• Alkalemia detected." :
                  "• pH is within normal range.");

    // Step 2: Determine primary disorder
    let primaryDisorder = "";
    if (isAcidemia) {
        if (isRespiratoryAcidosis && !isMetabolicAcidosis) {
            primaryDisorder = "respiratory acidosis";
        } else if (isMetabolicAcidosis && !isRespiratoryAcidosis) {
            primaryDisorder = "metabolic acidosis";
        } else if (isRespiratoryAcidosis && isMetabolicAcidosis) {
            primaryDisorder = "mixed respiratory and metabolic acidosis";
        }
    } else if (isAlkalemia) {
        if (isRespiratoryAlkalosis && !isMetabolicAlkalosis) {
            primaryDisorder = "respiratory alkalosis";
        } else if (isMetabolicAlkalosis && !isRespiratoryAlkalosis) {
            primaryDisorder = "metabolic alkalosis";
        } else if (isRespiratoryAlkalosis && isMetabolicAlkalosis) {
            primaryDisorder = "mixed respiratory and metabolic alkalosis";
        }
    } else {
        if (isRespiratoryAcidosis && isMetabolicAlkalosis) {
            primaryDisorder = "mixed disorder with normal pH";
        } else if (isRespiratoryAlkalosis && isMetabolicAcidosis) {
            primaryDisorder = "mixed disorder with normal pH";
        } else {
            primaryDisorder = "normal acid-base status";
        }
    }
    
    disorders.push(`• Primary disorder: ${primaryDisorder}`);

    // Step 3: Check for compensation
    if (primaryDisorder.includes("respiratory acidosis")) {
        const expectedHCO3Acute = 24 + 0.1 * (pCO2 - 40); // Acute: HCO3↑ by 1 per 10↑ pCO2
        const expectedHCO3Chronic = 24 + 0.35 * (pCO2 - 40); // Chronic: HCO3↑ by 4 per 10↑ pCO2
        const isCompensated = HCO3 >= expectedHCO3Acute && HCO3 <= expectedHCO3Chronic;
        disorders.push(isCompensated ?
            "  - Chronic respiratory acidosis with renal compensation." :
            "  - Acute respiratory acidosis with minimal compensation.");
    } else if (primaryDisorder.includes("respiratory alkalosis")) {
        const expectedHCO3Acute = 24 - 0.2 * (40 - pCO2); // Acute: HCO3↓ by 2 per 10↓ pCO2
        const expectedHCO3Chronic = 24 - 0.4 * (40 - pCO2); // Chronic: HCO3↓ by 4 per 10↓ pCO2
        const isCompensated = HCO3 <= expectedHCO3Acute && HCO3 >= expectedHCO3Chronic;
        disorders.push(isCompensated ?
            "  - Chronic respiratory alkalosis with renal compensation." :
            "  - Acute respiratory alkalosis with minimal compensation.");
    } else if (primaryDisorder.includes("metabolic acidosis")) {
        const expectedPCO2 = 1.5 * HCO3 + 8; // Winter's formula
        const isCompensated = Math.abs(pCO2 - expectedPCO2) < 5;
        disorders.push(isCompensated ?
            "  - Metabolic acidosis with appropriate respiratory compensation." :
            "  - Metabolic acidosis with inadequate respiratory compensation.");
    } else if (primaryDisorder.includes("metabolic alkalosis")) {
        const expectedPCO2 = 0.7 * HCO3 + 20; // Expected compensation
        const isCompensated = Math.abs(pCO2 - expectedPCO2) < 5;
        disorders.push(isCompensated ?
            "  - Metabolic alkalosis with appropriate respiratory compensation." :
            "  - Metabolic alkalosis with inadequate respiratory compensation.");
    }

    // Step 4: Detect mixed disorders
    if ((isRespiratoryAcidosis && isMetabolicAcidosis) || (isRespiratoryAlkalosis && isMetabolicAlkalosis)) {
        disorders.push("• Mixed disorder: Combined respiratory and metabolic disturbance.");
    } else if ((isRespiratoryAcidosis && isMetabolicAlkalosis) || (isRespiratoryAlkalosis && isMetabolicAcidosis)) {
        disorders.push("• Mixed disorder: Opposite respiratory and metabolic disturbances.");
    }

    // Step 5: Add anion gap note
    disorders.push("\nNote: For metabolic acidosis, always calculate anion gap to identify type.");

    return disorders.join("\n");
}

function provideClinicalSuggestions(pH, pCO2, HCO3, BE) {
    let suggestions = ["<div class='clinical-suggestion'>"];
    let hasSuggestions = false;

    // 1. Critical Values First - Treatment recommendations for life-threatening situations
    if (pH < 7.2 || pH > 7.6) {
        suggestions.push("<div style='display: flex; justify-content: center; margin-bottom: 20px;'>");
        suggestions.push("<h3 style='color: #dc3545; background-color: #f8d7da; padding: 10px; border-radius: 5px; border: 2px solid #dc3545; text-align: center;'>⚠️ CRITICAL VALUE ALERT ⚠️</h3>");
        suggestions.push("</div>");
        suggestions.push("<ul>");
        if (pH < 7.2) {
            suggestions.push("<li style='color: #dc3545; font-weight: bold;'>Severe acidemia (pH <7.2):");
            suggestions.push("<ul>");
            suggestions.push("<li>Immediate ABG confirmation required</li>");
            suggestions.push("<li>Consider IV bicarbonate only if pH <7.1 with severe metabolic acidosis</li>");
            suggestions.push("<li>Target pH >7.1-7.2, not normal pH (avoid overcorrection)</li>");
            suggestions.push("<li>Ensure adequate ventilation before bicarbonate administration</li>");
            suggestions.push("<li>For DKA: IV fluids, insulin, and potassium replacement per protocol</li>");
            suggestions.push("</ul></li>");
        }
        if (pH > 7.6) {
            suggestions.push("<li style='color: #dc3545; font-weight: bold;'>Severe alkalemia (pH >7.6):");
            suggestions.push("<ul>");
            suggestions.push("<li>For respiratory: Adjust ventilation to normalize PCO2</li>");
            suggestions.push("<li>For metabolic: Isotonic saline for chloride-responsive cases</li>");
            suggestions.push("<li>Avoid rapid correction (target 0.1 pH change per hour)</li>");
            suggestions.push("<li>Replace K+ if hypokalemic (common with alkalosis)</li>");
            suggestions.push("<li>Consider acetazolamide for diuretic-induced alkalosis</li>");
            suggestions.push("</ul></li>");
        }
        suggestions.push("</ul>");
        hasSuggestions = true;
    }

    // 2. Disorder-Specific Treatment Recommendations
    let primaryDisorder = determineAcidBaseDisorder(pH, pCO2, HCO3, BE);
    if (primaryDisorder) {
        suggestions.push("<h3>Treatment Recommendations</h3>");
        suggestions.push("<ul>");
        
        if (primaryDisorder.includes("Respiratory Acidosis")) {
            suggestions.push("<li>Respiratory Acidosis Treatment:");
            suggestions.push("<ul>");
            suggestions.push("<li>Acute: Optimize airway, ventilation, and oxygenation</li>");
            suggestions.push("<li>Bronchodilators (albuterol, ipratropium) for bronchospasm</li>");
            suggestions.push("<li>NIV: Consider for COPD/CHF (IPAP 8-20, EPAP 3-10 cmH2O)</li>");
            suggestions.push("<li>Mechanical ventilation: Start with VT 6-8 mL/kg, RR 12-20</li>");
            suggestions.push("<li>Reduce/reverse sedatives, opioids, or neuromuscular blockers</li>");
            suggestions.push("<li>Chronic: Avoid rapid correction (risk of post-hypercapnic alkalosis)</li>");
            suggestions.push("</ul></li>");
            hasSuggestions = true;
        }
        else if (primaryDisorder.includes("Respiratory Alkalosis")) {
            suggestions.push("<li>Respiratory Alkalosis Treatment:");
            suggestions.push("<ul>");
            suggestions.push("<li>Treat underlying cause (pain, anxiety, sepsis, PE)</li>");
            suggestions.push("<li>Anxiety-induced: Controlled breathing techniques, consider anxiolytics</li>");
            suggestions.push("<li>Ventilated patients: Decrease minute ventilation (↓ RR or VT)</li>");
            suggestions.push("<li>Avoid rapid correction in chronic cases</li>");
            suggestions.push("<li>Rebreathing techniques only for psychogenic hyperventilation</li>");
            suggestions.push("<li>Replace phosphate if hypophosphatemia present</li>");
            suggestions.push("</ul></li>");
            hasSuggestions = true;
        }
        else if (primaryDisorder.includes("Metabolic Acidosis")) {
            suggestions.push("<li>Metabolic Acidosis Treatment:");
            suggestions.push("<ul>");
            suggestions.push("<li>High AG acidosis:</li>");
            suggestions.push("<ul>");
            suggestions.push("<li>Lactic acidosis: Optimize tissue perfusion, treat sepsis</li>");
            suggestions.push("<li>DKA: IV fluids, insulin, K+ replacement per protocol</li>");
            suggestions.push("<li>Toxic: Specific antidotes (e.g., fomepizole for methanol/ethylene glycol)</li>");
            suggestions.push("<li>Renal failure: Consider dialysis if severe/refractory</li>");
            suggestions.push("</ul>");
            suggestions.push("<li>Normal AG acidosis:</li>");
            suggestions.push("<ul>");
            suggestions.push("<li>GI loss: Volume and bicarbonate replacement</li>");
            suggestions.push("<li>RTA: Oral bicarbonate supplementation</li>");
            suggestions.push("<li>IV bicarbonate only if pH <7.1 or symptomatic</li>");
            suggestions.push("</ul></li>");
            hasSuggestions = true;
        }
        else if (primaryDisorder.includes("Metabolic Alkalosis")) {
            suggestions.push("<li>Metabolic Alkalosis Treatment:");
            suggestions.push("<ul>");
            suggestions.push("<li>Chloride-responsive (urine Cl <20 mEq/L):</li>");
            suggestions.push("<ul>");
            suggestions.push("<li>Volume depletion: Normal saline (0.9% NaCl)</li>");
            suggestions.push("<li>K+ depletion: KCl replacement (oral or IV)</li>");
            suggestions.push("<li>Stop diuretics if possible</li>");
            suggestions.push("</ul>");
            suggestions.push("<li>Chloride-resistant (urine Cl >20 mEq/L):</li>");
            suggestions.push("<ul>");
            suggestions.push("<li>Primary hyperaldosteronism: Spironolactone</li>");
            suggestions.push("<li>Cushing's: Treat underlying cause</li>");
            suggestions.push("<li>Severe cases: Consider H+ administration (HCl, acetazolamide)</li>");
            suggestions.push("</ul></li>");
            hasSuggestions = true;
        }
        else if (primaryDisorder.includes("Mixed")) {
            suggestions.push("<li>Mixed Disorder Treatment:</li>");
            suggestions.push("<ul>");
            suggestions.push("<li>Prioritize treatment of the most life-threatening component</li>");
            suggestions.push("<li>For combined acidosis (metabolic + respiratory):</li>");
            suggestions.push("<ul>");
            suggestions.push("<li>Optimize ventilation and address metabolic component</li>");
            suggestions.push("<li>Fluid resuscitation if hypovolemic</li>");
            suggestions.push("</ul>");
            suggestions.push("<li>For opposing disorders (e.g., metabolic acidosis + respiratory alkalosis):</li>");
            suggestions.push("<ul>");
            suggestions.push("<li>Treat underlying causes of both components</li>");
            suggestions.push("<li>Monitor closely for overcorrection</li>");
            suggestions.push("<li>Consider sepsis, salicylate toxicity, liver failure</li>");
            suggestions.push("</ul></li>");
            hasSuggestions = true;
        }
        
        suggestions.push("</ul>");
    }


    
    // 3. Medication Dosing Guidelines (New Section)
    suggestions.push("<h3>Medication Dosing Guidelines</h3>");
    suggestions.push("<ul>");
    suggestions.push("<li>Sodium bicarbonate:</li>");
    suggestions.push("<ul>");
    suggestions.push("<li>Severe acidosis: 1-2 mEq/kg IV bolus, then 0.5-1 mEq/kg/hr infusion</li>");
    suggestions.push("<li>Target pH >7.1-7.2, not normal pH</li>");
    suggestions.push("</ul>");
    suggestions.push("<li>Potassium replacement:</li>");
    suggestions.push("<ul>");
    suggestions.push("<li>K+ 3.0-3.5: 40-60 mEq oral or 10 mEq/hr IV</li>");
    suggestions.push("<li>K+ 2.5-3.0: 60-80 mEq oral or 10-20 mEq/hr IV</li>");
    suggestions.push("<li>K+ <2.5: 20 mEq/hr IV (max rate with cardiac monitoring)</li>");
    suggestions.push("</ul>");
    suggestions.push("<li>Acetazolamide: 250-500 mg IV/PO for metabolic alkalosis</li>");
    suggestions.push("</ul>");
    hasSuggestions = true;

    // 4. Monitoring Recommendations
    suggestions.push("<h3>Monitoring Recommendations</h3>");
    suggestions.push("<ul>");
    suggestions.push("<li>Repeat ABG/VBG in 2-4 hours after intervention</li>");
    suggestions.push("<li>Monitor electrolytes q4-6h during active correction</li>");
    suggestions.push("<li>Continuous cardiac monitoring for severe disorders</li>");
    suggestions.push("<li>Monitor urine output (goal >0.5 mL/kg/hr)</li>");
    suggestions.push("<li>For bicarbonate therapy: monitor ionized calcium</li>");
    suggestions.push("</ul>");
    hasSuggestions = true;

    // 3. Parameter-Specific Alerts
    let alerts = [];
    if (pCO2 > 50) alerts.push("Severe hypercapnia: Consider respiratory support, assess for COPD exacerbation or respiratory depression");
    if (pCO2 < 25) alerts.push("Severe hypocapnia: Assess for anxiety, sepsis, DKA, PE, or CNS pathology");
    if (HCO3 < 15) alerts.push("Severe metabolic acidosis: Calculate anion gap, check lactate, ketones, and renal function");
    if (BE < -4) alerts.push("Base deficit: Assess tissue perfusion, blood pressure, urine output, and oxygen saturation");
    if (BE > 4) alerts.push("Base excess: Assess volume status, electrolytes, and diuretic use");

    if (alerts.length > 0) {
        suggestions.push("<h3>⚠️ Parameter-Specific Alerts</h3>");
        suggestions.push("<ul>");
        alerts.forEach(alert => {
            suggestions.push(`<li>${alert}</li>`);
        });
        suggestions.push("</ul>");
        hasSuggestions = true;
    }

    if (!hasSuggestions) {
        suggestions.push("<p>No critical alerts. Continue monitoring as clinically indicated.</p>");
    }

    suggestions.push("</div>");
    return suggestions.join("\n");
}

function validateAndAnalyzeABG(ph, pco2, hco3, be) {
    let result = [];

    // ABG Validation
    result.push("<div class='result-section'>");
    result.push("<h3>ABG Validation</h3>");
    try {
        let calculatedPH = calculateHendersonHasselbalch(pco2, hco3);
        let isValid = Math.abs(calculatedPH - ph) < 0.15;

        if (!isValid) {
            result.push("<div class='validation-result invalid'>");
            result.push("<strong>⚠️ WARNING:</strong> Values may be inconsistent with Henderson-Hasselbalch equation");
            result.push(`<div class='calculated-value'>Calculated pH: ${calculatedPH.toFixed(2)} (Measured: ${ph.toFixed(2)})</div>`);
            result.push("</div>");
        } else {
            result.push("<div class='validation-result valid'>");
            result.push("<strong>✓ Values are consistent</strong> with Henderson-Hasselbalch equation.");
            result.push(`<div class='calculated-value'>Calculated pH: ${calculatedPH.toFixed(2)} (Measured: ${ph.toFixed(2)})</div>`);
            result.push("</div>");
        }
    } catch (ex) {
        result.push(`<div class='validation-result invalid'>Error in validation: ${ex.message}</div>`);
    }
    result.push("</div>");

    // Compensation Analysis
    result.push("<div class='result-section'>");
    result.push("<h3>Compensation Analysis</h3>");
    try {
        let expectedPCO2 = calculateExpectedPCO2(hco3, ph);
        let pco2Difference = Math.abs(expectedPCO2 - pco2);
        
        // Define compensation based on pH normalization (7.35-7.45)
        let isCompensated = ph >= 7.35 && ph <= 7.45;
        let compensationStatus = isCompensated ? 
            "<span class='status-compensated'>Compensated</span>" : 
            "<span class='status-uncompensated'>Not compensated</span>";
        
        result.push(`<p>Expected PCO₂: ${expectedPCO2.toFixed(1)} mmHg (Measured: ${pco2.toFixed(1)} mmHg)</p>`);
        result.push(`<p>Difference: ${pco2Difference.toFixed(1)} mmHg</p>`);
        result.push(`<p>Compensation Status: ${compensationStatus}</p>`);
        
        // Add explanation of compensation status
        if (!isCompensated) {
            if (ph < 7.35) {
                result.push("<p class='compensation-note'>pH remains acidemic despite compensation</p>");
            } else if (ph > 7.45) {
                result.push("<p class='compensation-note'>pH remains alkalemic despite compensation</p>");
            }
        } else {
            result.push("<p class='compensation-note'>pH has returned to normal range</p>");
        }
    } catch (ex) {
        result.push(`<div class='validation-result invalid'>Error in compensation analysis: ${ex.message}</div>`);
    }
    result.push("</div>");

    // Primary Disorder Analysis
    result.push("<div class='result-section'>");
    result.push("<h3>Primary Disorder</h3>");

    // Get disorder type and details
    let disorderType = determineDisorderType(ph, pco2, hco3);
    let disorderDetails = getDisorderDetails(ph, pco2, hco3, be);
    let disorderIcon = getDisorderIcon(disorderType);
    let disorderSeverity = determineSeverity(ph, pco2, hco3);

    // Create enhanced disorder display
    result.push(`<div class='disorder-container disorder-${disorderType.toLowerCase()}'>`);
    result.push(`<div class='disorder-header'><i class="fas ${disorderIcon}"></i>${disorderDetails.mainPoint}</div>`);
    result.push(`<div class='disorder-content'>`);

    // Add disorder description
    result.push(`<div class='disorder-description'>${getDisorderDescription(disorderType, ph)}</div>`);

    // Add severity badge if not normal
    if (disorderType !== "Normal") {
        result.push(`<div class='disorder-severity severity-${disorderSeverity.toLowerCase()}'>${disorderSeverity} ${disorderType}</div>`);
    }

    // Add detailed points
    if (disorderDetails.subPoints.length > 0) {
        result.push(`<div class='disorder-details'><ul>`);
        disorderDetails.subPoints.forEach(point => {
            result.push(`<li>${point}</li>`);
        });
        result.push(`</ul></div>`);
    }

    result.push(`</div></div>`);
    result.push("</div>");

    // Clinical Suggestions
    result.push("<div class='result-section'>");
    result.push("<h3>Clinical Suggestions</h3>");
    
    // Critical alert section
    if (ph < 7.2 || ph > 7.6) {
        result.push("<div class='critical-alert'>");
        result.push("<h4>⚠️ CRITICAL VALUE ALERT</h4>");
        result.push("<ul>");
        if (ph < 7.2) {
            result.push("<li><strong>Severe acidemia (pH &lt;7.2):</strong>");
            result.push("<ul>");
            result.push("<li>Immediate ABG confirmation required</li>");
            result.push("<li>Consider IV bicarbonate only if pH &lt;7.1 with severe metabolic acidosis</li>");
            result.push("<li>Target pH &gt;7.1-7.2, not normal pH (avoid overcorrection)</li>");
            result.push("<li>Ensure adequate ventilation before bicarbonate administration</li>");
            result.push("<li>For DKA: IV fluids, insulin, and potassium replacement per protocol</li>");
            result.push("</ul></li>");
        }
        // Add similar blocks for other critical values
        result.push("</ul>");
        result.push("</div>");
    }
    
    // Treatment recommendations
    result.push("<div class='treatment-section'>");
    result.push("<h3>Treatment Recommendations</h3>");
    result.push("<div class='treatment-content'>");

    // Add disorder-specific treatment recommendations
    if (disorderType === "Acidosis") {
        if (pco2 > 45) { // Respiratory acidosis
            result.push("<h4>Respiratory Acidosis Management:</h4>");
            result.push("<ul>");
            result.push("<li><strong>Ventilatory Support:</strong> Optimize airway management and ventilation parameters</li>");
            result.push("<li><strong>Acute Setting:</strong> Consider NIV (IPAP 10-14, EPAP 4-6 cmH₂O) or mechanical ventilation</li>");
            result.push("<li><strong>Chronic COPD:</strong> Bronchodilators (albuterol 2.5mg nebulized q4-6h), consider corticosteroids</li>");
            result.push("<li><strong>Opioid-Induced:</strong> Naloxone 0.4-2mg IV/IM/IN, titrate to respiratory effect</li>");
            result.push("<li><strong>Neuromuscular:</strong> Address underlying cause, consider neurology consultation</li>");
            result.push("</ul>");
        } else { // Metabolic acidosis
            result.push("<h4>Metabolic Acidosis Management:</h4>");
            result.push("<ul>");
            
            // Calculate anion gap
            const anionGap = 140 - hco3 - 100; // Simplified calculation
            
            if (anionGap > 12) {
                result.push("<li><strong>High Anion Gap Acidosis:</strong></li>");
                result.push("<ul>");
                result.push("<li><strong>Lactic Acidosis:</strong> IV crystalloids, source control for sepsis, vasopressors if needed</li>");
                result.push("<li><strong>DKA:</strong> IV fluids (NS 15-20 mL/kg/hr initial), insulin (0.1 U/kg/hr), K⁺ replacement when K⁺ <5.0 mEq/L</li>");
                result.push("<li><strong>Toxic Ingestion:</strong> Fomepizole 15 mg/kg IV for methanol/ethylene glycol, consider hemodialysis</li>");
                result.push("<li><strong>Renal Failure:</strong> Nephrology consult, consider RRT if severe (pH <7.1, K⁺ >6.5, or refractory)</li>");
                result.push("</ul>");
            } else {
                result.push("<li><strong>Normal Anion Gap Acidosis:</strong></li>");
                result.push("<ul>");
                result.push("<li><strong>RTA Type 1:</strong> Oral bicarbonate 1-2 mEq/kg/day in divided doses</li>");
                result.push("<li><strong>RTA Type 2:</strong> Bicarbonate replacement, K⁺ citrate, address underlying cause</li>");
                result.push("<li><strong>RTA Type 4:</strong> Fludrocortisone 0.1-0.2 mg daily if hypoaldosteronism</li>");
                result.push("<li><strong>Diarrhea:</strong> IV fluids with bicarbonate (D5 ½NS + 75-100 mEq NaHCO₃/L)</li>");
                result.push("</ul>");
            }
            
            // Bicarbonate therapy guidelines
            if (ph < 7.2) {
                result.push("<li><strong>Bicarbonate Therapy:</strong></li>");
                result.push("<ul>");
                result.push("<li>Consider if pH <7.1 with severe metabolic acidosis</li>");
                result.push("<li>Dose: NaHCO₃ 1-2 mEq/kg IV bolus, then 0.5-1 mEq/kg/hr infusion</li>");
                result.push("<li>Target pH >7.1-7.2, not normal pH (avoid overcorrection)</li>");
                result.push("<li>Monitor ionized calcium and potassium closely</li>");
                result.push("</ul>");
            }
            
            result.push("</ul>");
        }
    } else if (disorderType === "Alkalosis") {
        if (pco2 < 35) { // Respiratory alkalosis
            result.push("<h4>Respiratory Alkalosis Management:</h4>");
            result.push("<ul>");
            result.push("<li><strong>Anxiety-Induced:</strong> Breathing techniques, consider anxiolytics (lorazepam 0.5-1mg)</li>");
            result.push("<li><strong>Sepsis:</strong> Source control, appropriate antibiotics, fluid resuscitation</li>");
            result.push("<li><strong>Hypoxemia:</strong> Oxygen therapy, address underlying cause</li>");
            result.push("<li><strong>Salicylate Toxicity:</strong> Consider activated charcoal if recent ingestion, alkaline diuresis</li>");
            result.push("<li><strong>Mechanical Ventilation:</strong> Adjust respiratory rate and tidal volume</li>");
            result.push("</ul>");
        } else { // Metabolic alkalosis
            result.push("<h4>Metabolic Alkalosis Management:</h4>");
            result.push("<ul>");
            result.push("<li><strong>Chloride-Responsive (Urine Cl⁻ <20 mEq/L):</strong></li>");
            result.push("<ul>");
            result.push("<li>Volume depletion: Normal saline (0.9% NaCl) at 100-150 mL/hr</li>");
            result.push("<li>K⁺ depletion: KCl 10-20 mEq/hr IV (max 200 mEq/day) with cardiac monitoring</li>");
            result.push("<li>Discontinue diuretics if possible</li>");
            result.push("</ul>");
            result.push("<li><strong>Chloride-Resistant (Urine Cl⁻ >20 mEq/L):</strong></li>");
            result.push("<ul>");
            result.push("<li>Primary hyperaldosteronism: Spironolactone 25-100 mg daily</li>");
            result.push("<li>Cushing's syndrome: Address underlying cause</li>");
            result.push("<li>Severe cases: Acetazolamide 250-500 mg IV/PO q6h</li>");
            result.push("<li>Consider H₂ blockers for nasogastric suction (famotidine 20mg IV q12h)</li>");
            result.push("</ul>");
            result.push("</ul>");
        }
    } else if (disorderType === "Mixed") {
        result.push("<h4>Mixed Disorder Management:</h4>");
        result.push("<ul>");
        result.push("<li><strong>Complex Presentation:</strong> Address primary disorder first</li>");
        result.push("<li><strong>Careful Correction:</strong> Monitor closely during treatment to avoid overcorrection</li>");
        result.push("<li><strong>Serial ABGs:</strong> Repeat testing q2-4h during active intervention</li>");
        result.push("<li><strong>Nephrology/Critical Care Consult:</strong> Consider for complex mixed disorders</li>");
        result.push("</ul>");
    } else { // Normal
        result.push("<h4>Normal Acid-Base Status:</h4>");
        result.push("<ul>");
        result.push("<li>Continue monitoring if clinically indicated</li>");
        result.push("<li>Consider repeat testing if clinical status changes</li>");
        result.push("</ul>");
    }

    // Add medication dosing guidelines
    result.push("<h4>Medication Dosing Guidelines:</h4>");
    result.push("<div class='medication-dosing'>");
    result.push("<table>");
    result.push("<tr><th>Medication</th><th>Indication</th><th>Dosing</th><th>Monitoring</th></tr>");
    result.push("<tr><td>Sodium Bicarbonate</td><td>Severe metabolic acidosis</td><td>1-2 mEq/kg IV bolus, then 0.5-1 mEq/kg/hr</td><td>pH, electrolytes, ionized Ca²⁺</td></tr>");
    result.push("<tr><td>Acetazolamide</td><td>Metabolic alkalosis</td><td>250-500 mg IV/PO q6-12h</td><td>Electrolytes, acid-base status</td></tr>");
    result.push("<tr><td>Potassium Chloride</td><td>Hypokalemia</td><td>10-20 mEq/hr IV (max 200 mEq/day)</td><td>ECG, K⁺ levels q4-6h</td></tr>");
    result.push("<tr><td>Albuterol</td><td>Bronchospasm</td><td>2.5-5 mg nebulized q4-6h</td><td>O₂ saturation, heart rate</td></tr>");
    result.push("</table>");
    result.push("</div>");

    result.push("</div>"); // Close treatment-content
    result.push("</div>"); // Close treatment-section
    
    // Parameter alerts
    result.push("<div class='parameter-alert'>");
    result.push("<h4>Parameter-Specific Alerts</h4>");
    result.push("<ul>");
    if (hco3 < 15) {
        result.push("<li>Severe metabolic acidosis: Calculate anion gap, check lactate, ketones, and renal function</li>");
    }
    if (be < -4) {
        result.push("<li>Base deficit: Assess tissue perfusion, blood pressure, urine output, and oxygen saturation</li>");
    }
    // Add other parameter alerts
    result.push("</ul>");
    result.push("</div>");
    
    result.push("</div>");

    return result.join("\n");
}

function analyzeABG(phValue, pco2Value, hco3Value, beValue) {
    // Validate inputs
    const inputValidation = validateInputs(phValue, pco2Value, hco3Value, beValue);
    if (!inputValidation.isValid) {
        return { success: false, message: inputValidation.errorMessage };
    }

    // Parse values
    const parseResult = parseValues(phValue, pco2Value, hco3Value, beValue);
    if (!parseResult.success) {
        return { success: false, message: parseResult.error };
    }

    // Validate ranges
    const rangeValidation = validateRanges(parseResult.data);
    if (!rangeValidation.isValid) {
        return { success: false, message: rangeValidation.errorMessage };
    }

    // Perform analysis
    const analysis = validateAndAnalyzeABG(
        parseResult.data.pH, 
        parseResult.data.pCO2, 
        parseResult.data.hCO3, 
        parseResult.data.BE
    );

    return { 
        success: true, 
        message: "Analysis completed successfully", 
        analysis: analysis,
        data: parseResult.data
    };
}

function displayResultsInModal(results) {
    const modalContent = document.getElementById('modalResultContent');
    const resultsModal = document.getElementById('resultsModal');
    
    if (!modalContent || !resultsModal) {
        alert("Error: Modal elements not found in the document");
        console.error("Modal elements not found");
        return;
    }
    
    if (!results.success) {
        modalContent.innerHTML = `<div class="error-message">${results.message}</div>`;
    } else {
        // Process the analysis text to enhance headers
        let enhancedAnalysis = results.analysis;
        
        // Replace the ABG Validation header with an h3
        enhancedAnalysis = enhancedAnalysis.replace(
            /<b>1\. ABG Validation:<\/b><br>/,
            '<h3>1. ABG Validation</h3>'
        );
        
        // Replace other section headers with h3 tags
        enhancedAnalysis = enhancedAnalysis.replace(
            /<b>2\. Primary Disorder:<\/b><br>/,
            '<h3>2. Primary Disorder</h3>'
        );
        
        enhancedAnalysis = enhancedAnalysis.replace(
            /<b>3\. Compensation Status:<\/b><br>/,
            '<h3>3. Compensation Status</h3>'
        );
        
        enhancedAnalysis = enhancedAnalysis.replace(
            /<b>4\. Clinical Implications:<\/b><br>/,
            '<h3>4. Clinical Implications</h3>'
        );
        
        // Add a class to the modal for animation purposes
        resultsModal.classList.add('animated-modal');
        
        modalContent.innerHTML = `
            <div class="results-header">
                <h2>ABG Analysis Results</h2>
                <div class="values-summary">
                    <div class="value-item">pH: ${results.data.pH.toFixed(2)}</div>
                    <div class="value-item">PCO₂: ${results.data.pCO2.toFixed(1)} mmHg</div>
                    <div class="value-item">HCO₃: ${results.data.hCO3.toFixed(1)} mEq/L</div>
                    <div class="value-item">BE: ${results.data.BE.toFixed(1)} mEq/L</div>
                </div>
            </div>
            <div class="analysis-content">
                ${enhancedAnalysis}
            </div>
            <div class="results-actions">
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Print Results
                </button>
                <button class="btn btn-secondary" onclick="closeResultsModal()">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        `;
        
        // Add animation classes to elements after they're in the DOM
        setTimeout(() => {
            const headers = modalContent.querySelectorAll('.analysis-content h3');
            headers.forEach((header, index) => {
                header.style.setProperty('--i', index + 1);
            });
        }, 100);
    }
    
    // Show the modal
    resultsModal.style.display = 'block';
}

// Helper function to determine disorder type
function determineDisorderType(ph, pco2, hco3) {
    if (ph < 7.35) {
        if (pco2 > 45) return "Acidosis";
        if (hco3 < 22) return "Acidosis";
        return "Mixed";
    } else if (ph > 7.45) {
        if (pco2 < 35) return "Alkalosis";
        if (hco3 > 26) return "Alkalosis";
        return "Mixed";
    } else {
        return "Normal";
    }
}

// Helper function to get appropriate icon
function getDisorderIcon(disorderType) {
    switch(disorderType) {
        case "Acidosis": return "fa-exclamation-triangle";
        case "Alkalosis": return "fa-arrow-up";
        case "Mixed": return "fa-random";
        case "Normal": return "fa-check-circle";
        default: return "fa-question-circle";
    }
}

// Helper function to get disorder details
function getDisorderDetails(ph, pco2, hco3, be) {
    let details = {
        mainPoint: "",
        subPoints: []
    };
    
    if (ph < 7.35) {
        if (pco2 > 45 && hco3 > 26) {
            details.mainPoint = "Primary Respiratory Acidosis with Metabolic Compensation";
            details.subPoints = [
                "Elevated PCO₂ indicates respiratory acidosis",
                "Elevated HCO₃ suggests metabolic compensation",
                "Consider causes: hypoventilation, COPD, sedatives, neuromuscular disorders"
            ];
        } else if (pco2 > 45 && hco3 <= 26) {
            details.mainPoint = "Acute Respiratory Acidosis";
            details.subPoints = [
                "Elevated PCO₂ with minimal HCO₃ compensation",
                "Consider causes: acute respiratory depression, airway obstruction",
                "Requires immediate ventilatory support assessment"
            ];
        } else if (hco3 < 22 && pco2 < 35) {
            details.mainPoint = "Primary Metabolic Acidosis with Respiratory Compensation";
            details.subPoints = [
                "Low HCO₃ indicates metabolic acidosis",
                "Low PCO₂ suggests respiratory compensation",
                "Calculate anion gap to differentiate causes"
            ];
        } else if (hco3 < 22 && pco2 >= 35) {
            details.mainPoint = "Metabolic Acidosis with Inadequate Respiratory Compensation";
            details.subPoints = [
                "Low HCO₃ with inadequate respiratory response",
                "May indicate respiratory muscle fatigue or CNS depression",
                "Consider mechanical ventilation if progressive"
            ];
        } else {
            details.mainPoint = "Mixed Acid-Base Disorder";
            details.subPoints = [
                "Complex pattern suggesting multiple disturbances",
                "Consider combined respiratory and metabolic disorders",
                "Requires comprehensive clinical assessment"
            ];
        }
    } else if (ph > 7.45) {
        if (pco2 < 35 && hco3 < 22) {
            details.mainPoint = "Primary Respiratory Alkalosis";
            details.subPoints = [
                "Low PCO₂ indicates respiratory alkalosis",
                "Low/normal HCO₃ suggests acute process or early compensation",
                "Consider causes: hyperventilation, anxiety, sepsis, hypoxemia"
            ];
        } else if (pco2 < 35 && hco3 >= 22) {
            details.mainPoint = "Primary Metabolic Alkalosis with Respiratory Compensation";
            details.subPoints = [
                "Low PCO₂ with normal or elevated HCO₃",
                "Consider causes: hypokalemia, hypochloremia, or hyperaldosteronism",
                "Monitor for signs of volume depletion or electrolyte imbalance"
            ];
        } else if (pco2 >= 35 && hco3 > 26) {
            details.mainPoint = "Metabolic Alkalosis with Inadequate Respiratory Compensation";
            details.subPoints = [
                "Elevated HCO₃ with inadequate respiratory response",
                "May indicate respiratory muscle fatigue or CNS depression",
                "Consider mechanical ventilation if progressive"
            ];
        } else {
            details.mainPoint = "Mixed Acid-Base Disorder";
            details.subPoints = [
                "Complex pattern suggesting multiple disturbances",
                "Consider combined respiratory and metabolic disorders",
                "Requires comprehensive clinical assessment"
            ];
        }
    } else {
        details.mainPoint = "Normal Acid-Base Status";
        details.subPoints = [
            "pH within normal range (7.35-7.45)",
            "PCO₂ and HCO₃ within normal ranges",
            "No significant acid-base disturbance detected"
        ];
    }
    
    return details;
}

// Event listener for the analyze button
document.addEventListener('DOMContentLoaded', function() {
    const analyzeButton = document.getElementById('analyze-btn');
    if (analyzeButton) {
        analyzeButton.addEventListener('click', function() {
            const phValue = document.getElementById('ph-input').value;
            const pco2Value = document.getElementById('pco2-input').value;
            const hco3Value = document.getElementById('hco3-input').value;
            const beValue = document.getElementById('be-input').value;
            const results = analyzeABG(phValue, pco2Value, hco3Value, beValue);
            displayResultsInModal(results);
        });
    }
    
    // Close modal when clicking the close button
    const closeModalButton = document.querySelector('.close-modal');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            closeResultsModal();
        });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('resultsModal');
        if (event.target === modal) {
            closeResultsModal();
        }
    });
    
    // Add keyboard support for closing modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeResultsModal();
        }
    });
    
    // Add input validation for numeric fields
    const numericInputs = document.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
        input.addEventListener('input', function() {
            validateNumericInput(this);
        });
    });
});

// Function to close the results modal
function closeResultsModal() {
    const resultsModal = document.getElementById('resultsModal');
    
    // Add closing animation
    resultsModal.classList.add('closing');
    
    // Remove the modal after the animation completes
    setTimeout(() => {
        resultsModal.style.display = 'none';
        resultsModal.classList.remove('animated-modal', 'closing');
    }, 300);
}

// Function to validate numeric input fields
function validateNumericInput(inputElement) {
    const value = inputElement.value;
    if (value && isNaN(parseFloat(value.replace(',', '.')))) {
        inputElement.classList.add('invalid-input');
    } else {
        inputElement.classList.remove('invalid-input');
    }
}

// Function to calculate Henderson-Hasselbalch equation
function calculateHendersonHasselbalch(pco2, hco3) {
    return 6.1 + Math.log10(hco3 / (0.03 * pco2));
}

// Function to calculate expected PCO2 based on metabolic status
function calculateExpectedPCO2(hco3, ph) {
    if (ph < 7.35) {
        // Metabolic acidosis: Winter's formula
        return 1.5 * hco3 + 8;
    } else if (ph > 7.45) {
        // Metabolic alkalosis
        return 0.7 * hco3 + 20;
    } else {
        // Normal pH
        return 40;
    }
}

// Function to validate ranges
function validateRanges(data) {
    if (data.pH < 6.8 || data.pH > 7.8) {
        return { isValid: false, errorMessage: "pH value is outside physiological range (6.8-7.8)" };
    }
    
    if (data.pCO2 < 10 || data.pCO2 > 130) {
        return { isValid: false, errorMessage: "PCO₂ value is outside physiological range (10-130 mmHg)" };
    }
    
    if (data.hCO3 < 5 || data.hCO3 > 60) {
        return { isValid: false, errorMessage: "HCO₃ value is outside physiological range (5-60 mEq/L)" };
    }
    
    if (data.BE < -30 || data.BE > 30) {
        return { isValid: false, errorMessage: "Base Excess value is outside physiological range (-30 to +30 mEq/L)" };
    }
    
    return { isValid: true, errorMessage: "" };
}

function determineSeverity(ph, pco2, hco3) {
    // Determine severity based on how far values deviate from normal
    if (ph >= 7.35 && ph <= 7.45) return "Normal";
    
    if (ph < 7.35) {
        if (ph < 7.20) return "Severe";
        if (ph < 7.30) return "Moderate";
        return "Mild";
    } else {
        if (ph > 7.60) return "Severe";
        if (ph > 7.50) return "Moderate";
        return "Mild";
    }
}

function getDisorderDescription(disorderType, ph) {
    switch(disorderType) {
        case "Acidosis":
            return `Blood pH is ${ph.toFixed(2)}, indicating acidemia. This suggests an underlying acid-base disturbance affecting the body's pH regulation.`;
        case "Alkalosis":
            return `Blood pH is ${ph.toFixed(2)}, indicating alkalemia. This suggests an underlying acid-base disturbance affecting the body's pH regulation.`;
        case "Mixed":
            return `Complex acid-base disturbance with multiple primary disorders affecting pH regulation. Careful clinical correlation is required.`;
        case "Normal":
            return `Blood pH is within normal range (${ph.toFixed(2)}), indicating balanced acid-base status.`;
        default:
            return `Acid-base status requires clinical interpretation.`;
    }
}
