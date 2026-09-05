// -----------------------------------------------------------
// Hero background video — play/pause, speed, mute, fullscreen
// -----------------------------------------------------------
const heroVideoEl = document.getElementById('heroVideoEl');
if (heroVideoEl) {
  const playBtn = document.getElementById('heroVideoPlay');
  const speedBtn = document.getElementById('heroVideoSpeed');
  const muteBtn = document.getElementById('heroVideoMute');
  const fsBtn = document.getElementById('heroVideoFullscreen');
  const timeEl = document.getElementById('heroVideoTime');
  const wrap = document.getElementById('heroVideo');
  const speeds = [1, 1.5, 2, 0.5];
  let speedIndex = 0;

  const formatTime = (s) => {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    heroVideoEl.pause();
  } else {
    heroVideoEl.play().catch(() => {
      // Autoplay blocked — fall back to a paused first frame with a play button.
    });
  }

  const syncPlayIcon = () => {
    const isPlaying = !heroVideoEl.paused && !heroVideoEl.ended;
    playBtn.querySelector('.icon-pause').hidden = !isPlaying;
    playBtn.querySelector('.icon-play').hidden = isPlaying;
    playBtn.setAttribute('aria-pressed', String(isPlaying));
    playBtn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');
  };
  syncPlayIcon();
  heroVideoEl.addEventListener('play', syncPlayIcon);
  heroVideoEl.addEventListener('pause', syncPlayIcon);

  playBtn?.addEventListener('click', () => {
    if (heroVideoEl.paused) heroVideoEl.play();
    else heroVideoEl.pause();
  });

  speedBtn?.addEventListener('click', () => {
    speedIndex = (speedIndex + 1) % speeds.length;
    heroVideoEl.playbackRate = speeds[speedIndex];
    speedBtn.textContent = `${speeds[speedIndex]}x`;
  });

  const syncMuteIcon = () => {
    muteBtn.querySelector('.icon-muted').hidden = !heroVideoEl.muted;
    muteBtn.querySelector('.icon-unmuted').hidden = heroVideoEl.muted;
    muteBtn.setAttribute('aria-pressed', String(!heroVideoEl.muted));
    muteBtn.setAttribute('aria-label', heroVideoEl.muted ? 'Unmute video' : 'Mute video');
  };
  syncMuteIcon();
  muteBtn?.addEventListener('click', () => {
    heroVideoEl.muted = !heroVideoEl.muted;
    syncMuteIcon();
  });

  fsBtn?.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (wrap.requestFullscreen) {
      wrap.requestFullscreen();
    }
  });

  heroVideoEl.addEventListener('timeupdate', () => {
    timeEl.textContent = formatTime(heroVideoEl.currentTime);
  });
}


document.getElementById('year').textContent = new Date().getFullYear();

// -----------------------------------------------------------
// Mobile nav toggle
// -----------------------------------------------------------
const navToggle = document.getElementById('navToggle');
const navRoutes = document.getElementById('navRoutes');
navToggle.addEventListener('click', () => {
  const isOpen = navRoutes.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
navRoutes.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    navRoutes.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  })
);

// -----------------------------------------------------------
// Nav flips white<->black as a dark sheet pins under it
// -----------------------------------------------------------
// Both sheet variants are dark now (see style.css), so the nav chrome
// should stay in its "on dark" state throughout the scroll.
const darkSheets = document.querySelectorAll('.sheet--dark, .sheet--light');
if ('IntersectionObserver' in window && darkSheets.length) {
  const navIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // A dark sheet counts as "under the nav" once its top has
        // scrolled at or above the nav height.
        if (entry.boundingClientRect.top <= 90) {
          document.body.classList.add('is-on-dark');
        }
      });
      // If none of the dark sheets currently qualify, we're back on the hero.
      const anyDark = Array.from(darkSheets).some((el) => el.getBoundingClientRect().top <= 90);
      document.body.classList.toggle('is-on-dark', anyDark);
    },
    { threshold: [0, 1], rootMargin: '-90px 0px 0px 0px' }
  );
  darkSheets.forEach((el) => navIo.observe(el));
  window.addEventListener('scroll', () => {
    const anyDark = Array.from(darkSheets).some((el) => el.getBoundingClientRect().top <= 90);
    document.body.classList.toggle('is-on-dark', anyDark);
  }, { passive: true });
}

// -----------------------------------------------------------
// Typing role rotator in the hero
// -----------------------------------------------------------
const roles = [
  'Backend Engineer',
  'Automation Developer',
  'DSA problem solver',
  'training to be an AI Engineer',
];
const typedEl = document.getElementById('typedRole');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion) {
  typedEl.textContent = roles[0];
} else {
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1600);
        return;
      }
    } else {
      charIndex--;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
    }
    setTimeout(tick, deleting ? 35 : 65);
  }
  setTimeout(tick, 500);
}

// -----------------------------------------------------------
// Scroll reveal
// -----------------------------------------------------------
const revealEls = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
}

// -----------------------------------------------------------
// Live GitHub public repo count (unauthenticated public API call)
// -----------------------------------------------------------
const ghRepoCountEl = document.getElementById('ghRepoCount');
fetch('https://api.github.com/users/Gayathri332')
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((data) => {
    ghRepoCountEl.textContent = `${data.public_repos}`;
  })
  .catch(() => {
    ghRepoCountEl.innerHTML = '<a href="https://github.com/Gayathri332" target="_blank" rel="noopener">view on GitHub →</a>';
  });

// -----------------------------------------------------------
// Projects — fetched from /api/projects (MongoDB), with a static
// fallback (window.FALLBACK_PROJECTS, from js/projects-data.js).
// Each card is a placeholder image + copy; clicking opens
// project.html?slug=... for a full detail page.
// -----------------------------------------------------------
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
// If a project came from the live database and is missing its photo(s) —
// e.g. the DB record predates the images field, or just hasn't been
// re-seeded — fall back to the matching entry (by slug) in the local
// FALLBACK_PROJECTS list before ever reaching for a random stock photo.
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

function renderProjects(projects) {
  const grid = document.getElementById('projectGrid');
  if (!projects || projects.length === 0) {
    grid.innerHTML = '<p class="project-grid__empty">No projects yet — check back soon.</p>';
    return;
  }
  grid.innerHTML = projects
    .map((p, i) => {
      const slug = window.slugify(p.title || `project-${i}`);
      return `
    <article class="project-card reveal is-visible" data-slug="${escapeAttr(slug)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(p.title)} project details">
      <div class="project-card__media">
        <img src="${projectImage(p, i)}" alt="" loading="lazy" onerror="this.style.display='none'; this.closest('.project-card__media').classList.add('no-image')">
        <span class="project-card__index">${String(i + 1).padStart(2, '0')}</span>
      </div>
      <div class="project-card__body">
        <div class="project-card__head">
          <h3>${escapeHtml(p.title)}</h3>
          <span class="project-card__badge ${badgeClass(p)}">${escapeHtml(badgeLabel(p))}</span>
        </div>
        <p>${escapeHtml(p.description)}</p>
        <div class="project-card__tech">
          ${(p.tech || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
        </div>
        <span class="project-card__view">View project →</span>
      </div>
    </article>`;
    })
    .join('');

  grid.querySelectorAll('.project-card').forEach((card) => {
    const go = () => { window.location.href = `project.html?slug=${encodeURIComponent(card.dataset.slug)}`; };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}

// -----------------------------------------------------------
// Certifications — fetched from /api/certificates (MongoDB), with
// a static fallback (window.FALLBACK_CERTIFICATES). Each card is
// just a photo + name, per the brief: click the card (or its arrow)
// to open certificates.html, where every certificate shows large.
// -----------------------------------------------------------
function renderCertificates(certs) {
  const grid = document.getElementById('certGrid');
  if (!certs || certs.length === 0) {
    grid.innerHTML = '<p class="project-grid__empty">No certificates yet — check back soon.</p>';
    return;
  }
  grid.innerHTML = certs
    .map((c, i) => {
      const slug = window.slugify(c.title || `certificate-${i}`);
      // Use the real thumbnail/file the data actually points to — no more
      // guessing a filename from the slug (that never matched the real
      // files on disk, which is why every card fell back to the placeholder).
      // Supports both the static fallback shape (file/thumb) and the
      // MongoDB API shape (fileUrl/image).
      const file = c.file || c.fileUrl || '';
      const thumbSrc = c.thumb || c.image || (file && /\.(jpe?g|png|webp)$/i.test(file) ? file : '');
      const mediaHTML = thumbSrc
        ? `<img src="${escapeAttr(thumbSrc)}" alt="" loading="lazy" onerror="this.closest('.cert-card__media').classList.add('no-image'); this.style.display='none';">`
        : '';
      return `
    <article class="cert-card reveal is-visible" data-slug="${escapeAttr(slug)}" tabindex="0" role="link" aria-label="View ${escapeHtml(c.title)} certificate, full size">
      <div class="cert-card__media ${!thumbSrc ? 'no-image' : ''}">
        ${mediaHTML}
        <div class="cert-card__placeholder">${window.certificatePlaceholderSVG()}</div>
        <span class="cert-card__badge">${escapeHtml(c.badge || 'Course')}</span>
      </div>
      <div class="cert-card__foot">
        <h3>${escapeHtml(c.title)}</h3>
        <span class="cert-card__view" aria-hidden="true">→</span>
      </div>
    </article>`;
    })
    .join('');

  grid.querySelectorAll('.cert-card').forEach((card) => {
    const go = () => { window.location.href = `certificates.html#${encodeURIComponent(card.dataset.slug)}`; };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
}

// If we arrived at index.html with a #projects, #certifications, or any
// other section hash, the browser tries to jump there on initial paint —
// but the grids are still empty at that point (they fill in once the
// /api fetches below resolve), so the page lands short and can look like
// only some of the section is there. Once each grid is actually
// populated, re-run the jump so the hash points at the real thing.
function reJumpToHashIfNeeded() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (target) target.scrollIntoView({ block: 'start' });
}

fetch('/api/certificates')
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((data) => renderCertificates(data.length ? data : window.FALLBACK_CERTIFICATES))
  .catch(() => renderCertificates(window.FALLBACK_CERTIFICATES))
  .finally(reJumpToHashIfNeeded);

fetch('/api/projects')
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((data) => renderProjects(data.length ? data : window.FALLBACK_PROJECTS))
  .catch(() => renderProjects(window.FALLBACK_PROJECTS))
  .finally(reJumpToHashIfNeeded);

// -----------------------------------------------------------
// Contact form — POSTs to /api/contact (saved in MongoDB)
// -----------------------------------------------------------
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('contactStatus');
const submitBtn = document.getElementById('contactSubmit');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    message: form.message.value.trim(),
    website: form.website.value, // honeypot
  };

  if (!payload.name || !payload.email || !payload.message) {
    statusEl.textContent = 'Fill in your name, email, and a message first.';
    statusEl.dataset.state = 'error';
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = 'Sending…';
  statusEl.dataset.state = 'loading';

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    statusEl.textContent = "Sent — I'll reply by email soon. Thank you.";
    statusEl.dataset.state = 'ok';
    form.reset();
  } catch (err) {
    statusEl.textContent = err.message || 'Could not send right now. Try again shortly.';
    statusEl.dataset.state = 'error';
  } finally {
    submitBtn.disabled = false;
  }
});

// -----------------------------------------------------------
// Contact hero — the "Hiring? Let's talk." CTA scrolls down and
// focuses the form; the email chip copies the address to the
// clipboard with a little feedback state.
// -----------------------------------------------------------
const contactCta = document.getElementById('contactCta');
if (contactCta) {
  contactCta.addEventListener('click', () => {
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form.classList.remove('is-nudged');
    // restart the highlight animation even on repeated clicks
    void form.offsetWidth;
    form.classList.add('is-nudged');
    window.setTimeout(() => form.name.focus(), 450);
  });
}

const emailCopy = document.getElementById('emailCopy');
const emailCopyHint = document.getElementById('emailCopyHint');
if (emailCopy) {
  const defaultHint = emailCopyHint ? emailCopyHint.textContent : 'click to copy';
  emailCopy.addEventListener('click', async () => {
    const email = emailCopy.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Clipboard API unavailable (older browser / no permission) — fall
      // back to a temporary selectable text element.
      const helper = document.createElement('textarea');
      helper.value = email;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      document.body.removeChild(helper);
    }
    emailCopy.classList.add('is-copied');
    if (emailCopyHint) emailCopyHint.textContent = 'copied! ✅';
    window.setTimeout(() => {
      emailCopy.classList.remove('is-copied');
      if (emailCopyHint) emailCopyHint.textContent = defaultHint;
    }, 2000);
  });
}

// -----------------------------------------------------------
// "Ask about Gayathri" chat widget
// -----------------------------------------------------------
const chatBubble = document.getElementById('chatBubble');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

function openChat() {
  chatPanel.classList.add('is-open');
  chatPanel.setAttribute('aria-hidden', 'false');
  chatBubble.setAttribute('aria-expanded', 'true');
  chatInput.focus();
}
function closeChat() {
  chatPanel.classList.remove('is-open');
  chatPanel.setAttribute('aria-hidden', 'true');
  chatBubble.setAttribute('aria-expanded', 'false');
}
chatBubble.addEventListener('click', () => {
  chatPanel.classList.contains('is-open') ? closeChat() : openChat();
});
chatClose.addEventListener('click', closeChat);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && chatPanel.classList.contains('is-open')) closeChat();
});

function addChatMessage(text, who) {
  const el = document.createElement('div');
  el.className = `chat-msg chat-msg--${who}`;
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;

  addChatMessage(question, 'user');
  chatInput.value = '';
  chatInput.disabled = true;
  const loadingEl = addChatMessage('Thinking…', 'bot');
  loadingEl.classList.add('chat-msg--loading');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    loadingEl.classList.remove('chat-msg--loading');
    loadingEl.textContent = res.ok
      ? data.answer
      : data.error || "Couldn't get an answer just now — try again.";
  } catch (err) {
    loadingEl.classList.remove('chat-msg--loading');
    loadingEl.textContent = "Couldn't reach the server — check that it's running.";
  } finally {
    chatInput.disabled = false;
    chatInput.focus();
  }
});