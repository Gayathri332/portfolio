

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');

const Project = require('../models/Project');
const Certificate = require('../models/Certificate');
const Profile = require('../models/Profile');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { embed } = require('../lib/cohere');
const { listRepos, getReadme } = require('../lib/github');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'Gayathri332';
const MAX_CHUNK_CHARS = 900;
const EMBED_BATCH_SIZE = 90; // Cohere's embed endpoint caps at 96 texts/call

// Greedily packs paragraphs into chunks up to MAX_CHUNK_CHARS, without
// splitting a paragraph unless it's longer than the limit on its own.
function chunkText(text, source) {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];
  let current = '';
  for (const p of paras) {
    const candidate = current ? `${current}\n\n${p}` : p;
    if (candidate.length > MAX_CHUNK_CHARS && current) {
      chunks.push(current);
      current = p;
    } else {
      current = candidate;
    }
    // A single paragraph longer than the limit (e.g. a dense README
    // section) gets hard-split so nothing is silently dropped.
    while (current.length > MAX_CHUNK_CHARS) {
      chunks.push(current.slice(0, MAX_CHUNK_CHARS));
      current = current.slice(MAX_CHUNK_CHARS);
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.map((text) => ({ text, source }));
}

// Pulls the actual visible text out of about.html — the bio, "what I'm
// doing now", and every "off the clock" card (cooking, travel, reading,
// etc.) — so anything you write there automatically reaches the widget.
function gatherAboutPageText() {
  const filePath = path.join(__dirname, '..', 'public', 'about.html');
  if (!fs.existsSync(filePath)) return '';
  const $ = cheerio.load(fs.readFileSync(filePath, 'utf8'));
  const sections = [];

  $('.about-block').each((_, el) => {
    const heading = $(el).find('h2').first().text().trim();
    const lines = [];
    $(el)
      .find('> p')
      .each((_, p) => lines.push($(p).text().trim()));
    $(el)
      .find('.personal-card')
      .each((_, card) => {
        const title = $(card).find('h3').text().trim();
        const desc = $(card).find('p').text().trim();
        if (title) lines.push(`${title}: ${desc}`);
      });
    if (heading || lines.length) sections.push(`${heading}\n${lines.join('\n')}`.trim());
  });

  const tagline = $('.about-hero__tagline').text().trim().replace(/\s+/g, ' ');
  return [tagline, ...sections].filter(Boolean).join('\n\n');
}

async function gatherResumeText() {
  const filePath = path.join(__dirname, '..', 'public', 'assets', 'Gayathri_Resume_2026S.pdf');
  if (!fs.existsSync(filePath)) {
    console.warn('  no resume PDF found at public/assets/Gayathri_Resume_2026S.pdf — skipping');
    return '';
  }
  const data = await pdfParse(fs.readFileSync(filePath));
  return data.text;
}

async function gatherGithubChunks() {
  let repos = [];
  try {
    repos = await listRepos(GITHUB_USERNAME);
  } catch (err) {
    console.warn(`  could not list GitHub repos for ${GITHUB_USERNAME}: ${err.message}`);
    return [];
  }

  const chunks = [];
  for (const repo of repos) {
    const parts = [`GitHub repository: ${repo.name} (${repo.htmlUrl})`];
    if (repo.description) parts.push(`Description: ${repo.description}`);
    if (repo.language) parts.push(`Primary language: ${repo.language}`);
    if (repo.topics.length) parts.push(`Topics: ${repo.topics.join(', ')}`);

    let readme = '';
    try {
      readme = await getReadme(GITHUB_USERNAME, repo.name);
    } catch {
      // No README, or the call failed — fine, just skip it.
    }
    if (readme) parts.push(`README:\n${readme.slice(0, 6000)}`);

    chunks.push(...chunkText(parts.join('\n'), `github:${repo.name}`));
  }
  return chunks;
}

async function embedAll(chunks) {
  const embedded = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const vectors = await embed(
      batch.map((c) => c.text),
      'search_document'
    );
    batch.forEach((c, j) => embedded.push({ ...c, embedding: vectors[j] }));
    console.log(`  embedded ${Math.min(i + EMBED_BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
  }
  return embedded;
}

async function run() {
  if (!process.env.COHERE_API_KEY) {
    console.error('COHERE_API_KEY is not set in .env — the knowledge base needs it to embed text.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB. Gathering content...');

  const allChunks = [];

  const profile = await Profile.findOne();
  if (profile?.context) {
    allChunks.push(...chunkText(profile.context, 'resume-summary'));
    console.log('  added hand-written profile summary');
  }

  console.log('  reading resume PDF...');
  const resumeText = await gatherResumeText();
  if (resumeText) allChunks.push(...chunkText(resumeText, 'resume-pdf'));

  console.log('  reading about.html...');
  const aboutText = gatherAboutPageText();
  if (aboutText) allChunks.push(...chunkText(aboutText, 'about-page'));

  console.log('  loading projects from the database...');
  const projects = await Project.find();
  for (const p of projects) {
    const text = [
      `Project: ${p.title}`,
      p.description,
      p.tech?.length ? `Tech used: ${p.tech.join(', ')}` : '',
      `Status: ${p.status}`,
      p.badge ? `Badge: ${p.badge}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    allChunks.push(...chunkText(text, `project:${p.title}`));
  }

  console.log('  loading certificates from the database...');
  const certs = await Certificate.find();
  if (certs.length) {
    const text = certs.map((c) => `${c.title} — ${c.issuer}${c.badge ? ` (${c.badge})` : ''}`).join('\n');
    allChunks.push(...chunkText(text, 'certificates'));
  }

  console.log(`  fetching public GitHub repos for ${GITHUB_USERNAME}...`);
  allChunks.push(...(await gatherGithubChunks()));

  console.log(`Embedding ${allChunks.length} chunks with Cohere...`);
  const embedded = await embedAll(allChunks);

  console.log('Replacing stored knowledge base...');
  await KnowledgeChunk.deleteMany({});
  await KnowledgeChunk.insertMany(embedded);

  console.log(`Done. Stored ${embedded.length} knowledge chunks.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Building the knowledge base failed:', err);
  process.exit(1);
});
