/**
 * Comprehensive Automated Test Suite for NeuroExplain
 * Tests: DB, Authentication, PDF Extraction, RAG, AI Interpretation, Ownership Protection, Cleanup
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { pool, testConnection } = require('../db');
const { extractTextFromPDF } = require('../utils/pdfExtractor');
const { retrieveMedicalEvidence } = require('../utils/ragService');
const { generateReportInterpretation } = require('../utils/geminiService');

const TEST_EMAIL = `test_patient_${Date.now()}@neuroexplain.org`;
const TEST_PASSWORD = 'SecurePassword123!';
const OTHER_USER_EMAIL = `other_patient_${Date.now()}@neuroexplain.org`;

let testUserId = null;
let otherUserId = null;
let testReportId = null;

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   STARTING NEUROEXPLAIN INTEGRATION & SYSTEM TESTS   ');
  console.log('======================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  async function test(name, fn) {
    totalCount++;
    process.stdout.write(`[Test ${totalCount}] ${name} ... `);
    try {
      await fn();
      console.log('PASSED \x1b[32m✓\x1b[0m');
      passedCount++;
    } catch (err) {
      console.log('FAILED \x1b[31m✗\x1b[0m');
      console.error('   Error Details:', err.message);
    }
  }

  try {
    // 1. Database Connection
    await test('MySQL 8.0 Database Connection & Tables', async () => {
      const isConnected = await testConnection();
      assert.strictEqual(isConnected, true, 'Database should connect successfully');
      const [tables] = await pool.query('SHOW TABLES');
      assert(tables.length >= 3, 'Should have users, reports, and results tables');
    });

    // 2. User Registration & Password Hashing
    await test('User Registration & Bcrypt Hashing', async () => {
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
      const [insertRes] = await pool.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Jane Doe Test', TEST_EMAIL, hashedPassword]
      );
      testUserId = insertRes.insertId;
      assert(testUserId > 0, 'New user should have a valid auto-increment ID');

      // Verify password was hashed and is not stored in plaintext
      const [userRow] = await pool.query('SELECT password FROM users WHERE id = ?', [testUserId]);
      assert.notStrictEqual(userRow[0].password, TEST_PASSWORD, 'Password must not be stored in plaintext');
      const matches = await bcrypt.compare(TEST_PASSWORD, userRow[0].password);
      assert.strictEqual(matches, true, 'Bcrypt should verify original password');
    });

    // 3. Duplicate Email Prevention
    await test('Duplicate Email Prevention (Unique Constraint)', async () => {
      let threw = false;
      try {
        await pool.query(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          ['Duplicate User', TEST_EMAIL, 'anotherpassword']
        );
      } catch (err) {
        threw = true;
      }
      assert.strictEqual(threw, true, 'Inserting duplicate email should throw database error');
    });

    // 4. JWT Token Generation & Verification
    await test('JWT Authentication Token Generation & Verification', async () => {
      const secret = process.env.JWT_SECRET || 'neuroexplain_secure_jwt_secret_token_2026_salt';
      const token = jwt.sign({ id: testUserId, email: TEST_EMAIL, name: 'Jane Doe Test' }, secret, { expiresIn: '1h' });
      assert(typeof token === 'string' && token.length > 20, 'Token must be valid string');

      const decoded = jwt.verify(token, secret);
      assert.strictEqual(decoded.id, testUserId);
      assert.strictEqual(decoded.email, TEST_EMAIL);
    });

    // 5. PDF Text Extraction & Section Parsing
    await test('PDF Parsing & Section Parsing (mri_brain_sample.pdf)', async () => {
      const samplePath = path.resolve(__dirname, '..', 'samples', 'mri_brain_sample.pdf');
      assert(fs.existsSync(samplePath), 'Sample MRI PDF must exist');

      const parsed = await extractTextFromPDF(samplePath);
      assert(parsed.text.length > 100, 'Parsed text must not be empty');
      assert.strictEqual(parsed.isScanned, false, 'Sample PDF should have clean text layer');
      assert.strictEqual(parsed.detectedType, 'MRI', 'Should auto-detect MRI from keywords');
      assert(parsed.sections.findings.length > 0, 'Should extract findings section');
      assert(parsed.sections.impression.length > 0, 'Should extract impression section');
    });

    // 6. RAG Evidence Retrieval
    await test('RAG Medical Knowledge Retrieval (MedlinePlus / NIH)', async () => {
      const sampleText = 'Scattered punctate foci of high T2/FLAIR signal intensity in the subcortical white matter. Mild maxillary sinus mucosal thickening.';
      const evidence = retrieveMedicalEvidence(sampleText, 'MRI', 3);
      assert(Array.isArray(evidence) && evidence.length > 0, 'Should return matching evidence citations');
      assert(evidence[0].source.includes('NIH') || evidence[0].source.includes('MedlinePlus'), 'Sources must be official medical authorities');
      assert(evidence[0].url.startsWith('https://'), 'Must provide authentic HTTPS URL');
    });

    // 7. Report Storage in MySQL
    await test('Report Storage in MySQL (reports table)', async () => {
      const samplePath = path.resolve(__dirname, '..', 'samples', 'mri_brain_sample.pdf');
      const parsed = await extractTextFromPDF(samplePath);

      const [res] = await pool.query(
        'INSERT INTO reports (user_id, report_name, report_type, file_path, extracted_text) VALUES (?, ?, ?, ?, ?)',
        [testUserId, 'MRI Brain Test Study', 'MRI', 'uploads/test-sample.pdf', parsed.text]
      );
      testReportId = res.insertId;
      assert(testReportId > 0, 'Report must be inserted with valid ID');
    });

    // 8. Ownership Protection
    await test('Report Ownership Security Isolation', async () => {
      // Create a second user
      const hashed = await bcrypt.hash('OtherPassword123!', 10);
      const [insertRes] = await pool.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Second Patient', OTHER_USER_EMAIL, hashed]
      );
      otherUserId = insertRes.insertId;

      // Ensure second user cannot find report #testReportId in their scoped query
      const [scopedRows] = await pool.query(
        'SELECT id FROM reports WHERE id = ? AND user_id = ?',
        [testReportId, otherUserId]
      );
      assert.strictEqual(scopedRows.length, 0, 'User 2 must NOT have access to User 1 reports');
    });

    // 9. AI Interpretation & RAG Generation
    await test('AI Interpretation Generation & Clinical Grounding', async () => {
      const [rep] = await pool.query('SELECT extracted_text, report_type FROM reports WHERE id = ?', [testReportId]);
      const interpretation = await generateReportInterpretation(rep[0].extracted_text, rep[0].report_type);

      assert(interpretation.summary && interpretation.summary.length > 20, 'Summary must be non-empty');
      assert(Array.isArray(interpretation.key_findings) && interpretation.key_findings.length > 0, 'Must have structured key findings');
      assert(Array.isArray(interpretation.questions_for_neurologist), 'Must have doctor questions');
      assert(interpretation.disclaimer.includes('does not provide a medical diagnosis'), 'Must include safety disclaimer');

      // Store in results table
      const [resInsert] = await pool.query(
        'INSERT INTO results (report_id, summary, key_findings, explanation, questions, evidence_sources) VALUES (?, ?, ?, ?, ?, ?)',
        [
          testReportId,
          interpretation.summary,
          JSON.stringify(interpretation.key_findings),
          JSON.stringify({ what_report_says: interpretation.what_report_says }),
          JSON.stringify(interpretation.questions_for_neurologist),
          JSON.stringify(interpretation.evidence_sources)
        ]
      );
      assert(resInsert.insertId > 0, 'Results record must be created in MySQL');
    });

    // 10. Results Retrieval
    await test('Saved Interpretation Retrieval from MySQL', async () => {
      const [results] = await pool.query('SELECT * FROM results WHERE report_id = ?', [testReportId]);
      assert(results.length > 0, 'Should find saved result for report');
      const findings = JSON.parse(results[0].key_findings);
      assert(Array.isArray(findings), 'Key findings should parse back to an array');
    });

    // 11. Cascading Delete
    await test('Cascading Delete (Report deletion removes results)', async () => {
      await pool.query('DELETE FROM reports WHERE id = ?', [testReportId]);
      const [remainingReports] = await pool.query('SELECT id FROM reports WHERE id = ?', [testReportId]);
      assert.strictEqual(remainingReports.length, 0, 'Report should be deleted');

      const [orphanedResults] = await pool.query('SELECT id FROM results WHERE report_id = ?', [testReportId]);
      assert.strictEqual(orphanedResults.length, 0, 'Associated results must cascade delete');
    });

    // Clean up test users
    if (testUserId) await pool.query('DELETE FROM users WHERE id = ?', [testUserId]);
    if (otherUserId) await pool.query('DELETE FROM users WHERE id = ?', [otherUserId]);

  } catch (suiteError) {
    console.error('Fatal test suite failure:', suiteError);
  } finally {
    console.log('\n======================================================');
    console.log(`   TEST SUMMARY: ${passedCount} / ${totalCount} TESTS PASSED`);
    console.log('======================================================\n');
    await pool.end();
    process.exit(passedCount === totalCount ? 0 : 1);
  }
}

runTestSuite();
