// -----------------------------------------------------------
// Custom square cursor — dot + square outline, mix-blend-mode:
// difference so it auto-inverts between the white hero and the
// black sheets. Enlarges + rotates slightly over interactive /
// "hoverable" elements. Desktop / fine-pointer only, respects
// prefers-reduced-motion.
// -----------------------------------------------------------
(function () {
  const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsFinePointer || reduceMotion) return;

  document.body.classList.add('has-custom-cursor');

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const square = document.createElement('div');
  square.className = 'cursor-square';
  document.body.appendChild(square);
  document.body.appendChild(dot);

  let dotX = window.innerWidth / 2;
  let dotY = window.innerHeight / 2;
  let sqX = dotX;
  let sqY = dotY;

  window.addEventListener('mousemove', (e) => {
    dotX = e.clientX;
    dotY = e.clientY;
    dot.style.transform = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;
  });

  function raf() {
    sqX += (dotX - sqX) * 0.16;
    sqY += (dotY - sqY) * 0.16;
    square.style.transform = `translate(${sqX}px, ${sqY}px) translate(-50%, -50%) rotate(${square.classList.contains('is-active') ? 45 : 0}deg)`;
    requestAnimationFrame(raf);
  }
  raf();

  const HOVERABLE = 'a, button, input, textarea, .project-card, .cert-card, .stack-group, [data-cursor-grow]';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(HOVERABLE)) square.classList.add('is-active');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(HOVERABLE)) square.classList.remove('is-active');
  });
  document.addEventListener('mousedown', () => square.classList.add('is-pressed'));
  document.addEventListener('mouseup', () => square.classList.remove('is-pressed'));

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    square.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    square.style.opacity = '1';
  });
})();
