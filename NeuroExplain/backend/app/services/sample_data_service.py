"""
Synthetic Sample Neurological Reports for NeuroExplain.
Realistic clinical cases for demonstration with zero PII (Personally Identifiable Information).
"""

from typing import List, Dict, Any

SAMPLE_REPORTS: List[Dict[str, Any]] = [
    {
        "id": "sample-mri-wmh",
        "title": "Brain MRI — White Matter Hyperintensities & Headaches",
        "modality": "Brain MRI (3.0 Tesla)",
        "description": "Patient presenting with episodic migraines. Shows frontal punctate FLAIR hyperintensities with NO acute infarct or hemorrhage.",
        "file_name": "mri_brain_wmh_sample.pdf",
        "text": """METROPOLITAN NEUROLOGICAL INSTITUTE
Department of Neurodiagnostics & Clinical Neurophysiology
EXAM DATE: October 08, 2026
PATIENT: Synthetic Patient A (DOB: 10/14/1978) — ID: NX-884920
PROCEDURE: MRI Brain Without Contrast (3.0T)

CLINICAL INDICATION:
48-year-old female presenting with episodic tension-type headaches and mild dizziness. Rule out intracranial pathology or acute territorial infarct.

TECHNIQUE:
Multiplanar, multisequence magnetic resonance imaging of the brain was performed on a 3.0 Tesla scanner including sagittal T1, axial T2, axial FLAIR, diffusion-weighted imaging (DWI), and ADC maps without intravenous gadolinium contrast.

FINDINGS:
BRAIN PARENCHYMA: The cerebral hemispheres demonstrate normal symmetric cortical gyral architecture. There are a few scattered punctate foci of high T2/FLAIR signal intensity in the subcortical and deep periventricular white matter of both frontal lobes. No diffusion restriction on DWI to suggest acute territorial infarction. No evidence of intracranial hemorrhage, midline shift, or mass effect.
VENTRICULAR SYSTEM: The lateral, third, and fourth ventricles are normal in size and symmetric for age. Basal cisterns are clear.
EXTRA-AXIAL SPACES: No extra-axial fluid collections or subdural hematoma.
PARANASAL SINUSES: Mild mucosal thickening noted in the bilateral maxillary sinuses. Mastoid air cells are well-aerated.

IMPRESSION:
1. No acute intracranial hemorrhage, mass effect, or territorial infarction.
2. Minimal scattered punctate T2/FLAIR white matter hyperintensities in the frontal lobes, non-specific, most commonly representing chronic microvascular ischemic changes or migraine-related changes.
3. Mild incidental bilateral maxillary sinus mucosal thickening."""
    },
    {
        "id": "sample-mri-mass",
        "title": "Brain MRI — Suspected Extra-Axial Mass (Meningioma Safety Case)",
        "modality": "Brain MRI With & Without Contrast",
        "description": "Report describing a well-circumscribed dural-based mass. Demonstrates tumor safety protocols and differential explanations.",
        "file_name": "mri_brain_mass_safety_sample.pdf",
        "text": """METROPOLITAN NEUROLOGICAL INSTITUTE
Department of Neurodiagnostics & Clinical Neurophysiology
EXAM DATE: October 08, 2026
PATIENT: Synthetic Patient B (DOB: 04/22/1965) — ID: NX-992314
PROCEDURE: MRI Brain With and Without Intravenous Gadolinium

CLINICAL INDICATION:
61-year-old male with progressive left-sided focal headaches and occasional visual blurriness. Rule out intracranial mass.

TECHNIQUE:
Multiplanar pre- and post-contrast MRI of the brain was acquired on a 3.0 Tesla system with axial T1, T2, FLAIR, and 3D T1 post-contrast sequences following 15 mL Dotarem.

FINDINGS:
BRAIN PARENCHYMA: There is a well-circumscribed, homogenously enhancing extra-axial mass along the right frontal convexity measuring 2.4 x 2.1 x 1.8 cm. The lesion demonstrates a distinct dural tail sign. There is mild adjacent vasogenic edema in the right frontal subcortical white matter. Mild mass effect on the right frontal cortical sulci without midline shift (midline shift = 0 mm). No evidence of acute territorial infarction on DWI/ADC.
VENTRICULAR SYSTEM: Ventricles are within normal limits with no hydrocephalus.
POSTERIOR FOSSA: Cerebellum and brainstem are unremarkable.

IMPRESSION:
1. 2.4 cm avidly enhancing right frontal extra-axial mass with dural tail and mild localized mass effect, appearance most characteristic of a benign meningioma (differential diagnosis includes solitary fibrous tumor or hemangiopericytoma).
2. Mild adjacent vasogenic edema without midline shift or acute infarction.
3. Neurosurgical and neuro-oncological consultation recommended for clinical correlation and treatment planning."""
    },
    {
        "id": "sample-eeg-routine",
        "title": "Routine 30-Minute Video EEG — Normal Awake & Drowsy",
        "modality": "Routine Electroencephalogram (EEG)",
        "description": "Evaluated for a single episode of lightheadedness. Demonstrates reassuring normal posterior dominant alpha rhythm.",
        "file_name": "eeg_routine_normal_sample.pdf",
        "text": """METROPOLITAN NEUROLOGICAL INSTITUTE
Department of Neurodiagnostics & Clinical Neurophysiology
EXAM DATE: October 08, 2026
PATIENT: Synthetic Patient C (DOB: 08/11/1992) — ID: NX-551029
PROCEDURE: Routine 30-Minute Awake and Drowsy Digital EEG

CLINICAL INDICATION:
34-year-old patient evaluated for single episode of unprovoked lightheadedness and transient staring spell. Rule out epileptiform activity.

TECHNIQUE:
Digital electroencephalogram recorded using the International 10-20 system of electrode placement. Intermittent photic stimulation (1-20 Hz) and 3 minutes of hyperventilation were performed. Continuous single-lead EKG was monitored.

FINDINGS:
BACKGROUND: The resting background consists of a well-formed, symmetric 9.5-10 Hz posterior dominant alpha rhythm with eyes closed, which attenuates promptly upon eye opening. Anterior channels show low-voltage fast beta frequencies.
ACTIVATION PROCEDURES: Hyperventilation for 3 minutes produced transient mild diffuse theta slowing that returned to baseline within 45 seconds following cessation. Intermittent photic stimulation demonstrated symmetric photic driving at 10 and 12 Hz without photoparoxysmal responses.
TRANSIENTS: No focal or generalized spike-and-wave discharges, polyspikes, or sharp waves were detected. No clinical or electrographic seizures occurred during the recording session.

IMPRESSION:
1. Normal 30-minute awake and drowsy routine electroencephalogram.
2. Well-organized posterior alpha rhythm with appropriate reactivity.
3. No epileptiform discharges or electrographic seizure activity observed during this recording."""
    },
    {
        "id": "sample-emg-ncs",
        "title": "EMG & NCS — Right Median Neuropathy (Carpal Tunnel)",
        "modality": "Electromyography & Nerve Conduction (EMG/NCS)",
        "description": "Patient with nocturnal hand numbness. Shows prolonged median sensory/motor latency with intact motor amplitudes.",
        "file_name": "emg_ncs_carpal_tunnel_sample.pdf",
        "text": """METROPOLITAN NEUROLOGICAL INSTITUTE
Department of Neurodiagnostics & Clinical Neurophysiology
EXAM DATE: October 08, 2026
PATIENT: Synthetic Patient D (DOB: 02/19/1984) — ID: NX-441208
PROCEDURE: Electromyography and Nerve Conduction Study (EMG/NCS)

CLINICAL INDICATION:
42-year-old computer programmer with progressive nocturnal numbness and tingling in the thumb, index, and middle fingers of the right hand. Evaluate for median neuropathy or cervical radiculopathy.

TECHNIQUE:
Motor and sensory nerve conduction studies of the bilateral median and ulnar nerves were performed. Needle electromyography (EMG) was conducted in selected muscles of the right upper extremity.

FINDINGS:
NERVE CONDUCTION STUDIES:
- Right Median Sensory: Distal sensory latency prolonged at 4.2 ms (normal < 3.5 ms); transcarpal sensory conduction velocity slowed.
- Right Median Motor: Distal motor latency mildly prolonged at 4.4 ms (normal < 4.0 ms) recorded at abductor pollicis brevis. Compound muscle action potential (CMAP) amplitude is preserved at 8.2 mV.
- Right Ulnar Sensory and Motor: Distal latencies, amplitudes, and conduction velocities are normal across all segments.

NEEDLE ELECTROMYOGRAPHY:
Needle electrode examination of the right abductor pollicis brevis, first dorsal interosseous, pronator teres, biceps brachii, and cervical paraspinal muscles demonstrated normal insertional activity. No resting fibrillation potentials or positive sharp waves observed. Normal motor unit action potential (MUAP) morphology and recruitment pattern.

IMPRESSION:
1. Electrodiagnostic findings consistent with mild-to-moderate right median neuropathy at the carpal tunnel (Carpal Tunnel Syndrome), evidenced by sensory and motor distal latency prolongation with preserved motor amplitude.
2. No electrodiagnostic evidence of right ulnar neuropathy, plexopathy, or active cervical radiculopathy."""
    }
]

def get_all_sample_reports() -> List[Dict[str, Any]]:
    return SAMPLE_REPORTS

def get_sample_report_by_id(sample_id: str) -> Dict[str, Any]:
    for sample in SAMPLE_REPORTS:
        if sample["id"] == sample_id:
            return sample
    raise ValueError(f"Sample report '{sample_id}' not found.")
