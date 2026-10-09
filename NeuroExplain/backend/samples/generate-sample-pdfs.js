const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const samplesDir = path.resolve(__dirname);
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

function createSamplePDF(filename, title, reportType, content) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(samplesDir, filename);
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    doc.fontSize(18).fillColor('#1e3a8a').text('METROPOLITAN NEUROLOGICAL INSTITUTE', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text('Department of Neurodiagnostics & Clinical Neurophysiology', { align: 'center' });
    doc.moveDown(0.5);
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.8);

    // Metadata block
    doc.fontSize(10).fillColor('#334155');
    doc.text(`PATIENT: Jane Doe                      DOB: 10/14/1978          ID: NX-884920`);
    doc.text(`EXAM DATE: October 08, 2026             REFERRING: Dr. S. Vance, MD`);
    doc.text(`PROCEDURE: ${title}`);
    doc.moveDown(0.8);
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Content sections
    for (const section of content) {
      doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text(section.heading);
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#334155').font('Helvetica').text(section.body, { lineGap: 3 });
      doc.moveDown(0.8);
    }

    // Footer signature
    doc.moveDown(1);
    doc.fontSize(9).fillColor('#64748b').text('Electronically signed by: Marcus Sterling, MD, Neurologist / Clinical Neurophysiologist');
    doc.text('Board Certified in Neurology and Electrodiagnostic Medicine');

    doc.end();

    writeStream.on('finish', () => {
      console.log(`Generated sample report: ${filename}`);
      resolve(filePath);
    });

    writeStream.on('error', reject);
  });
}

async function generateAllSamples() {
  // 1. MRI Brain Report
  await createSamplePDF('mri_brain_sample.pdf', 'MRI Brain Without Contrast', 'MRI', [
    {
      heading: 'CLINICAL INDICATION',
      body: '48-year-old female presenting with episodic tension-type headaches and mild dizziness. Rule out intracranial pathology or mass lesion.'
    },
    {
      heading: 'TECHNIQUE',
      body: 'Multiplanar, multisequence magnetic resonance imaging of the brain was performed on a 3.0 Tesla scanner including sagittal T1, axial T2, axial FLAIR, diffusion-weighted imaging (DWI), and ADC maps without intravenous gadolinium contrast.'
    },
    {
      heading: 'FINDINGS',
      body: 'BRAIN PARENCHYMA: The cerebral hemispheres demonstrate normal symmetric cortical gyral architecture. There are a few scattered punctate foci of high T2/FLAIR signal intensity in the subcortical and deep periventricular white matter of both frontal lobes. No diffusion restriction on DWI to suggest acute territorial infarction. No evidence of intracranial hemorrhage or mass effect. Midline structures are centered.\n\nVENTRICULAR SYSTEM: The lateral, third, and fourth ventricles are normal in size and symmetric for age. Basal cisterns are clear.\n\nEXTRA-AXIAL SPACES: No extra-axial fluid collections or subdural hematoma.\n\nPARANASAL SINUSES & ORBITS: Mild mucosal thickening noted in the bilateral maxillary sinuses and ethmoid air cells. Mastoid air cells are well-aerated.'
    },
    {
      heading: 'IMPRESSION',
      body: '1. No acute intracranial hemorrhage, mass effect, or territorial infarction.\n2. Minimal scattered punctate T2/FLAIR white matter hyperintensities in the frontal lobes, non-specific, most commonly representing chronic microvascular ischemic changes or migraine-related changes.\n3. Mild incidental bilateral maxillary sinus mucosal thickening.'
    }
  ]);

  // 2. Routine EEG Report
  await createSamplePDF('eeg_routine_sample.pdf', 'Routine 30-Minute Video EEG', 'EEG', [
    {
      heading: 'CLINICAL INDICATION',
      body: '34-year-old patient evaluated for single episode of unprovoked lightheadedness and transient staring spell. Rule out epileptiform activity.'
    },
    {
      heading: 'TECHNIQUE',
      body: 'Digital electroencephalogram recorded using the International 10-20 system of electrode placement. Intermittent photic stimulation (1-20 Hz) and 3 minutes of hyperventilation were performed. Continuous single-lead EKG was monitored.'
    },
    {
      heading: 'FINDINGS',
      body: 'BACKGROUND: The resting background consists of a well-formed, symmetric 9.5-10 Hz posterior dominant alpha rhythm with eyes closed, which attenuates promptly upon eye opening. Anterior channels show low-voltage fast beta frequencies.\n\nACTIVATION PROCEDURES: Hyperventilation for 3 minutes produced transient mild diffuse theta slowing that returned to baseline within 45 seconds following cessation. Intermittent photic stimulation demonstrated symmetric photic driving at 10 and 12 Hz without photoparoxysmal responses.\n\nTRANSIENTS: No focal or generalized spike-and-wave discharges, polyspikes, or sharp waves were detected. No clinical or electrographic seizures occurred during the recording session.'
    },
    {
      heading: 'IMPRESSION',
      body: '1. Normal 30-minute awake and drowsy routine electroencephalogram.\n2. Well-organized posterior alpha rhythm with appropriate reactivity.\n3. No epileptiform discharges or electrographic seizure activity observed during this recording.'
    }
  ]);

  // 3. EMG & NCS Report
  await createSamplePDF('emg_ncs_sample.pdf', 'Electromyography and Nerve Conduction Study (EMG/NCS)', 'EMG', [
    {
      heading: 'CLINICAL INDICATION',
      body: '42-year-old computer programmer with progressive nocturnal numbness and tingling in the thumb, index, and middle fingers of the right hand. Evaluate for median neuropathy or cervical radiculopathy.'
    },
    {
      heading: 'TECHNIQUE',
      body: 'Motor and sensory nerve conduction studies of the bilateral median and ulnar nerves were performed. Needle electromyography (EMG) was conducted in selected muscles of the right upper extremity.'
    },
    {
      heading: 'FINDINGS',
      body: 'NERVE CONDUCTION STUDIES:\n- Right Median Sensory: Distal sensory latency prolonged at 4.2 ms (normal < 3.5 ms); transcarpal sensory conduction velocity slowed.\n- Right Median Motor: Distal motor latency mildly prolonged at 4.4 ms (normal < 4.0 ms) recorded at abductor pollicis brevis. Compound muscle action potential (CMAP) amplitude is preserved at 8.2 mV.\n- Right Ulnar Sensory and Motor: Distal latencies, amplitudes, and conduction velocities are normal across all segments.\n\nNEEDLE ELECTROMYOGRAPHY:\nNeedle electrode examination of the right abductor pollicis brevis, first dorsal interosseous, pronator teres, biceps brachii, and cervical paraspinal muscles demonstrated normal insertional activity. No resting fibrillation potentials or positive sharp waves observed. Normal motor unit action potential (MUAP) morphology and recruitment pattern.'
    },
    {
      heading: 'IMPRESSION',
      body: '1. Electrodiagnostic findings consistent with mild-to-moderate right median neuropathy at the carpal tunnel (Carpal Tunnel Syndrome), evidenced by sensory and motor distal latency prolongation with preserved motor amplitude.\n2. No electrodiagnostic evidence of right ulnar neuropathy, plexopathy, or active cervical radiculopathy.'
    }
  ]);

  console.log('Sample PDFs generated successfully in backend/samples/');
}

generateAllSamples().catch(console.error);
