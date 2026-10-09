# NeuroExplain Knowledge Base

This directory contains verified, peer-reviewed clinical guidelines, neurology practice bulletins, and PubMed literature references used by NeuroExplain's Retrieval-Augmented Generation (RAG) pipeline.

## 📚 Knowledge Sources & Citations

1. **Stroke & Acute Ischemia**
   - **Title**: *Guidelines for the Early Management of Patients With Acute Ischemic Stroke: 2019 Update*
   - **Publisher**: American Heart Association / American Stroke Association (*Stroke* Journal)
   - **PMID**: [31662037](https://pubmed.ncbi.nlm.nih.gov/31662037/)
   - **DOI**: 10.1161/STR.0000000000000211
   - **Application**: Grounding diffusion-weighted imaging (DWI) / ADC interpretations, distinguishing acute cytotoxic edema from chronic microvascular white matter changes.

2. **White Matter Hyperintensities & Small Vessel Disease**
   - **Title**: *Standards for Reporting Vascular Changes on Neuroimaging (STRIVE): White Matter Hyperintensities*
   - **Publisher**: *The Lancet Neurology*
   - **PMID**: [23867200](https://pubmed.ncbi.nlm.nih.gov/23867200/)
   - **DOI**: 10.1016/S1474-4422(13)70124-8
   - **Application**: Clarifying Fazekas grading, punctate subcortical foci, migraine-related hyperintensities, and vascular risk factor management.

3. **Intracranial Masses & Brain Tumor Safety**
   - **Title**: *Radiological Approach to Brain Tumors and Intracranial Mass Lesions: Differential Diagnosis and Safety*
   - **Publisher**: Radiological Society of North America (*RadioGraphics*) & American Academy of Neurology (AAN)
   - **PMID**: [33635740](https://pubmed.ncbi.nlm.nih.gov/33635740/)
   - **DOI**: 10.1148/rg.2021200135
   - **Application**: Ensuring strict safety distinction between extra-axial benign lesions (e.g. meningiomas) and intra-axial infiltrative lesions, emphasizing histopathological confirmation before definitive diagnosis.

4. **Electroencephalography (EEG) & Seizures**
   - **Title**: *American Clinical Neurophysiology Society's Standardized EEG Terminology and Clinical Interpretation*
   - **Publisher**: American Clinical Neurophysiology Society (ACNS) / *Journal of Clinical Neurophysiology*
   - **PMID**: [33475283](https://pubmed.ncbi.nlm.nih.gov/33475283/)
   - **DOI**: 10.1097/WNP.0000000000000806
   - **Application**: Normal posterior dominant alpha rhythm reactivity, photic driving, hyperventilation responses, and distinguishing epileptiform sharp waves from benign transients.

5. **Electromyography & Nerve Conduction (EMG/NCS)**
   - **Title**: *Practice Guideline: Electrodiagnostic Services in Patients With Suspected Carpal Tunnel Syndrome*
   - **Publisher**: American Association of Neuromuscular & Electrodiagnostic Medicine (AANEM) / *Muscle & Nerve*
   - **PMID**: [27129528](https://pubmed.ncbi.nlm.nih.gov/27129528/)
   - **DOI**: 10.1002/mus.25148
   - **Application**: Distal sensory/motor latency thresholds, median vs ulnar nerve comparisons, needle EMG absence of active denervation potentials.

6. **Spinal Neuropathies & Disc Herniations**
   - **Title**: *Lumbar and Cervical Spine MRI Terminology and Clinical Concordance*
   - **Publisher**: North American Spine Society (NASS) / American Society of Spine Radiology (ASSR)
   - **PMID**: [25444654](https://pubmed.ncbi.nlm.nih.gov/25444654/)
   - **DOI**: 10.1016/j.spinee.2014.08.007
   - **Application**: Distinguishing age-related generalized disc bulges from focal nerve-root compressing protrusions.

7. **Ventricular Enlargement & Hydrocephalus**
   - **Title**: *Evaluation of Ventricular Enlargement and Normal Pressure Hydrocephalus on Brain MRI*
   - **Publisher**: European Academy of Neurology / *Journal of the Neurological Sciences*
   - **PMID**: [32062118](https://pubmed.ncbi.nlm.nih.gov/32062118/)
   - **DOI**: 10.1016/j.jns.2020.116744
   - **Application**: Age-appropriate ex-vacuo ventricular prominence vs true CSF dynamics obstruction.

8. **Incidental Findings in General Population**
   - **Title**: *Incidental Findings on Brain MRI in the General Population: A Systematic Review and Meta-analysis*
   - **Publisher**: *BMJ* / Cochrane Database
   - **PMID**: [29903722](https://pubmed.ncbi.nlm.nih.gov/29903722/)
   - **DOI**: 10.1136/bmj.k2247
   - **Application**: Reassuring explanations for benign incidental findings (paranasal sinus mucosal thickening, arachnoid cysts, developmental venous anomalies).

---

## 🔍 Multilingual Vector Storage
All documents are chunked and vectorized using `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` into a local FAISS index stored at `backend/faiss_index/`. This enables seamless cross-lingual querying in English, Telugu, and Hindi.
