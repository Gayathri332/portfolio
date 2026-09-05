// Small wrapper around the Cohere API so both scripts/buildKnowledgeBase.js
// and routes/chat.js talk to it the same way.

const EMBED_MODEL = process.env.COHERE_EMBED_MODEL || 'embed-english-v3.0';
const CHAT_MODEL = process.env.COHERE_MODEL || 'command-a-03-2025';

function apiKey() {
  const key = process.env.COHERE_API_KEY;
  if (!key) throw new Error('COHERE_API_KEY is not set');
  return key;
}

// inputType is 'search_document' when embedding things to store, and
// 'search_query' when embedding an incoming question — Cohere's embed
// models are trained to treat the two differently, and mixing them up
// quietly hurts retrieval quality.
async function embed(texts, inputType = 'search_document') {
  const resp = await fetch('https://api.cohere.com/v2/embed', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      texts,
      input_type: inputType,
      embedding_types: ['float'],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Cohere embed failed: ${resp.status} ${body}`);
  }
  const data = await resp.json();
  return data.embeddings.float; // one float[] per input text, same order
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// One "chat" call to Cohere's v2 endpoint. `tools`/`toolResultsMessages` are
// optional — pass them to do function calling. Returns the raw response
// message so the caller can inspect tool_calls vs. plain text.
async function chat(messages, { tools } = {}) {
  const body = { model: CHAT_MODEL, messages };
  if (tools) body.tools = tools;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '');
      throw new Error(`Cohere chat failed: ${resp.status} ${errBody}`);
    }
    const data = await resp.json();
    return data.message; // { role, content, tool_plan?, tool_calls? }
  } finally {
    clearTimeout(timeout);
  }
}

function chatText(message) {
  const content = message?.content;
  if (Array.isArray(content)) {
    return content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
      .trim();
  }
  if (typeof content === 'string') return content.trim();
  return '';
}

module.exports = { embed, cosineSimilarity, chat, chatText };
