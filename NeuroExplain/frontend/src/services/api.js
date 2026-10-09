/**
 * Frontend API Service for NeuroExplain
 * Communicates with FastAPI backend endpoints
 */

const API_BASE_URL = '';

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

export async function uploadReport(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/reports/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return response.json();
}

export async function analyzeReport(reportId, language = 'en', userNotes = '') {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language,
      user_notes: userNotes,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(err.detail || 'Analysis failed');
  }
  return response.json();
}

export async function askFollowUpQuestion(reportId, question, language = 'en') {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      language,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Question failed' }));
    throw new Error(err.detail || 'Failed to answer question');
  }
  return response.json();
}

export async function getReportSources(reportId) {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/sources`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Sources fetch failed' }));
    throw new Error(err.detail || 'Failed to retrieve sources');
  }
  return response.json();
}

export async function simplifyTerm(reportId, term, context = '', language = 'en') {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportId}/simplify-term`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      term,
      context,
      language,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Simplify failed' }));
    throw new Error(err.detail || 'Failed to simplify term');
  }
  return response.json();
}

export async function getSampleReports() {
  const response = await fetch(`${API_BASE_URL}/api/reports/samples`);
  if (!response.ok) {
    throw new Error('Failed to fetch samples');
  }
  return response.json();
}

export async function loadSampleReport(sampleId) {
  const response = await fetch(`${API_BASE_URL}/api/reports/sample/${sampleId}/load`, {
    method: 'POST',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Sample load failed' }));
    throw new Error(err.detail || 'Failed to load sample report');
  }
  return response.json();
}
