import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTr6o6nfSkWiSS_STvVjiuWUSb97-lQ24",
  authDomain: "trek-wild.firebaseapp.com",
  projectId: "trek-wild",
  storageBucket: "trek-wild.firebasestorage.app",
  messagingSenderId: "575392456892",
  appId: "1:575392456892:web:7808fc2dcfd8d79f4170b9"
};

const auth = getAuth(initializeApp(firebaseConfig));
const $ = id => document.getElementById(id);
let mode = 'login';

// ---------- Screen state (Log in tab vs Sign up tab) ----------
const SWAP_TARGETS = '#authTitle, #authSub, #signupSteps, #googleBtn, .or, #authForm .field, #forgotLink, #authSubmit';

function setMode(m, animate = false) {
  const box = $('authBox');
  const heightBefore = box.offsetHeight;
  const goingToSignup = m === 'signup';
  mode = m;
  const login = m === 'login';

  // Sliding black highlight on the tabs
  $('tabLogin').parentElement.dataset.mode = m;
  $('tabLogin').classList.toggle('active', login);
  $('tabSignup').classList.toggle('active', !login);
  $('tabLogin').setAttribute('aria-selected', login);
  $('tabSignup').setAttribute('aria-selected', !login);

  $('authTitle').textContent = login ? 'Welcome' : 'Create your account';
  $('authSub').textContent = login
    ? 'Log in to send your booking request.'
    : 'It takes less than a minute and is free.';
  $('authSubmit').textContent = login ? 'Log in' : 'Create account';

  $('nameField').hidden = login;
  $('signupSteps').hidden = login;
  $('forgotLink').hidden = !login;
  $('authPass').autocomplete = login ? 'current-password' : 'new-password';

  say('');
  if (!animate) return;

  // 1) Content slides in one piece after another (from right when going to Sign up, from left when going back)
  const cls = goingToSignup ? 'swap-right' : 'swap-left';
  let i = 0;
  box.querySelectorAll(SWAP_TARGETS).forEach(el => {
    if (el.offsetParent === null) return;      // skip hidden elements
    el.classList.remove('swap-right', 'swap-left');
    void el.offsetWidth;                        // restart the animation
    el.style.animationDelay = (i++ * 0.04) + 's';
    el.classList.add(cls);
  });

  // 2) The card grows / shrinks smoothly instead of jumping
  const heightAfter = box.offsetHeight;
  if (heightBefore !== heightAfter && box.animate) {
    box.style.overflow = 'hidden';
    box.animate(
      [{ height: heightBefore + 'px' }, { height: heightAfter + 'px' }],
      { duration: 400, easing: 'cubic-bezier(.65,0,.35,1)' }
    ).onfinish = () => { box.style.overflow = ''; };
  }
}

function say(text, ok = false) {
  $('authMsg').textContent = text;
  $('authMsg').className = text ? (ok ? 'ok' : 'err') : '';
}

function friendly(err) {
  const c = err.code || '';
  if (c.includes('email-already-in-use')) return 'This email is already registered. Try the Log in tab.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Wrong email or password.';
  if (c.includes('invalid-email')) return 'That email address does not look right.';
  if (c.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return 'Sign-in window was closed.';
  if (c.includes('popup-blocked')) return 'Your browser blocked the sign-in popup. Please allow popups and try again.';
  if (c.includes('network-request-failed')) return 'No internet connection. Please check and try again.';
  if (c.includes('too-many-requests')) return 'Too many attempts. Please wait a few minutes and try again.';
  if (c.includes('unauthorized-domain')) return 'Add this domain under Firebase > Authentication > Settings > Authorized domains.';
  if (c.includes('operation-not-allowed')) return 'This sign-in method is not enabled in Firebase yet.';
  return 'Something went wrong. Please try again.';
}

// Disable a button and show a loading label while something runs
async function withBusy(btn, busyText, task) {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = busyText;
  try { return await task(); }
  finally { btn.disabled = false; btn.textContent = original; }
}

// Checks the form and tells the user exactly what is missing
function checkInputs({ needPass = true } = {}) {
  const name = $('authName').value.trim();
  const email = $('authEmail').value.trim();
  const pass = $('authPass').value;

  if (mode === 'signup' && !name) { say('Please enter your full name.'); $('authName').focus(); return null; }
  if (!email || !$('authEmail').checkValidity()) { say('Please enter a valid email address.'); $('authEmail').focus(); return null; }
  if (needPass && pass.length < 6) { say('Password must be at least 6 characters.'); $('authPass').focus(); return null; }
  return { name, email, pass };
}

// ---------- Events ----------
$('tabLogin').addEventListener('click', () => { if (mode !== 'login') setMode('login', true); });
$('tabSignup').addEventListener('click', () => { if (mode !== 'signup') setMode('signup', true); });

$('togglePass').addEventListener('click', () => {
  const show = $('authPass').type === 'password';
  $('authPass').type = show ? 'text' : 'password';
  $('togglePass').textContent = show ? 'Hide' : 'Show';
  $('togglePass').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
});

$('googleBtn').addEventListener('click', () => {
  say('');
  withBusy($('googleBtn'), 'Opening Google...', async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { say(friendly(e)); }
  });
});

$('authForm').addEventListener('submit', async e => {
  e.preventDefault();
  say('');

  const v = checkInputs();
  if (!v) return;

  await withBusy($('authSubmit'), mode === 'signup' ? 'Creating account...' : 'Logging in...', async () => {
    try {
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, v.email, v.pass);
        await updateProfile(user, { displayName: v.name });
        $('form').elements.name.value = v.name;   // pre-fill the booking form
        // onAuthStateChanged now shows the booking form automatically
      } else {
        await signInWithEmailAndPassword(auth, v.email, v.pass);
        // onAuthStateChanged now shows the booking form automatically
      }
    } catch (err) { say(friendly(err)); }
  });
});

$('forgotLink').addEventListener('click', async e => {
  e.preventDefault();
  say('');
  const email = $('authEmail').value.trim();
  if (!email || !$('authEmail').checkValidity()) {
    say('Type your email above first, then click "Forgot password?".');
    $('authEmail').focus();
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    say('If an account exists for ' + email + ', a password reset link is on its way. Check your spam folder too.', true);
  } catch (err) { say(friendly(err)); }
});

$('logoutBtn').addEventListener('click', () => signOut(auth));

// ---------- Show login box or booking form ----------
onAuthStateChanged(auth, user => {
  const ok = !!user;
  window.currentUser = ok ? user : null;
  $('authBox').hidden = ok;
  $('bookingBox').hidden = !ok;
  if (ok) {
    $('userEmail').textContent = user.email;
    const f = $('form');
    f.elements.email.value = user.email;
    f.elements.email.readOnly = true;
    if (!f.elements.name.value) f.elements.name.value = user.displayName || '';
  }
});

setMode('login');