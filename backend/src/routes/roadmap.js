const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * Generate a day-by-day study roadmap from today until the test date.
 */
function generateRoadmapDays(topics, resources, startDate, endDate) {
  const days = [];
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(1, Math.floor((endDate - startDate) / msPerDay));

  // Last day is always revision
  const studyDays = totalDays - 1;
  const topicsPerDay =
    studyDays > 0 ? Math.ceil(topics.length / studyDays) : topics.length;

  let topicIndex = 0;
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate.getTime() + i * msPerDay);
    const isLastDay = i === totalDays - 1;

    if (isLastDay) {
      days.push({
        day_number: i + 1,
        date: date.toISOString().split('T')[0],
        goal: 'Revision & Mock Practice',
        topics: topics, // All topics for revision
        resources: resources,
        is_revision_day: true,
        is_completed: false,
      });
    } else {
      const dayTopics = topics.slice(topicIndex, topicIndex + topicsPerDay);
      topicIndex += topicsPerDay;
      days.push({
        day_number: i + 1,
        date: date.toISOString().split('T')[0],
        goal: `Study ${dayTopics.join(', ')}`,
        topics: dayTopics,
        resources: resources.slice(0, Math.min(2, resources.length)),
        is_revision_day: false,
        is_completed: false,
      });
    }
  }
  return days;
}

/**
 * Returns true if today is within 2 days of the exam date.
 */
function isWithinTwoDays(testDate) {
  const now = new Date();
  const msUntilExam = new Date(testDate) - now;
  const daysUntilExam = msUntilExam / (24 * 60 * 60 * 1000);
  return daysUntilExam >= 0 && daysUntilExam <= 2;
}

// POST /api/roadmap/tests/:id/generate — Student only
router.post('/tests/:id/generate', requireRole('student'), async (req, res, next) => {
  const { id: testId } = req.params;

  try {
    const testResult = await pool.query(
      'SELECT id, title, date, syllabus_topics, resources FROM tests WHERE id = $1',
      [testId]
    );
    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];
    const testDate = new Date(test.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (testDate <= today) {
      return res.status(400).json({ error: 'Cannot generate a roadmap for a past test' });
    }

    const topics = Array.isArray(test.syllabus_topics) ? test.syllabus_topics : [];
    const resources = Array.isArray(test.resources) ? test.resources : [];

    const days = generateRoadmapDays(topics, resources, today, testDate);
    const twoDayFlag = isWithinTwoDays(testDate);

    const result = await pool.query(
      `INSERT INTO roadmaps (test_id, student_id, days)
       VALUES ($1, $2, $3)
       ON CONFLICT (test_id, student_id)
       DO UPDATE SET days = EXCLUDED.days, generated_at = NOW()
       RETURNING *`,
      [testId, req.user.id, JSON.stringify(days)]
    );

    res.status(201).json({
      roadmap: result.rows[0],
      days,
      two_day_confidence_check: twoDayFlag,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/roadmap/tests/:id/roadmap — Student only
router.get('/tests/:id/roadmap', requireRole('student'), async (req, res, next) => {
  const { id: testId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.*, t.title AS test_title, t.date AS test_date, t.subject
       FROM roadmaps r
       JOIN tests t ON t.id = r.test_id
       WHERE r.test_id = $1 AND r.student_id = $2`,
      [testId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Roadmap not found. Generate one first.' });
    }

    const roadmap = result.rows[0];

    // Merge progress into days
    const progressResult = await pool.query(
      'SELECT * FROM roadmap_progress WHERE roadmap_id = $1 ORDER BY day_number ASC',
      [roadmap.id]
    );

    const progressMap = {};
    for (const p of progressResult.rows) {
      progressMap[p.day_number] = p;
    }

    const days = roadmap.days.map((day) => {
      const progress = progressMap[day.day_number];
      return {
        ...day,
        completed_topics: progress ? progress.completed_topics : [],
        unsure_topics: progress ? progress.unsure_topics : [],
        is_completed:
          progress &&
          day.topics.length > 0 &&
          progress.completed_topics.length >= day.topics.length,
      };
    });

    res.json({
      roadmap: { ...roadmap, days },
      two_day_confidence_check: isWithinTwoDays(roadmap.test_date),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/roadmap/tests/:id/roadmap/progress — Student only
router.put(
  '/tests/:id/roadmap/progress',
  requireRole('student'),
  [
    body('day_number').isInt({ min: 1 }).withMessage('day_number must be a positive integer'),
    body('completed_topics').isArray().withMessage('completed_topics must be an array'),
    body('unsure_topics').optional().isArray().withMessage('unsure_topics must be an array'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { id: testId } = req.params;
    const { day_number, completed_topics, unsure_topics = [] } = req.body;

    try {
      const roadmapResult = await pool.query(
        `SELECT r.*, t.date AS test_date
         FROM roadmaps r
         JOIN tests t ON t.id = r.test_id
         WHERE r.test_id = $1 AND r.student_id = $2`,
        [testId, req.user.id]
      );

      if (roadmapResult.rows.length === 0) {
        return res.status(404).json({ error: 'Roadmap not found. Generate one first.' });
      }

      const roadmap = roadmapResult.rows[0];

      // Upsert progress for the given day
      await pool.query(
        `INSERT INTO roadmap_progress (roadmap_id, day_number, completed_topics, unsure_topics)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (roadmap_id, day_number)
         DO UPDATE SET completed_topics = EXCLUDED.completed_topics,
                       unsure_topics = EXCLUDED.unsure_topics,
                       checked_at = NOW()`,
        [roadmap.id, day_number, JSON.stringify(completed_topics), JSON.stringify(unsure_topics)]
      );

      let updatedDays = roadmap.days;

      // If there are unsure topics and the exam is 2 days away, re-adjust remaining days
      if (unsure_topics.length > 0 && isWithinTwoDays(roadmap.test_date)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const testDate = new Date(roadmap.test_date);

        // Insert unsure topics into the days before the revision day
        const remainingDays = updatedDays.filter(
          (d) => d.day_number > day_number && !d.is_revision_day
        );
        const revisionDay = updatedDays.find((d) => d.is_revision_day);

        if (remainingDays.length > 0) {
          // Spread unsure topics into remaining non-revision days
          const topicsPerDay = Math.ceil(unsure_topics.length / remainingDays.length);
          let unsureIndex = 0;

          updatedDays = updatedDays.map((d) => {
            if (d.day_number > day_number && !d.is_revision_day) {
              const extra = unsure_topics.slice(unsureIndex, unsureIndex + topicsPerDay);
              unsureIndex += topicsPerDay;
              return {
                ...d,
                topics: [...d.topics, ...extra],
                goal: `Study ${[...d.topics, ...extra].join(', ')}`,
              };
            }
            return d;
          });
        } else if (revisionDay) {
          // No remaining days — flag them in the revision day
          updatedDays = updatedDays.map((d) =>
            d.is_revision_day
              ? {
                  ...d,
                  goal: 'Revision, Mock Practice & Unsure Topics Review',
                  unsure_review_topics: unsure_topics,
                }
              : d
          );
        }

        await pool.query('UPDATE roadmaps SET days = $1 WHERE id = $2', [
          JSON.stringify(updatedDays),
          roadmap.id,
        ]);
      }

      res.json({
        message: 'Progress updated',
        two_day_confidence_check: isWithinTwoDays(roadmap.test_date),
        days: updatedDays,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/roadmap/tests/:id/roadmap/status — Check if 2-day confidence prompt should show
router.get('/tests/:id/roadmap/status', requireRole('student'), async (req, res, next) => {
  const { id: testId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.id, t.date AS test_date, t.title AS test_title
       FROM roadmaps r
       JOIN tests t ON t.id = r.test_id
       WHERE r.test_id = $1 AND r.student_id = $2`,
      [testId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    const { test_date, test_title } = result.rows[0];
    const now = new Date();
    const msUntilExam = new Date(test_date) - now;
    const daysUntilExam = msUntilExam / (24 * 60 * 60 * 1000);

    res.json({
      test_title,
      test_date,
      days_until_exam: Math.max(0, Math.floor(daysUntilExam)),
      show_confidence_check: isWithinTwoDays(test_date),
      exam_passed: daysUntilExam < 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
