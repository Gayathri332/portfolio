const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const contactRoutes = require('./routes/contact');
const projectRoutes = require('./routes/projects');
const profileRoutes = require('./routes/profile');
const chatRoutes = require('./routes/chat');
const certificateRoutes = require('./routes/certificates');

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000')
  .split(',')
  .map((s) => s.trim());

app.use(
  helmet({
    contentSecurityPolicy: false, // relaxed so Google Fonts + inline widget JS load without extra config
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '20kb' }));

// Static frontend — only actually used for local dev (`npm run dev`/`npm start`).
// On Vercel, requests for anything other than /api/* are served straight from
// the public/ folder as static files by Vercel's edge network and never reach
// this app at all, so this line is dead code there, not a duplicate server.
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/certificates', certificateRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, dbState: mongoose.connection.readyState });
});

// Fallback to index.html for any non-API route (simple multi-page site;
// local dev only — see note above).
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
