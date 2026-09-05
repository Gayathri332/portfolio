const express = require('express');
const rateLimit = require('express-rate-limit');
const Profile = require('../models/Profile');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { embed, cosineSimilarity, chat, chatText } = require('../lib/cohere');
const { listRepos, getReadme } = require('../lib/github');

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many questions in a short time. Try again in a few minutes.' },
});

const FALLBACK_ANSWER =
  "I don't have a good answer for that yet from what's stored about Gayathri. " +
  "Try asking about her experience, skills, projects, education, or how to reach her \u2014 " +
  "or use the contact form below and she'll answer directly.";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'Gayathri332';
const TOP_K = 6;

// ---------------------------------------------------------------------------
// Knowledge base retrieval (semantic search over pre-embedded chunks built
// by `npm run build-kb` from the resume PDF, about.html, certificates,
// projects, and GitHub READMEs).
// ---------------------------------------------------------------------------

// The chunk set only changes when someone re-runs build-kb, so it's cheap
// to cache in memory and refresh occasionally rather than hit Mongo on
// every question.
let chunkCache = { chunks: null, loadedAt: 0 };
const CHUNK_CACHE_TTL_MS = 10 * 60 * 1000;

async function getChunks() {
  const now = Date.now();
  if (chunkCache.chunks && now - chunkCache.loadedAt < CHUNK_CACHE_TTL_MS) {
    return chunkCache.chunks;
  }
  const docs = await KnowledgeChunk.find({}, { text: 1, source: 1, embedding: 1 }).lean();
  chunkCache = { chunks: docs, loadedAt: now };
  return docs;
}

async function retrieveContext(question) {
  const chunks = await getChunks();
  if (!chunks.length) return null; // knowledge base hasn't been built yet

  const [queryVector] = await embed([question], 'search_query');
  const scored = chunks
    .map((c) => ({ ...c, score: cosineSimilarity(queryVector, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    // Drop anything too dissimilar to be useful rather than padding the
    // prompt with noise the model would have to explicitly ignore.
    .filter((c) => c.score > 0.2);

  if (!scored.length) return null;
  return scored.map((c) => `[${c.source}]\n${c.text}`).join('\n\n---\n\n');
}

// ---------------------------------------------------------------------------
// Live GitHub tool — lets the model pull a specific repo's description and
// README at answer time, for implementation-level project questions that
// aren't captured in the resume or in the last knowledge-base rebuild.
// ---------------------------------------------------------------------------

const githubToolCache = new Map(); // repoQuery(lowercased) -> { text, cachedAt }
const GITHUB_TOOL_CACHE_TTL_MS = 60 * 60 * 1000;

const githubTool = {
  type: 'function',
  function: {
    name: 'get_github_repo_details',
    description:
      `Look up a specific public GitHub repository belonging to ${GITHUB_USERNAME} and return its ` +
      'description and README content. Use this when asked for implementation details of a project ' +
      "that aren't already covered in the provided context \u2014 e.g. how something was built, what " +
      'algorithm or library it uses, or what a specific file/module does.',
    parameters: {
      type: 'object',
      properties: {
        repo_query: {
          type: 'string',
          description:
            'The project name or a close guess at the repo name, e.g. "Shopnest" or "llm-file-assistant".',
        },
      },
      required: ['repo_query'],
    },
  },
};

async function runGithubTool(repoQuery) {
  const key = repoQuery.trim().toLowerCase();
  const cached = githubToolCache.get(key);
  if (cached && Date.now() - cached.cachedAt < GITHUB_TOOL_CACHE_TTL_MS) return cached.text;

  let repos;
  try {
    repos = await listRepos(GITHUB_USERNAME);
  } catch (err) {
    return `Could not reach GitHub right now (${err.message}).`;
  }

  // Loose match: exact name match wins, otherwise best substring match
  // against name or description.
  const normalized = key.replace(/[^a-z0-9]/g, '');
  let match =
    repos.find((r) => r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) ||
    repos.find(
      (r) =>
        r.name.toLowerCase().includes(key) ||
        key.includes(r.name.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(key)
    );

  if (!match) {
    const text = `No GitHub repo matching "${repoQuery}" was found among ${GITHUB_USERNAME}'s public repos.`;
    githubToolCache.set(key, { text, cachedAt: Date.now() });
    return text;
  }

  let readme = '';
  try {
    readme = await getReadme(GITHUB_USERNAME, match.name);
  } catch {
    // fine, just proceed without it
  }

  const text = [
    `Repository: ${match.name} (${match.htmlUrl})`,
    match.description ? `Description: ${match.description}` : '',
    match.language ? `Primary language: ${match.language}` : '',
    readme ? `README:\n${readme.slice(0, 6000)}` : 'This repo has no README.',
  ]
    .filter(Boolean)
    .join('\n');

  githubToolCache.set(key, { text, cachedAt: Date.now() });
  return text;
}

// ---------------------------------------------------------------------------
// Main LLM answer path: retrieved context + tool access to GitHub.
// ---------------------------------------------------------------------------

async function answerWithRag(question) {
  const context = await retrieveContext(question);

  const systemPrompt =
    'You are a friendly assistant answering visitor questions on Gayathri Shettigar\u2019s personal ' +
    'portfolio site, on her behalf. Speak about her in the third person and keep answers short ' +
    '(2-4 sentences) unless the question needs more detail. Answer using the CONTEXT below. If a ' +
    "question is about a specific project's implementation details and the context doesn't fully " +
    'cover it, call get_github_repo_details to look it up before answering. If the answer still ' +
    "isn't available after that, say you don't have that detail and suggest the contact form " +
    'instead of guessing \u2014 never invent facts about her.\n\n--- CONTEXT ---\n' +
    (context || '(no matching stored context for this question)');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ];

  // Up to two rounds: one to let the model call the tool, one to get its
  // final answer after seeing the tool result. Bail out to null on any
  // failure so the route can fall back cleanly.
  for (let round = 0; round < 2; round++) {
    const message = await chat(messages, { tools: [githubTool] });
    if (!message) return null;

    if (Array.isArray(message.tool_calls) && message.tool_calls.length) {
      messages.push({
        role: 'assistant',
        tool_plan: message.tool_plan,
        tool_calls: message.tool_calls,
      });
      for (const call of message.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(call.function?.arguments || '{}');
        } catch {
          // leave args empty; runGithubTool handles a blank query gracefully
        }
        const result = await runGithubTool(args.repo_query || question);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result,
        });
      }
      continue; // go around again so the model can use the tool result
    }

    const text = chatText(message);
    if (text) return text;
    break;
  }
  return null;
}

// Simple keyword-overlap search over `facts`. Last-resort fallback if
// there's no Cohere key or the API call fails outright.
function answerFromFacts(question, facts) {
  const q = question.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const fact of facts) {
    let score = 0;
    for (const kw of fact.keywords) {
      if (q.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = fact;
    }
  }
  return bestScore > 0 ? best.answer : FALLBACK_ANSWER;
}

// POST /api/chat — { question: string }
router.post('/', chatLimiter, async (req, res) => {
  try {
    const question = (req.body.question || '').trim();
    if (!question) return res.status(400).json({ error: 'Ask a question first.' });
    if (question.length > 500) {
      return res.status(400).json({ error: 'Keep the question under 500 characters.' });
    }

    const profile = await Profile.findOne();
    if (!profile) {
      return res.json({
        answer:
          "Gayathri hasn't loaded her profile data yet \u2014 run `npm run seed` to set it up.",
        source: 'none',
      });
    }

    if (process.env.COHERE_API_KEY) {
      try {
        const ragAnswer = await answerWithRag(question);
        if (ragAnswer) return res.json({ answer: ragAnswer, source: 'rag' });
      } catch (err) {
        console.error('RAG answer failed, falling back:', err.message);
      }
    }

    const fallback = answerFromFacts(question, profile.facts || []);
    res.json({ answer: fallback, source: 'facts' });
  } catch (err) {
    console.error('POST /api/chat failed:', err.message);
    res.status(500).json({ error: 'Something went wrong answering that. Try again.' });
  }
});

module.exports = router;
