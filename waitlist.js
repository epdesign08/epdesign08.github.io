// The launch waitlist: sends an email (and where the visitor came from) to Supabase, and shows how many have joined.
(() => {
  const API = 'https://olkfyjuasgelitznecbq.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_3Fe1PeGa_eP0vMqeRKG08w_yTzCfsg2';
  // MailerLite's form for the "Jolt Code waitlist" group, which sends the welcome email.
  const MAILERLITE = 'https://assets.mailerlite.com/jsonp/2744184/forms/202414920633943040/subscribe';

  // Where this visitor came from: a ?ref= tag on the link, else the site that sent them, else "direct".
  // Remembered for the visit, so it survives clicking around before signing up.
  const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  let source = 'direct';
  try {
    const ref = clean(new URLSearchParams(location.search).get('ref'));
    const saved = sessionStorage.getItem('jolt-ref');
    const from = document.referrer && !document.referrer.includes(location.host)
      ? clean(new URL(document.referrer).hostname.replace(/^www\./, '').split('.')[0]) : '';
    source = ref || saved || from || 'direct';
    sessionStorage.setItem('jolt-ref', source);
  } catch (e) { /* storage blocked: keep the default */ }

  const call = (fn, body) => fetch(API + fn, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

  // The welcome email. MailerLite doesn't answer cross-site requests, so this is sent without waiting to read a reply.
  const welcome = (email) => {
    const body = new FormData();
    body.append('fields[email]', email);
    body.append('ml-submit', '1');
    body.append('anticsrf', 'true');
    return fetch(MAILERLITE, { method: 'POST', mode: 'no-cors', body }).catch(() => {});
  };

  const showCount = (n) => {
    if (typeof n !== 'number' || n < 25) return;   // a tiny number reads worse than none
    document.querySelectorAll('.waitlist .count').forEach((el) => {
      el.textContent = n.toLocaleString() + ' makers are already on the list.';
    });
  };

  document.querySelectorAll('.waitlist').forEach((form) => {
    const note = form.querySelector('.note');
    const count = document.createElement('p');
    count.className = 'count';
    form.appendChild(count);

    form.dataset.label = form.querySelector('button').textContent;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type=email]');
      const button = form.querySelector('button');
      if (form.querySelector('.hp').value) return;   // a bot filled the hidden field
      const email = input.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        note.textContent = 'That email doesn\'t look quite right. Mind checking it?';
        note.classList.add('error');
        input.focus();
        return;
      }
      button.disabled = true;
      button.textContent = 'Adding you…';
      try {
        // A form can name its own source (the home page says "home") for visitors who arrived with no tag.
        const from = source === 'direct' && form.dataset.source ? clean(form.dataset.source) : source;
        const n = await call('join_waitlist', { email, source: from });
        welcome(email);
        form.classList.add('done');
        note.classList.remove('error');
        note.textContent = '⚡ You\'re on the list. Check your inbox for a welcome email.';
        showCount(n);
      } catch (err) {
        note.textContent = 'Something went wrong. Please try again, or email hello@ebenlabs.app.';
        note.classList.add('error');
        button.disabled = false;
        button.textContent = form.dataset.label || 'Get it on day one';
      }
    });
  });

  // Show the forms only once the waitlist is set up and answering; otherwise the page keeps its "coming soon" badge.
  call('waitlist_count').then((n) => {
    document.querySelectorAll('.waitlist, #cta').forEach((el) => { el.hidden = false; });
    document.querySelectorAll('.waitlist-fallback').forEach((el) => { el.hidden = true; });
    showCount(n);
  }).catch(() => {});
})();
