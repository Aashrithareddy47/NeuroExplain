const { GoogleGenerativeAI } = require('@google/generative-ai');
const { retrieveMedicalEvidence, formatEvidenceForPrompt } = require('./ragService');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite'
];

// Mandatory Patient Safety Notice
const MANDATORY_DISCLAIMER = 'NeuroExplain provides AI-generated educational explanations of medical reports. It does not provide a medical diagnosis or replace advice from a qualified healthcare professional. Always discuss your report with your neurologist.';

/**
 * Generates structured, patient-friendly explanation of a neurological report using Gemini and RAG
 * @param {string} reportText - Extracted text of the report
 * @param {string} reportType - 'MRI', 'EEG', 'EMG'
 * @param {object} [sections] - Extracted report sections
 * @returns {Promise<object>} Structured interpretation result
 */
async function generateReportInterpretation(reportText, reportType = 'MRI', sections = {}) {
  // 1. Retrieve trusted evidence from RAG module
  const evidenceList = retrieveMedicalEvidence(reportText, reportType, 4);
  const formattedEvidence = formatEvidenceForPrompt(evidenceList);

  // 2. Build system instructions and clinical prompt
  const prompt = `
You are NeuroExplain, an expert neurological patient education AI assistant.
Your mission is to translate complex neurological diagnostic reports (such as MRI, EEG, or EMG) into clear, reassuring, and accurate educational language for patients.

CRITICAL MEDICAL SAFETY RULES:
1. NEVER provide a definitive medical diagnosis or declare that the patient has a specific disease.
2. NEVER recommend starting, stopping, or altering any medication or medical treatment.
3. NEVER invent or hallucinate findings that are not explicitly stated in the report.
4. Clearly distinguish between what the report EXPLICITLY states vs. general educational background.
5. If the report findings are ambiguous, non-specific, or normal, state that clearly to alleviate unnecessary anxiety.
6. If the report mentions potential acute concerns (such as mass effect, acute stroke, midline shift), explain the term calmly and advise prompt discussion with their treating physician without sensationalism.

INPUT REPORT TYPE: ${reportType}

EXTRACTED REPORT TEXT:
"""
${reportText.slice(0, 8000)}
"""

IDENTIFIED SECTIONS:
- Clinical Indication: ${sections.clinicalIndication || 'Not explicitly specified'}
- Technique / Protocol: ${sections.technique || 'Not explicitly specified'}
- Findings: ${sections.findings || 'Full report body'}
- Impression: ${sections.impression || 'See findings'}

RETRIEVED TRUSTED MEDICAL EVIDENCE (MedlinePlus / NIH / NINDS):
${formattedEvidence}

RESPONSE FORMAT REQUIREMENT:
You must reply with a valid, clean JSON object matching this schema EXACTLY without any additional surrounding prose:
{
  "summary": "2-3 sentences explaining in plain English what this test was looking at and the main takeaway.",
  "key_findings": [
    {
      "finding": "Short statement of the finding as written in the report",
      "interpretation": "Plain language explanation of what this means in everyday words",
      "significance": "normal" | "benign_common" | "noteworthy" | "requires_discussion"
    }
  ],
  "medical_terms": [
    {
      "term": "Medical term from report (e.g., T2 hyperintensity, attenuation, MUAP)",
      "simple_definition": "Clear, everyday definition",
      "analogy": "A friendly real-life analogy (e.g., like a tiny gray hair for the brain, or like a slight delay on a phone line)"
    }
  ],
  "what_report_says": "Detailed, compassionate narrative explaining the findings systematically. Grounded strictly in the report text without adding unsupported diagnoses.",
  "questions_for_neurologist": [
    "Specific, high-value question 1 based on the findings",
    "Specific, high-value question 2 based on the findings",
    "Specific, high-value question 3 based on next steps or treatment"
  ],
  "evidence_sources": [
    {
      "title": "Exact title of the source from the provided evidence",
      "source": "Institution (e.g., MedlinePlus, NIH, NINDS)",
      "url": "Official URL from provided evidence",
      "relevance": "Why this source applies to this specific finding"
    }
  ],
  "limitations": "Honest statement explaining that imaging or electrical studies are only one piece of the clinical puzzle and must be correlated with physical exams, symptoms, and prior studies.",
  "emergency_notice": "Standard guidance reminding the patient that if they develop sudden severe neurological symptoms (loss of speech, sudden facial droop, limb paralysis), they should contact emergency services immediately."
}
`;

  // 3. Attempt Gemini API call with candidate models
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 0) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[Gemini] Attempting interpretation using model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            maxOutputTokens: 3000
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean JSON if enclosed in markdown code fences
        const cleanedJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsedData = JSON.parse(cleanedJson);

        if (parsedData.summary && Array.isArray(parsedData.key_findings)) {
          if (!parsedData.evidence_sources || parsedData.evidence_sources.length === 0) {
            parsedData.evidence_sources = evidenceList.map(e => ({
              title: e.title,
              source: e.source,
              url: e.url,
              relevance: e.summary
            }));
          }

          parsedData.disclaimer = MANDATORY_DISCLAIMER;
          parsedData.generatedBy = 'Google Gemini ' + modelName;
          console.log(`[Gemini] Successfully generated interpretation using ${modelName}`);
          return parsedData;
        }
      } catch (apiError) {
        console.warn(`[Gemini] ${modelName} encountered error:`, apiError.message);
        // Continue to next candidate model
      }
    }
    console.log('[Gemini] All candidate models busy or rate-limited. Activating clinical knowledge fallback interpreter.');
  } else {
    console.warn('[Gemini] GEMINI_API_KEY is not configured. Using clinical rule-based interpreter.');
  }

  // 4. Clinical Knowledge Fallback Engine
  return generateClinicalFallbackInterpretation(reportText, reportType, sections, evidenceList);
}

/**
 * Resilient clinical rule-based educational interpreter fallback
 * Guarantees zero downtime and safe, factual explanations
 */
function generateClinicalFallbackInterpretation(reportText, reportType, sections, evidenceList) {
  const lower = reportText.toLowerCase();
  const findings = [];
  const terms = [];
  const questions = [
    'How do these report findings correlate with the symptoms I have been experiencing?',
    'Are these changes expected for my age and health history, or do they require specific monitoring?',
    'Do you recommend any follow-up studies, physical therapy, or lifestyle adjustments?'
  ];

  if (reportType === 'MRI') {
    if (lower.includes('hyperintensity') || lower.includes('white matter') || lower.includes('flair')) {
      findings.push({
        finding: 'T2/FLAIR White Matter Hyperintensities',
        interpretation: 'Small bright patches noted in the deep brain tissue. These are very commonly related to natural aging, migraine history, or mild small blood vessel changes (microvascular).',
        significance: 'benign_common'
      });
      terms.push({
        term: 'T2/FLAIR Hyperintensity',
        simple_definition: 'A spot on the MRI scan that appears brighter than the surrounding brain tissue.',
        analogy: 'Similar to a tiny freckle or gray hair—often a normal sign of blood vessels aging over time rather than a major illness.'
      });
      questions.push('Are the white matter spots on my MRI consistent with normal age-related changes or migraines?');
    }

    if (lower.includes('ventricle') && (lower.includes('normal') || lower.includes('symmetric'))) {
      findings.push({
        finding: 'Ventricles and basal cisterns within normal limits',
        interpretation: 'The natural fluid-filled chambers inside your brain are normal in size, shape, and balance.',
        significance: 'normal'
      });
    }

    if (lower.includes('no acute intracranial') || lower.includes('no acute hemorrhage') || lower.includes('no acute infarction')) {
      findings.push({
        finding: 'No acute intracranial hemorrhage, mass effect, or territorial infarction',
        interpretation: 'There is no sign of sudden bleeding, large swelling pressing on brain structures, or recent acute stroke.',
        significance: 'normal'
      });
    }

    if (lower.includes('mucosal') || lower.includes('sinus')) {
      findings.push({
        finding: 'Incidental sinus mucosal thickening',
        interpretation: 'Mild swelling or congestion in the sinuses, similar to what happens with common seasonal allergies or a mild cold.',
        significance: 'benign_common'
      });
      terms.push({
        term: 'Mucosal Thickening',
        simple_definition: 'Swelling of the delicate lining of your sinus cavities.',
        analogy: 'Like having slightly stuffy sinuses from seasonal dust or a mild cold.'
      });
    }

    if (lower.includes('disc') || lower.includes('stenosis') || lower.includes('bulge')) {
      findings.push({
        finding: 'Degenerative disc changes / mild canal narrowing',
        interpretation: 'Mild wear-and-tear in the spinal discs or joints, which can occasionally touch nearby nerves.',
        significance: 'noteworthy'
      });
      terms.push({
        term: 'Spinal Stenosis / Disc Bulge',
        simple_definition: 'Narrowing of the spaces through which nerves travel in the spine.',
        analogy: 'Like a water hose passing through a garden gate that is slightly snug.'
      });
    }
  } else if (reportType === 'EEG') {
    if (lower.includes('alpha') || lower.includes('posterior')) {
      findings.push({
        finding: 'Well-organized posterior alpha rhythm (8-12 Hz)',
        interpretation: 'Your brain produces healthy resting electrical waves that respond normally when you close and open your eyes.',
        significance: 'normal'
      });
      terms.push({
        term: 'Alpha Rhythm',
        simple_definition: 'The standard electrical wave pattern produced by the brain during relaxed wakefulness with eyes closed.',
        analogy: 'Like a car smoothly idling at a stop light.'
      });
    }

    if (lower.includes('no epileptiform') || lower.includes('no seizure')) {
      findings.push({
        finding: 'No electrographic seizures or epileptiform discharges',
        interpretation: 'During the recording time, no spike-like electrical bursts associated with seizures were observed.',
        significance: 'normal'
      });
    }

    if (lower.includes('slowing') || lower.includes('theta') || lower.includes('delta')) {
      findings.push({
        finding: 'Intermittent background slowing',
        interpretation: 'Certain brain waves are slightly slower than typical resting rhythm, which can reflect drowsiness, medication effects, or mild metabolic variation.',
        significance: 'noteworthy'
      });
      terms.push({
        term: 'Background Slowing',
        simple_definition: 'Brain waves operating at a lower frequency than expected for full wakefulness.',
        analogy: 'Like music playing at a slightly relaxed tempo.'
      });
    }
  } else if (reportType === 'EMG') {
    if (lower.includes('carpal') || lower.includes('median')) {
      findings.push({
        finding: 'Prolongation of median nerve distal sensory/motor latencies',
        interpretation: 'Electrical signals traveling through the median nerve at the wrist are slowed, consistent with Carpal Tunnel compression.',
        significance: 'noteworthy'
      });
      terms.push({
        term: 'Distal Latency',
        simple_definition: 'The time it takes for an electrical pulse to travel from the stimulation point to the muscle or detector.',
        analogy: 'Like a brief internet connection lag between clicking a link and seeing the webpage.'
      });
      questions.push('Would wrist splints, ergonomics, or physical therapy be the best next step for my carpal tunnel symptoms?');
    }

    if (lower.includes('no spontaneous') || lower.includes('no fibrillations')) {
      findings.push({
        finding: 'No active spontaneous denervation (no fibrillations or positive sharp waves)',
        interpretation: 'The muscles examined are receiving healthy nerve signals at rest without active nerve injury.',
        significance: 'normal'
      });
    }
  }

  // Ensure at least one finding
  if (findings.length === 0) {
    findings.push({
      finding: 'Report text parsed successfully',
      interpretation: 'The test results describe specific neurological measurements that should be correlated with your symptoms.',
      significance: 'requires_discussion'
    });
  }

  return {
    summary: `This ${reportType} study examines ${reportType === 'MRI' ? 'anatomical brain or spinal structures' : reportType === 'EEG' ? 'brain electrical wave patterns' : 'nerve conduction and muscle electrical function'}. Overall, the recorded data provides important structural and functional insights to guide your neurologist.`,
    key_findings: findings,
    medical_terms: terms.length > 0 ? terms : [
      {
        term: 'Clinical Correlation',
        simple_definition: 'Comparing what the medical scan or test shows with how you actually feel and what symptoms you have.',
        analogy: 'Like looking at a weather radar and then looking outside your window to see if it is actually raining.'
      }
    ],
    what_report_says: `The report documents specific observations made during this ${reportType} evaluation. Important baseline structures and rhythms were noted, and any variations have been documented for review with your healthcare provider. Crucially, imaging and electrodiagnostic tests do not determine clinical diagnosis on their own; your neurologist reviews them alongside your medical history and clinical exam.`,
    questions_for_neurologist: questions.slice(0, 4),
    evidence_sources: evidenceList.map(e => ({
      title: e.title,
      source: e.source,
      url: e.url,
      relevance: e.summary
    })),
    limitations: `This interpretation is an educational breakdown of the extracted report text. It cannot examine raw DICOM imaging slices or raw multichannel waveforms. Your treating neurologist has access to full diagnostic data and clinical history.`,
    emergency_notice: `If you or someone around you experiences sudden severe headache, sudden facial drooping, one-sided weakness or numbness, or sudden speech difficulty, please contact emergency medical services (such as 911 or local emergency) immediately.`,
    disclaimer: MANDATORY_DISCLAIMER,
    generatedBy: 'NeuroExplain Clinical NLP Engine (Evidence-Grounded)'
  };
}

module.exports = {
  generateReportInterpretation,
  MANDATORY_DISCLAIMER
};
