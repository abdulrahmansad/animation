(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;

  const xrayLayer = document.querySelector('.xray-layer');
  if (xrayLayer) {
    xrayLayer.style.background = 'rgba(5, 5, 5, .76)';
    xrayLayer.style.backdropFilter = 'grayscale(1) contrast(1.28)';
    xrayLayer.style.webkitBackdropFilter = 'grayscale(1) contrast(1.28)';
  }

  // Keep the loader theatrical, not obstructive. The page is static and does
  // not need a fake multi-second loading state.
  const bootShell = document.querySelector('.boot');
  if (bootShell) bootShell.style.transitionDuration = reducedMotion ? '0s' : '.68s';
  if (!reducedMotion) {
    window.setTimeout(() => {
      const counter = document.querySelector('.boot__counter');
      const line = document.querySelector('.boot__line span');
      if (counter) counter.textContent = '100';
      if (line) line.style.width = '100%';
      bootShell?.classList.add('is-done');
    }, 520);
  }

  // -------------------------------------------------------------------------
  // X-RAY MODE — the interface exposes the motion data it is already reading.
  // -------------------------------------------------------------------------
  const xrayToggle = document.querySelector('.xray-toggle');
  const xraySection = document.querySelector('#xray-section');
  const xrayPointer = document.querySelector('#xray-pointer');
  const xrayVelocity = document.querySelector('#xray-velocity');
  const sections = [...document.querySelectorAll('.section')];

  let xrayActive = false;
  let pointerX = innerWidth * 0.5;
  let pointerY = innerHeight * 0.5;
  let previousPointerX = pointerX;
  let previousPointerY = pointerY;
  let pointerSpeed = 0;
  let smoothPointerSpeed = 0;
  let scrollSpeed = 0;
  let smoothScrollSpeed = 0;
  let lastScrollY = window.scrollY;
  let currentSection = 0;

  const setXray = (next) => {
    xrayActive = Boolean(next);
    document.body.classList.toggle('xray-active', xrayActive);
    xrayToggle?.setAttribute('aria-pressed', String(xrayActive));
  };

  xrayToggle?.addEventListener('click', () => setXray(!xrayActive));

  window.addEventListener('keydown', (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    );
    if (!isTyping && event.key.toLowerCase() === 'x') {
      event.preventDefault();
      setXray(!xrayActive);
    }
  });

  window.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    const dx = pointerX - previousPointerX;
    const dy = pointerY - previousPointerY;
    pointerSpeed = Math.hypot(dx, dy);
    previousPointerX = pointerX;
    previousPointerY = pointerY;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    const next = window.scrollY;
    scrollSpeed = Math.abs(next - lastScrollY);
    lastScrollY = next;
  }, { passive: true });

  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const index = sections.indexOf(visible.target);
    if (index >= 0) currentSection = index;
  }, { threshold: [0.2, 0.4, 0.6] });

  sections.forEach((section) => sectionObserver.observe(section));

  const updateXray = () => {
    smoothPointerSpeed = lerp(smoothPointerSpeed, pointerSpeed, 0.16);
    smoothScrollSpeed = lerp(smoothScrollSpeed, scrollSpeed, 0.12);
    pointerSpeed *= 0.72;
    scrollSpeed *= 0.72;

    const angle = Math.atan2(pointerY - innerHeight / 2, pointerX - innerWidth / 2) * 180 / Math.PI;
    root.style.setProperty('--xr-x', `${pointerX}px`);
    root.style.setProperty('--xr-y', `${pointerY}px`);
    root.style.setProperty('--xr-rotation', `${angle}deg`);

    if (xrayPointer) {
      xrayPointer.textContent = `PTR ${String(Math.round(pointerX)).padStart(4, '0')} / ${String(Math.round(pointerY)).padStart(4, '0')}`;
    }
    if (xrayVelocity) {
      xrayVelocity.textContent = `VEL ${smoothPointerSpeed.toFixed(1)} · SCR ${smoothScrollSpeed.toFixed(1)}`;
    }
    if (xraySection) {
      const section = sections[currentSection];
      const label = section?.dataset.xrayLabel || `SECTION ${String(currentSection + 1).padStart(2, '0')}`;
      xraySection.textContent = `SECTION ${String(currentSection + 1).padStart(2, '0')} / ${label}`;
    }

    requestAnimationFrame(updateXray);
  };

  requestAnimationFrame(updateXray);

  // -------------------------------------------------------------------------
  // DISTORTION CHAMBER — cursor velocity becomes displacement intensity.
  // -------------------------------------------------------------------------
  const stage = document.querySelector('#signal-stage');
  const displace = document.querySelector('#signal-displace');
  const turbulence = document.querySelector('#signal-noise');
  const forceReadout = document.querySelector('#signal-force');
  const frequencyReadout = document.querySelector('#signal-frequency');

  if (stage && displace && turbulence) {
    let stageVisible = false;
    let lastX = 0;
    let lastY = 0;
    let lastTime = performance.now();
    let targetForce = 0;
    let force = 0;
    let burst = 0;
    let frequency = 0.006;
    let ruptureTimer = 0;

    const stageObserver = new IntersectionObserver((entries) => {
      stageVisible = entries[0]?.isIntersecting ?? false;
    }, { threshold: 0.05 });
    stageObserver.observe(stage);

    const updateLocalPointer = (event) => {
      const rect = stage.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, rect.width);
      const y = clamp(event.clientY - rect.top, 0, rect.height);
      const now = performance.now();
      const elapsed = Math.max(8, now - lastTime);
      const distance = Math.hypot(x - lastX, y - lastY);
      const pixelsPerFrame = distance * (16.667 / elapsed);

      targetForce = clamp(pixelsPerFrame * 1.35, 0, 92);
      lastX = x;
      lastY = y;
      lastTime = now;

      stage.style.setProperty('--signal-x', `${(x / rect.width) * 100}%`);
      stage.style.setProperty('--signal-y', `${(y / rect.height) * 100}%`);
    };

    const rupture = () => {
      if (reducedMotion) return;
      burst = 118;
      targetForce = Math.max(targetForce, 70);
      stage.classList.add('is-rupturing');
      window.clearTimeout(ruptureTimer);
      ruptureTimer = window.setTimeout(() => stage.classList.remove('is-rupturing'), 420);
    };

    stage.addEventListener('pointerenter', (event) => {
      const rect = stage.getBoundingClientRect();
      lastX = event.clientX - rect.left;
      lastY = event.clientY - rect.top;
      lastTime = performance.now();
    });
    stage.addEventListener('pointermove', updateLocalPointer, { passive: true });
    stage.addEventListener('pointerdown', (event) => {
      updateLocalPointer(event);
      rupture();
    });
    stage.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        rupture();
      }
    });
    stage.addEventListener('pointerleave', () => { targetForce = 0; });

    const animateSignal = () => {
      if (stageVisible && !document.hidden) {
        if (reducedMotion) {
          force = 0;
          burst = 0;
        } else {
          force = lerp(force, Math.max(targetForce, burst), 0.14);
          targetForce *= 0.86;
          burst *= 0.88;
        }

        const total = clamp(force, 0, 118);
        frequency = 0.006 + total * 0.000055;
        displace.setAttribute('scale', total.toFixed(2));
        turbulence.setAttribute('baseFrequency', `${frequency.toFixed(4)} ${(frequency * 3.15).toFixed(4)}`);
        stage.style.setProperty('--signal-energy', String(clamp(0.18 + total / 145, 0.18, 1)));
        stage.style.setProperty('--signal-ring', String(0.72 + total / 240));
        stage.style.setProperty('--signal-cursor-scale', String(0.82 + total / 220));

        if (forceReadout) forceReadout.textContent = `FORCE ${String(Math.round(total)).padStart(3, '0')}`;
        if (frequencyReadout) frequencyReadout.textContent = `FREQ ${frequency.toFixed(3)}`;
      }
      requestAnimationFrame(animateSignal);
    };
    requestAnimationFrame(animateSignal);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      previousPointerX = pointerX;
      previousPointerY = pointerY;
      lastScrollY = window.scrollY;
    }
  });
})();
