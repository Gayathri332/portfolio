const express = require('express');
const Certificate = require('../models/Certificate');

const router = express.Router();

function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Missing or invalid admin key.' });
  }
  next();
}

// GET /api/certificates — public, powers the Certifications section + certificates.html.
router.get('/', async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ order: 1, createdAt: -1 });
    res.json(certificates);
  } catch (err) {
    console.error('GET /api/certificates failed:', err.message);
    res.status(500).json({ error: 'Could not load certificates.' });
  }
});

// POST /api/certificates — add a new certificate later without redeploying.
// Example:
// curl -X POST http://localhost:5000/api/certificates \
//   -H "Content-Type: application/json" \
//   -H "x-admin-key: YOUR_ADMIN_KEY" \
//   -d '{"title":"New Certificate","issuer":"Coursera","badge":"Course"}'
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required.' });
    const certificate = await Certificate.create(req.body);
    res.status(201).json(certificate);
  } catch (err) {
    console.error('POST /api/certificates failed:', err.message);
    res.status(500).json({ error: 'Could not create certificate.' });
  }
});

// PUT /api/certificates/:id — update fields (e.g. adding a real image/fileUrl).
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!certificate) return res.status(404).json({ error: 'Certificate not found.' });
    res.json(certificate);
  } catch (err) {
    console.error('PUT /api/certificates failed:', err.message);
    res.status(500).json({ error: 'Could not update certificate.' });
  }
});

// DELETE /api/certificates/:id — remove a certificate.
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/certificates failed:', err.message);
    res.status(500).json({ error: 'Could not delete certificate.' });
  }
});

module.exports = router;
