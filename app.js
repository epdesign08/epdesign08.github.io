// Animations for the app pages: tilting feature cards, Jolt's typing editor, and Stallwise's counting result card.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const whenVisible = (el, fn) => {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold: 0.3 });
    io.observe(el);
  };

  // Cards lean toward the pointer, with a soft light where it points.
  if (!still && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.feature').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  // Jolt: type a program, press play, and show what the board prints. Then the next one.
  const code = document.getElementById('demo-code');
  if (code) {
    const term = document.getElementById('demo-term');
    const run = document.querySelector('.demo-bar .run');
    const title = document.getElementById('demo-title');
    const programs = [
      { name: 'Desk lights', code: '# Desk lights\nfrom machine import Pin\nimport neopixel\n\nstrip = neopixel.NeoPixel(Pin(5), 30)\nstrip.fill((90, 0, 160))\nstrip.write()\nprint("Lights on")',
        out: ['Lights on'] },
      { name: 'Plant watcher', code: '# Plant watcher\nfrom machine import ADC, Pin\n\nsoil = ADC(Pin(34))\nwet = soil.read_u16() // 655\nprint("Soil moisture:", wet, "%")',
        out: ['Soil moisture: 61 %'] },
      { name: 'Servo dial', code: '# Servo dial\nfrom machine import Pin, PWM\n\nservo = PWM(Pin(13), freq=50)\nservo.duty_u16(4915)  # 90 degrees\nprint("Pointing at: focus")',
        out: ['Pointing at: focus'] },
    ];
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    // One pass over the plain text, so the colouring never re-colours its own markup.
    const token = /(#[^\n]*)|("[^"\n]*"?)|\b(from|import|for|in|while|True|def|return)\b|\b([A-Za-z_]\w*)(?=\()|\b(\d+)\b/g;
    const paint = (s) => {
      let html = '', last = 0;
      for (const m of s.matchAll(token)) {
        const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'f' : 'n';
        html += esc(s.slice(last, m.index)) + '<span class="' + cls + '">' + esc(m[0]) + '</span>';
        last = m.index + m[0].length;
      }
      return html + esc(s.slice(last));
    };
    const show = (p, n) => { code.innerHTML = paint(p.code.slice(0, n)) + '<span class="caret"></span>'; };
    const runOnce = async (p) => {
      title.textContent = p.name;
      term.innerHTML = '<span class="muted">⚡ Ready. Hit play to send code to your board.</span>';
      if (still) { code.innerHTML = paint(p.code); term.innerHTML += '<br>' + p.out.map(esc).join('<br>'); return; }
      for (let n = 0; n <= p.code.length; n++) { show(p, n); await wait(p.code[n] === '\n' ? 140 : 28 + Math.random() * 30); }
      await wait(500);
      run.classList.add('pressed'); await wait(180); run.classList.remove('pressed');
      term.innerHTML += '<br><span class="muted">• ⚡ Sending ' + esc(p.name) + '…</span>';
      await wait(650);
      for (const line of p.out) { term.innerHTML += '<br>' + esc(line); await wait(300); }
      term.innerHTML += '<br><span class="muted">✓ Done</span>';
    };
    whenVisible(code, async () => {
      if (still) return runOnce(programs[0]);
      for (let i = 0; ; i = (i + 1) % programs.length) { await runOnce(programs[i]); await wait(3200); }
    });
  }

  // Stallwise: count the result up, then reveal the verdict.
  const card = document.querySelector('.profit-card');
  if (card) {
    const count = (el, to, ms, money) => new Promise((done) => {
      const start = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - start) / ms), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
        el.textContent = (money ? '$' : '') + v.toLocaleString();
        k < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    });
    whenVisible(card, async () => {
      const nums = card.querySelectorAll('[data-to]');
      if (still) { nums.forEach((el) => { el.textContent = (el.dataset.money ? '$' : '') + Number(el.dataset.to).toLocaleString(); }); card.querySelector('.verdict').classList.add('in'); return; }
      await Promise.all([...nums].map((el) => count(el, Number(el.dataset.to), 1600, !!el.dataset.money)));
      await wait(250);
      card.querySelector('.verdict').classList.add('in');
    });
  }
})();
