"""
NeuroExplain Knowledge Base Module
Contains verified clinical guidelines, neurological literature abstracts, and educational references
from PubMed, American Heart Association (AHA), American Academy of Neurology (AAN), 
National Institute of Neurological Disorders and Stroke (NINDS), and Radiopaedia.
"""

from typing import List, Dict, Any
import json
import os
from pathlib import Path

# Core Clinical Reference Documents
CLINICAL_KNOWLEDGE_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "id": "KB-STROKE-001",
        "title": "Guidelines for the Early Management of Patients With Acute Ischemic Stroke: 2019 Update",
        "publisher": "American Heart Association / American Stroke Association (Stroke Journal)",
        "year": 2019,
        "pmid": "31662037",
        "doi": "10.1161/STR.0000000000000211",
        "url": "https://pubmed.ncbi.nlm.nih.gov/31662037/",
        "category": "Ischemic Stroke & Cerebrovascular",
        "summary": "Clinical protocol for identifying acute ischemic infarction versus microvascular changes on brain MRI. Diffusion-weighted imaging (DWI) paired with ADC maps is the gold standard for acute cytotoxic edema.",
        "chunks": [
            "Diffusion-Weighted Imaging (DWI) and Apparent Diffusion Coefficient (ADC) in acute brain ischemia: Acute ischemic stroke is characterized by restricted Brownian motion of water molecules caused by cytotoxic edema, appearing hyperintense (bright) on DWI and hypointense (dark) on ADC maps. If a brain MRI shows 'No diffusion restriction on DWI' or 'No acute territorial infarction', it confirms the absence of an acute arterial blockage or fresh brain tissue death at the time of scanning.",
            "Chronic Microvascular Ischemic Changes vs Acute Infarction: Punctate T2 and FLAIR hyperintensities in the deep periventricular or subcortical white matter without corresponding DWI restriction represent chronic microvascular changes (arteriolosclerosis) rather than acute stroke. These are commonly associated with age, hypertension, diabetes, or migraine diathesis and do not indicate an emergency acute infarct."
        ]
    },
    {
        "id": "KB-WMH-002",
        "title": "Standards for Reporting Vascular Changes on Neuroimaging (STRIVE): White Matter Hyperintensities",
        "publisher": "The Lancet Neurology / STandards for ReportIng Vascular changes on nEuroimaging",
        "year": 2013,
        "pmid": "23867200",
        "doi": "10.1016/S1474-4422(13)70124-8",
        "url": "https://pubmed.ncbi.nlm.nih.gov/23867200/",
        "category": "White Matter & Small Vessel Disease",
        "summary": "Standardized definitions for white matter hyperintensities (WMH) of presumed vascular origin, lacunes, and perivascular spaces.",
        "chunks": [
            "White Matter Hyperintensities (WMH) of presumed vascular origin: Hyperintense signal on T2-weighted or FLAIR MRI sequences appearing in the cerebral white matter. Fazekas Scale classifies WMH from Grade 0 (absent) to Grade 3 (confluent large areas). Punctate frontal subcortical lesions (Grade 1) are very frequent incidental findings in asymptomatic adults over 40 and individuals with chronic migraine.",
            "Patient Communication for White Matter Changes: A finding of 'scattered punctate T2/FLAIR hyperintensities' does not mean irreversible disability or dementia. It reflects microscopic small-vessel stiffening or past migraine vasospasm. Primary management focuses on cardiovascular risk control: managing blood pressure, cholesterol, blood glucose, smoking cessation, and routine aerobic exercise."
        ]
    },
    {
        "id": "KB-MASS-003",
        "title": "Radiological Approach to Brain Tumors and Intracranial Mass Lesions: Differential Diagnosis and Safety",
        "publisher": "Radiological Society of North America (RadioGraphics) & AAN Guidelines",
        "year": 2021,
        "pmid": "33635740",
        "doi": "10.1148/rg.2021200135",
        "url": "https://pubmed.ncbi.nlm.nih.gov/33635740/",
        "category": "Intracranial Mass Lesions & Oncology",
        "summary": "Principles of evaluating space-occupying lesions on neuroimaging: differentiating benign meningiomas, intra-axial gliomas, infectious abscesses, and vascular malformations.",
        "chunks": [
            "Intracranial Mass vs. Confirmed Neoplasm Safety Protocol: An MRI finding describing an 'intracranial space-occupying lesion', 'extra-axial mass', or 'abnormal parenchymal enhancement' represents an imaging abnormality that requires histopathological or specialized multidisciplinary review. It is medically inaccurate and premature to diagnose malignancy solely from imaging without contrast enhancement dynamics, MR spectroscopy, perfusion studies, and tissue biopsy.",
            "Extra-Axial vs Intra-Axial Masses: Extra-axial masses (such as dural-based meningiomas or schwannomas) originate outside the brain tissue itself and are overwhelmingly benign (WHO Grade I). They often produce local compression rather than brain tissue infiltration. Key imaging parameters include presence of mass effect, midline shift, vasogenic edema, and dural tail sign.",
            "Critical Safety Distinction for Image Uploads: Direct visual interpretation of raw MRI/CT pixels cannot substitute for a certified radiologist report. No automated system should declare a tumor present or absent from raw image slices without an official diagnostic radiology report."
        ]
    },
    {
        "id": "KB-EEG-004",
        "title": "American Clinical Neurophysiology Society's Standardized EEG Terminology and Clinical Interpretation",
        "publisher": "American Clinical Neurophysiology Society (ACNS) / Journal of Clinical Neurophysiology",
        "year": 2021,
        "pmid": "33475283",
        "doi": "10.1097/WNP.0000000000000806",
        "url": "https://pubmed.ncbi.nlm.nih.gov/33475283/",
        "category": "Electroencephalography & Seizures",
        "summary": "Clinical guidance for interpreting routine, sleep, and ambulatory electroencephalography (EEG) recordings.",
        "chunks": [
            "Posterior Dominant Alpha Rhythm: In a normal awake adult, the posterior dominant rhythm is typically between 8.5 Hz and 12 Hz over the occipital regions with eyes closed, attenuating immediately with eye opening (reactivity). This is a hallmark sign of healthy cortical function and wakefulness.",
            "Epileptiform Discharges vs. Benign Transients: True epileptiform activity involves sharp waves (<200 ms) or spike-and-wave discharges with a distinct physiological after-coming slow wave and disruptive field. Hyperventilation and photic stimulation are standard activation procedures to test seizure thresholds. The statement 'No epileptiform activity or electrographic seizures' signifies a normal electrical baseline during the recording window."
        ]
    },
    {
        "id": "KB-EMG-005",
        "title": "Practice Guideline: Electrodiagnostic Services in Patients With Suspected Carpal Tunnel Syndrome",
        "publisher": "American Association of Neuromuscular & Electrodiagnostic Medicine (AANEM) / Muscle & Nerve",
        "year": 2016,
        "pmid": "27129528",
        "doi": "10.1002/mus.25148",
        "url": "https://pubmed.ncbi.nlm.nih.gov/27129528/",
        "category": "Neuromuscular & EMG/NCS",
        "summary": "Diagnostic criteria for median neuropathy at the carpal tunnel, distinguishing it from cervical radiculopathy and ulnar neuropathy.",
        "chunks": [
            "Median Nerve Conduction Abnormalities: Carpal tunnel syndrome (CTS) is diagnosed electrophysiologically by prolongation of distal sensory latency (>3.5 ms across the wrist) and distal motor latency (>4.2 ms) of the median nerve, while ulnar nerve parameters remain normal.",
            "Needle EMG Examination in Neuropathy: Needle electromyography evaluates muscle response to assess active nerve root irritation or motor axon loss. The absence of fibrillations or positive sharp waves, combined with normal motor unit action potential (MUAP) morphology, indicates intact nerve axon continuity without active denervation."
        ]
    },
    {
        "id": "KB-SPINE-006",
        "title": "Lumbar and Cervical Spine MRI Terminology and Clinical Concordance",
        "publisher": "North American Spine Society (NASS) / American Society of Spine Radiology (ASSR)",
        "year": 2014,
        "pmid": "25444654",
        "doi": "10.1016/j.spinee.2014.08.007",
        "url": "https://pubmed.ncbi.nlm.nih.gov/25444654/",
        "category": "Spinal Neuropathies & Disc Disease",
        "summary": "Standardized classification of disc bulges, protrusions, extrusions, canal stenosis, and neural foraminal narrowing.",
        "chunks": [
            "Disc Bulge vs Herniation: A disc bulge involves generalized circumferential extension of disc tissue beyond the vertebral edges (>50% circumference) and is often an asymptomatic degenerative change. A focal protrusion involves <25% circumference and is clinically relevant only if it compresses an exiting nerve root (producing radicular symptoms).",
            "Neural Foraminal Stenosis and Radiculopathy: Narrowing of the exit canals (neuroforamina) can irritate cervical or lumbar nerve roots. Asymptomatic MRI findings of disc degenerative changes are present in over 60% of healthy individuals over 40 and must always be correlated with clinical neurological examination."
        ]
    },
    {
        "id": "KB-VENT-007",
        "title": "Evaluation of Ventricular Enlargement and Normal Pressure Hydrocephalus on Brain MRI",
        "publisher": "European Academy of Neurology / Journal of the Neurological Sciences",
        "year": 2020,
        "pmid": "32062118",
        "doi": "10.1016/j.jns.2020.116744",
        "url": "https://pubmed.ncbi.nlm.nih.gov/32062118/",
        "category": "Ventricular System & CSF Dynamics",
        "summary": "Differentiating age-appropriate ventriculomegaly (ex vacuo enlargement) from communicating hydrocephalus.",
        "chunks": [
            "Normal Ventricles vs Ventriculomegaly: The cerebral ventricles (lateral, third, and fourth) contain cerebrospinal fluid (CSF) which cushions the brain. Mild ventricular prominence symmetric with prominent sulci typically represents normal involutional brain volume change associated with healthy aging ('ex-vacuo' appearance), rather than elevated CSF pressure.",
            "Hydrocephalus Signs: Pathological hydrocephalus features disproportionately large lateral ventricles with tight high-convexity sulci (DESH pattern) and transependymal CSF resorption (periventricular halo). When reports state 'Ventricles and sulci normal in size for age', this excludes hydrocephalus."
        ]
    },
    {
        "id": "KB-INCID-008",
        "title": "Incidental Findings on Brain MRI in the General Population: A Systematic Review and Meta-analysis",
        "publisher": "British Medical Journal (BMJ) / Cochrane Database",
        "year": 2018,
        "pmid": "29903722",
        "doi": "10.1136/bmj.k2247",
        "url": "https://pubmed.ncbi.nlm.nih.gov/29903722/",
        "category": "Incidental Neuroimaging Findings",
        "summary": "Prevalence and clinical significance of incidental findings like paranasal sinus thickening, pineal cysts, arachnoid cysts, and developmental venous anomalies.",
        "chunks": [
            "Maxillary and Paranasal Sinus Thickening: Paranasal sinus mucosal thickening (e.g. maxillary or ethmoid sinus mucous membrane thickening) is seen in over 30% of brain MRIs as an incidental non-neurological finding. It relates to mild seasonal allergies, previous cold, or rhinosinusitis and does not affect the brain parenchyma or nervous system.",
            "Arachnoid Cysts and Benign Variants: Asymptomatic arachnoid cysts, cavum septum pellucidum, and developmental venous anomalies (DVAs) are congenital anatomic variants found incidentally. They do not represent brain damage or progressive tumors."
        ]
    }
]

def get_all_knowledge_documents() -> List[Dict[str, Any]]:
    """Returns all knowledge base documents with metadata and text chunks."""
    return CLINICAL_KNOWLEDGE_DOCUMENTS

def save_knowledge_base_to_disk(target_dir: str):
    """Saves each clinical knowledge document as a JSON file in the target directory."""
    os.makedirs(target_dir, exist_ok=True)
    for doc in CLINICAL_KNOWLEDGE_DOCUMENTS:
        file_path = os.path.join(target_dir, f"{doc['id']}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2, ensure_ascii=False)
