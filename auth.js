import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, signOut, updateProfile
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

function render() {
  const login = mode === 'login';
  $('authTitle').textContent = login ? 'Log in to book' : 'Create your account';
  $('authSubmit').textContent = login ? 'Log in' : 'Sign up';
  $('switchText').textContent = login ? 'New here?' : 'Already have an account?';
  $('switchLink').textContent = login ? 'Create an account' : 'Log in';
  $('authName').hidden = login;
  $('authName').required = !login;
  $('authMsg').textContent = '';
}
function say(text, ok = false) {
  $('authMsg').textContent = text;
  $('authMsg').className = ok ? 'ok' : 'err';
}
function friendly(err) {
  const c = err.code || '';
  if (c.includes('email-already-in-use')) return 'This email is already registered. Try logging in.';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Wrong email or password.';
  if (c.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (c.includes('popup-closed')) return 'Sign-in window was closed.';
  if (c.includes('too-many-requests')) return 'Too many attempts. Try again later.';
  if (c.includes('unauthorized-domain')) return 'Add this domain under Firebase > Authentication > Settings > Authorized domains.';
  if (c.includes('operation-not-allowed')) return 'This sign-in method is not enabled in Firebase yet.';
  return 'Something went wrong. Please try again.';
}

$('switchLink').addEventListener('click', e => {
  e.preventDefault();
  mode = mode === 'login' ? 'signup' : 'login';
  render();
});

$('googleBtn').addEventListener('click', async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { say(friendly(e)); }
});

$('authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('authEmail').value.trim();
  const pass = $('authPass').value;
  try {
    if (mode === 'signup') {
      const { user } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(user, { displayName: $('authName').value.trim() });
      await sendEmailVerification(user);
      await signOut(auth);
      mode = 'login'; render();
      say('Account created. We sent a verification link to ' + email + '. Verify it, then log in.', true);
    } else {
      const { user } = await signInWithEmailAndPassword(auth, email, pass);
      if (!user.emailVerified) {
        await signOut(auth);
        say('Please verify your email first. Check your inbox and spam folder.');
      }
    }
  } catch (err) { say(friendly(err)); }
});

$('logoutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, user => {
  const ok = !!(user && user.emailVerified);
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