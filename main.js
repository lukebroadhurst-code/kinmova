// Kinmova pre-launch page. Everything here is an enhancement: without it, all content is visible.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Entrances: reveal once as each part enters the viewport.
(() => {
  const targets = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -24px 0px', threshold: 0 }); // start as soon as it reaches the screen, so nothing sits blank while you scroll
  targets.forEach((el) => io.observe(el));
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

// The little stories in the figures (the logins, the chat, the quiet week, the merge) play once most of the figure is on screen.
(() => {
  const figs = document.querySelectorAll('[data-play]');
  const play = (el) => el.classList.add('is-playing');
  if (reduceMotion || !('IntersectionObserver' in window)) { figs.forEach(play); return; }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) { if (entry.isIntersecting) { play(entry.target); io.unobserve(entry.target); } }
  }, { threshold: 0.55 });
  figs.forEach((f) => io.observe(f));
})();

// See who's gone quiet / kept it up: the blown-up switch.
(() => {
  const section = document.querySelector('.switch-sec');
  const control = section?.querySelector('.bs-control');
  if (!control) return;
  const word = section.querySelector('.swap-word');
  const label = control.querySelector('.bs-label');
  const value = control.querySelector('.bs-value');
  const flip = () => {
    const on = control.getAttribute('aria-checked') !== 'true';
    control.setAttribute('aria-checked', String(on));
    section.dataset.state = on ? 'quiet' : 'kept';
    word.textContent = on ? 'gone quiet' : 'kept it up';
    label.textContent = on ? 'Gone quiet this week' : 'Kept it up this week';
    value.textContent = on ? '9 of 32' : '23 of 32';
    control.setAttribute('aria-label', on ? 'Show members who’ve gone quiet this week' : 'Show members who kept it up this week');
  };
  let touched = false;
  control.addEventListener('click', (e) => { if (e.isTrusted) touched = true; flip(); });
  // Flip once to 'kept it up' and back the first time it's in view, so people see it's live.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setTimeout(() => { if (!touched) flip(); setTimeout(() => { if (!touched) flip(); }, 2400); }, 1100);
    }, { threshold: 0.55 });
    io.observe(section);
  }
})();

// What's included: the old class photographs crossfade slowly inside the circle.
(() => {
  const imgs = [...document.querySelectorAll('.inc-circle img')];
  const caption = document.querySelector('.inc-caption');
  if (imgs.length < 2 || reduceMotion) return;
  let i = 0;
  let timer = null;
  const next = () => {
    imgs[i].classList.remove('is-on');
    i = (i + 1) % imgs.length;
    imgs[i].classList.add('is-on');
    caption.textContent = imgs[i].dataset.caption;
  };
  const start = () => { if (!timer) timer = setInterval(next, 6000); };
  const stop = () => { clearInterval(timer); timer = null; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
})();

// Studio or member view. The head script has already set data-view from ?for=members, so there's no flash.
(() => {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('[data-set-view]');
  const set = (view, save) => {
    if (view === 'member') root.dataset.view = 'member'; else delete root.dataset.view;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setView === view)));
    if (save) {
      const url = new URL(location.href);
      if (view === 'member') url.searchParams.set('for', 'members'); else url.searchParams.delete('for');
      history.replaceState(null, '', url);
      dispatchEvent(new Event('resize')); // the page height changed, so the scroll movement re-measures
    }
  };
  buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.setView, true)));
  set(root.dataset.view === 'member' ? 'member' : 'studio', false);
})();

// After a member signs up: a ready-made message to send their club, through the share sheet, WhatsApp, email or a copy.
const SITE = 'https://kinmova.app/';
let shareCount = 0;
const showShare = (form) => {
  const first = form.elements.namedItem('name').value.trim().split(/\s+/)[0];
  const clubs = form.elements.namedItem('clubs').value.split(/,|\n|&|\band\b/i).map((c) => c.trim()).filter(Boolean);
  const owner = form.elements.namedItem('owner').value.trim();
  const ownerEmail = /^\S+@\S+\.\S+$/.test(owner) ? owner : '';
  const ownerName = owner && !ownerEmail ? owner.split(/\s+/)[0] : '';
  const ask = clubs.length === 1 ? `Any chance ${clubs[0]} could go on it?` : 'Any chance you could go on it?';
  const message = `Hi${ownerName ? ` ${ownerName}` : ''}, I’ve signed up for Kinmova. It’s an app for booking classes and logging the training in between, and one account works at every club that’s on it. ${ask} Founding studios get their first 3 months free: ${SITE}`;

  const step = document.getElementById('share-tpl').content.firstElementChild.cloneNode(true);
  const text = step.querySelector('.share-text');
  const status = step.querySelector('.share-status');
  const native = step.querySelector('.share-native');
  const wa = step.querySelector('.share-wa');
  const mail = step.querySelector('.share-mail');
  text.id = `share-text-${++shareCount}`;
  step.querySelector('label').htmlFor = text.id;
  step.querySelector('.share-thanks').textContent = `Thanks${first ? `, ${first}` : ''}. You’re on the list.`;
  text.value = message;
  const subject = `Kinmova${clubs.length === 1 ? ` for ${clubs[0]}` : ''}`;
  const links = () => {
    wa.href = `https://wa.me/?text=${encodeURIComponent(text.value)}`;
    mail.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text.value)}`;
  };
  links();
  text.addEventListener('input', links);
  if (navigator.share) native.addEventListener('click', () => navigator.share({ text: text.value }).catch(() => {}));
  else native.remove();
  step.querySelector('.share-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text.value); } catch { text.select(); document.execCommand('copy'); }
    status.textContent = 'Copied. Paste it wherever you talk to your club.';
  });
  form.hidden = true;
  form.after(step);
  step.querySelector('.share-title').focus({ preventScroll: true });
};

// Sign-up forms. Each posts to the Formspree endpoint in its data-endpoint: studios to one form, members to another.
document.querySelectorAll('.signup-form').forEach((form) => {
  const status = form.querySelector('.form-status');
  const member = form.dataset.kind === 'member';
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const first = form.querySelector(':invalid');
      status.textContent = first === form.email ? 'Please add an email address we can reach you on.'
        : member ? 'Please add your name, your email and where you train.' : 'Please fill in all four boxes.';
      first?.focus();
      return;
    }
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      status.textContent = 'This form isn’t connected yet, so nothing was sent.';
      return;
    }
    status.textContent = 'Sending…';
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      status.textContent = 'That didn’t send. Please try again in a minute.';
      return;
    }
    if (member) { status.textContent = ''; showShare(form); return; }
    const studio = form.studio.value.trim();
    form.reset();
    status.textContent = `Thanks. ${studio}’s place is saved, and we’ll be in touch when it’s ready.`;
  });
});

// Scroll movement, all built from the week of dots. Transform and opacity only; nothing moves under reduced motion.
(() => {
  if (reduceMotion) return;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const through = (el) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1); };
  const dot = document.querySelector('.giant-dot');
  const owners = document.querySelectorAll('.hero-phone');
  const photo = document.querySelector('.inc-circle');
  const tracker = document.querySelector('.page-week');
  const trackerDots = tracker ? [...tracker.children] : [];
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    const h = clamp(y / vh, 0, 1);
    if (dot) { dot.style.translate = `${-h * 10}% ${-h * 14}%`; dot.style.scale = String(1 + h * 0.3); }
    owners.forEach((o) => { o.style.translate = `0 ${(-h * 60).toFixed(1)}px`; });
    if (photo) { const p = ease(clamp(through(photo) * 2.2, 0, 1)); photo.style.scale = (0.55 + 0.45 * p).toFixed(3); photo.style.rotate = `${((1 - p) * -12).toFixed(2)}deg`; }
    if (tracker) {
      const pg = clamp(y / Math.max(1, document.documentElement.scrollHeight - vh), 0, 1);
      const n = Math.round(pg * 7);
      trackerDots.forEach((t, i) => t.classList.toggle('lit', i < n));
      tracker.classList.toggle('gone', pg > 0.94);
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

// The founding price counts down from £15 to £0 the first time it's seen.
(() => {
  const amt = document.querySelector('.figure .amt');
  if (!amt || reduceMotion || !('IntersectionObserver' in window)) return;
  const r = amt.getBoundingClientRect();
  if (r.top < innerHeight) return; // already on screen: leave it at £0
  amt.textContent = '15';
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    const start = performance.now();
    const run = (now) => {
      const t = Math.min(1, (now - start) / 1100);
      amt.textContent = String(Math.round(15 * (1 - (1 - Math.pow(1 - t, 3)))));
      if (t < 1) requestAnimationFrame(run);
    };
    setTimeout(() => requestAnimationFrame(run), 350);
  }, { threshold: 0.6 });
  io.observe(amt);
})();
