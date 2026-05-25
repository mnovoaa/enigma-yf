/* ENIGMA yf — Crónicas de Gotham — page behavior */

(() => {
  // ── DETECCIÓN DE PREFERENCIAS ────────────────────────
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || window.innerWidth <= 880;

  // ── MOBILE NAV ────────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');

  function openMobileNav() {
    mobileNav.classList.add('mobile-nav--open');
    mobileNav.setAttribute('aria-hidden', 'false');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
    navToggle.classList.add('hud__burger--open');
    document.body.classList.add('nav-open');
  }

  function closeMobileNav() {
    mobileNav.classList.remove('mobile-nav--open');
    mobileNav.setAttribute('aria-hidden', 'true');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
    navToggle.classList.remove('hud__burger--open');
    document.body.classList.remove('nav-open');
  }

  navToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('mobile-nav--open');
    isOpen ? closeMobileNav() : openMobileNav();
  });

  // Cerrar al hacer click en un link
  mobileNav.querySelectorAll('.mobile-nav__link').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('mobile-nav--open')) {
      closeMobileNav();
      navToggle.focus();
    }
  });

  // ── TRACKLIST ────────────────────────────────────────
  const tracks = [
    { n: '01', title: 'Blanco',     time: '03:24' },
    { n: '02', title: 'Gato Nuevo', time: '03:08' },
    { n: '03', title: 'Solo II',    time: '04:01' },
    { n: '04', title: 'Iguales',    time: '03:42' },
    { n: '05', title: 'Amazona',    time: '03:27' },
  ];

  const tracklistEl = document.getElementById('tracklist');
  const totalSeconds = tracks.reduce((acc, t) => {
    const [m, s] = t.time.split(':').map(Number);
    return acc + m * 60 + s;
  }, 0);

  tracks.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'track';
    el.dataset.cursor = 'hover';
    el.dataset.index = i;
    el.setAttribute('role', 'listitem');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `Pista ${t.n}: ${t.title}, duración ${t.time}`);
    el.innerHTML = `
      <div class="track__num" aria-hidden="true">${t.n}</div>
      <div class="track__title">${t.title}</div>
      <div class="track__time" aria-hidden="true">${t.time}</div>
      <div class="track__play" aria-hidden="true">
        <svg class="ic-play" viewBox="0 0 14 14" fill="currentColor"><path d="M2 1l11 6L2 13z"/></svg>
      </div>
      <div class="track__waveform" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
    `;
    tracklistEl.appendChild(el);
  });

  let playingIdx = -1;
  let progress = 0;
  let playTimer = null;

  const coverBar = document.getElementById('coverBar');
  const coverTime = document.getElementById('coverTime');

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function setIcon(el, type) {
    const svg = el.querySelector('.track__play svg');
    if (!svg) return;
    if (type === 'pause') {
      svg.innerHTML = '<rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/>';
    } else {
      svg.innerHTML = '<path d="M2 1l11 6L2 13z"/>';
    }
  }

  function updateCover() {
    const ratio = progress / totalSeconds;
    coverBar.style.width = `${Math.min(100, ratio * 100)}%`;
    coverTime.textContent = `${fmt(progress)} / ${fmt(totalSeconds)}`;
  }
  updateCover();

  function stopAll() {
    document.querySelectorAll('.track').forEach((t) => {
      t.classList.remove('playing');
      setIcon(t, 'play');
    });
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
  }

  function play(idx) {
    stopAll();
    const trackEl = tracklistEl.children[idx];
    if (!trackEl) return;
    trackEl.classList.add('playing');
    setIcon(trackEl, 'pause');
    playingIdx = idx;

    let start = 0;
    for (let i = 0; i < idx; i++) {
      const [m, s] = tracks[i].time.split(':').map(Number);
      start += m * 60 + s;
    }
    progress = start;
    updateCover();

    playTimer = setInterval(() => {
      progress += 1;
      if (progress >= totalSeconds) {
        progress = totalSeconds;
        stopAll();
        playingIdx = -1;
      }
      updateCover();
    }, 1000);
  }

  tracklistEl.addEventListener('click', (e) => {
    const el = e.target.closest('.track');
    if (!el) return;
    const idx = Number(el.dataset.index);
    if (playingIdx === idx) {
      stopAll();
      playingIdx = -1;
    } else {
      play(idx);
    }
  });

  // Teclado: Enter o Space para reproducir pista
  tracklistEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = e.target.closest('.track');
      if (!el) return;
      e.preventDefault();
      el.click();
    }
  });

  // ── HUD CLOCK ────────────────────────────────────────
  const clockEl = document.getElementById('hudClock');
  function tickClock() {
    const d = new Date();
    clockEl.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  tickClock();
  // Actualizar cada minuto (reloj no muestra segundos)
  setInterval(tickClock, 60000);

  // ── CATHEDRAL PARALLAX ───────────────────────────────
  const cathedral = document.getElementById('cathedral');
  let scrollY = 0;
  let scrollTarget = 0;

  window.addEventListener('scroll', () => {
    scrollTarget = window.scrollY;
  }, { passive: true });

  // Sólo animar parallax si el usuario no prefiere movimiento reducido
  if (!reducedMotion) {
    function parallaxLoop() {
      scrollY += (scrollTarget - scrollY) * 0.08;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const t = docH > 0 ? Math.min(1, Math.max(0, scrollY / docH)) : 0;

      const scale = 1 + t * 0.18;
      const yShift = -t * 8;
      const base = parseFloat(cathedral.dataset.baseBrightness || '0.95');
      const brightness = Math.max(0.1, base - t * 0.35);
      const contrast = 1.05 + t * 0.1;
      cathedral.style.transform = `translateY(${yShift}%) scale(${scale})`;
      cathedral.style.filter = `contrast(${contrast}) brightness(${brightness})`;

      requestAnimationFrame(parallaxLoop);
    }
    parallaxLoop();
  }

  // ── CUSTOM CURSOR ────────────────────────────────────
  const cursor = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursorRing');

  // Sólo activar cursor custom en dispositivos de puntero fino
  if (window.matchMedia('(pointer:fine)').matches) {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = `${mx}px`;
      cursor.style.top = `${my}px`;
    }, { passive: true });

    if (!reducedMotion) {
      function cursorLoop() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        cursorRing.style.left = `${rx}px`;
        cursorRing.style.top = `${ry}px`;
        requestAnimationFrame(cursorLoop);
      }
      cursorLoop();
    } else {
      // Sin animación suave: cursor anillado sigue directo
      window.addEventListener('mousemove', (e) => {
        cursorRing.style.left = `${e.clientX}px`;
        cursorRing.style.top = `${e.clientY}px`;
      }, { passive: true });
    }

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('[data-cursor="hover"]')) {
        cursor.classList.add('cursor--hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('[data-cursor="hover"]')) {
        cursor.classList.remove('cursor--hover');
      }
    });
  }

  // ── BAT FLIGHT ───────────────────────────────────────
  const batLayer = document.getElementById('batflight');

  // Menos murciélagos en móvil o con motion reducida
  const batsEnabled = !reducedMotion;

  function spawnBat() {
    if (!batsEnabled) return;
    const bat = document.createElement('div');
    bat.className = 'bat';
    const fromLeft = Math.random() < 0.6;
    const size = 22 + Math.random() * 28;
    bat.style.width = `${size}px`;
    bat.style.height = `${size * 0.6}px`;
    bat.style.opacity = 0.45 + Math.random() * 0.4;

    const startX = fromLeft ? -80 : window.innerWidth + 40;
    const startY = Math.random() * window.innerHeight * 0.7;
    bat.style.left = `${startX}px`;
    bat.style.top = `${startY}px`;

    const dx = (fromLeft ? 1 : -1) * (window.innerWidth + 200);
    const dy = (Math.random() - 0.3) * 200;
    const dur = 6 + Math.random() * 6;

    bat.animate(
      [
        { transform: 'translate(0,0) scaleY(.55)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 30}px) scaleY(1)` },
        { transform: `translate(${dx}px, ${dy}px) scaleY(.55)` },
      ],
      { duration: dur * 1000, easing: 'ease-in-out' }
    );

    batLayer.appendChild(bat);
    setTimeout(() => bat.remove(), dur * 1000 + 100);
  }

  if (batsEnabled) {
    // Menos en móvil para no sacrificar rendimiento
    const interval = isMobile ? 8000 : 4500;
    setTimeout(() => spawnBat(), 1200);
    if (!isMobile) setTimeout(() => spawnBat(), 3400);
    setInterval(() => {
      if (Math.random() < (isMobile ? 0.5 : 0.7)) spawnBat();
    }, interval);
  }

  // ── REVEAL ON SCROLL ─────────────────────────────────
  const revealEls = document.querySelectorAll(
    '.silencio__inner, .album__head, .album__body, .cronicas__head, .gallery .frame, .cosmos__script, .cosmos__verse, .cosmos__stats, .sigilo__bat, .sigilo__line, .sigilo__contact'
  );

  if (!reducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
            io.unobserve(e.target); // dejar de observar una vez visible
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity 1.2s ease, transform 1.2s cubic-bezier(.2,.7,.2,1)';
      io.observe(el);
    });
  }
  // Con movimiento reducido, mostrar todo inmediatamente
  else {
    revealEls.forEach((el) => {
      el.style.opacity = '1';
    });
  }
})();
