const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// POST /api/submissions/assignments/:id/submit — Student only
router.post(
  '/assignments/:id/submit',
  requireRole('student'),
  [
    body('submission_url').optional().isURL().withMessage('submission_url must be a valid URL'),
    body('notes').optional().isString(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { id: assignmentId } = req.params;
    const { submission_url, notes } = req.body;

    try {
      const assignment = await pool.query(
        'SELECT id, title, subject, teacher_id FROM assignments WHERE id = $1',
        [assignmentId]
      );
      if (assignment.rows.length === 0) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      const result = await pool.query(
        `INSERT INTO submissions (assignment_id, student_id, submission_url, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (assignment_id, student_id)
         DO UPDATE SET submission_url = EXCLUDED.submission_url,
                       notes = EXCLUDED.notes,
                       submitted_at = NOW()
         RETURNING *`,
        [assignmentId, req.user.id, submission_url || null, notes || null]
      );

      const submission = result.rows[0];
      const { title, subject, teacher_id } = assignment.rows[0];

      // Notify the teacher
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          teacher_id,
          'submission_received',
          `Submission received: ${title}`,
          `${req.user.name} submitted "${title}" (${subject})`,
          assignmentId,
        ]
      );

      res.status(201).json({ submission });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/submissions/assignments/:id/submissions — Teacher only
router.get(
  '/assignments/:id/submissions',
  requireRole('teacher'),
  async (req, res, next) => {
    const { id: assignmentId } = req.params;

    try {
      const assignment = await pool.query(
        'SELECT id, title, teacher_id FROM assignments WHERE id = $1 AND teacher_id = $2',
        [assignmentId, req.user.id]
      );
      if (assignment.rows.length === 0) {
        return res.status(404).json({ error: 'Assignment not found or not yours' });
      }

      const submissions = await pool.query(
        `SELECT s.*, u.name AS student_name, u.email AS student_email, u.student_id AS student_number
         FROM submissions s
         JOIN users u ON u.id = s.student_id
         WHERE s.assignment_id = $1
         ORDER BY s.submitted_at DESC`,
        [assignmentId]
      );

      const allStudents = await pool.query(
        "SELECT id, name, email, student_id AS student_number FROM users WHERE role = 'student'"
      );

      const submittedIds = new Set(submissions.rows.map((s) => s.student_id));
      const pendingStudents = allStudents.rows.filter((s) => !submittedIds.has(s.id));

      const totalStudents = allStudents.rows.length;
      const submittedCount = submissions.rows.length;
      const percentage =
        totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

      res.json({
        submissions: submissions.rows,
        progress: {
          submitted_count: submittedCount,
          total_students: totalStudents,
          percentage,
          pending_students: pendingStudents,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/submissions/assignments/:id/remind — Teacher only
router.post(
  '/assignments/:id/remind',
  requireRole('teacher'),
  async (req, res, next) => {
    const { id: assignmentId } = req.params;

    try {
      const assignment = await pool.query(
        'SELECT id, title, subject, deadline, teacher_id FROM assignments WHERE id = $1 AND teacher_id = $2',
        [assignmentId, req.user.id]
      );
      if (assignment.rows.length === 0) {
        return res.status(404).json({ error: 'Assignment not found or not yours' });
      }

      const { title, subject, deadline } = assignment.rows[0];

      const submissions = await pool.query(
        'SELECT student_id FROM submissions WHERE assignment_id = $1',
        [assignmentId]
      );
      const submittedIds = submissions.rows.map((s) => s.student_id);

      let pendingStudents;
      if (submittedIds.length > 0) {
        pendingStudents = await pool.query(
          `SELECT id FROM users WHERE role = 'student' AND id != ALL($1::uuid[])`,
          [submittedIds]
        );
      } else {
        pendingStudents = await pool.query(
          "SELECT id FROM users WHERE role = 'student'"
        );
      }

      if (pendingStudents.rows.length === 0) {
        return res.json({ message: 'All students have already submitted', reminded_count: 0 });
      }

      const notifTitle = `Reminder: ${title} due soon`;
      const notifMessage = `Don't forget to submit "${title}" (${subject}). Deadline: ${new Date(deadline).toLocaleDateString()}`;

      const placeholders = pendingStudents.rows
        .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`)
        .join(', ');
      const notifValues = pendingStudents.rows.flatMap((s) => [
        s.id,
        'submission_reminder',
        notifTitle,
        notifMessage,
        assignmentId,
      ]);

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id) VALUES ${placeholders}`,
        notifValues
      );

      res.json({
        message: 'Reminders sent successfully',
        reminded_count: pendingStudents.rows.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
