// Vercel entry point. All requests to /api/* are rewritten here (see
// vercel.json) and handled by the same Express app used locally by
// server.js — just without app.listen(), since Vercel handles the
// HTTP server itself.
require('dotenv').config();
const app = require('../app');
const connectDB = require('../lib/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Database connection failed.' }));
    return;
  }
  app(req, res);
};
