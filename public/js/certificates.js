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

// Ensure slugify exists, or provide a simple inline fallback
const generateSlug = (text) => {
  if (window.slugify) return window.slugify(text);
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

function render(certs) {
  const list = document.getElementById('certShowcaseList');
  const countEl = document.getElementById('csCount');

  if (!certs || certs.length === 0) {
    if (countEl) countEl.textContent = 'No certificates yet — check back soon.';
    return;
  }
  
  if (countEl) {
    countEl.textContent = `${certs.length} certificate${certs.length === 1 ? '' : 's'} — every one, full size.`;
  }

  if (list) {
    list.innerHTML = certs
      .map((c, i) => {
        const slug = generateSlug(c.title || `certificate-${i}`);
        const side = i % 2 === 0 ? '' : 'cert-row--reverse';
        
        let mediaHTML = '';

        // Supports both the static fallback shape (file/thumb) and the
        // MongoDB API shape (fileUrl/image).
        const file = c.file || c.fileUrl || '';
        const thumb = c.thumb || c.image || '';

        if (file) {
          const isPDF = file.toLowerCase().endsWith('.pdf');

          if (isPDF) {
            // Render the actual PDF full-size, embedded inline.
            mediaHTML = `<embed src="${file}" type="application/pdf" width="100%" height="450px" style="border: none; border-radius: 8px; background: #1a1a1a;" />`;
          } else {
            // Render Image. If the image path is wrong, it safely hides itself and adds 'no-image' to show the placeholder
            mediaHTML = `<img src="${file}" alt="${escapeHtml(c.title)} certificate" onerror="this.parentElement.classList.add('no-image'); this.style.display='none';">`;
          }
        } else if (thumb) {
          mediaHTML = `<img src="${thumb}" alt="${escapeHtml(c.title)} certificate" onerror="this.parentElement.classList.add('no-image'); this.style.display='none';">`;
        }

        return `
        <article class="cert-row ${side}" id="${escapeHtml(slug)}">
          <div class="cert-row__media ${!file && !thumb ? 'no-image' : ''}">
            ${mediaHTML}
            <div class="cert-row__placeholder">${window.certificatePlaceholderSVG ? window.certificatePlaceholderSVG() : ''}</div>
          </div>
          <div class="cert-row__body">
            <span class="cert-row__index">${String(i + 1).padStart(2, '0')} / ${String(certs.length).padStart(2, '0')}</span>
            <span class="cert-card__badge cert-row__badge">${escapeHtml(c.badge || 'Course')}</span>
            <h2>${escapeHtml(c.title)}</h2>
            ${c.issuer ? `<p class="cert-row__issuer">${escapeHtml(c.issuer)}</p>` : ''}
            ${c.date ? `<p class="cert-row__date">${escapeHtml(c.date)}</p>` : ''}
            ${file ? `<a class="cert-row__link" href="${file}" target="_blank" rel="noopener">View original file ↗</a>` : ''}
          </div>
        </article>`;
      })
      .join('');
  }

  // If we arrived via a #slug link from the main page, scroll to it.
  if (window.location.hash) {
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      target.classList.add('cert-row--highlight');
    }
  }
}

// Fetch from API, fallback to offline data array if API fails
fetch('/api/certificates')
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((data) => render(data.length ? data : window.FALLBACK_CERTIFICATES))
  .catch(() => render(window.FALLBACK_CERTIFICATES));