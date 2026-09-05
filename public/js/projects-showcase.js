// -----------------------------------------------------------
// Full "all projects" listing (projects.html) — same fetch
// (/api/projects, with the shared static fallback) and the same
// row-by-row layout as the certificates showcase page, so
// clicking "/projects" in the nav feels exactly like clicking
// "/certifications" does. Clicking a row opens project.html for
// the full detail page, same as the homepage's project cards.
// -----------------------------------------------------------

document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navRoutes = document.getElementById('navRoutes');
if (navToggle && navRoutes) {
  navToggle.addEventListener('click', () => {
    const isOpen = navRoutes.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function badgeClass(project) {
  if (project.badge) return 'badge--patent';
  return project.status === 'in-progress' ? 'badge--in-progress' : 'badge--live';
}
function badgeLabel(project) {
  if (project.badge) return project.badge;
  return project.status === 'in-progress' ? 'In progress' : 'Live';
}
function placeholderImage(project, index) {
  const seed = window.slugify(project.title || `project-${index}`);
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/560`;
}
function fallbackImagesFor(project, index) {
  const slug = window.slugify(project.title || `project-${index}`);
  const match = (window.FALLBACK_PROJECTS || []).find((p) => window.slugify(p.title) === slug);
  return match && Array.isArray(match.images) && match.images.length ? match.images : null;
}
function projectImage(project, index) {
  if (Array.isArray(project.images) && project.images.length) return project.images[0];
  if (project.image) return project.image;
  const fallback = fallbackImagesFor(project, index);
  if (fallback) return fallback[0];
  return placeholderImage(project, index);
}

function render(projects) {
  const list = document.getElementById('projectShowcaseList');
  const countEl = document.getElementById('psCount');

  if (!projects || projects.length === 0) {
    if (countEl) countEl.textContent = 'No projects yet — check back soon.';
    return;
  }

  if (countEl) {
    countEl.textContent = `${projects.length} project${projects.length === 1 ? '' : 's'} — click any to open it.`;
  }

  if (list) {
    list.innerHTML = projects
      .map((p, i) => {
        const slug = window.slugify(p.title || `project-${i}`);
        const side = i % 2 === 0 ? '' : 'cert-row--reverse';
        const links = [];
        if (p.liveUrl) links.push(`<a class="cert-row__link" href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener">Live ↗</a>`);
        if (p.githubUrl) links.push(`<a class="cert-row__link" href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener">GitHub ↗</a>`);

        return `
        <article class="cert-row ${side}" data-slug="${escapeHtml(slug)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(p.title)} project details">
          <div class="cert-row__media">
            <img src="${projectImage(p, i)}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.parentElement.classList.add('no-image'); this.style.display='none';">
          </div>
          <div class="cert-row__body">
            <span class="cert-row__index">${String(i + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}</span>
            <span class="cert-card__badge cert-row__badge ${badgeClass(p)}">${escapeHtml(badgeLabel(p))}</span>
            <h2>${escapeHtml(p.title)}</h2>
            <p class="cert-row__desc">${escapeHtml(p.description || '')}</p>
            <div class="cert-row__tech">${(p.tech || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
            ${links.length ? `<div class="cert-row__links">${links.join('')}</div>` : ''}
          </div>
        </article>`;
      })
      .join('');

    list.querySelectorAll('.cert-row').forEach((row) => {
      const go = () => { window.location.href = `project.html?slug=${encodeURIComponent(row.dataset.slug)}`; };
      row.addEventListener('click', go);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
  }
}

fetch('/api/projects')
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((data) => render(data.length ? data : window.FALLBACK_PROJECTS))
  .catch(() => render(window.FALLBACK_PROJECTS));
