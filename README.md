# Gayathri Shettigar — Portfolio

A single-server portfolio: a static frontend (vanilla HTML/CSS/JS, no build step) served by
an Express backend, with MongoDB storing your **projects** and **contact messages**. The
"Projects" section is pulled live from the database, so you can add new projects later without
touching the code or redeploying.

## Design

Strict black & white, editorial-poster style. The nav reads like API routes (`GET /about`,
`POST /contact`) and the hero includes a live system-status panel, since the whole point is
that you're a backend engineer. Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono
(labels/code). Everything is in `public/css/style.css` if you want to retheme it.

**Alternating stacked sheets.** Each section ("sheet") is white or black, alternating down the
page: Hero (white) → About (black) → Experience (white) → Skills (black) → Projects (white) →
Certifications (black) → Contact (white). Each one is `position: sticky; top: 0`, so as you
scroll, the current sheet stays pinned in place while the next one slides up and over it,
peeling into view with a rounded top edge — the earlier sheet stays static underneath the whole
time, exactly like pages stacking on a desk. The nav bar automatically flips its own text
black/white to stay readable against whichever sheet is currently pinned under it.

To reorder sections or change which are light/dark: each `<section class="sheet sheet--light">`
or `sheet--dark` in `public/index.html` carries a `style="--i:N"` — keep `N` sequential (0, 1,
2…) so the stacking order and z-index stay correct, and toggle `sheet--light`/`sheet--dark` on
any section to change its color. Component colors (borders, dividers, timeline dots, tag
outlines) all read from `--line`, `--dim`, `--fg`, and `--bg`, which are redefined per sheet —
so everything auto-adapts to whichever color a section is, no manual retouching needed.

**Projects.** The grid on the main page is a compact 3-up (2 on tablets, 1 on phones) — a
photo, title, one-line-clamped description, and a badge. Click any card and it opens as its
own page, `project.html?slug=...`, with a full-width image, longer description, tech stack,
links, and prev/next navigation between projects. Project photos are placeholders (seeded
`picsum.photos` images, run through a grayscale filter to match the theme) until you swap them
for real screenshots — see "Adding real project images" below.

**Extras:** a square custom cursor on desktop that grows over links/cards (auto-off on touch
devices and if the visitor has "reduce motion" on), a persistent line-art motif fixed in the
bottom-left corner that stays visible through the entire scroll and auto-inverts against
whichever sheet is behind it, and a floating **"Ask about Gayathri"** chat bubble bottom-right.

### Adding real project images

Project cards and the detail page show placeholder photos until you provide real ones. Add an
`image` field when you create or update a project via the API (see "Add new projects" below):

```bash
curl -X PUT http://localhost:5000/api/projects/PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"image": "/assets/projects/llm-file-assistant.png"}'
```

Drop the actual file into `public/assets/projects/` (create that folder) with a matching name.
Any project without an `image` field keeps showing its placeholder automatically.

## Adding your photo

Drop a photo in as `public/assets/profile1.jpg` (a square-ish, well-lit photo works best — it's
used both as a small round avatar in the hero and a larger card in the About section). Until
you add one, both spots show a clean "GS" placeholder automatically — nothing looks broken in
the meantime, so you can ship this now and drop the photo in whenever you have one ready.

## 1. Prerequisites

- [Node.js](https://nodejs.org) 18+
- A MongoDB database — easiest is a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster (or run MongoDB locally)

## 2. Setup

```bash
cd gayathri-portfolio
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `MONGODB_URI` — your Atlas (or local) connection string
- `ADMIN_KEY` — any secret string you make up yourself (used to add projects / read messages)
- `PORT` — leave as 5000 unless it's taken

## 3. Seed your starter projects

```bash
npm run seed
```

This inserts the 4 starter projects (LLM File Assistant, Smart Speed Breaker, Health
Monitoring System, Shopnest) into MongoDB. Edit the `projects` array in `seed.js` any time
and re-run `npm run seed` to reset them, or add new ones live (see below) once it's running.

## 4. Run it

```bash
npm run dev      # auto-restarts on changes (nodemon)
# or
npm start
```

Visit **http://localhost:5000**.

## 5. The "Ask about Gayathri" chat widget

**It works with zero setup** — without any AI key, it answers using the keyword facts seeded
by `npm run seed` (things like "what does she do", "what has she built", "how do I contact
her"). This is the fallback path, used if `COHERE_API_KEY` isn't set or a Cohere call fails.

**With a Cohere key set, it does real semantic search + GitHub lookups instead of keyword
matching.** A separate build step reads everything about you — the resume PDF, the actual text
of `about.html` (bio, "what I'm doing now", every "off the clock" card), certificates and
projects from the database, and your public GitHub repos (description + README) — splits it
into chunks, embeds each chunk with Cohere, and stores it in a `KnowledgeChunk` collection.
When a visitor asks something, the widget embeds their question, finds the most relevant
chunks by cosine similarity, and hands only those to Cohere as context — so it isn't limited to
whatever fits in one hand-written paragraph, and questions about things you only mentioned on
the About page (hobbies, etc.) actually get answered instead of hitting the "I don't have that"
fallback.

On top of that, the model has a live tool, `get_github_repo_details`, that it can call mid-answer
to pull a specific repo's live description and README — so it can go beyond the resume for "what
did she actually do in that project" questions, even for details you never wrote down anywhere
on the site.

**Setup:**
1. Get a Cohere key at https://dashboard.cohere.com/api-keys (same one your LLM File Assistant
   project uses) and put it in `.env` as `COHERE_API_KEY=...`.
2. Optionally set `GITHUB_USERNAME` (defaults to `Gayathri332`) and `GITHUB_TOKEN` (raises the
   GitHub API rate limit from 60/hour to 5000/hour — worth it once the site gets real traffic).
3. Run `npm install` (pulls in the two new dependencies, `pdf-parse` and `cheerio`).
4. Run `npm run build-kb`. This connects to Mongo, reads everything above, calls Cohere's embed
   endpoint, and stores the result. It prints progress as it goes.
5. Restart the server.

**Re-run `npm run build-kb` any time you:**
- update your resume PDF
- edit `about.html`
- add/edit projects or certificates
- push new commits/READMEs to GitHub that you want reflected in answers

It fully replaces the stored knowledge base each time, so it's always safe to re-run.

The old `Profile.context` / `Profile.facts` fields (seeded by `npm run seed`) are still used —
`context` is folded into the knowledge base as one more chunk, and `facts` remains the offline
keyword fallback. To update those directly:

```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"context": "your updated resume text here", "facts": []}'
```

## 6. Add a resume PDF (optional)

The "Download résumé" button links to `public/assets/Gayathri_Shettigar_Resume.pdf`. Drop your
resume PDF into `public/assets/` with that exact filename, or edit the `href` in
`public/index.html`.

## 7. Adding your real certificate files

`npm run seed` loads 12 certificates (from `seed.js`) with titles guessed off your certificate
folder — **double-check these, some are inferred and may be wrong.** Fix any of them the same
way you'd fix a project (see #9 below), or just edit the `certificateSeedData` array in
`seed.js` and re-run `npm run seed`.

Each certificate looks for its image at a predictable path based on its title, so **you don't
need to touch any code to add real photos** — just drop matching files into
`public/assets/certificates/`:

- **Image-only certificates** (a screenshot/photo of the certificate, no separate PDF): save it
  as `<slug>.jpg` (or `.jpeg`/`.png`/`.webp`) where `<slug>` is the title lowercased with
  spaces/punctuation turned into dashes — e.g. "AWS Cloud Practitioner Essentials" →
  `aws-cloud-practitioner-essentials.jpg`.
- **PDF certificates**: save the PDF as `<slug>.pdf` in the same folder. A PDF can't be shown
  directly as a card photo in a browser, so also add a `<slug>.jpg` image (a screenshot or
  exported first page of the PDF) for the thumbnail — the PDF itself is linked as
  "View original file ↗" on the certificates page.
- Until a matching image exists, that certificate shows a plain placeholder seal instead — the
  page never looks broken, it just looks "pending" until you drop the file in.

Not sure what to name a file? Run this in your browser console on the certifications section
(or just ask me — paste in your certificate title and I'll give you the exact filename).

## 8. How certificates click through to their own page

The main page's Certifications section only shows a photo and a name per certificate, on
purpose. Click any card (or its → arrow) and it opens `certificates.html`, which shows every
certificate large, alternating left/right down the page — the same "stacked, click through to
a bigger page" idea as Projects, just laid out as one long showcase instead of one-per-page
with prev/next.

## 9. Add new projects later, without touching code

Once the server is running, POST to the API with your admin key:

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{
    "title": "Resume Intelligence",
    "description": "A Streamlit Resume Q&A app using FAISS, Sentence Transformers, and Cohere.",
    "tech": ["Python", "FAISS", "Sentence Transformers", "Cohere"],
    "tags": ["AI/LLM"],
    "status": "in-progress"
  }'
```

It shows up on the site instantly — no redeploy. You can test this straight from Postman too,
which you already use. Certificates work exactly the same way, just at `/api/certificates`:

```bash
curl -X POST http://localhost:5000/api/certificates \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"title": "New Certificate", "issuer": "Coursera", "badge": "Course"}'

# fix a title, or attach a real image once you've added the file:
curl -X PUT http://localhost:5000/api/certificates/CERT_ID \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"title": "Corrected Title"}'
```

## 10. Read contact messages

Messages submitted through the contact form are saved in MongoDB, in the `contacts`
collection. Fetch them with your admin key:

```bash
curl http://localhost:5000/api/contact -H "x-admin-key: YOUR_ADMIN_KEY"
```

Or just open the collection directly in MongoDB Atlas / Compass.

## 11. Deploying

This is one server (frontend + API together), so it deploys as a single Node app:

- **Render / Railway / Fly.io**: connect the repo, set the same environment variables from
  `.env`, build command `npm install`, start command `npm start`.
- Point `ALLOWED_ORIGINS` in your deployed `.env` at your live URL once you have one — this
  is a CORS allowlist that currently only permits `localhost`.
- Point your domain (if you buy one) at whichever platform you deploy to.

## Project structure

```
gayathri-portfolio/
├── server.js              # Express app entry point
├── seed.js                 # Seeds starter projects, certificates, and profile into MongoDB
├── models/
│   ├── Contact.js           # Contact message schema
│   ├── Project.js           # Project schema
│   ├── Certificate.js       # Certificate schema
│   └── Profile.js           # Resume/about text + fallback facts for the chat widget
├── routes/
│   ├── contact.js           # POST /api/contact (public), GET (admin)
│   ├── projects.js          # GET /api/projects (public), POST/PUT/DELETE (admin)
│   ├── certificates.js      # GET /api/certificates (public), POST/PUT/DELETE (admin)
│   ├── profile.js           # GET/PUT /api/profile (admin) — what the chat widget knows
│   └── chat.js               # POST /api/chat — powers "Ask about Gayathri"
└── public/
    ├── index.html            # Main scrolling page (Hero → About → … → Contact)
    ├── project.html           # One project, big, with prev/next
    ├── certificates.html      # Every certificate, big, alternating left/right
    ├── css/style.css
    ├── js/
    │   ├── main.js             # index.html behavior + card rendering
    │   ├── project.js          # project.html rendering
    │   ├── certificates.js     # certificates.html rendering
    │   ├── projects-data.js    # project fallback data + slugify()
    │   ├── certificates-data.js # certificate fallback data + placeholder seal art
    │   └── cursor.js           # custom cursor
    └── assets/
        ├── profile1.jpg          # your photo
        ├── Gayathri_Resume_2026S.pdf
        └── certificates/        # certificate images/PDFs — see section 7
```

## Notes on choices made for you

- **No phone number displayed publicly** — it's on your résumé but left off the live page to
  cut down on spam calls. Easy to add back in `index.html` under `.contact__list` if you'd
  rather have it visible.
- **Honeypot + rate limiting** on the contact form to cut down on bot spam, since it's a public
  POST endpoint.
- **GitHub repo count is fetched live** client-side from the public GitHub API — LeetCode
  doesn't have an open CORS-friendly API, so that section links out to your live profile
  instead of faking a number that would go stale.

## 11. Deploying to Vercel

Vercel runs everything as on-demand serverless functions rather than one long-running process,
so the app is split accordingly:

- **`app.js`** — the actual Express app (middleware, routes, static serving). No `listen()`,
  no DB connect — just the request handler, so it can be reused by both entry points below.
- **`server.js`** — local dev only (`npm run dev` / `npm start`). Connects to Mongo, then calls
  `app.listen()`.
- **`api/index.js`** — the Vercel entry point. Wraps `app.js`, connecting to Mongo (with a
  cached connection, via `lib/db.js`) before handling each request.
- **`vercel.json`** — rewrites every `/api/*` request to that one function. Everything else
  (`index.html`, `about.html`, images, the resume PDF, etc.) is served automatically and
  directly from `public/` by Vercel's static hosting — it never touches the function, which
  keeps things fast and avoids bundling large binary assets (the hero video, certificate PDFs)
  into a serverless function.

**Steps:**
1. Push this project to a GitHub repo (`.gitignore` already excludes `node_modules` and `.env`).
2. In MongoDB Atlas → Network Access, allow access from anywhere (`0.0.0.0/0`) — Vercel's
   functions don't have a fixed IP, so an IP allowlist won't work here.
3. On vercel.com → **Add New Project** → import that repo. Framework preset: **Other**. Leave
   the build command blank — there's nothing to build.
4. Under **Environment Variables**, add everything from your `.env`: `MONGODB_URI`,
   `ADMIN_KEY`, `ALLOWED_ORIGINS` (set this to your real deployed domain, e.g.
   `https://gayathri.dev`), `COHERE_API_KEY`, `COHERE_MODEL`, `COHERE_EMBED_MODEL`,
   `GITHUB_USERNAME`, `GITHUB_TOKEN`.
5. Click **Deploy**.
6. Point your domain at the Vercel deployment (Project → Settings → Domains) if you're using
   `gayathri.dev` rather than the `*.vercel.app` one it gives you by default.

**`npm run seed` and `npm run build-kb` are not run by Vercel** — they're one-off maintenance
scripts. Run them locally with your `.env`'s `MONGODB_URI` pointed at the same Atlas cluster
Vercel uses, and the data/knowledge base will be there the next time the site loads. Re-run
`build-kb` any time content changes, same as before.
