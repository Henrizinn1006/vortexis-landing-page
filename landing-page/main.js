(function initVortex() {
  const canvas = document.getElementById('vortex-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, vx, vy;

  /* ── Espiral ──────────────────────────────────────── */
  const ARMS      = 2;
  const TURNS     = 1.55;
  const ROT_SPEED = 0.000065;

  /* ── Partículas ───────────────────────────────────── */
  const N         = 1200;   // total de pontos
  const SCATTER_A = 0.22;   // dispersão angular
  const SCATTER_R = 0.06;   // dispersão radial

  /* ── Paleta ───────────────────────────────────────── */
  const C_CYAN   = [80,  190, 255];
  const C_BLUE   = [20,  93,  255];
  const C_PURPLE = [123, 44,  255];

  /* Pré-gera partículas*/
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

    /* Limpa o frame completamente */
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

      const env     = Math.pow(Math.sin(p.t * Math.PI * 0.90 + 0.10), 0.30);
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

    // Halo médio
    const haloR = maxR * 0.22 * pulse;
    const halo  = ctx.createRadialGradient(vx, vy, 0, vx, vy, haloR);
    halo.addColorStop(0,   `rgba(80,190,255,${0.30 * pulse})`);
    halo.addColorStop(0.5, `rgba(20,93,255,${0.14 * pulse})`);
    halo.addColorStop(1,   'rgba(5,8,16,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(vx, vy, haloR, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo
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


(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


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


/* FADE-IN ON SCROLL */
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

  const ICON_PAUSE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
  const ICON_PLAY  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;

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

  /* Tick */
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

  /* Button listeners */
  pauseBtn.addEventListener('click', () => setPlaying(!playing));

  prevBtn.addEventListener('click', () => {
    goTo(current - 1);
    if (playing) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); }
  });

  nextBtn.addEventListener('click', () => {
    goTo(current + 1);
    if (playing) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); }
  });

  /* Touch swipe */
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


/* SMOOTH SCROLL */
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


/* EXTENDED SCROLL ANIMATIONS (fade-up, fade-left, fade-right, scale-in) */
(function initExtendedAnimations() {
  const els = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => observer.observe(el));
})();


/* ANIMATED COUNTERS */
(function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(c => observer.observe(c));
})();


/* CURSOR PARALLAX TILT (desktop only) */
(function initTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  const cards = document.querySelectorAll(
    '.process-card, .bento-card, .stat-card, .diff-card'
  );

  if (cards.length) cards.forEach(card => {
    let raf = null;

    card.addEventListener('mousemove', (e) => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
        const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
        card.style.transform = `translateY(-6px) rotateX(${-dy * 3.5}deg) rotateY(${dx * 3.5}deg)`;
        card.style.transformStyle = 'preserve-3d';
        card.style.transition = 'transform 0.1s ease, border-color 0.35s, box-shadow 0.35s';
      });
    });

    card.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = '';
      card.style.transition = '';
    });
  });
})();



/* ═══════════════════════════════════════════
   CTA CIRCUIT BOARD ANIMATION
═══════════════════════════════════════════ */
(function initCtaCircuit() {
  var canvas = document.getElementById('cta-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var section = document.getElementById('contato');
  if (!section) return;

  var W, H, rafId = null, active = false, t = 0;

  /* grid config */
  var COLS, ROWS, CELL;
  var nodes = [];   /* {x,y,active,brightness} */
  var pulses = [];  /* {col,row,dir,progress,col_idx} */

  var COLORS = [
    [20,  93,  255],
    [80,  190, 255],
    [123, 44,  255]
  ];

  function resize() {
    W = canvas.width  = section.clientWidth;
    H = canvas.height = section.clientHeight;
    CELL = window.innerWidth < 768 ? 60 : 80;
    COLS = Math.floor(W / CELL) + 1;
    ROWS = Math.floor(H / CELL) + 1;
    buildGrid();
  }

  function buildGrid() {
    nodes = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        nodes.push({
          x: c * CELL + (W - (COLS - 1) * CELL) / 2,
          y: r * CELL + (H - (ROWS - 1) * CELL) / 2,
          brightness: 0,
          col_idx: Math.floor(Math.random() * COLORS.length)
        });
      }
    }
  }

  function getNode(c, r) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
    return nodes[r * COLS + c];
  }

  function spawnPulse() {
    /* random starting node on edge or interior */
    var dir  = Math.random() < 0.5 ? 0 : 1;  /* 0=horizontal,1=vertical */
    var col_idx = Math.floor(Math.random() * COLORS.length);
    if (dir === 0) {
      var row = Math.floor(Math.random() * ROWS);
      pulses.push({ col: 0, row: row, dir: 0, progress: 0, col_idx: col_idx, maxCol: COLS });
    } else {
      var col = Math.floor(Math.random() * COLS);
      pulses.push({ col: col, row: 0, dir: 1, progress: 0, col_idx: col_idx, maxRow: ROWS });
    }
  }

  function tick() {
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    /* spawn pulses */
    if (Math.random() < 0.04 && pulses.length < 18) spawnPulse();

    /* draw grid dots (dim) */
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.brightness = Math.max(0, n.brightness - 0.04);
      var b = 0.06 + n.brightness * 0.6;
      var col = COLORS[n.col_idx];
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + b + ')';
      ctx.fill();
    }

    /* draw grid lines (very dim) */
    ctx.lineWidth = 0.5;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS - 1; c++) {
        var na = getNode(c, r), nb = getNode(c + 1, r);
        if (!na || !nb) continue;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = 'rgba(20,93,255,0.06)';
        ctx.stroke();
      }
    }
    for (var c2 = 0; c2 < COLS; c2++) {
      for (var r2 = 0; r2 < ROWS - 1; r2++) {
        var na2 = getNode(c2, r2), nb2 = getNode(c2, r2 + 1);
        if (!na2 || !nb2) continue;
        ctx.beginPath();
        ctx.moveTo(na2.x, na2.y);
        ctx.lineTo(nb2.x, nb2.y);
        ctx.strokeStyle = 'rgba(20,93,255,0.06)';
        ctx.stroke();
      }
    }

    /* update & draw pulses */
    var alive = [];
    for (var p = 0; p < pulses.length; p++) {
      var pulse = pulses[p];
      pulse.progress += 0.035;

      var col = COLORS[pulse.col_idx];
      var R = col[0], G = col[1], B = col[2];

      if (pulse.dir === 0) {
        /* horizontal */
        var seg = Math.floor(pulse.progress);
        var frac = pulse.progress - seg;
        var c1 = pulse.col + seg;
        var c2b = c1 + 1;
        if (c1 >= pulse.maxCol) continue;  /* dead */
        alive.push(pulse);

        /* light up passed nodes */
        for (var s = 0; s <= seg && s < pulse.maxCol; s++) {
          var nn = getNode(pulse.col + s, pulse.row);
          if (nn) { nn.brightness = 1; nn.col_idx = pulse.col_idx; }
        }

        /* glowing trace on current segment */
        var na3 = getNode(c1, pulse.row);
        var nb3 = getNode(c2b, pulse.row);
        if (na3 && nb3) {
          /* tail glow */
          var grd = ctx.createLinearGradient(na3.x, na3.y, nb3.x, nb3.y);
          grd.addColorStop(0,    'rgba(' + R + ',' + G + ',' + B + ',0)');
          grd.addColorStop(0.3,  'rgba(' + R + ',' + G + ',' + B + ',0.35)');
          grd.addColorStop(frac, 'rgba(' + R + ',' + G + ',' + B + ',0.9)');
          grd.addColorStop(Math.min(frac + 0.01, 1), 'rgba(' + R + ',' + G + ',' + B + ',0)');

          ctx.beginPath();
          ctx.moveTo(na3.x, na3.y);
          ctx.lineTo(nb3.x, nb3.y);
          ctx.strokeStyle = grd;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          /* bright head dot */
          var hx = na3.x + (nb3.x - na3.x) * frac;
          var hy = na3.y + (nb3.y - na3.y) * frac;
          var hgrd = ctx.createRadialGradient(hx, hy, 0, hx, hy, 12);
          hgrd.addColorStop(0, 'rgba(' + R + ',' + G + ',' + B + ',1)');
          hgrd.addColorStop(0.4,'rgba(' + R + ',' + G + ',' + B + ',0.6)');
          hgrd.addColorStop(1, 'rgba(' + R + ',' + G + ',' + B + ',0)');
          ctx.beginPath();
          ctx.arc(hx, hy, 12, 0, Math.PI * 2);
          ctx.fillStyle = hgrd;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(hx, hy, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fill();
        }
      } else {
        /* vertical */
        var seg2 = Math.floor(pulse.progress);
        var frac2 = pulse.progress - seg2;
        var r1 = pulse.row + seg2;
        var r2c = r1 + 1;
        if (r1 >= pulse.maxRow) continue;
        alive.push(pulse);

        for (var s2 = 0; s2 <= seg2 && s2 < pulse.maxRow; s2++) {
          var nn2 = getNode(pulse.col, pulse.row + s2);
          if (nn2) { nn2.brightness = 1; nn2.col_idx = pulse.col_idx; }
        }

        var na4 = getNode(pulse.col, r1);
        var nb4 = getNode(pulse.col, r2c);
        if (na4 && nb4) {
          var grd2 = ctx.createLinearGradient(na4.x, na4.y, nb4.x, nb4.y);
          grd2.addColorStop(0,     'rgba(' + R + ',' + G + ',' + B + ',0)');
          grd2.addColorStop(0.3,   'rgba(' + R + ',' + G + ',' + B + ',0.35)');
          grd2.addColorStop(frac2, 'rgba(' + R + ',' + G + ',' + B + ',0.9)');
          grd2.addColorStop(Math.min(frac2 + 0.01, 1), 'rgba(' + R + ',' + G + ',' + B + ',0)');

          ctx.beginPath();
          ctx.moveTo(na4.x, na4.y);
          ctx.lineTo(nb4.x, nb4.y);
          ctx.strokeStyle = grd2;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          var hx2 = na4.x + (nb4.x - na4.x) * frac2;
          var hy2 = na4.y + (nb4.y - na4.y) * frac2;
          var hgrd2 = ctx.createRadialGradient(hx2, hy2, 0, hx2, hy2, 12);
          hgrd2.addColorStop(0, 'rgba(' + R + ',' + G + ',' + B + ',1)');
          hgrd2.addColorStop(0.4,'rgba(' + R + ',' + G + ',' + B + ',0.6)');
          hgrd2.addColorStop(1, 'rgba(' + R + ',' + G + ',' + B + ',0)');
          ctx.beginPath();
          ctx.arc(hx2, hy2, 12, 0, Math.PI * 2);
          ctx.fillStyle = hgrd2;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(hx2, hy2, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fill();
        }
      }
    }
    pulses = alive;

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    active = true;
    resize();
    /* pre-spawn a few pulses */
    for (var i = 0; i < 4; i++) spawnPulse();
    tick();
  }

  function stop() {
    active = false;
    cancelAnimationFrame(rafId);
  }

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting && !active) start();
      else if (!e.isIntersecting && active) stop();
    });
  }, { threshold: 0.05 });
  obs.observe(section);

  window.addEventListener('resize', function() {
    if (!active) return;
    resize();
  });
})();
