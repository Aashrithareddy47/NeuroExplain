const fs = require('fs');
const { Worker } = require('worker_threads');

/**
 * Parses PDF buffer using pdf-parse inside an isolated Worker thread.
 * This guarantees complete memory isolation, prevents legacy PDFJS global state pollution
 * in modern Node.js runtimes, and prevents event loop blocking.
 */
function parsePdfWithWorker(buffer) {
  return new Promise((resolve, reject) => {
    const workerScript = `
      const { parentPort, workerData } = require('worker_threads');
      const pdfParse = require('pdf-parse');

      pdfParse(workerData)
        .then(res => {
          parentPort.postMessage({
            success: true,
            text: res.text || '',
            numpages: res.numpages || 1
          });
        })
        .catch(err => {
          parentPort.postMessage({
            success: false,
            error: err.message || 'Failed to parse PDF'
          });
        });
    `;

    const worker = new Worker(workerScript, {
      eval: true,
      workerData: buffer
    });

    worker.on('message', (msg) => {
      if (msg.success) {
        resolve({ text: msg.text, numpages: msg.numpages });
      } else {
        reject(new Error(msg.error));
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`PDF worker exited with code ${code}`));
      }
    });
  });
}

/**
 * Extracts and cleans text from a PDF file
 * @param {string|Buffer} source - File path or Buffer
 * @returns {Promise<{text: string, pageCount: number, isScanned: boolean, wordCount: number, sections: object, detectedType: string}>}
 */
async function extractTextFromPDF(source) {
  let dataBuffer;
  if (typeof source === 'string') {
    dataBuffer = await fs.promises.readFile(source);
  } else if (Buffer.isBuffer(source)) {
    dataBuffer = source;
  } else {
    throw new Error('Invalid PDF source: expected file path string or Buffer.');
  }

  const parseResult = await parsePdfWithWorker(dataBuffer);
  const rawText = parseResult.text || '';
  const pageCount = parseResult.numpages || 1;

  // Clean raw text
  const cleanedText = cleanReportText(rawText);

  // Check if PDF appears to be scanned / image-only / empty
  const wordCount = cleanedText.split(/\s+/).filter(w => w.length > 1).length;
  const isScanned = cleanedText.length < 50 || wordCount < 10;

  // Parse structured sections
  const sections = extractSections(cleanedText);

  // Infer report type from content
  const detectedType = inferReportType(cleanedText);

  return {
    text: cleanedText,
    rawText: rawText.trim(),
    pageCount,
    isScanned,
    wordCount,
    sections,
    detectedType
  };
}

/**
 * Normalizes whitespaces, fixes odd encoding and control chars
 */
function cleanReportText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, ' ') // Strip non-printable ASCII
    .replace(/[ \t]+/g, ' ')                            // Collapse repeated spaces
    .replace(/\n{3,}/g, '\n\n')                         // Limit consecutive newlines
    .trim();
}

/**
 * Heuristically identifies clinical report sections
 */
function extractSections(text) {
  const sections = {
    patientInfo: '',
    clinicalIndication: '',
    technique: '',
    findings: '',
    impression: '',
    other: ''
  };

  if (!text) return sections;

  // Match common headings (case-insensitive)
  const indicationMatch = text.match(/(?:CLINICAL INDICATION|HISTORY|REASON FOR EXAM|INDICATION|CLINICAL INFORMATION):?\s*([\s\S]*?)(?=(?:TECHNIQUE|PROTOCOL|COMPARISON|FINDINGS|IMPRESSION|CONCLUSION|$))/i);
  if (indicationMatch) sections.clinicalIndication = indicationMatch[1].trim();

  const techniqueMatch = text.match(/(?:TECHNIQUE|PROTOCOL|EXAMINATION|STUDY):?\s*([\s\S]*?)(?=(?:COMPARISON|FINDINGS|IMPRESSION|CONCLUSION|$))/i);
  if (techniqueMatch) sections.technique = techniqueMatch[1].trim();

  const findingsMatch = text.match(/(?:FINDINGS|OBSERVATIONS|RESULTS|EXAM DETAILS):?\s*([\s\S]*?)(?=(?:IMPRESSION|CONCLUSION|SUMMARY|RECOMMENDATION|$))/i);
  if (findingsMatch) sections.findings = findingsMatch[1].trim();

  const impressionMatch = text.match(/(?:IMPRESSION|CONCLUSION|SUMMARY|INTERPRETATION):?\s*([\s\S]*?)(?=(?:RECOMMENDATION|SIGNATURE|ELECTRONICALLY SIGNED|$))/i);
  if (impressionMatch) sections.impression = impressionMatch[1].trim();

  return sections;
}

/**
 * Automatically infers if report is MRI, EEG, or EMG based on vocabulary
 */
function inferReportType(text) {
  if (!text) return 'MRI';
  const lower = text.toLowerCase();

  // EEG keywords
  const eegKeywords = ['electroencephalogram', 'eeg', 'spike and wave', 'photostimulation', 'hyperventilation', 'alpha rhythm', 'posterior basic rhythm', 'epileptiform', 'theta activity', 'delta slowing'];
  const eegScore = eegKeywords.filter(k => lower.includes(k)).length;

  // EMG keywords
  const emgKeywords = ['electromyography', 'emg', 'nerve conduction', 'ncs', 'fibrillation potentials', 'positive sharp waves', 'muap', 'fasciculation', 'median nerve', 'ulnar nerve', 'peroneal nerve', 'sural nerve', 'distal latency', 'conduction velocity'];
  const emgScore = emgKeywords.filter(k => lower.includes(k)).length;

  // MRI keywords
  const mriKeywords = ['mri', 'magnetic resonance', 't1', 't2', 'flair', 'diffusion weighted', 'dwi', 'sagittal', 'axial', 'coronal', 'contrast', 'gadolinium', 'ventricle', 'white matter', 'spine', 'vertebra'];
  const mriScore = mriKeywords.filter(k => lower.includes(k)).length;

  if (eegScore > emgScore && eegScore > mriScore) return 'EEG';
  if (emgScore > eegScore && emgScore > mriScore) return 'EMG';
  if (mriScore >= eegScore && mriScore >= emgScore) return 'MRI';

  return 'MRI';
}

module.exports = {
  extractTextFromPDF,
  cleanReportText,
  extractSections,
  inferReportType
};
