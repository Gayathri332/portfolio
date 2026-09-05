document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navRoutes = document.getElementById('navRoutes');
if (navToggle && navRoutes) {
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
}

/* ---------- Hero photos: gentle parallax tilt as the cursor moves ---------- */
(function heroParallax() {
  const group = document.getElementById('aboutHeroPhotos');
  if (!group || window.matchMedia('(pointer: coarse)').matches) return;
  const photos = group.querySelectorAll('.about-hero__photo');
  group.addEventListener('mousemove', (e) => {
    const rect = group.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    photos.forEach((photo, i) => {
      const depth = (i + 1) * 5;
      photo.style.setProperty('--px', `${(x * depth).toFixed(1)}px`);
      photo.style.setProperty('--py', `${(y * depth).toFixed(1)}px`);
    });
  });
  group.addEventListener('mouseleave', () => {
    photos.forEach((photo) => {
      photo.style.setProperty('--px', '0px');
      photo.style.setProperty('--py', '0px');
    });
  });
})();

/* ---------- Lightbox: click a photo to enlarge it ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

document.querySelectorAll('[data-lightbox]').forEach((el) => {
  el.addEventListener('click', () => {
    const src = el.getAttribute('data-lightbox');
    const alt = el.querySelector('img')?.alt || '';
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.hidden = false;
  });
});
function closeLightbox() { lightbox.hidden = true; lightboxImg.src = ''; }
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

/* ---------- "Set the vibe": three tiny self-generated ambient loops ---------- */
/* No external audio files needed — everything is synthesised with the Web Audio API. */
(function vibePlayer() {
  const widget = document.getElementById('vibeWidget');
  const toggleBtn = document.getElementById('vibeToggle');
  const panel = document.getElementById('vibePanel');
  const label = document.getElementById('vibeLabel');
  const stopBtn = document.getElementById('vibeStop');
  const trackBtns = document.querySelectorAll('.vibe__track');
  if (!widget) return;

  let ctx = null;
  let master = null;
  let scheduler = null;
  let currentTrack = null;
  let nextNoteTime = 0;
  let stepIndex = 0;

  const PRESETS = {
    lofi: {
      label: 'Lo-fi',
      tempo: 88,
      wave: 'triangle',
      notes: [261.6, 0, 311.1, 349.2, 0, 293.7, 261.6, 0],
      gain: 0.05,
    },
    chill: {
      label: 'Chill',
      tempo: 70,
      wave: 'sine',
      notes: [220.0, 0, 261.6, 0, 246.9, 0, 196.0, 0],
      gain: 0.045,
    },
    focus: {
      label: 'Focus',
      tempo: 100,
      wave: 'sine',
      notes: [329.6, 392.0, 349.2, 392.0, 329.6, 293.7, 329.6, 246.9],
      gain: 0.04,
    },
  };

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function playNote(freq, time, wave, gainAmt) {
    if (!freq) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(gainAmt, time + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);
    osc.connect(g);
    g.connect(master);
    osc.start(time);
    osc.stop(time + 0.55);
  }

  function scheduleLoop(preset) {
    const stepTime = 60 / preset.tempo;
    while (nextNoteTime < ctx.currentTime + 0.2) {
      const freq = preset.notes[stepIndex % preset.notes.length];
      playNote(freq, nextNoteTime, preset.wave, preset.gain);
      nextNoteTime += stepTime;
      stepIndex += 1;
    }
    scheduler = setTimeout(() => scheduleLoop(preset), 50);
  }

  function stopLoop() {
    if (scheduler) clearTimeout(scheduler);
    scheduler = null;
    if (master) master.gain.linearRampToValueAtTime(0, (ctx?.currentTime || 0) + 0.4);
    currentTrack = null;
    widget.classList.remove('is-playing');
    label.textContent = "It's quiet in here. Click to set the vibe.";
    trackBtns.forEach((b) => b.classList.remove('is-active'));
  }

  function playTrack(key) {
    ensureContext();
    const preset = PRESETS[key];
    if (!preset) return;
    if (scheduler) clearTimeout(scheduler);
    stepIndex = 0;
    nextNoteTime = ctx.currentTime + 0.1;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.4);
    scheduleLoop(preset);
    currentTrack = key;
    widget.classList.add('is-playing');
    label.textContent = `Now playing: ${preset.label}`;
    trackBtns.forEach((b) => b.classList.toggle('is-active', b.dataset.track === key));
  }

  toggleBtn.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });
  document.addEventListener('click', (e) => {
    if (!widget.contains(e.target)) panel.hidden = true;
  });
  trackBtns.forEach((btn) => {
    btn.addEventListener('click', () => playTrack(btn.dataset.track));
  });
  stopBtn.addEventListener('click', stopLoop);
})();