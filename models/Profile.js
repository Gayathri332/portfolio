const mongoose = require('mongoose');

// A single document holds everything the "Ask about Gayathri" assistant
// can draw on: free-form context (used as LLM grounding) plus a list of
// keyword -> answer facts (used as a no-API-key fallback).
const factSchema = new mongoose.Schema(
  {
    keywords: { type: [String], required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    // Paste your full resume / about-me text here. This is sent to the LLM
    // as grounding context when COHERE_API_KEY is set.
    context: { type: String, required: true },
    // Fallback Q&A used when no LLM key is configured, or if the LLM call fails.
    facts: { type: [factSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
