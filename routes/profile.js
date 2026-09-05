const express = require('express');
const Profile = require('../models/Profile');

const router = express.Router();

function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Missing or invalid admin key.' });
  }
  next();
}

// GET /api/profile — admin only (this is your resume/context data, not meant to be public raw).
router.get('/', requireAdmin, async (req, res) => {
  try {
    const profile = await Profile.findOne();
    res.json(profile || {});
  } catch (err) {
    console.error('GET /api/profile failed:', err.message);
    res.status(500).json({ error: 'Could not load profile.' });
  }
});

// PUT /api/profile — replace your context/facts later, e.g. after updating your resume.
// Example:
// curl -X PUT http://localhost:5000/api/profile \
//   -H "Content-Type: application/json" \
//   -H "x-admin-key: YOUR_ADMIN_KEY" \
//   -d '{"context": "full updated resume text...", "facts": [...]}'
router.put('/', requireAdmin, async (req, res) => {
  try {
    const { context, facts } = req.body;
    if (!context) return res.status(400).json({ error: 'context is required.' });
    const profile = await Profile.findOneAndUpdate(
      {},
      { context, facts: facts || [] },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(profile);
  } catch (err) {
    console.error('PUT /api/profile failed:', err.message);
    res.status(500).json({ error: 'Could not update profile.' });
  }
});

module.exports = router;
