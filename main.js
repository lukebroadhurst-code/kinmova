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
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  targets.forEach((el) => io.observe(el));
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

// See who trained / skipped: the blown-up switch.
(() => {
  const section = document.querySelector('.switch-sec');
  const control = section?.querySelector('.bs-control');
  if (!control) return;
  const word = section.querySelector('.swap-word');
  const label = control.querySelector('.bs-label');
  const value = control.querySelector('.bs-value');
  control.addEventListener('click', () => {
    const on = control.getAttribute('aria-checked') !== 'true';
    control.setAttribute('aria-checked', String(on));
    section.dataset.state = on ? 'trained' : 'skipped';
    word.textContent = on ? 'trained' : 'skipped';
    label.textContent = on ? 'Trained this week' : 'Skipped this week';
    value.textContent = on ? '23 of 32' : '9 of 32';
    control.setAttribute('aria-label', on ? 'Show members who trained this week' : 'Show members who skipped this week');
  });
})();

// How it works: one slider drives the clause, the note and the app screen.
(() => {
  const input = document.getElementById('stage');
  if (!input) return;
  const stages = [
    { name: 'Timetable', clause: 'First, put your timetable in', note: 'Add your classes, coaches and prices once, and choose which three offers members see first when they buy.' },
    { name: 'Joining', clause: 'Then members join and book', note: 'New members pick a membership or class pack, pay by card or direct debit, and book their first class in one go. After that they book, cancel and join waitlists on their own.' },
    { name: 'Training', clause: 'Next, set training for the gaps', note: 'Give each class a few sets for the days in between, and members see them on their home screen straight away.' },
    { name: 'Progress', clause: 'Last, see who kept it up', note: 'Every set a member logs shows on your list with their best so far, so you know who to cheer on and who to chase.' },
  ];
  const clause = document.querySelector('.how-clause');
  const note = document.querySelector('.how-note');
  const frags = document.querySelectorAll('.how-frag');
  const names = document.querySelectorAll('.how-names li');
  const fill = document.querySelector('.range-fill');
  let current = 0;
  const show = (i) => {
    fill.style.width = `${(i / (stages.length - 1)) * 100}%`;
    if (i === current) return;
    current = i;
    input.setAttribute('aria-valuetext', stages[i].name);
    frags.forEach((f) => f.classList.toggle('is-current', Number(f.dataset.stage) === i));
    names.forEach((n, k) => n.classList.toggle('is-current', k === i));
    const swap = () => { clause.textContent = stages[i].clause; note.textContent = stages[i].note; clause.style.opacity = 1; note.style.opacity = 1; };
    if (reduceMotion) { swap(); return; }
    clause.style.opacity = 0; note.style.opacity = 0;
    setTimeout(swap, 180);
  };
  input.addEventListener('input', () => show(Number(input.value)));
  show(0);
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

// Sign-up form. Set data-endpoint on the form (for example a Formspree or Tally URL) before launch.
(() => {
  const form = document.querySelector('.coupon-form');
  if (!form) return;
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const first = form.querySelector(':invalid');
      status.textContent = first === form.email ? 'Please add an email address we can reach you on.' : 'Please fill in all four boxes.';
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
      const studio = form.studio.value.trim();
      form.reset();
      status.textContent = `Thanks. ${studio}’s place is saved, and we’ll be in touch when it’s ready.`;
    } catch {
      status.textContent = 'That didn’t send. Please try again in a minute.';
    }
  });
})();
