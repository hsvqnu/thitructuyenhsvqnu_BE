/**
 * server.ts — Express REST API cho hệ thống thi QNU
 * Kết nối PostgreSQL qua pool, phục vụ frontend React/Vite.
 *
 * Dev:  npm run server
 * Prod: node dist/server.js
 */

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __filename0 = fileURLToPath(import.meta.url);
const __dirname0 = dirname(__filename0);

dotenvConfig({
  path: resolve(__dirname0, '.env'),
});

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { pool, query, queryOne } from './src/lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: [
      'https://hsvqnu-exam.vercel.app',
      'http://localhost:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  })
);

// =====================================================
// Middleware
// =====================================================

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sendError(res: Response, err: unknown, status = 500) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[API Error]', msg);
  res.status(status).json({ error: msg });
}

// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────

app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    const row = await queryOne<{ password: string }>(
      `SELECT password FROM admins WHERE username = $1`,
      [username]
    );
    if (!row || row.password !== password) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    }
    res.json({ success: true, role: 'admin' });
  } catch (err) { sendError(res, err); }
});

// ─── STUDENTS ─────────────────────────────────────────────────────────────────

app.get('/api/students', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT
        username,
        full_name            AS "fullName",
        major, gender,
        TO_CHAR(dob, 'YYYY-MM-DD') AS dob,
        phone, email, password,
        faculty_association  AS "facultyAssociation",
        class_branch         AS "classBranch",
        cohort,
        class_group          AS "classGroup",
        is_active            AS "isActive",
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt"
      FROM students ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) { sendError(res, err); }
});

app.put('/api/students/:username', async (req: Request, res: Response) => {
  try {
    const s = req.body;
    await pool.query(`
      INSERT INTO students (
        username, full_name, major, gender, dob, phone, email,
        password, faculty_association, class_branch, cohort, class_group,
        is_active, created_at
      ) VALUES ($1,$2,$3,$4,$5::DATE,$6,$7,$8,$9,$10,$11,$12,$13,
        COALESCE($14::TIMESTAMP, NOW()))
      ON CONFLICT (username) DO UPDATE SET
        full_name           = EXCLUDED.full_name,
        major               = EXCLUDED.major,
        gender              = EXCLUDED.gender,
        dob                 = EXCLUDED.dob,
        phone               = EXCLUDED.phone,
        email               = EXCLUDED.email,
        password            = EXCLUDED.password,
        faculty_association = EXCLUDED.faculty_association,
        class_branch        = EXCLUDED.class_branch,
        cohort              = EXCLUDED.cohort,
        class_group         = EXCLUDED.class_group,
        is_active           = EXCLUDED.is_active
    `, [
      s.username, s.fullName, s.major ?? '', s.gender,
      s.dob, s.phone ?? '', s.email ?? '', s.password ?? null,
      s.facultyAssociation ?? null, s.classBranch ?? null,
      s.cohort ?? null, s.classGroup ?? null,
      s.isActive ?? true, s.createdAt ?? null,
    ]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

app.delete('/api/students/:username', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM students WHERE username = $1', [req.params.username]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// ─── BANKS ────────────────────────────────────────────────────────────────────

app.get('/api/banks', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT id, name, description,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt"
      FROM banks ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) { sendError(res, err); }
});

app.put('/api/banks/:id', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    await pool.query(`
      INSERT INTO banks (id, name, description, created_at)
      VALUES ($1,$2,$3, COALESCE($4::TIMESTAMP, NOW()))
      ON CONFLICT (id) DO UPDATE SET
        name        = EXCLUDED.name,
        description = EXCLUDED.description
    `, [b.id, b.name, b.description ?? '', b.createdAt ?? null]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

app.delete('/api/banks/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM banks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// ─── EXAMS ────────────────────────────────────────────────────────────────────

app.get('/api/exams', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT
        id, title,
        TO_CHAR(start_time, 'YYYY-MM-DD HH24:MI') AS "startTime",
        TO_CHAR(end_time,   'YYYY-MM-DD HH24:MI') AS "endTime",
        duration,
        total_points         AS "totalPoints",
        status,
        student_count        AS "studentCount",
        submitted_count      AS "submittedCount",
        max_attempts         AS "maxAttempts",
        question_source      AS "questionSource",
        bank_id              AS "bankId",
        random_question_count  AS "randomQuestionCount",
        per_question_limit_sec AS "perQuestionLimitSec",
        academic_year        AS "academicYear",
        contest_type         AS "contestType",
        pass_question_count  AS "passQuestionCount",
        is_published         AS "isPublished",
        randomize_questions  AS "randomizeQuestions",
        randomize_answers    AS "randomizeAnswers"
      FROM exams ORDER BY start_time DESC
    `);
    res.json(rows);
  } catch (err) { sendError(res, err); }
});

app.put('/api/exams/:id', async (req: Request, res: Response) => {
  try {
    const e = req.body;
    await pool.query(`
      INSERT INTO exams (
        id, title, start_time, end_time, duration, total_points,
        status, student_count, submitted_count,
        max_attempts, question_source, bank_id,
        random_question_count, per_question_limit_sec,
        academic_year, contest_type, pass_question_count,
        is_published, randomize_questions, randomize_answers
      ) VALUES ($1,$2,$3::TIMESTAMP,$4::TIMESTAMP,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      ON CONFLICT (id) DO UPDATE SET
        title                  = EXCLUDED.title,
        start_time             = EXCLUDED.start_time,
        end_time               = EXCLUDED.end_time,
        duration               = EXCLUDED.duration,
        total_points           = EXCLUDED.total_points,
        status                 = EXCLUDED.status,
        student_count          = EXCLUDED.student_count,
        submitted_count        = EXCLUDED.submitted_count,
        max_attempts           = EXCLUDED.max_attempts,
        question_source        = EXCLUDED.question_source,
        bank_id                = EXCLUDED.bank_id,
        random_question_count  = EXCLUDED.random_question_count,
        per_question_limit_sec = EXCLUDED.per_question_limit_sec,
        academic_year          = EXCLUDED.academic_year,
        contest_type           = EXCLUDED.contest_type,
        pass_question_count    = EXCLUDED.pass_question_count,
        is_published           = EXCLUDED.is_published,
        randomize_questions    = EXCLUDED.randomize_questions,
        randomize_answers      = EXCLUDED.randomize_answers
    `, [
      e.id, e.title, e.startTime, e.endTime,
      e.duration, e.totalPoints,
      e.status ?? 'Sắp diễn ra',
      e.studentCount ?? 0, e.submittedCount ?? 0,
      e.maxAttempts ?? null,
      e.questionSource ?? 'static',
      e.bankId ?? null,
      e.randomQuestionCount ?? null,
      e.perQuestionLimitSec ?? null,
      e.academicYear ?? null,
      e.contestType ?? null,
      e.passQuestionCount ?? null,
      e.isPublished ?? false,
      e.randomizeQuestions ?? false,
      e.randomizeAnswers ?? false,
    ]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

app.delete('/api/exams/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// ─── QUESTIONS ────────────────────────────────────────────────────────────────

app.get('/api/questions', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT
        id, exam_id AS "examId", bank_id AS "bankId",
        content, options,
        correct_option_index AS "correctOptionIndex",
        points
      FROM questions ORDER BY exam_id, id
    `);
    res.json(rows);
  } catch (err) { sendError(res, err); }
});

app.put('/api/questions/:id', async (req: Request, res: Response) => {
  try {
    const q = req.body;
    // Handle empty string examId -> convert to null for database
    const examIdValue = q.examId && q.examId.trim() !== '' ? q.examId : null;
    await pool.query(`
      INSERT INTO questions (id, exam_id, bank_id, content, options, correct_option_index, points)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id) DO UPDATE SET
        exam_id              = EXCLUDED.exam_id,
        bank_id              = EXCLUDED.bank_id,
        content              = EXCLUDED.content,
        options              = EXCLUDED.options,
        correct_option_index = EXCLUDED.correct_option_index,
        points               = EXCLUDED.points
    `, [q.id, examIdValue, q.bankId ?? null, q.content, q.options, q.correctOptionIndex, q.points ?? 1]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

app.delete('/api/questions/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────

app.get('/api/submissions', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT
        id, exam_id AS "examId", exam_title AS "examTitle",
        student_id AS "studentId", student_name AS "studentName",
        student_major AS "studentMajor",
        score, total_points AS "totalPoints",
        TO_CHAR(submitted_at, 'YYYY-MM-DD HH24:MI:SS') AS "submittedAt",
        duration_used AS "durationUsed",
        answers, question_times AS "questionTimes",
        is_passed AS "isPassed"
      FROM submissions ORDER BY submitted_at DESC
    `);
    res.json(rows);
  } catch (err) { sendError(res, err); }
});

app.put('/api/submissions/:id', async (req: Request, res: Response) => {
  try {
    const s = req.body;
    await pool.query(`
      INSERT INTO submissions (
        id, exam_id, exam_title, student_id, student_name, student_major,
        score, total_points, submitted_at, duration_used,
        answers, question_times, is_passed
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
        COALESCE($9::TIMESTAMP, NOW()),
        $10,$11,$12,$13)
      ON CONFLICT (id) DO UPDATE SET
        score          = EXCLUDED.score,
        total_points   = EXCLUDED.total_points,
        submitted_at   = EXCLUDED.submitted_at,
        duration_used  = EXCLUDED.duration_used,
        answers        = EXCLUDED.answers,
        question_times = EXCLUDED.question_times,
        is_passed      = EXCLUDED.is_passed
    `, [
      s.id, s.examId, s.examTitle,
      s.studentId, s.studentName, s.studentMajor ?? '',
      s.score, s.totalPoints,
      s.submittedAt ?? null,
      s.durationUsed ?? 0,
      JSON.stringify(s.answers ?? {}),
      JSON.stringify(s.questionTimes ?? {}),
      s.isPassed ?? false,
    ]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

app.delete('/api/submissions/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM submissions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// ─── ONLINE USERS ─────────────────────────────────────────────────────────────

app.get('/api/online_users', async (_req: Request, res: Response) => {
  try {
    const rows = await query(`
      SELECT
        username, full_name AS "fullName", major, status,
        active_exam_id    AS "activeExamId",
        active_exam_title AS "activeExamTitle",
        time_left         AS "timeLeft",
        TO_CHAR(last_active, 'YYYY-MM-DD HH24:MI:SS') AS "lastActive"
      FROM online_users ORDER BY last_active DESC
    `);
    res.json(rows);
  } catch (err) { sendError(res, err); }
});

app.put('/api/online_users/:username', async (req: Request, res: Response) => {
  try {
    const u = req.body;
    await pool.query(`
      INSERT INTO online_users (
        username, full_name, major, status,
        active_exam_id, active_exam_title, time_left, last_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::TIMESTAMP, NOW()))
      ON CONFLICT (username) DO UPDATE SET
        full_name         = EXCLUDED.full_name,
        major             = EXCLUDED.major,
        status            = EXCLUDED.status,
        active_exam_id    = EXCLUDED.active_exam_id,
        active_exam_title = EXCLUDED.active_exam_title,
        time_left         = EXCLUDED.time_left,
        last_active       = EXCLUDED.last_active
    `, [
      u.username, u.fullName, u.major ?? '', u.status,
      u.activeExamId ?? null, u.activeExamTitle ?? null,
      u.timeLeft ?? null, u.lastActive ?? null,
    ]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

app.delete('/api/online_users/:username', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM online_users WHERE username = $1', [req.params.username]);
    res.json({ success: true });
  } catch (err) { sendError(res, err); }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'postgresql' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────

app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(200).send('Frontend chưa được build. Chạy: npm run build');
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại port ${PORT}`);
  console.log(
    `🗄️ DATABASE_URL: ${
      process.env.DATABASE_URL ? 'FOUND' : 'NOT FOUND'
    }`
  );
});
