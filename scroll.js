// Scroll effects: things fade in as they appear, a statement lights up word by word,
// and each app's phone stays on screen while its screens and features change with the scroll.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  // Fade and rise into view.
  const reveals = document.querySelectorAll('.reveal');
  if (still || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  // Split the statement into words so each can light up.
  const statement = document.querySelector('.statement-text');
  let words = [];
  if (statement) {
    const text = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    words = text.map((w) => {
      const s = document.createElement('span');
      s.textContent = w + ' ';
      statement.appendChild(s);
      return s;
    });
  }

  const shows = [...document.querySelectorAll('.show')].map((el) => ({
    el,
    phone: el.querySelector('.phone'),
    shots: [...el.querySelectorAll('.screen img')],
    steps: [...el.querySelectorAll('.step')],
    chips: [...el.querySelectorAll('.chip')],
    bar: el.querySelector('.bar i'),
    orbit: el.querySelector('.orbit'),
    active: -1,
  }));
  const heroMark = document.querySelector('.hero-mark');
  const statementTrack = document.querySelector('.statement');

  // How far through a tall track the page has scrolled, 0 to 1.
  const progress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight));
  };

  let ticking = false;
  function frame() {
    ticking = false;

    if (heroMark && !still) {
      const y = scrollY;
      heroMark.style.transform = `translateY(${y * 0.25}px) scale(${1 + y / 1400})`;
      heroMark.style.opacity = String(clamp(1 - y / 700));
    }

    if (statementTrack && words.length) {
      const p = still ? 1 : progress(statementTrack);
      const lit = Math.round(p * 1.15 * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    }

    for (const s of shows) {
      const p = progress(s.el);
      const step = Math.min(s.steps.length - 1, Math.floor(p * s.steps.length));
      if (step !== s.active) {
        s.active = step;
        s.shots.forEach((img, i) => {
          img.classList.toggle('on', i === step);
          img.classList.toggle('past', i < step);
        });
        s.steps.forEach((el, i) => el.classList.toggle('on', i === step));
      }
      if (s.bar) s.bar.style.transform = `scaleY(${p})`;
      if (still) continue;

      // The phone tips up and settles as the section arrives, then leans away as it leaves.
      const enter = ease(clamp(p / 0.14));
      const leave = clamp((p - 0.9) / 0.1);
      const tilt = (1 - enter) * 26 - leave * 10;
      const lift = (1 - enter) * 120 - leave * 40;
      const scale = 0.8 + enter * 0.2 - leave * 0.06;
      const turn = Math.sin(p * Math.PI * 2) * 4;
      s.phone.style.transform = `translateY(${lift}px) perspective(1400px) rotateX(${tilt}deg) rotateY(${turn}deg) scale(${scale})`;
      if (s.orbit) s.orbit.style.transform = `translate(-50%, -50%) rotate(${p * 300}deg) scale(${0.85 + enter * 0.25})`;
      s.chips.forEach((c, i) => {
        const dir = i % 2 ? -1 : 1;
        c.style.transform = `translate(${dir * (1 - enter) * 120}px, ${(0.5 - p) * (140 + i * 60)}px)`;
        c.style.opacity = String(enter * (1 - leave));
      });
    }
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  frame();
})();
