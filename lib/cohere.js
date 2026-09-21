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

// Streaming variant of chat(). Calls onTextDelta(text) as each chunk of the
// answer arrives, and returns a message object shaped like the non-streaming
// response ({ content, tool_plan, tool_calls }) once the stream ends, so
// callers can reuse the same tool-calling loop either way.
async function chatStream(messages, { tools, onTextDelta } = {}) {
  const body = { model: CHAT_MODEL, messages, stream: true };
  if (tools) body.tools = tools;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const resp = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!resp.ok || !resp.body) {
      const errBody = await resp.text().catch(() => '');
      throw new Error(`Cohere chat stream failed: ${resp.status} ${errBody}`);
    }

    const message = { role: 'assistant', content: '', tool_plan: '', tool_calls: [] };
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of resp.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep trailing partial line for the next chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        let event;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue; // partial/malformed event line, skip it
        }

        if (event.type === 'content-delta') {
          const delta = event.delta?.message?.content?.text || '';
          if (delta) {
            message.content += delta;
            if (onTextDelta) onTextDelta(delta);
          }
        } else if (event.type === 'tool-plan-delta') {
          message.tool_plan += event.delta?.message?.tool_plan || '';
        } else if (event.type === 'tool-call-start') {
          const idx = event.index ?? message.tool_calls.length;
          const call = event.delta?.message?.tool_calls || {};
          message.tool_calls[idx] = {
            id: call.id,
            type: 'function',
            function: {
              name: call.function?.name || '',
              arguments: call.function?.arguments || '',
            },
          };
        } else if (event.type === 'tool-call-delta') {
          const idx = event.index ?? 0;
          const argsDelta = event.delta?.message?.tool_calls?.function?.arguments || '';
          if (message.tool_calls[idx]) message.tool_calls[idx].function.arguments += argsDelta;
        }
      }
    }

    return message;
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

module.exports = { embed, cosineSimilarity, chat, chatStream, chatText };
