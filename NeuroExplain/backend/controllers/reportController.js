const path = require('path');
const fs = require('fs');
const { pool } = require('../db');
const { extractTextFromPDF } = require('../utils/pdfExtractor');
const { generateReportInterpretation } = require('../utils/geminiService');
const { retrieveMedicalEvidence } = require('../utils/ragService');

/**
 * Upload a PDF neurological report
 * POST /api/reports/upload
 */
async function uploadReport(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file was uploaded. Please select a valid neurological PDF report.'
      });
    }

    const { originalname, filename, path: tempFilePath } = req.file;
    const reportTypeParam = req.body.reportType ? req.body.reportType.toUpperCase() : null;
    const customReportName = req.body.reportName ? req.body.reportName.trim() : null;

    // 1. Extract text using pdf-parse
    let extractionResult;
    try {
      extractionResult = await extractTextFromPDF(tempFilePath);
    } catch (parseErr) {
      console.error('[Report Controller] PDF parse error:', parseErr);
      return res.status(422).json({
        success: false,
        message: 'Unable to read or parse the uploaded PDF file. The file may be corrupt or password-protected.'
      });
    }

    const { text, isScanned, detectedType, pageCount, wordCount } = extractionResult;

    // Determine final report type
    const finalReportType = (reportTypeParam && ['MRI', 'EEG', 'EMG'].includes(reportTypeParam))
      ? reportTypeParam
      : (detectedType || 'MRI');

    const finalReportName = customReportName || originalname.replace(/\.[^/.]+$/, '');

    // 2. Warn if document is scanned or has virtually no text
    if (isScanned) {
      console.warn(`[Report Controller] Uploaded file "${originalname}" appears to be scanned or has minimal text (${wordCount} words).`);
    }

    // 3. Store record in MySQL
    const relativeFilePath = path.join('uploads', filename);
    const [result] = await pool.query(
      `INSERT INTO reports (user_id, report_name, report_type, file_path, extracted_text)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, finalReportName, finalReportType, relativeFilePath, text || '']
    );

    const newReportId = result.insertId;

    return res.status(201).json({
      success: true,
      message: isScanned
        ? 'Report uploaded. Note: This PDF contains limited text layers (possibly a scanned document). Text extraction may be incomplete.'
        : 'Report uploaded and parsed successfully!',
      report: {
        id: newReportId,
        userId,
        reportName: finalReportName,
        reportType: finalReportType,
        filePath: relativeFilePath,
        pageCount,
        wordCount,
        isScanned,
        extractedTextPreview: (text || '').slice(0, 300),
        hasFullText: (text || '').length > 50
      }
    });
  } catch (error) {
    console.error('[Report Controller] Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload and process report: ' + error.message
    });
  }
}

/**
 * List all reports for the authenticated user
 * GET /api/reports
 */
async function listReports(req, res) {
  try {
    const userId = req.user.id;
    const { type, search } = req.query;

    let query = `
      SELECT r.id, r.user_id, r.report_name, r.report_type, r.file_path,
             r.created_at,
             LENGTH(r.extracted_text) as text_length,
             (SELECT COUNT(*) FROM results res WHERE res.report_id = r.id) as interpretation_count,
             (SELECT res.created_at FROM results res WHERE res.report_id = r.id ORDER BY res.created_at DESC LIMIT 1) as last_interpreted_at
      FROM reports r
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (type && ['MRI', 'EEG', 'EMG'].includes(type.toUpperCase())) {
      query += ` AND r.report_type = ?`;
      params.push(type.toUpperCase());
    }

    if (search && search.trim().length > 0) {
      query += ` AND (r.report_name LIKE ? OR r.extracted_text LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [reports] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports: reports.map(r => ({
        id: r.id,
        reportName: r.report_name,
        reportType: r.report_type,
        filePath: r.file_path,
        createdAt: r.created_at,
        textLength: r.text_length || 0,
        isInterpreted: r.interpretation_count > 0,
        lastInterpretedAt: r.last_interpreted_at
      }))
    });
  } catch (error) {
    console.error('[Report Controller] listReports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports.'
    });
  }
}

/**
 * Retrieve an individual report by ID (Ownership verified)
 * GET /api/reports/:id
 */
async function getReportById(req, res) {
  try {
    const userId = req.user.id;
    const reportId = parseInt(req.params.id, 10);

    if (isNaN(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID.' });
    }

    const [reports] = await pool.query(
      `SELECT id, user_id, report_name, report_type, file_path, extracted_text, created_at
       FROM reports
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [reportId, userId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or you do not have permission to view it.'
      });
    }

    const report = reports[0];

    // Check if there are saved results for this report
    const [results] = await pool.query(
      `SELECT id, report_id, summary, key_findings, explanation, questions, evidence_sources, created_at
       FROM results
       WHERE report_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [reportId]
    );

    let savedInterpretation = null;
    if (results.length > 0) {
      const row = results[0];
      try {
        savedInterpretation = {
          id: row.id,
          reportId: row.report_id,
          summary: row.summary,
          key_findings: typeof row.key_findings === 'string' ? JSON.parse(row.key_findings) : row.key_findings,
          explanation: typeof row.explanation === 'string' ? JSON.parse(row.explanation) : row.explanation,
          questions_for_neurologist: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions,
          evidence_sources: row.evidence_sources ? (typeof row.evidence_sources === 'string' ? JSON.parse(row.evidence_sources) : row.evidence_sources) : [],
          createdAt: row.created_at
        };
      } catch (parseErr) {
        console.warn('Failed to parse saved result JSON:', parseErr);
        savedInterpretation = {
          id: row.id,
          summary: row.summary,
          createdAt: row.created_at
        };
      }
    }

    return res.status(200).json({
      success: true,
      report: {
        id: report.id,
        userId: report.user_id,
        reportName: report.report_name,
        reportType: report.report_type,
        filePath: report.file_path,
        extractedText: report.extracted_text,
        createdAt: report.created_at,
        savedInterpretation
      }
    });
  } catch (error) {
    console.error('[Report Controller] getReportById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve report details.'
    });
  }
}

/**
 * Delete a report (Ownership verified)
 * DELETE /api/reports/:id
 */
async function deleteReport(req, res) {
  try {
    const userId = req.user.id;
    const reportId = parseInt(req.params.id, 10);

    if (isNaN(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID.' });
    }

    // Verify report exists and belongs to current user
    const [reports] = await pool.query(
      'SELECT id, file_path FROM reports WHERE id = ? AND user_id = ? LIMIT 1',
      [reportId, userId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or you do not have permission to delete it.'
      });
    }

    const report = reports[0];

    // Delete physically from disk if exists
    if (report.file_path) {
      const fullPath = path.resolve(__dirname, '..', report.file_path);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (unlinkErr) {
          console.warn('Failed to delete physical file:', unlinkErr.message);
        }
      }
    }

    // Delete from MySQL (cascade handles results table)
    await pool.query('DELETE FROM reports WHERE id = ? AND user_id = ?', [reportId, userId]);

    return res.status(200).json({
      success: true,
      message: 'Report and its saved interpretations have been permanently deleted.'
    });
  } catch (error) {
    console.error('[Report Controller] deleteReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete report.'
    });
  }
}

/**
 * Generate AI Interpretation using Gemini & RAG
 * POST /api/reports/:id/interpret
 */
async function interpretReport(req, res) {
  try {
    const userId = req.user.id;
    const reportId = parseInt(req.params.id, 10);
    const { forceRegenerate } = req.body || {};

    if (isNaN(reportId)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID.' });
    }

    // Verify ownership
    const [reports] = await pool.query(
      'SELECT id, user_id, report_name, report_type, extracted_text FROM reports WHERE id = ? AND user_id = ? LIMIT 1',
      [reportId, userId]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or you do not have permission to interpret it.'
      });
    }

    const report = reports[0];

    // Check if interpretation already exists (unless forceRegenerate is true)
    if (!forceRegenerate) {
      const [existingResults] = await pool.query(
        'SELECT id, summary, key_findings, explanation, questions, evidence_sources, created_at FROM results WHERE report_id = ? ORDER BY created_at DESC LIMIT 1',
        [reportId]
      );

      if (existingResults.length > 0) {
        const row = existingResults[0];
        return res.status(200).json({
          success: true,
          message: 'Retrieved existing saved interpretation.',
          result: {
            id: row.id,
            reportId,
            summary: row.summary,
            key_findings: typeof row.key_findings === 'string' ? JSON.parse(row.key_findings) : row.key_findings,
            explanation: typeof row.explanation === 'string' ? JSON.parse(row.explanation) : row.explanation,
            questions_for_neurologist: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions,
            evidence_sources: row.evidence_sources ? (typeof row.evidence_sources === 'string' ? JSON.parse(row.evidence_sources) : row.evidence_sources) : [],
            createdAt: row.created_at,
            isCached: true
          }
        });
      }
    }

    const textToInterpret = report.extracted_text || '';
    if (textToInterpret.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'The report text is too short or empty to interpret accurately. This often happens if the PDF is an image scan without searchable text.'
      });
    }

    // Run AI interpretation
    console.log(`[Report Controller] Generating AI interpretation for Report #${reportId} (${report.report_type})...`);
    const interpretation = await generateReportInterpretation(textToInterpret, report.report_type);

    // Save into MySQL "results" table
    const [insertResult] = await pool.query(
      `INSERT INTO results (report_id, summary, key_findings, explanation, questions, evidence_sources)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        interpretation.summary || '',
        JSON.stringify(interpretation.key_findings || []),
        JSON.stringify({
          what_report_says: interpretation.what_report_says || '',
          medical_terms: interpretation.medical_terms || [],
          limitations: interpretation.limitations || '',
          emergency_notice: interpretation.emergency_notice || '',
          disclaimer: interpretation.disclaimer || '',
          generatedBy: interpretation.generatedBy || ''
        }),
        JSON.stringify(interpretation.questions_for_neurologist || []),
        JSON.stringify(interpretation.evidence_sources || [])
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Report interpreted successfully with evidence-grounded AI.',
      result: {
        id: insertResult.insertId,
        reportId,
        summary: interpretation.summary,
        key_findings: interpretation.key_findings,
        medical_terms: interpretation.medical_terms,
        what_report_says: interpretation.what_report_says,
        questions_for_neurologist: interpretation.questions_for_neurologist,
        evidence_sources: interpretation.evidence_sources,
        limitations: interpretation.limitations,
        emergency_notice: interpretation.emergency_notice,
        disclaimer: interpretation.disclaimer,
        generatedBy: interpretation.generatedBy,
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('[Report Controller] interpretReport error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate interpretation: ' + error.message
    });
  }
}

/**
 * Get saved results for a report
 * GET /api/reports/:id/results
 */
async function getReportResults(req, res) {
  try {
    const userId = req.user.id;
    const reportId = parseInt(req.params.id, 10);

    // Verify ownership
    const [reports] = await pool.query('SELECT id FROM reports WHERE id = ? AND user_id = ? LIMIT 1', [reportId, userId]);
    if (reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const [results] = await pool.query(
      'SELECT id, report_id, summary, key_findings, explanation, questions, evidence_sources, created_at FROM results WHERE report_id = ? ORDER BY created_at DESC',
      [reportId]
    );

    const formatted = results.map(row => {
      let parsedExplanation = {};
      try {
        parsedExplanation = typeof row.explanation === 'string' ? JSON.parse(row.explanation) : row.explanation;
      } catch {
        parsedExplanation = { what_report_says: row.explanation };
      }

      return {
        id: row.id,
        reportId: row.report_id,
        summary: row.summary,
        key_findings: typeof row.key_findings === 'string' ? JSON.parse(row.key_findings) : row.key_findings,
        explanation: parsedExplanation,
        questions_for_neurologist: typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions,
        evidence_sources: row.evidence_sources ? (typeof row.evidence_sources === 'string' ? JSON.parse(row.evidence_sources) : row.evidence_sources) : [],
        createdAt: row.created_at
      };
    });

    return res.status(200).json({
      success: true,
      results: formatted
    });
  } catch (error) {
    console.error('[Report Controller] getReportResults error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve interpretation results.'
    });
  }
}

/**
 * Search the medical knowledge base
 * GET /api/reports/knowledge/search?q=...
 */
async function searchKnowledge(req, res) {
  try {
    const { q, type } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query parameter "q" is required.' });
    }

    const matches = retrieveMedicalEvidence(q, type, 10);
    return res.status(200).json({
      success: true,
      count: matches.length,
      evidence: matches
    });
  } catch (error) {
    console.error('[Report Controller] searchKnowledge error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search medical knowledge.'
    });
  }
}

module.exports = {
  uploadReport,
  listReports,
  getReportById,
  deleteReport,
  interpretReport,
  getReportResults,
  searchKnowledge
};
