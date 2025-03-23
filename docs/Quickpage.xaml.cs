using System.Text;
using ABGenius.Services;
using Plugin.MauiMTAdmob;



namespace ABGenius
{
    public partial class Quickpage : ContentPage
    {
        public Quickpage()
        {
            InitializeComponent();


            InitializeAnimationState();


            Appearing += OnPageAppearing;
        }

        private void InitializeAnimationState()
        {

            DiagonalLine.Opacity = 0;
            CircleDecoration.Opacity = 0;
            CornerElement.Opacity = 0;


            MainContent.Opacity = 0;
            MainContent.TranslationY = 50;
        }

        private async void OnPageAppearing(object? sender, EventArgs e)
        {
            // Faster background elements animation
            await Task.WhenAll(
                DiagonalLine.FadeTo(0.2, 300, Easing.CubicOut),
                CircleDecoration.FadeTo(0.2, 300, Easing.CubicOut)
            );

            // Faster main content animation
            await Task.WhenAll(
                MainContent.FadeTo(1, 250, Easing.CubicOut),
                MainContent.TranslateTo(0, 0, 250, Easing.CubicOut)
            );

            // Faster corner element fade
            await CornerElement.FadeTo(0.1, 200, Easing.CubicOut);
        }

        private async void OnBackButtonClicked(object sender, EventArgs e)
        {
            AdService.ShowAdIfNeeded();
            await Navigation.PopAsync();
        }

        

        private async void OnMenuButtonClicked(object sender, EventArgs e)
        {
            string action = await DisplayActionSheet("Reset", "About", "Sign Out");

            switch (action)
            {
                case "Reset":
                    await Navigation.PopAsync();
                    break;
                case "About":
                    await DisplayAlert("About ABGenius", "ABGenius v1.0\nA FunCU App\nA Syvursoft Lab(c) 2025", "OK");
                    break;
                case "Sign Out":
                    bool confirm = await DisplayAlert("Sign Out", "Are you sure you want to sign out?", "Yes", "No");
                    if (confirm)
                    {
                        await Navigation.PopToRootAsync();
                    }
                    break;
            }
        }


        #region Data Models  //start 
        public class ABGData
        {
            public double PH { get; }
            public double PCO2 { get; }
            public double HCO3 { get; }
            public double BE { get; }

            public ABGData(double ph, double pco2, double hco3, double be)
            {
                PH = ph;
                PCO2 = pco2;
                HCO3 = hco3;
                BE = be;
            }
        }
        #endregion // Data Models  //end

        #region Event Handlers   //start
        private async void OnAnalysisButtonClicked(object sender, EventArgs e)
        {
            try
            {
                // Validate inputs
                var (inputsValid, inputError) = ValidateInputs();
                if (!inputsValid)
                {
                    await DisplayAlert("Error😴", inputError, "OK😴");
                    return;
                }

                // Parse values
                var (parseSuccess, abgData, parseError) = ParseValues();
                if (!parseSuccess)
                {
                    await DisplayAlert("Error", parseError, "OK");
                    return;
                }

                // Validate ranges
                var (rangesValid, rangeError) = ValidateRanges(abgData);
                if (!rangesValid)
                {
                    await DisplayAlert("Error", rangeError, "OK");
                    return;
                }

                // Perform analysis
                string analysis = ValidateAndAnalyzeABG(abgData.PH, abgData.PCO2, abgData.HCO3, abgData.BE);
                var resultsPage = new ResultsPage(abgData.PH, abgData.PCO2, abgData.HCO3, abgData.BE, analysis);
                await Navigation.PushModalAsync(resultsPage);
            }
            catch (Exception ex)
            {
                await DisplayAlert("Error", "An unexpected error occurred. Please try again.", "OK");
                System.Diagnostics.Debug.WriteLine($"Analysis error: {ex.Message}");
            }
        }
        #endregion  // Event Handlers   //end

        #region Validation Methods //start
        private (bool isValid, string errorMessage) ValidateInputs()
        {
            if (string.IsNullOrWhiteSpace(phEntry.Text) ||
                string.IsNullOrWhiteSpace(pco2Entry.Text) ||
                string.IsNullOrWhiteSpace(hco3Entry.Text) ||
                string.IsNullOrWhiteSpace(beEntry.Text))
            {
                return (false, "Please fill in all fields😴");
            }
            return (true, string.Empty);
        }

        private (bool success, ABGData data, string error) ParseValues()
        {
            try
            {
                var ph = double.Parse(phEntry.Text.Replace(',', '.'));
                var pco2 = double.Parse(pco2Entry.Text.Replace(',', '.'));
                var hco3 = double.Parse(hco3Entry.Text.Replace(',', '.'));
                var be = double.Parse(beEntry.Text.Replace(',', '.'));

                return (true, new ABGData(ph, pco2, hco3, be), string.Empty);
            }
            catch
            {
                return (false, new ABGData(0, 0, 0, 0), "Please enter valid numbers");
            }
        }

        private (bool isValid, string errorMessage) ValidateRanges(ABGData data)
        {
            if (data.PH < 6.8 || data.PH > 7.8 ||
                data.PCO2 < 15 || data.PCO2 > 100 ||
                data.HCO3 < 4 || data.HCO3 > 50 ||
                data.BE < -20 || data.BE > 20)
            {
                return (false, "Values are inconsistent with life 😛:\n\n" +
                              "pH: 6.8-7.8\n" +
                              "PCO₂: 15-100 mmHg\n" +
                              "HCO₃: 4-50 mEq/L\n" +
                              "Base Excess: -20 to +20 mEq/L");
            }
            return (true, string.Empty);
        }
        #endregion  // Validation Methods //end

        #region Calculation Methods  //start
        private double CalculateHendersonHasselbalch(double pco2, double hco3)
        {
            if (pco2 <= 0 || hco3 <= 0)
            {
                throw new ArgumentException("PCO2 and HCO3 must be greater than 0");
            }
            return 6.1 + Math.Log10(hco3 / (0.03 * pco2));
        }

        private double CalculateExpectedPCO2(double hco3, double ph)
        {
            if (hco3 <= 0)
                throw new ArgumentException("HCO3 must be greater than 0", nameof(hco3));
            if (ph < 6.8 || ph > 7.8)
                throw new ArgumentException("pH must be between 6.8 and 7.8", nameof(ph));

            if (ph < 7.35)
            {
                return hco3 < 12 ? (1.5 * hco3) + 6 : (1.5 * hco3) + 8;
            }
            else if (ph > 7.45)
            {
                return hco3 > 40 ? (0.7 * hco3) + 20 : (0.9 * hco3) + 16;
            }
            else
            {
                double expectedPCO2 = 40;

                if (hco3 < 24)
                    expectedPCO2 = 38 + ((hco3 - 22) * 0.5);
                else if (hco3 > 26)
                    expectedPCO2 = 42 + ((hco3 - 26) * 0.5);

                return expectedPCO2;
            }
        }
        #endregion  //Calculation Methods  //end

        #region Analysis Methods  //start
        private string ValidateAndAnalyzeABG(double ph, double pco2, double hco3, double be)
        {
            var result = new StringBuilder();

            // 1. ABG Validation using Henderson-Hasselbalch
            result.AppendLine("<div style='background-color: #fffdf8; padding: 15px; border-radius: 8px; margin-bottom: 15px;'>");
            result.AppendLine("<b>1. ABG Validation:</b><br>");
            try
            {
                double calculatedPH = CalculateHendersonHasselbalch(pco2, hco3);
                bool isValid = Math.Abs(calculatedPH - ph) < 0.15;

                if (!isValid)
                {
                    result.AppendLine("<div style='color: #dc3545; font-weight: bold;'>");
                    result.AppendLine("⚠️ WARNING: Values may be inconsistent with Henderson-Hasselbalch equation");
                    result.AppendFormat("Calculated pH: {0:F2} (Measured: {1:F2})<br>", calculatedPH, ph);
                    result.AppendLine("</div>");
                }
                else
                {
                    result.AppendLine("<span style='color: #28a745;'>✓ Values are consistent with Henderson-Hasselbalch equation</span><br>");
                }
            }
            catch (ArgumentException)
            {
                result.AppendLine("<span style='color: #dc3545;'>Error calculating Henderson-Hasselbalch equation</span><br>");
            }
            result.AppendLine("</div>");

            // 2. Expected PCO2 Analysis
            result.AppendLine("<div style='background-color: #fffdf8; padding: 15px; border-radius: 8px; margin-bottom: 15px;'>");
            result.AppendLine("<b>2. Expected PCO₂ Analysis:</b><br>");
            double expectedPCO2 = CalculateExpectedPCO2(hco3, ph);
            double pco2Difference = Math.Abs(pco2 - expectedPCO2);

            result.AppendFormat("Expected PCO₂: {0:F1} mmHg<br>", expectedPCO2);
            result.AppendFormat("Measured PCO₂: {0:F1} mmHg<br>", pco2);
            result.AppendFormat("Difference: {0:F1} mmHg<br>", pco2Difference);
            result.AppendLine("</div>");

            // 3. Primary Disorder Analysis
            result.AppendLine("<div style='background-color: #fffdf8; padding: 15px; border-radius: 8px; margin-bottom: 15px;'>");
            result.AppendLine("<b>3. Primary Disorder:</b><br>");
            string primaryDisorder = DetermineAcidBaseDisorder(ph, pco2, hco3, be);
            result.AppendLine($"{primaryDisorder}<br>");
            result.AppendLine("</div>");

            // 4. Clinical Suggestions
            result.AppendLine("<div style='background-color: #fffdf8; padding: 15px; border-radius: 8px; margin-bottom: 15px;'>");
            result.AppendLine("<b>4. Clinical Suggestions:</b><br>");
            string clinicalSuggestions = ProvideClinicalSuggestions(ph, pco2, hco3, be);
            result.AppendLine($"{clinicalSuggestions}<br>");
            result.AppendLine("</div>");

            return result.ToString();
        }

        private string DetermineAcidBaseDisorder(double pH, double pCO2, double HCO3, double BE)
        {
            var disorders = new StringBuilder();
            bool isAcidemia = pH < 7.35;
            bool isAlkalemia = pH > 7.45;
            bool isMetabolicAcidosis = HCO3 < 22 || BE < -2;
            bool isMetabolicAlkalosis = HCO3 > 26 || BE > 2;
            bool isRespiratoryAcidosis = pCO2 > 45;
            bool isRespiratoryAlkalosis = pCO2 < 35;

            // Step 1: Detect acidemia/alkalemia
            disorders.AppendLine(isAcidemia ? "• Acidemia detected." :
                                isAlkalemia ? "• Alkalemia detected." :
                                "• pH is within normal range.");

            // Step 2: Identify primary disorder
            string primaryDisorder = "unclear";
            if (isAcidemia)
            {
                if (isRespiratoryAcidosis) primaryDisorder = "respiratory acidosis (primary)";
                else if (isMetabolicAcidosis) primaryDisorder = "metabolic acidosis (primary)";
            }
            else if (isAlkalemia)
            {
                if (isRespiratoryAlkalosis) primaryDisorder = "respiratory alkalosis (primary)";
                else if (isMetabolicAlkalosis) primaryDisorder = "metabolic alkalosis (primary)";
            }
            disorders.AppendLine($"• Primary disorder: {primaryDisorder}");

            // Step 3: Check for compensation using formulas
            if (primaryDisorder.Contains("respiratory acidosis"))
            {
                double expectedHCO3Acute = 24 + 0.1 * (pCO2 - 40); // Acute: HCO3↑ by 1 per 10↑ pCO2
                double expectedHCO3Chronic = 24 + 0.35 * (pCO2 - 40); // Chronic: HCO3↑ by 4 per 10↑ pCO2
                bool isCompensated = HCO3 >= expectedHCO3Acute && HCO3 <= expectedHCO3Chronic;
                disorders.AppendLine(isCompensated ?
                    "  - Chronic respiratory acidosis with renal compensation." :
                    "  - Acute respiratory acidosis with minimal compensation.");
            }
            else if (primaryDisorder.Contains("respiratory alkalosis"))
            {
                double expectedHCO3Acute = 24 - 0.2 * (40 - pCO2); // Acute: HCO3↓ by 2 per 10↓ pCO2
                double expectedHCO3Chronic = 24 - 0.5 * (40 - pCO2); // Chronic: HCO3↓ by 5 per 10↓ pCO2
                bool isCompensated = HCO3 <= expectedHCO3Acute && HCO3 >= expectedHCO3Chronic;
                disorders.AppendLine(isCompensated ?
                    "  - Chronic respiratory alkalosis with renal compensation." :
                    "  - Acute respiratory alkalosis with minimal compensation.");
            }
            else if (primaryDisorder.Contains("metabolic acidosis"))
            {
                double expectedPCO2 = 1.5 * HCO3 + 8; // Winter's formula ± 2
                bool isCompensated = pCO2 >= expectedPCO2 - 2 && pCO2 <= expectedPCO2 + 2;
                disorders.AppendLine(isCompensated ?
                    "  - Adequate respiratory compensation detected." :
                    "  - Inadequate compensation: Possible mixed respiratory disorder.");
            }
            else if (primaryDisorder.Contains("metabolic alkalosis"))
            {
                double expectedPCO2 = 0.7 * HCO3 + 20; // Metabolic alkalosis compensation formula
                bool isCompensated = pCO2 >= expectedPCO2 - 5 && pCO2 <= expectedPCO2 + 5;
                disorders.AppendLine(isCompensated ?
                    "  - Adequate respiratory compensation detected." :
                    "  - Inadequate compensation: Possible mixed respiratory disorder.");
            }

            // Step 4: Detect mixed disorders
            if ((isRespiratoryAcidosis && isMetabolicAcidosis) || (isRespiratoryAlkalosis && isMetabolicAlkalosis))
            {
                disorders.AppendLine("• Mixed disorder: Combined respiratory and metabolic disturbance.");
            }
            else if ((isRespiratoryAcidosis && isMetabolicAlkalosis) || (isRespiratoryAlkalosis && isMetabolicAcidosis))
            {
                disorders.AppendLine("• Mixed disorder: Opposite respiratory and metabolic disturbances.");
            }

            // Step 5: Add anion gap note (if parameters were available)
            disorders.AppendLine("\nNote: For metabolic acidosis, always calculate anion gap to identify type.");

            return disorders.ToString();
        }

        private string ProvideClinicalSuggestions(double pH, double pCO2, double HCO3, double BE)
        {
            var suggestions = new StringBuilder();
            suggestions.AppendLine("<div class='clinical-suggestion'>");
            bool hasSuggestions = false;

            // Get primary disorder from previous analysis
            string primaryDisorder = DetermineAcidBaseDisorder(pH, pCO2, HCO3, BE);

            // 1. Critical Values First
            if (pH < 7.2 || pH > 7.6)
            {
                suggestions.AppendLine("<h3>⚠️ CRITICAL VALUE ALERT</h3>");
                suggestions.AppendLine("<ul>");
                if (pH < 7.2)
                {
                    suggestions.AppendLine("<li>Severe acidemia (pH <7.2):");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Immediate ABG confirmation required</li>");
                    suggestions.AppendLine("<li>Consider bicarbonate therapy if pH <7.1 and metabolic acidosis</li>");
                    suggestions.AppendLine("<li>Prepare for possible mechanical ventilation</li>");
                    suggestions.AppendLine("<li>Check lactate, creatinine, toxicology screen</li>");
                    suggestions.AppendLine("</ul></li>");
                }
                else
                {
                    suggestions.AppendLine("<li>Severe alkalemia (pH >7.6):");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Assess for tetany/seizures</li>");
                    suggestions.AppendLine("<li>Consider IV calcium if symptomatic</li>");
                    suggestions.AppendLine("<li>Evaluate for hypokalemia/hypocalcemia</li>");
                    suggestions.AppendLine("<li>Consider acetazolamide if metabolic alkalosis</li>");
                    suggestions.AppendLine("</ul></li>");
                }
                suggestions.AppendLine("</ul>");
                hasSuggestions = true;
            }

            // 2. Mixed Disorders (Expanded Detection)
            if (primaryDisorder.Contains("Mixed disorder"))
            {
                suggestions.AppendLine("<h3>🔍 Mixed Disorder Management</h3>");
                suggestions.AppendLine("<ul>");

                if (primaryDisorder.Contains("Combined"))
                {
                    suggestions.AppendLine("<li>Dual pathology management:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Simultaneous treatment of both components</li>");
                    suggestions.AppendLine("<li>Prioritize life-threatening elements first</li>");
                    suggestions.AppendLine("</ul></li>");
                }
                else if (primaryDisorder.Contains("Opposite"))
                {
                    suggestions.AppendLine("<li>Counteracting disturbances:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Caution with Fluids and Electrolytes correction speed</li>");
                    suggestions.AppendLine("<li>Monitor for over-correction</li>");
                    suggestions.AppendLine("</ul></li>");
                }

                suggestions.AppendLine("<li>Recommended workup:");
                suggestions.AppendLine("<ul>");
                suggestions.AppendLine("<li>Check Vital Signs by Your Self</li>");
                suggestions.AppendLine("<li>Lactate, KFT, LFTs</li>");
                suggestions.AppendLine("<li>Chest X-ray</li>");
                suggestions.AppendLine("<li>Toxicology screen</li>");
                suggestions.AppendLine("</ul></li>");
                suggestions.AppendLine("</ul>");
                hasSuggestions = true;
            }

            // 3. Primary Disorder-Specific Guidance
            if (!primaryDisorder.Contains("unclear") && !hasSuggestions)
            {
                suggestions.AppendLine($"<h3>1️⃣ {primaryDisorder.ToUpper()} Management</h3>");
                suggestions.AppendLine("<ul>");

                if (primaryDisorder.Contains("respiratory acidosis"))
                {
                    suggestions.AppendLine("<li>Airway management:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Non-invasive ventilation trial</li>");
                    suggestions.AppendLine("<li>Consider intubation if pH <7.20</li>");
                    suggestions.AppendLine("<li>Maintain SpO2 88-92% in COPD patients</li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("<li>Etiology workup:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>CXR for COPD/pneumonia/pneumothorax</li>");
                    suggestions.AppendLine("<li>ABG with A-a gradient calculation</li>");
                    suggestions.AppendLine("<li>Neurological assessment (GCS, pupils)</li>");
                    suggestions.AppendLine("<li>Nerve conduction studies if GBS suspected</li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("<li>Specific treatments:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Naloxone for opioid overdose</li>");
                    suggestions.AppendLine("<li>Bronchodilators for asthma/COPD</li>");
                    // suggestions.AppendLine("<li>Dialysis for CO2 retention in ECMO patients</li>");
                    suggestions.AppendLine("</ul></li>");
                }
                else if (primaryDisorder.Contains("metabolic acidosis"))
                {
                    suggestions.AppendLine("<li>Anion gap evaluation:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Calculate AG: Na - (Cl + HCO3)</li>");
                    suggestions.AppendLine("<li>Elevated AG (>12):");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Check lactate, ketones, creatinine</li>");
                    suggestions.AppendLine("<li>Consider toxic alcohols (ethylene glycol, methanol)</li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("<li>Normal AG:");
                    suggestions.AppendLine("<ul>");
                    // suggestions.AppendLine("<li>Check diarrhea history</li>");
                    // suggestions.AppendLine("<li>Evaluate for RTA (Urine pH >5.5)</li>");
                    suggestions.AppendLine("<li>Assess renal tubular function</li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("<li>Management protocol:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>NaHCO3 only if pH <7.1 and non-anion gap</li>");
                    suggestions.AppendLine("<li>Correct potassium abnormalities first</li>");
                    suggestions.AppendLine("<li>Consider renal replacement therapy for toxic ingestions</li>");
                    suggestions.AppendLine("</ul></li>");
                }
                else if (primaryDisorder.Contains("respiratory alkalosis"))
                {
                    suggestions.AppendLine("<li>Acute vs chronic differentiation:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Acute: Check for hyperventilation (anxiety, pain, fever)</li>");
                    suggestions.AppendLine("<li>Chronic: Evaluate for chronic hypoxia (CHF, pulmonary fibrosis)</li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("<li>Essential workup:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>ABG with A-a gradient calculation</li>");
                    suggestions.AppendLine("<li>D-dimer if PE suspected</li>");
                    suggestions.AppendLine("<li>Sepsis screening (lactate, cultures)</li>");
                    suggestions.AppendLine("<li>CNS imaging if neurological cause suspected</li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("<li>Management strategies:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Treat underlying cause (e.g., antibiotics for pneumonia)</li>");
                    suggestions.AppendLine("<li>Consider paper bag rebreathing only if anxiety-induced</li>");
                    suggestions.AppendLine("<li>Correct hypophosphatemia if present</li>");
                    suggestions.AppendLine("</ul></li>");
                }
                else if (primaryDisorder.Contains("metabolic alkalosis"))
                {
                    suggestions.AppendLine("<li>Urine chloride differentiation:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li><20 mEq/L: Chloride-responsive (vomiting, NG suction)</li>");
                    suggestions.AppendLine("<li>>40 mEq/L: Chloride-resistant (mineralocorticoid excess)</li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("<li>Essential evaluations:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>24h urine electrolytes</li>");
                    suggestions.AppendLine("<li>Aldosterone/renin ratio</li>");
                    suggestions.AppendLine("<li>Blood pressure monitoring</li>");
                    suggestions.AppendLine("</ul></li>");
                    suggestions.AppendLine("<li>Treatment approaches:");
                    suggestions.AppendLine("<ul>");
                    suggestions.AppendLine("<li>Chloride-responsive: NS infusion + KCl replacement</li>");
                    suggestions.AppendLine("<li>Chloride-resistant: Spironolactone trial</li>");
                    suggestions.AppendLine("<li>Consider acetazolamide 250-500mg IV if pH >7.5</li>");
                    suggestions.AppendLine("</ul></li>");
                }
                suggestions.AppendLine("</ul>");
                hasSuggestions = true;
            }

            // 4. Parameter-Specific Alerts
            var alerts = new List<string>();
            if (pCO2 > 50) alerts.Add("Severe hypercapnia: Consider Chest Auscultation/Bronchodilators/ NIV/mechanical ventilation");
            if (pCO2 < 25) alerts.Add("Severe hypocapnia: Assess for sepsis/Dka/PE/CNS pathology");
            if (HCO3 < 15) alerts.Add("Severe metabolic acidosis: Check anion gap and lactate");
            if (BE < -4) alerts.Add("base deficit: Assess tissue perfusion/Blood Pressure /Urine Output/ SPo2");
            if (BE > 4) alerts.Add("base Excess: Assess Volume status / Electrolytes");
            if (alerts.Count > 0)
            {
                suggestions.AppendLine("<h3>⚠️ Parameter-Specific Alerts</h3>");
                suggestions.AppendLine("<ul>");
                foreach (var alert in alerts)
                {
                    suggestions.AppendLine($"<li>{alert}</li>");
                }
                suggestions.AppendLine("</ul>");
                hasSuggestions = true;
            }

            // 5. Normal Values
            if (!hasSuggestions)
            {
                suggestions.AppendLine("<h3> Normal Acid-Base Status</h3>");
                suggestions.AppendLine("<ul>");
                suggestions.AppendLine("<li>Routine monitoring suggested</li>");
                suggestions.AppendLine("<li>Consider clinical correlation</li>");
                suggestions.AppendLine("<li>Repeat ABG if clinical suspicion remains</li>");
                suggestions.AppendLine("</ul>");
            }

            suggestions.AppendLine("</div>");
            return suggestions.ToString();
        }
        #endregion  //Analysis Methods  //end
    }

}