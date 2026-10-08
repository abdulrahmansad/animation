(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Boot sequence ------------------------------------------------------------
  const boot = document.querySelector('.boot');
  const bootCounter = document.querySelector('.boot__counter');
  const bootLine = document.querySelector('.boot__line span');

  const finishBoot = () => {
    if (!boot) return;
    bootCounter.textContent = '100';
    bootLine.style.width = '100%';
    window.setTimeout(() => boot.classList.add('is-done'), reducedMotion ? 0 : 260);
  };

  if (reducedMotion) {
    finishBoot();
  } else {
    let value = 0;
    const bootTimer = window.setInterval(() => {
      value += Math.ceil(Math.random() * 11);
      value = Math.min(value, 100);
      bootCounter.textContent = String(value).padStart(2, '0');
      bootLine.style.width = `${value}%`;
      if (value >= 100) {
        window.clearInterval(bootTimer);
        finishBoot();
      }
    }, 45);
  }

  // Cursor system ------------------------------------------------------------
  const cursorDot = document.querySelector('.cursor--dot');
  const cursorRing = document.querySelector('.cursor--ring');
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
  const ring = { x: pointer.x, y: pointer.y };

  if (!coarsePointer && !reducedMotion) {
    window.addEventListener('pointermove', (event) => {
      pointer.tx = event.clientX;
      pointer.ty = event.clientY;
      if (cursorDot) {
        cursorDot.style.left = `${event.clientX}px`;
        cursorDot.style.top = `${event.clientY}px`;
      }
    });

    document.querySelectorAll('a, button, .tilt-card').forEach((el) => {
      el.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
    });

    document.querySelectorAll('.system-row').forEach((el) => {
      el.addEventListener('pointerenter', () => document.body.classList.add('cursor-view'));
      el.addEventListener('pointerleave', () => document.body.classList.remove('cursor-view'));
    });

    const animateCursor = () => {
      ring.x = lerp(ring.x, pointer.tx, 0.16);
      ring.y = lerp(ring.y, pointer.ty, 0.16);
      if (cursorRing) {
        cursorRing.style.left = `${ring.x}px`;
        cursorRing.style.top = `${ring.y}px`;
      }
      requestAnimationFrame(animateCursor);
    };
    animateCursor();
  }

  // Magnetic elements --------------------------------------------------------
  if (!coarsePointer && !reducedMotion) {
    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        element.style.transform = `translate(${dx * 0.14}px, ${dy * 0.14}px)`;
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = 'translate(0, 0)';
      });
    });
  }

  // Reveal observers ---------------------------------------------------------
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal-up').forEach((el) => revealObserver.observe(el));

  // Scroll choreography ------------------------------------------------------
  const progress = document.querySelector('.scroll-progress span');
  const kineticLines = [...document.querySelectorAll('.kinetic-line')];
  const splitCopy = document.querySelector('.split-lines');
  const manifesto = document.querySelector('.manifesto');

  const onScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const ratio = clamp(scrollY / maxScroll, 0, 1);
    if (progress) progress.style.height = `${ratio * 100}%`;

    if (!reducedMotion) {
      kineticLines.forEach((line, index) => {
        const dir = Number(line.dataset.direction || 1);
        const amount = scrollY * (0.05 + index * 0.012) * dir;
        const word = line.querySelector('.kinetic-word');
        const ghost = line.querySelector('.kinetic-ghost');
        if (word) word.style.transform = `translate3d(${amount}px,0,0)`;
        if (ghost) ghost.style.transform = `translate3d(${amount * -0.7}px,0,0)`;
      });

      if (manifesto && splitCopy) {
        const rect = manifesto.getBoundingClientRect();
        const local = clamp((innerHeight - rect.top) / (innerHeight + rect.height * 0.52), 0, 1);
        splitCopy.style.setProperty('--reveal', `${local * 112}%`);
      }
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Button-assisted scrolling ------------------------------------------------
  document.querySelectorAll('[data-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.scroll);
      target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  // 3D card tilt -------------------------------------------------------------
  if (!coarsePointer && !reducedMotion) {
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-ny * 5}deg) rotateY(${nx * 7}deg) translateZ(0)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  // Animated metrics ---------------------------------------------------------
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = Number(entry.target.dataset.count || 0);
      const duration = reducedMotion ? 1 : 900;
      const start = performance.now();
      const tick = (now) => {
        const p = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        entry.target.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.65 });

  document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));

  // Canvas field -------------------------------------------------------------
  const canvas = document.querySelector('#particle-canvas');
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    const particles = [];
    const mouse = { x: innerWidth / 2, y: innerHeight / 2, active: false };
    let dpr = Math.min(devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = coarsePointer ? 34 : Math.min(86, Math.floor((innerWidth * innerHeight) / 18000));
      particles.length = 0;
      for (let i = 0; i < targetCount; i += 1) {
        particles.push({
          x: Math.random() * innerWidth,
          y: Math.random() * innerHeight,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.3 + 0.35,
          phase: Math.random() * Math.PI * 2
        });
      }
    };

    window.addEventListener('pointermove', (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;
    }, { passive: true });
    window.addEventListener('pointerleave', () => { mouse.active = false; });
    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();

    const drawField = (time) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.fillStyle = 'rgba(199,255,47,.78)';
      ctx.strokeStyle = 'rgba(199,255,47,.085)';
      ctx.lineWidth = 0.6;

      particles.forEach((p) => {
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 32000 && dist2 > 120) {
            const force = 0.012 / Math.max(1, Math.sqrt(dist2) * 0.06);
            p.vx += dx * force * 0.004;
            p.vy += dy * force * 0.004;
          }
        }

        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = innerWidth + 10;
        if (p.x > innerWidth + 10) p.x = -10;
        if (p.y < -10) p.y = innerHeight + 10;
        if (p.y > innerHeight + 10) p.y = -10;

        const pulse = 0.7 + Math.sin(time * 0.001 + p.phase) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 7200) {
            ctx.globalAlpha = (1 - dist2 / 7200) * 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(drawField);
    };
    requestAnimationFrame(drawField);
  }

  // Motion Lab: drag + spring followers -------------------------------------
  const lab = document.querySelector('#motion-lab');
  const core = lab?.querySelector('.lab-core');
  const satellites = lab ? [...lab.querySelectorAll('.satellite')] : [];
  const velocityReadout = document.querySelector('#velocity-readout');

  if (lab && core) {
    let rect = lab.getBoundingClientRect();
    let dragging = false;
    let target = { x: rect.width / 2, y: rect.height / 2 };
    let corePos = { ...target };
    let previous = { ...target };
    let velocity = { x: 0, y: 0 };
    const followers = satellites.map((el, index) => ({
      el,
      x: target.x,
      y: target.y,
      vx: 0,
      vy: 0,
      spring: 0.05 + index * 0.017,
      damping: 0.82 - index * 0.03,
      offset: (index + 1) * 36
    }));

    const measureLab = () => {
      rect = lab.getBoundingClientRect();
      if (!dragging) {
        target.x = rect.width / 2;
        target.y = rect.height / 2;
      }
    };
    window.addEventListener('resize', measureLab, { passive: true });

    const setTargetFromEvent = (event) => {
      rect = lab.getBoundingClientRect();
      const coreRadius = core.offsetWidth / 2;
      target.x = clamp(event.clientX - rect.left, coreRadius + 8, rect.width - coreRadius - 8);
      target.y = clamp(event.clientY - rect.top, coreRadius + 8, rect.height - coreRadius - 8);
    };

    core.addEventListener('pointerdown', (event) => {
      dragging = true;
      core.setPointerCapture(event.pointerId);
      setTargetFromEvent(event);
    });
    core.addEventListener('pointermove', (event) => {
      if (dragging) setTargetFromEvent(event);
    });
    core.addEventListener('pointerup', () => { dragging = false; });
    core.addEventListener('pointercancel', () => { dragging = false; });

    const animateLab = () => {
      if (reducedMotion) {
        corePos.x = target.x;
        corePos.y = target.y;
      } else {
        corePos.x = lerp(corePos.x, target.x, dragging ? 0.28 : 0.09);
        corePos.y = lerp(corePos.y, target.y, dragging ? 0.28 : 0.09);
      }

      velocity.x = corePos.x - previous.x;
      velocity.y = corePos.y - previous.y;
      previous = { ...corePos };
      const speed = Math.hypot(velocity.x, velocity.y);

      core.style.left = `${corePos.x}px`;
      core.style.top = `${corePos.y}px`;
      core.style.transform = `translate(-50%,-50%) rotate(${clamp(velocity.x * 1.8, -18, 18)}deg) scale(${1 + Math.min(speed * 0.006, 0.08)})`;
      if (velocityReadout) velocityReadout.textContent = `VEL ${speed.toFixed(2)}`;

      followers.forEach((follower, index) => {
        const leadX = corePos.x - velocity.x * follower.offset;
        const leadY = corePos.y - velocity.y * follower.offset;
        follower.vx += (leadX - follower.x) * follower.spring;
        follower.vy += (leadY - follower.y) * follower.spring;
        follower.vx *= follower.damping;
        follower.vy *= follower.damping;
        follower.x += follower.vx;
        follower.y += follower.vy;

        follower.el.style.left = `${follower.x}px`;
        follower.el.style.top = `${follower.y}px`;
        follower.el.style.transform = `translate(-50%,-50%) scale(${1 - index * 0.06})`;
      });

      requestAnimationFrame(animateLab);
    };
    requestAnimationFrame(animateLab);
  }

  // Keep anchor links friendly to keyboard users ----------------------------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const destination = document.querySelector(id);
      if (!destination) return;
      event.preventDefault();
      destination.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();
