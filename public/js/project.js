document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navRoutes = document.getElementById('navRoutes');
navToggle.addEventListener('click', () => {
  const isOpen = navRoutes.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function placeholderImage(project, index) {
  const seed = window.slugify(project.title || `project-${index}`);
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/900`;
}
// Same defensive fallback as the homepage grid: if the live DB record is
// missing its photos, use the matching (by slug) entry from the local
// FALLBACK_PROJECTS list instead of a random stock photo.
function fallbackImagesFor(project, index) {
  const slug = window.slugify(project.title || `project-${index}`);
  const match = (window.FALLBACK_PROJECTS || []).find((p) => window.slugify(p.title) === slug);
  return match && Array.isArray(match.images) && match.images.length ? match.images : null;
}
function projectImages(project, index) {
  if (Array.isArray(project.images) && project.images.length) return project.images;
  if (project.image) return [project.image];
  const fallback = fallbackImagesFor(project, index);
  if (fallback) return fallback;
  return [placeholderImage(project, index)];
}
function badgeLabel(project) {
  if (project.badge) return project.badge;
  return project.status === 'in-progress' ? 'In progress' : 'Live';
}
function badgeClass(project) {
  if (project.badge) return 'badge--patent';
  return project.status === 'in-progress' ? 'badge--in-progress' : 'badge--live';
}

/* ---------- Photo carousel (handles 1, 2, or many photos per project) ---------- */
const pdImage = document.getElementById('pdImage');
const pdImgPrev = document.getElementById('pdImgPrev');
const pdImgNext = document.getElementById('pdImgNext');
const pdImgDots = document.getElementById('pdImgDots');
const pdImageFrame = document.getElementById('pdImageFrame');
let carouselImages = [];
let carouselIndex = 0;
let carouselTitle = '';

function showCarouselImage(i) {
  if (!carouselImages.length) return;
  carouselIndex = (i + carouselImages.length) % carouselImages.length;
  pdImage.style.display = '';
  pdImageFrame.classList.remove('no-image');
  pdImage.src = carouselImages[carouselIndex];
  pdImage.alt = carouselImages.length > 1
    ? `${carouselTitle} — photo ${carouselIndex + 1} of ${carouselImages.length}`
    : carouselTitle;
  pdImgDots.querySelectorAll('button').forEach((dot, di) =>
    dot.classList.toggle('is-active', di === carouselIndex)
  );
}
function setupCarousel(project) {
  carouselImages = projectImages(project, project._i);
  carouselTitle = project.title;
  carouselIndex = 0;

  const multi = carouselImages.length > 1;
  pdImgPrev.hidden = !multi;
  pdImgNext.hidden = !multi;
  pdImgDots.hidden = !multi;
  pdImgDots.innerHTML = multi
    ? carouselImages.map((_, di) => `<button type="button" aria-label="Show photo ${di + 1}" data-i="${di}"></button>`).join('')
    : '';
  pdImgDots.querySelectorAll('button').forEach((dot) =>
    dot.addEventListener('click', () => showCarouselImage(Number(dot.dataset.i)))
  );

  pdImage.onerror = () => {
    pdImage.style.display = 'none';
    pdImageFrame.classList.add('no-image');
  };
  showCarouselImage(0);
}
pdImgPrev.addEventListener('click', () => showCarouselImage(carouselIndex - 1));
pdImgNext.addEventListener('click', () => showCarouselImage(carouselIndex + 1));
document.addEventListener('keydown', (e) => {
  if (!carouselImages.length || carouselImages.length < 2) return;
  if (e.key === 'ArrowLeft') showCarouselImage(carouselIndex - 1);
  if (e.key === 'ArrowRight') showCarouselImage(carouselIndex + 1);
});

function render(projects) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const withSlugs = projects.map((p, i) => ({ ...p, _slug: window.slugify(p.title || `project-${i}`), _i: i }));

  let idx = withSlugs.findIndex((p) => p._slug === slug);
  if (idx === -1) idx = 0;
  const project = withSlugs[idx];

  if (!project) {
    document.getElementById('pdTitle').textContent = 'Project not found';
    document.getElementById('pdSubtitle').textContent = 'That project link may be out of date.';
    document.querySelector('.project-row').style.display = 'none';
    document.querySelector('.project-nav').style.display = 'none';
    return;
  }

  document.title = `${project.title} — Gayathri Shettigar`;
  document.getElementById('pdEyebrow').textContent = `GET /projects/${project._slug}`;
  document.getElementById('pdTitle').textContent = project.title;
  document.getElementById('pdSubtitle').textContent = (project.tags || []).join(' · ') || 'Personal project';

  setupCarousel(project);

  // Flip the photo/details side per project — same alternating rhythm
  // as the certificate showcase rows.
  const pdRow = document.getElementById('pdRow');
  if (pdRow) pdRow.classList.toggle('project-row--reverse', idx % 2 === 1);

  document.getElementById('pdDescription').textContent = project.description;
  const pdStatus = document.getElementById('pdStatus');
  pdStatus.textContent = badgeLabel(project);
  pdStatus.className = `project-card__badge ${badgeClass(project)}`;

  const techWrap = document.getElementById('pdTech');
  techWrap.innerHTML = (project.tech || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('') || '<span>—</span>';

  const linksWrap = document.getElementById('pdLinks');
  const links = [];
  if (project.githubUrl) links.push(`<a href="${project.githubUrl}" target="_blank" rel="noopener">Code on GitHub →</a>`);
  if (project.liveUrl) links.push(`<a href="${project.liveUrl}" target="_blank" rel="noopener">View live →</a>`);
  linksWrap.innerHTML = links.join('') || '<span style="opacity:.5">No public link yet</span>';
  if (!links.length) document.getElementById('pdLinksWrap').style.opacity = '0.6';

  const prev = withSlugs[(idx - 1 + withSlugs.length) % withSlugs.length];
  const next = withSlugs[(idx + 1) % withSlugs.length];
  document.getElementById('pdPrev').href = `project.html?slug=${encodeURIComponent(prev._slug)}`;
  document.getElementById('pdPrev').textContent = `← ${prev.title}`;
  document.getElementById('pdNext').href = `project.html?slug=${encodeURIComponent(next._slug)}`;
  document.getElementById('pdNext').textContent = `${next.title} →`;
}

fetch('/api/projects')
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((data) => render(data.length ? data : window.FALLBACK_PROJECTS))
  .catch(() => render(window.FALLBACK_PROJECTS));
