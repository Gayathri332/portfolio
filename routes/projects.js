const express = require('express');
const Project = require('../models/Project');

const router = express.Router();

function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Missing or invalid admin key.' });
  }
  next();
}

// GET /api/projects — public, powers the Projects section on the site.
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('GET /api/projects failed:', err.message);
    res.status(500).json({ error: 'Could not load projects.' });
  }
});

// POST /api/projects — add a new project later without redeploying the site.
// Example:
// curl -X POST http://localhost:5000/api/projects \
//   -H "Content-Type: application/json" \
//   -H "x-admin-key: YOUR_ADMIN_KEY" \
//   -d '{"title":"New Project","description":"...","tech":["Python"],"tags":["AI/LLM"]}'
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required.' });
    }
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    console.error('POST /api/projects failed:', err.message);
    res.status(500).json({ error: 'Could not create project.' });
  }
});

// PUT /api/projects/:id — update fields on an existing project (e.g. adding an image).
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    res.json(project);
  } catch (err) {
    console.error('PUT /api/projects failed:', err.message);
    res.status(500).json({ error: 'Could not update project.' });
  }
});

// DELETE /api/projects/:id — remove a project.
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/projects failed:', err.message);
    res.status(500).json({ error: 'Could not delete project.' });
  }
});

module.exports = router;
