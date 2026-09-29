// ===== Mobile menu =====
const btn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
btn.addEventListener('click', () => menu.classList.toggle('open'));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

// ===== Booking form =====
const form = document.getElementById('form');
const tour = document.getElementById('tour');
const travelers = document.getElementById('travelers');
const dateInput = document.getElementById('date');
const totalEl = document.getElementById('total');
const msg = document.getElementById('msg');
const submitBtn = document.getElementById('submitBtn');

dateInput.min = new Date().toISOString().split('T')[0];

function getTotal() {
  const price = Number(tour.selectedOptions[0].dataset.price || 0);
  const people = Math.max(1, Number(travelers.value) || 1);
  return price * people;
}
function updateTotal() { totalEl.textContent = '$' + getTotal(); }
tour.addEventListener('change', updateTotal);
travelers.addEventListener('input', updateTotal);

form.querySelectorAll('input,select').forEach(el =>
  el.addEventListener('blur', () => el.classList.add('touched')));

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!window.currentUser) {
    msg.className = 'err';
    msg.textContent = 'Please log in to book.';
    return;
  }

  form.querySelectorAll('input,select').forEach(el => el.classList.add('touched'));

  if (!form.checkValidity()) {
    msg.className = 'err';
    msg.textContent = 'Please fill in all required fields.';
    return;
  }

  const data = Object.fromEntries(new FormData(form));
  data.account_email = window.currentUser.email;
  data.account_id = window.currentUser.uid;
  data.estimated_total = '$' + getTotal();
  data._subject = `New Booking: ${data.tour} – ${data.name}`;
  data._template = 'table';
  data._captcha = 'false';

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  msg.className = '';
  msg.textContent = '';

  try {
    const res = await fetch('https://formsubmit.co/ajax/post.naitik@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok && (result.success === 'true' || result.success === true)) {
      msg.className = 'ok';
      msg.textContent = `Thanks ${data.name}! Your booking request for ${data.tour} was sent. We'll contact you soon.`;
      form.reset();
      form.elements.email.value = window.currentUser.email;
      form.querySelectorAll('.touched').forEach(el => el.classList.remove('touched'));
      travelers.value = 1;
      updateTotal();
    } else {
      throw new Error(result.message || 'Failed');
    }
  } catch (err) {
    msg.className = 'err';
    msg.textContent = 'Could not send. Please try again or email us directly at post.naitik@gmail.com.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Booking Request';
  }
});

// ===== Scroll-reveal animations =====
document.documentElement.classList.add('js');

function setup(selector, dir = '', step = 0.12) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal');
    if (dir) el.classList.add(dir);
    el.style.setProperty('--d', (i % 4) * step + 's');
  });
}

setup('.section h2', '', 0);
setup('.stats > div');
setup('.card');
setup('.post');
setup('.about-img', 'left', 0);
setup('.about > div', 'right', 0);
setup('.checks li', 'right', 0.15);
setup('form > *', '', 0.08);
setup('footer', '', 0);

function countUp(h) {
  const m = h.textContent.match(/^(\d+)(.*)$/);
  if (!m) return;
  const end = +m[1], suffix = m[2], dur = 1400, t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / dur, 1);
    h.textContent = Math.floor(end * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('show');
    io.unobserve(el);
    if (el.matches('.card, .post')) {
      setTimeout(() => el.classList.remove('reveal', 'show'), 1400);
    }
    if (el.matches('.stats > div')) countUp(el.querySelector('h3'));
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ===== Looping typewriter tagline (hero) =====
const phrases = ['Explore. Breathe. Wander.', 'Hike. Camp. Discover.', 'Trek. Raft. Roam.'];
const tw = document.getElementById('typewriter');
let pI = 0, cI = 0, deleting = false;

function typeLoop() {
  const word = phrases[pI];
  cI += deleting ? -1 : 1;
  tw.textContent = word.slice(0, cI);

  let delay = deleting ? 40 : 80;
  if (!deleting && cI === word.length) { delay = 1600; deleting = true; }
  else if (deleting && cI === 0) { deleting = false; pI = (pI + 1) % phrases.length; delay = 400; }

  setTimeout(typeLoop, delay);
}
typeLoop();

// ===== Looping checklist highlight (About section) =====
const checkItems = document.querySelectorAll('.checks li');
let activeIdx = 0;
if (checkItems.length) {
  setInterval(() => {
    checkItems.forEach(li => li.classList.remove('active'));
    checkItems[activeIdx].classList.add('active');
    activeIdx = (activeIdx + 1) % checkItems.length;
  }, 1200);
}

// ===== Letter-wave headings (animates on hover, every time) =====
document.querySelectorAll('.section h2').forEach(h => {
  h.innerHTML = h.textContent.split('').map((c, i) =>
    `<span style="display:inline-block;animation-delay:${i * 0.03}s">${c === ' ' ? '&nbsp;' : c}</span>`
  ).join('');
  h.classList.add('wave-heading');
});

// ===== Custom cursor =====
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');

if (dot && ring && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
  });

  (function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();

  document.addEventListener('mouseleave', () => {
    dot.classList.add('cursor-hidden'); ring.classList.add('cursor-hidden');
  });
  document.addEventListener('mouseenter', () => {
    dot.classList.remove('cursor-hidden'); ring.classList.remove('cursor-hidden');
  });

  document.querySelectorAll('a, button, input, select, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => { dot.classList.add('hover'); ring.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); ring.classList.remove('hover'); });
  });

  document.querySelectorAll('.nav, .hero, .stats, footer').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('on-dark'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('on-dark'));
  });
}

// ===== 3D tilt on tour cards =====
document.querySelectorAll('#tours .card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});