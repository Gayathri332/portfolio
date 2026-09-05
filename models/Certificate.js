const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    issuer: { type: String, trim: true },
    date: { type: String, trim: true }, // free text, e.g. "2024" or "Sep 2024" — keeps seeding simple
    badge: { type: String, trim: true, default: 'Course' }, // e.g. "Course", "Certification", "Workshop", "Patent", "Award"
    image: { type: String, trim: true }, // e.g. "/assets/certificates/aws.jpg" — falls back to a placeholder seal if omitted
    fileUrl: { type: String, trim: true }, // e.g. "/assets/certificates/aws.pdf" — the original certificate file, if you have one
    order: { type: Number, default: 0 }, // lower shows first
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
