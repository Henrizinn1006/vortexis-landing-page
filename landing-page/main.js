/* ═══════════════════════════════════════════════════════════
   VORTEXIS — main.js
   Módulos:
     1. Vortex Animation — 2 braços espirais com dashes (estilo logo)
     2. Navbar scroll effect
     3. Hamburger menu mobile
     4. Fade-in on scroll (IntersectionObserver)
     5. Smooth scroll
   ═══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   1. VORTEX ANIMATION — partículas pequenas em espiral
   Estilo Accenture: pontos minúsculos distribuídos ao longo
   de 2 braços espirais, azul-ciano → roxo, rotação suave.
   ══════════════════════════════════════════════════════════ */
(function initVortex() {
  const canvas = document.getElementById('vortex-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, vx, vy;

  /* ── Espiral ──────────────────────────────────────── */
  const ARMS      = 2;
  const TURNS     = 1.55;
  const ROT_SPEED = 0.000065; // mais lento — movimento quase imperceptível

  /* ── Partículas ───────────────────────────────────── */
  const N         = 1200;   // total de pontos
  const SCATTER_A = 0.22;   // dispersão angular
  const SCATTER_R = 0.06;   // dispersão radial

  /* ── Paleta ───────────────────────────────────────── */
  const C_CYAN   = [80,  190, 255];
  const C_BLUE   = [20,  93,  255];
  const C_PURPLE = [123, 44,  255];

  /* Pré-gera partículas — cada uma com fase e velocidade de piscar próprias */
  const pts = Array.from({ length: N }, () => {
    const t = Math.random();
    return {
      arm:         Math.floor(Math.random() * ARMS),
      t,
      dAng:        (Math.random() - 0.5) * SCATTER_A,
      dRad:        (Math.random() - 0.5) * SCATTER_R,
      /* partículas maiores na borda (profundidade) */
      size:        0.5 + Math.random() * 1.4 + t * 1.0,
      alpha:       0.28 + Math.random() * 0.72,
      /* piscar individual — galáxia viva */
      phase:       Math.random() * Math.PI * 2,
      twinkleSpd:  0.0006 + Math.random() * 0.0014,
    };
  });

  let globalAngle = 0;
  let lastT = 0;

  /* ── Posicionamento do vórtice ────────────────────── */
  function resize() {
    /* Usa as dimensões CSS reais do canvas para evitar esticamento oval */
    W = canvas.width  = canvas.offsetWidth  || window.innerWidth;
    H = canvas.height = canvas.offsetHeight || window.innerHeight;
    const cw = Math.min(W - 64, 1200);
    const cl = (W - cw) / 2;
    vx = cl + cw * 0.75;
    vy = H / 2;
  }

  /* ── Cor ao longo da espiral ──────────────────────── */
  function lerpRGB(a, b, t) {
    return a.map((v, i) => Math.round(v + (b[i] - v) * t));
  }
  function colorAtT(t) {
    const [r, g, b] = t < 0.45
      ? lerpRGB(C_CYAN, C_BLUE,   t / 0.45)
      : lerpRGB(C_BLUE, C_PURPLE, (t - 0.45) / 0.55);
    return `rgb(${r},${g},${b})`;
  }

  /* ── Loop principal ───────────────────────────────── */
  function draw(ts) {
    const dt = Math.min(ts - lastT, 50);
    lastT = ts;
    globalAngle += ROT_SPEED * dt;

    /* Limpa o frame completamente (sem comet-trail — estilo Accenture) */
    ctx.fillStyle = 'rgb(5,8,16)';
    ctx.fillRect(0, 0, W, H);

    const maxR = Math.min(W, H) * 0.44;
    const minR = maxR * 0.07;

    ctx.save();
    for (const p of pts) {
      const armOffset = (p.arm / ARMS) * Math.PI * 2;
      const tR        = Math.max(0.001, Math.min(0.999, p.t + p.dRad));
      const radius    = minR + (maxR - minR) * Math.pow(tR, 0.68);
      const angle     = armOffset + globalAngle
                      - p.t * TURNS * Math.PI * 2
                      + p.dAng;

      const x = vx + radius * Math.cos(angle);
      const y = vy + radius * Math.sin(angle);

      /* Envelope: apaga suavemente nas bordas */
      const env     = Math.pow(Math.sin(p.t * Math.PI * 0.90 + 0.10), 0.30);
      /* Piscar individual — cada partícula tem seu próprio ritmo */
      const twinkle = 0.65 + 0.35 * Math.sin(ts * p.twinkleSpd + p.phase);
      const alpha   = p.alpha * env * twinkle;
      if (alpha < 0.025) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle   = colorAtT(p.t);
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* ── Brilho central em 3 camadas (núcleo → halo → aura) ── */
    const pulse = 0.78 + 0.22 * Math.sin(ts * 0.0008);

    // Aura exterior — grande e suave
    const auraR = maxR * 0.55 * pulse;
    const aura  = ctx.createRadialGradient(vx, vy, 0, vx, vy, auraR);
    aura.addColorStop(0,   `rgba(20,93,255,${0.06 * pulse})`);
    aura.addColorStop(0.4, `rgba(123,44,255,${0.03 * pulse})`);
    aura.addColorStop(1,   'rgba(5,8,16,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(vx, vy, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Halo médio — azul brilhante
    const haloR = maxR * 0.22 * pulse;
    const halo  = ctx.createRadialGradient(vx, vy, 0, vx, vy, haloR);
    halo.addColorStop(0,   `rgba(80,190,255,${0.30 * pulse})`);
    halo.addColorStop(0.5, `rgba(20,93,255,${0.14 * pulse})`);
    halo.addColorStop(1,   'rgba(5,8,16,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(vx, vy, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo — ponto branco-azulado intenso
    const coreR = maxR * 0.05 * pulse;
    const core  = ctx.createRadialGradient(vx, vy, 0, vx, vy, coreR);
    core.addColorStop(0,   `rgba(210,235,255,${0.80 * pulse})`);
    core.addColorStop(0.5, `rgba(80,190,255,${0.45 * pulse})`);
    core.addColorStop(1,   'rgba(5,8,16,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(vx, vy, coreR, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  /* ── Bootstrap ────────────────────────────────────── */
  window.addEventListener('resize', () => {
    resize();
    ctx.fillStyle = 'rgb(5,8,16)';
    ctx.fillRect(0, 0, W, H);
  });

  resize();
  ctx.fillStyle = 'rgb(5,8,16)';
  ctx.fillRect(0, 0, W, H);
  requestAnimationFrame(draw);
})();


/* ══════════════════════════════════════════════════════════
   2. NAVBAR — blur + background on scroll
   ══════════════════════════════════════════════════════════ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ══════════════════════════════════════════════════════════
   3. HAMBURGER MENU (mobile)
   ══════════════════════════════════════════════════════════ */
(function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  if (!hamburger || !navLinks) return;

  function toggleMenu() {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  hamburger.addEventListener('click', toggleMenu);

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) toggleMenu();
  });
})();


/* ══════════════════════════════════════════════════════════
   4. FADE-IN ON SCROLL (IntersectionObserver)
   ══════════════════════════════════════════════════════════ */
(function initFadeIn() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  els.forEach(el => observer.observe(el));
})();


/* ══════════════════════════════════════════════════════════
   6. CAROUSEL — Serviços (estilo Accenture)
   Auto-play 5.5s, pause/play, prev/next, touch swipe,
   progress bar, fade-up transitions entre slides.
   ══════════════════════════════════════════════════════════ */
(function initCarousel() {
  const section = document.getElementById('servicos');
  if (!section) return;

  const slides    = Array.from(section.querySelectorAll('.carousel-slide'));
  const pauseBtn  = section.querySelector('.carousel-pause');
  const prevBtn   = section.querySelector('.carousel-prev');
  const nextBtn   = section.querySelector('.carousel-next');
  const currentEl = section.querySelector('.carousel-current');
  const progFill  = section.querySelector('.carousel-progress-fill');

  if (!slides.length || !pauseBtn) return;

  const DURATION = 5500; // ms per slide
  let current = 0;
  let playing = true;
  let startTs = null;
  let rafId   = null;

  /* Icons */
  const ICON_PAUSE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
  const ICON_PLAY  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;

  /* ── Go to slide by index ── */
  function goTo(idx) {
    const prev = current;
    current = ((idx % slides.length) + slides.length) % slides.length;

    // Exit
    slides[prev].classList.remove('active');
    slides[prev].classList.add('leaving');
    setTimeout(() => slides[prev].classList.remove('leaving'), 500);

    // Enter
    slides[current].classList.add('active');
    if (currentEl) currentEl.textContent = current + 1;

    // Reset progress
    startTs = null;
    if (progFill) progFill.style.width = '0%';
  }

  /* ── Tick (RAF loop) ── */
  function tick(ts) {
    if (!playing) return;
    if (!startTs) startTs = ts;

    const elapsed = ts - startTs;
    const pct = Math.min((elapsed / DURATION) * 100, 100);
    if (progFill) progFill.style.width = pct + '%';

    if (elapsed >= DURATION) {
      goTo(current + 1);
    }

    if (playing) rafId = requestAnimationFrame(tick);
  }

  /* ── Pause / play ── */
  function setPlaying(val) {
    playing = val;
    pauseBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    pauseBtn.setAttribute('aria-label', playing ? 'Pausar slideshow' : 'Iniciar slideshow');

    if (playing) {
      startTs = null;
      rafId = requestAnimationFrame(tick);
    } else {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
  }

  /* ── Button listeners ── */
  pauseBtn.addEventListener('click', () => setPlaying(!playing));

  prevBtn.addEventListener('click', () => {
    goTo(current - 1);
    if (playing) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); }
  });

  nextBtn.addEventListener('click', () => {
    goTo(current + 1);
    if (playing) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); }
  });

  /* ── Touch swipe ── */
  let touchX = 0;
  section.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  section.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? current + 1 : current - 1);
      if (playing) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); }
    }
  }, { passive: true });

  /* ── Keyboard ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); if (playing) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); } }
    if (e.key === 'ArrowRight') { goTo(current + 1); if (playing) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); } }
  });

  /* ── Start ── */
  pauseBtn.innerHTML = ICON_PAUSE;
  rafId = requestAnimationFrame(tick);
})();


/* ══════════════════════════════════════════════════════════
   5. SMOOTH SCROLL (for older browsers without CSS support)
   ══════════════════════════════════════════════════════════ */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();
