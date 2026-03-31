const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

async function notifyAllStudents(pool, type, title, message, relatedId) {
  const students = await pool.query("SELECT id FROM users WHERE role = 'student'");
  for (const student of students.rows) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [student.id, type, title, message, relatedId]
    );
  }
}

// POST /api/tests — Teacher only
router.post(
  '/',
  requireRole('teacher'),
  [
    body('type')
      .isIn(['test', 'model_exam', 'lab_practical'])
      .withMessage('Type must be test, model_exam, or lab_practical'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('syllabus_topics').optional().isArray().withMessage('syllabus_topics must be an array'),
    body('resources').optional().isArray().withMessage('resources must be an array'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { type, title, subject, date, syllabus_topics = [], resources = [] } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO tests (teacher_id, type, title, subject, date, syllabus_topics, resources)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.user.id,
          type,
          title,
          subject,
          date,
          JSON.stringify(syllabus_topics),
          JSON.stringify(resources),
        ]
      );

      const test = result.rows[0];

      await notifyAllStudents(
        pool,
        'new_test',
        `Upcoming ${type.replace('_', ' ')}: ${title}`,
        `${req.user.name} scheduled a ${type.replace('_', ' ')} for ${subject} on ${new Date(date).toLocaleDateString()}`,
        test.id
      );

      res.status(201).json({ test });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/tests — All authenticated users, sorted by date
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS teacher_name
       FROM tests t
       JOIN users u ON u.id = t.teacher_id
       ORDER BY t.date ASC`
    );
    res.json({ tests: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/tests/:id — Single test with full details
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name AS teacher_name
       FROM tests t
       JOIN users u ON u.id = t.teacher_id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({ test: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tests/:id — Teacher only
router.put(
  '/:id',
  requireRole('teacher'),
  [
    body('type')
      .optional()
      .isIn(['test', 'model_exam', 'lab_practical'])
      .withMessage('Invalid type'),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('syllabus_topics').optional().isArray().withMessage('syllabus_topics must be an array'),
    body('resources').optional().isArray().withMessage('resources must be an array'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { id } = req.params;

    try {
      const existing = await pool.query(
        'SELECT id FROM tests WHERE id = $1 AND teacher_id = $2',
        [id, req.user.id]
      );
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Test not found or not yours' });
      }

      const { type, title, subject, date, syllabus_topics, resources } = req.body;

      const result = await pool.query(
        `UPDATE tests SET
           type = COALESCE($1, type),
           title = COALESCE($2, title),
           subject = COALESCE($3, subject),
           date = COALESCE($4, date),
           syllabus_topics = COALESCE($5, syllabus_topics),
           resources = COALESCE($6, resources)
         WHERE id = $7
         RETURNING *`,
        [
          type,
          title,
          subject,
          date,
          syllabus_topics ? JSON.stringify(syllabus_topics) : null,
          resources ? JSON.stringify(resources) : null,
          id,
        ]
      );

      res.json({ test: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/tests/:id — Teacher only
router.delete('/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM tests WHERE id = $1 AND teacher_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or not yours' });
    }

    res.json({ message: 'Test deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
