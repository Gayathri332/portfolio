const express = require('express');
const rateLimit = require('express-rate-limit');
const Contact = require('../models/Contact');

const router = express.Router();

// Basic spam guard: 5 submissions per 15 minutes per IP.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent from this device. Please try again later.' },
});

function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Missing or invalid admin key.' });
  }
  next();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact — anyone can send a message. Saved to MongoDB.
router.post('/', contactLimiter, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const message = (req.body.message || '').trim();
    // Honeypot field: real users never fill this in, bots often do.
    const website = (req.body.website || '').trim();

    if (website) {
      // Silently pretend success so bots don't learn the honeypot worked.
      return res.status(201).json({ ok: true });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are all required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'That email address doesn\u2019t look right.' });
    }
    if (message.length < 10) {
      return res.status(400).json({ error: 'Message is too short \u2014 add a bit more detail.' });
    }

    const contact = await Contact.create({ name, email, message });
    res.status(201).json({ ok: true, id: contact._id });
  } catch (err) {
    console.error('POST /api/contact failed:', err.message);
    res.status(500).json({ error: 'Could not save your message right now. Please try again shortly.' });
  }
});

// GET /api/contact — list messages. Protected: requires x-admin-key header.
router.get('/', requireAdmin, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }).limit(200);
    res.json(messages);
  } catch (err) {
    console.error('GET /api/contact failed:', err.message);
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

module.exports = router;
