const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tech: { type: [String], default: [] },
    tags: { type: [String], default: [] }, // e.g. "AI/LLM", "IoT", "Web"
    githubUrl: { type: String, trim: true },
    liveUrl: { type: String, trim: true },
    image: { type: String, trim: true }, // e.g. "/assets/projects/my-project.png" — falls back to a placeholder if omitted
    images: { type: [String], default: [] }, // multiple photos — if set, the project page shows a left/right carousel
    status: { type: String, enum: ['live', 'in-progress', 'archived'], default: 'live' },
    badge: { type: String, trim: true }, // e.g. "Patented"
    order: { type: Number, default: 0 }, // lower shows first
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
