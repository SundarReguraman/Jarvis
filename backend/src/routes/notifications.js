const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/notifications — Get all notifications for current user
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ unread_count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all — Mark all as read
router.put('/read-all', async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read — Mark single notification as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
