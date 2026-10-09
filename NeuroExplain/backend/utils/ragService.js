/**
 * Evidence-Based Retrieval-Augmented Generation (RAG) Knowledge Module
 * NeuroExplain
 * 
 * Sources: MedlinePlus (National Library of Medicine), National Institutes of Health (NIH),
 * and National Institute of Neurological Disorders and Stroke (NINDS).
 */

const TRUSTED_MEDICAL_KNOWLEDGE = [
  // --- BRAIN & SPINE MRI KNOWLEDGE ---
  {
    id: 'mri-white-matter-hyperintensities',
    category: 'MRI',
    topics: ['t2 hyperintensity', 'flair hyperintensity', 'white matter', 'periventricular', 'ischemia', 'small vessel disease', 'microvascular', 'gliosis'],
    title: 'White Matter Hyperintensities and Microvascular Changes on MRI',
    source: 'National Institutes of Health (NIH) / MedlinePlus',
    url: 'https://medlineplus.gov/ency/article/000737.htm',
    summary: 'White matter hyperintensities (WMH) appear as bright patches on T2-weighted and FLAIR MRI scans. In adults and older individuals, they commonly reflect chronic microvascular changes (mild small blood vessel wear-and-tear) related to aging, hypertension, or migraine, rather than acute emergencies.',
    evidenceText: 'Studies archived by the NIH explain that non-specific T2/FLAIR hyperintensities are extremely prevalent in the general population. While they can occasionally correlate with demyelinating conditions such as multiple sclerosis when located in characteristic juxtacortical or callosal patterns, isolated punctate white matter lesions are frequently incidental and represent mild small vessel ischemic disease.'
  },
  {
    id: 'mri-brain-scan-overview',
    category: 'MRI',
    topics: ['mri', 'brain mri', 'magnetic resonance imaging', 'contrast', 'gadolinium', 't1', 't2', 'flair', 'diffusion'],
    title: 'Magnetic Resonance Imaging (MRI) of the Brain: Patient Education',
    source: 'MedlinePlus (U.S. National Library of Medicine)',
    url: 'https://medlineplus.gov/mriscans.html',
    summary: 'A brain MRI uses strong magnetic fields and radio waves to generate detailed cross-sectional pictures of brain tissue, ventricles, and blood vessels without ionizing radiation.',
    evidenceText: 'According to MedlinePlus, brain MRIs evaluate causes of headaches, seizures, weakness, or memory changes. T1-weighted images show anatomical detail, while T2-weighted and FLAIR images highlight fluid and areas of potential swelling or inflammation. The presence of contrast (gadolinium) helps clinicians determine if active inflammation or barrier breakdown is present.'
  },
  {
    id: 'mri-spine-stenosis-herniation',
    category: 'MRI',
    topics: ['disc bulge', 'disc herniation', 'canal stenosis', 'neural foraminal narrowing', 'radiculopathy', 'spondylosis', 'thecal sac', 'cervical', 'lumbar'],
    title: 'Spinal Stenosis, Disc Herniation, and Radiculopathy',
    source: 'National Institute of Neurological Disorders and Stroke (NINDS)',
    url: 'https://www.ninds.nih.gov/health-information/disorders/spinal-stenosis',
    summary: 'Spinal MRI evaluates the vertebrae, intervertebral discs, and spinal canal. Disc bulges or herniations occur when cushion pads between vertebrae press on adjacent nerve roots or the spinal cord, causing radiculopathy (pinched nerve symptoms).',
    evidenceText: 'NINDS notes that degenerative disc changes and mild foraminal narrowing are common aging-related imaging findings that may or may not correlate with clinical pain. Neurologists emphasize matching imaging findings with physical neurological examinations before recommending treatment.'
  },
  {
    id: 'mri-sinus-mucosal-thickening',
    category: 'MRI',
    topics: ['sinusitis', 'mucosal thickening', 'maxillary sinus', 'ethmoid', 'mastoid', 'incidental'],
    title: 'Incidental Paranasal Sinus Findings on Brain MRI',
    source: 'MedlinePlus (U.S. National Library of Medicine)',
    url: 'https://medlineplus.gov/sinusitis.html',
    summary: 'Mucosal thickening or fluid levels in the maxillary, ethmoid, or frontal sinuses are frequent incidental findings on brain MRI and typically reflect mild, often asymptomatic sinus inflammation or recent viral illness rather than brain disease.',
    evidenceText: 'Medical literature published through the NIH affirms that sinus mucosal changes appear on over 30% of routine brain MRIs in asymptomatic patients and are usually unrelated to the primary neurological complaint.'
  },

  // --- EEG KNOWLEDGE ---
  {
    id: 'eeg-overview-routine',
    category: 'EEG',
    topics: ['eeg', 'electroencephalogram', 'brain waves', 'alpha rhythm', 'posterior basic rhythm', 'photostimulation', 'hyperventilation'],
    title: 'Electroencephalogram (EEG): Test Overview and Normal Waves',
    source: 'MedlinePlus (U.S. National Library of Medicine)',
    url: 'https://medlineplus.gov/electroencephalogram.html',
    summary: 'An EEG records electrical activity of brain neurons using small sensors placed on the scalp. A normal resting awake EEG demonstrates an organized posterior alpha rhythm (8-13 Hz) that attenuates when the eyes open.',
    evidenceText: 'As detailed by MedlinePlus, routine EEG studies include activation maneuvers like intermittent photic stimulation (flashing lights) and hyperventilation (deep breathing) to evaluate if the brain develops abnormal rhythms in response to stress or visual stimuli.'
  },
  {
    id: 'eeg-epileptiform-discharges',
    category: 'EEG',
    topics: ['epileptiform', 'spike', 'polyspike', 'spike and wave', 'sharp wave', 'seizure', 'paroxysmal', 'epilepsy'],
    title: 'Epileptiform Discharges and Seizure Evaluation on EEG',
    source: 'National Institute of Neurological Disorders and Stroke (NINDS)',
    url: 'https://www.ninds.nih.gov/health-information/disorders/epilepsy-and-seizures',
    summary: 'Epileptiform discharges (such as spikes, sharp waves, and spike-wave complexes) are brief electrical bursts that suggest a predisposition to epileptic seizures. However, an EEG alone does not diagnose epilepsy without a clinical history of seizures.',
    evidenceText: 'NINDS guidance emphasizes that many individuals with epilepsy have normal interictal (between-seizure) EEGs, whereas some people without epilepsy may have non-specific sharp transients. Clinical correlation by a neurologist or epileptologist is always necessary.'
  },
  {
    id: 'eeg-slowing-focal-diffuse',
    category: 'EEG',
    topics: ['slowing', 'theta', 'delta', 'focal slowing', 'diffuse slowing', 'encephalopathy', 'background slowing'],
    title: 'Cerebral Slowing and Encephalopathy Patterns on EEG',
    source: 'National Institutes of Health (NIH) / MedlinePlus',
    url: 'https://medlineplus.gov/ency/article/001417.htm',
    summary: 'Slowing of brain waves (theta or delta frequencies) indicates reduced electrical speed. Focal slowing suggests a localized issue in one region, while generalized diffuse slowing usually indicates systemic or metabolic encephalopathy, medication effects, or drowsiness.',
    evidenceText: 'NIH clinical reviews highlight that mild diffuse background slowing is a non-specific reflection of brain metabolic state, sedation, or post-ictal fatigue, requiring review in the context of current medications and lab values.'
  },

  // --- EMG & NCS KNOWLEDGE ---
  {
    id: 'emg-ncs-overview',
    category: 'EMG',
    topics: ['electromyography', 'emg', 'nerve conduction study', 'ncs', 'latency', 'conduction velocity', 'amplitude', 'cmap', 'snap'],
    title: 'Electromyography (EMG) and Nerve Conduction Studies',
    source: 'MedlinePlus (U.S. National Library of Medicine)',
    url: 'https://medlineplus.gov/electromyography.html',
    summary: 'EMG evaluates muscle electrical activity, while Nerve Conduction Studies (NCS) measure how fast and strongly electrical signals travel down peripheral nerves. They assess tingling, numbness, muscle weakness, and pain.',
    evidenceText: 'MedlinePlus explains that NCS measures sensory and motor conduction velocities and latencies. Slowing of velocity usually implies damage to the myelin sheath, while reduced amplitude suggests loss of nerve axons.'
  },
  {
    id: 'emg-carpal-tunnel-neuropathy',
    category: 'EMG',
    topics: ['carpal tunnel', 'median nerve', 'distal latency', 'abductor pollicis brevis', 'sensory latency', 'transcarpal', 'entrapment'],
    title: 'Median Neuropathy at the Wrist (Carpal Tunnel Syndrome)',
    source: 'National Institute of Neurological Disorders and Stroke (NINDS)',
    url: 'https://www.ninds.nih.gov/health-information/disorders/carpal-tunnel-syndrome',
    summary: 'Prolongation of median sensory and motor distal latencies across the carpal tunnel with normal ulnar nerve conduction is the hallmark electrodiagnostic finding of Carpal Tunnel Syndrome (median nerve compression).',
    evidenceText: 'According to NINDS, electrodiagnostic testing grades carpal tunnel syndrome into mild (sensory conduction delay only), moderate (sensory and motor delay), and severe (loss of axons or needle EMG denervation), assisting the physician in choosing between conservative splinting and surgical release.'
  },
  {
    id: 'emg-radiculopathy-denervation',
    category: 'EMG',
    topics: ['fibrillation', 'positive sharp waves', 'denervation', 'fasciculation', 'muap', 'polyphasic', 'recruitment', 'radiculopathy', 'myopathy', 'neuropathy'],
    title: 'Needle EMG Findings: Denervation, Fibrillations, and Motor Units',
    source: 'National Institutes of Health (NIH) / MedlinePlus',
    url: 'https://medlineplus.gov/ency/article/003929.htm',
    summary: 'Resting muscle should be electrically silent. Spontaneous potentials like fibrillation potentials and positive sharp waves (PSW) indicate active loss of nerve supply (denervation). Alterations in motor unit action potential (MUAP) morphology indicate chronic reinnervation or primary muscle disease.',
    evidenceText: 'NIH publications state that the presence of acute denervation in a specific myotomal distribution localizes nerve root compression (radiculopathy) versus generalized peripheral nerve disease (polyneuropathy).'
  }
];

/**
 * Searches the medical knowledge base for passages relevant to the report text
 * @param {string} reportText - Extracted text of the report
 * @param {string} [reportType] - Optional type ('MRI', 'EEG', 'EMG')
 * @param {number} [limit=3] - Maximum number of citations to return
 * @returns {Array<object>} - Matched verified knowledge passages
 */
function retrieveMedicalEvidence(reportText, reportType = null, limit = 4) {
  if (!reportText || typeof reportText !== 'string') {
    return [];
  }

  const cleanQuery = reportText.toLowerCase();
  const scoredPassages = [];

  for (const item of TRUSTED_MEDICAL_KNOWLEDGE) {
    let score = 0;

    // Category boost
    if (reportType && item.category.toUpperCase() === reportType.toUpperCase()) {
      score += 3;
    }

    // Match topics against text
    for (const topic of item.topics) {
      const regex = new RegExp(`\\b${escapeRegExp(topic)}\\b`, 'gi');
      const matches = cleanQuery.match(regex);
      if (matches) {
        score += matches.length * 2.5;
      } else if (cleanQuery.includes(topic)) {
        score += 1.5;
      }
    }

    if (score > 1.5) {
      scoredPassages.push({
        id: item.id,
        category: item.category,
        title: item.title,
        source: item.source,
        url: item.url,
        summary: item.summary,
        evidenceText: item.evidenceText,
        relevanceScore: Math.round(score * 10) / 10
      });
    }
  }

  // Sort descending by relevance score
  scoredPassages.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredPassages.slice(0, limit);
}

/**
 * Formats retrieved evidence into a structured markdown block for LLM prompt context
 */
function formatEvidenceForPrompt(evidenceList) {
  if (!evidenceList || evidenceList.length === 0) {
    return 'NO SPECIFIC MEDICAL KNOWLEDGE BASE MATCHES FOUND. Rely strictly on general clinical consensus and explicitly state that verified external literature citations are unavailable for this report.';
  }

  return evidenceList.map((e, idx) => `
[Source Citation ${idx + 1}]
Title: ${e.title}
Institution: ${e.source}
Official Reference URL: ${e.url}
Clinical Summary: ${e.summary}
Evidence Passage: ${e.evidenceText}
`).join('\n---\n');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  TRUSTED_MEDICAL_KNOWLEDGE,
  retrieveMedicalEvidence,
  formatEvidenceForPrompt
};
