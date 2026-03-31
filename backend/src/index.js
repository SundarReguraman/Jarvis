require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const notificationRoutes = require('./routes/notifications');
const testRoutes = require('./routes/tests');
const roadmapRoutes = require('./routes/roadmap');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/roadmap', roadmapRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    console.warn('Starting server without verified DB connection...');
  }

  app.listen(PORT, () => {
    console.log(`CampusTrack API running on port ${PORT}`);
  });
}

start();
