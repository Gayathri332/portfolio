const mongoose = require('mongoose');

// Every fact the "Ask about Gayathri" widget can retrieve is stored as one
// of these: a chunk of text, where it came from, and its embedding vector.
// Rebuilt from scratch each time you run `npm run build-kb` — never edited
// by hand.
const knowledgeChunkSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    // e.g. "resume-pdf", "about-page", "certificates", "project:Shopnest",
    // "github:some-repo" — shown nowhere, just useful for debugging.
    source: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
