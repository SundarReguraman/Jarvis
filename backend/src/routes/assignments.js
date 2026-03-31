const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All assignment routes require authentication
router.use(authenticate);

async function createNotificationsForAllStudents(pool, type, title, message, relatedId) {
  const students = await pool.query(
    "SELECT id FROM users WHERE role = 'student'"
  );
  if (students.rows.length === 0) return;

  const values = students.rows.map((s) => [s.id, type, title, message, relatedId]);
  for (const v of values) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      v
    );
  }
}

// POST /api/assignments — Teacher only
router.post(
  '/',
  requireRole('teacher'),
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('type')
      .isIn(['assignment', 'project', 'lab_record', 'quiz', 'test', 'practical'])
      .withMessage('Invalid type'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('deadline').isISO8601().withMessage('Valid deadline date is required'),
    body('marks').isInt({ min: 0 }).withMessage('Marks must be a non-negative integer'),
    body('submission_format')
      .optional()
      .isIn(['soft_copy_pdf', 'hard_copy_spiral', 'hard_copy_hard_binding', 'in_class'])
      .withMessage('Invalid submission format'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      subject,
      type,
      title,
      instructions,
      deadline,
      marks,
      submission_format,
      is_group,
      group_size,
      topic_allocation,
    } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO assignments
           (teacher_id, subject, type, title, instructions, deadline, marks,
            submission_format, is_group, group_size, topic_allocation)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          req.user.id,
          subject,
          type,
          title,
          instructions || null,
          deadline,
          marks,
          submission_format || null,
          is_group || false,
          group_size || null,
          topic_allocation || null,
        ]
      );

      const assignment = result.rows[0];

      await createNotificationsForAllStudents(
        pool,
        'new_assignment',
        `New ${type}: ${title}`,
        `${req.user.name} posted a new ${type} for ${subject}. Deadline: ${new Date(deadline).toLocaleDateString()}`,
        assignment.id
      );

      res.status(201).json({ assignment });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/assignments — All authenticated users
router.get('/', async (req, res, next) => {
  try {
    let query;
    let params;

    if (req.user.role === 'teacher') {
      query = `
        SELECT a.*,
               u.name AS teacher_name,
               CASE
                 WHEN EXTRACT(EPOCH FROM (a.deadline - NOW())) <= 0 THEN 9999
                 ELSE a.marks / GREATEST(EXTRACT(EPOCH FROM (a.deadline - NOW())) / 86400, 0.01)
               END AS priority_score
        FROM assignments a
        JOIN users u ON u.id = a.teacher_id
        WHERE a.teacher_id = $1
        ORDER BY priority_score DESC, a.deadline ASC
      `;
      params = [req.user.id];
    } else {
      query = `
        SELECT a.*,
               u.name AS teacher_name,
               CASE
                 WHEN EXTRACT(EPOCH FROM (a.deadline - NOW())) <= 0 THEN 9999
                 ELSE a.marks / GREATEST(EXTRACT(EPOCH FROM (a.deadline - NOW())) / 86400, 0.01)
               END AS priority_score,
               s.id IS NOT NULL AS is_submitted,
               s.submitted_at
        FROM assignments a
        JOIN users u ON u.id = a.teacher_id
        LEFT JOIN submissions s
          ON s.assignment_id = a.id AND s.student_id = $1
        ORDER BY priority_score DESC, a.deadline ASC
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json({ assignments: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/assignments/:id — Single assignment with submission status
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.*,
              u.name AS teacher_name,
              CASE
                WHEN EXTRACT(EPOCH FROM (a.deadline - NOW())) <= 0 THEN 9999
                ELSE a.marks / GREATEST(EXTRACT(EPOCH FROM (a.deadline - NOW())) / 86400, 0.01)
              END AS priority_score
       FROM assignments a
       JOIN users u ON u.id = a.teacher_id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = result.rows[0];

    if (req.user.role === 'student') {
      const sub = await pool.query(
        'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
        [id, req.user.id]
      );
      assignment.submission = sub.rows[0] || null;
    }

    res.json({ assignment });
  } catch (err) {
    next(err);
  }
});

// PUT /api/assignments/:id — Teacher only
router.put(
  '/:id',
  requireRole('teacher'),
  [
    body('deadline').optional().isISO8601().withMessage('Valid deadline date is required'),
    body('marks').optional().isInt({ min: 0 }).withMessage('Marks must be a non-negative integer'),
    body('submission_format')
      .optional()
      .isIn(['soft_copy_pdf', 'hard_copy_spiral', 'hard_copy_hard_binding', 'in_class'])
      .withMessage('Invalid submission format'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { id } = req.params;

    try {
      const existing = await pool.query(
        'SELECT id FROM assignments WHERE id = $1 AND teacher_id = $2',
        [id, req.user.id]
      );
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Assignment not found or not yours' });
      }

      const {
        subject,
        type,
        title,
        instructions,
        deadline,
        marks,
        submission_format,
        is_group,
        group_size,
        topic_allocation,
      } = req.body;

      const result = await pool.query(
        `UPDATE assignments SET
           subject = COALESCE($1, subject),
           type = COALESCE($2, type),
           title = COALESCE($3, title),
           instructions = COALESCE($4, instructions),
           deadline = COALESCE($5, deadline),
           marks = COALESCE($6, marks),
           submission_format = COALESCE($7, submission_format),
           is_group = COALESCE($8, is_group),
           group_size = COALESCE($9, group_size),
           topic_allocation = COALESCE($10, topic_allocation)
         WHERE id = $11
         RETURNING *`,
        [
          subject,
          type,
          title,
          instructions,
          deadline,
          marks,
          submission_format,
          is_group,
          group_size,
          topic_allocation,
          id,
        ]
      );

      res.json({ assignment: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/assignments/:id — Teacher only
router.delete('/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM assignments WHERE id = $1 AND teacher_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or not yours' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
