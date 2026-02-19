/* ============================================================
   VELTRIX IDE — script.js
   Theme System | Auth | Lab IDE | UI
   ============================================================ */

'use strict';

/* ============================================================
   THEME SYSTEM
   ============================================================ */

const THEMES = [
  { id: 'aquatic', label: 'Aquatic',  swatch: '#e4e6ea' },
  { id: 'desert',  label: 'Desert',   swatch: '#d8d0c4' },
  { id: 'dusk',    label: 'Dusk',     swatch: '#48484c' },
  { id: 'night',   label: 'Night Sky', swatch: '#242424' },
];

const LS_THEME = 'veltrix_theme';

function getSavedTheme() {
  return localStorage.getItem(LS_THEME) || 'aquatic';
}

function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem(LS_THEME, id);

  // Sync label
  const labelEl = document.querySelector('.theme-label');
  const found = THEMES.find(t => t.id === id);
  if (labelEl && found) labelEl.textContent = found.label;

  // Sync active state in dropdown
  document.querySelectorAll('.theme-item').forEach(el => {
    el.classList.toggle('active', el.dataset.themeId === id);
  });
}

function buildThemeDropdown() {
  const dropdown = document.querySelector('.theme-dropdown');
  if (!dropdown) return;

  const current = getSavedTheme();
  dropdown.innerHTML = THEMES.map(t => `
    <div class="theme-item ${t.id === current ? 'active' : ''}" data-theme-id="${t.id}">
      <span class="theme-swatch" style="background:${t.swatch}"></span>
      ${t.label}
    </div>
  `).join('');

  dropdown.querySelectorAll('.theme-item').forEach(item => {
    item.addEventListener('click', () => {
      applyTheme(item.dataset.themeId);
      closeThemeDropdown();
    });
  });
}

function openThemeDropdown() {
  const btn = document.querySelector('.theme-toggle-btn');
  const dd  = document.querySelector('.theme-dropdown');
  if (dd) dd.classList.add('open');
  if (btn) btn.classList.add('open');
}

function closeThemeDropdown() {
  const btn = document.querySelector('.theme-toggle-btn');
  const dd  = document.querySelector('.theme-dropdown');
  if (dd) dd.classList.remove('open');
  if (btn) btn.classList.remove('open');
}

function initTheme() {
  // Apply before render (no flash)
  const saved = getSavedTheme();
  document.documentElement.setAttribute('data-theme', saved);

  buildThemeDropdown();
  applyTheme(saved);

  const btn = document.querySelector('.theme-toggle-btn');
  if (btn) {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const dd = document.querySelector('.theme-dropdown');
      if (dd && dd.classList.contains('open')) {
        closeThemeDropdown();
      } else {
        openThemeDropdown();
      }
    });
  }

  document.addEventListener('click', closeThemeDropdown);
}

/* ============================================================
   AUTHENTICATION — localStorage
   ============================================================ */

const LS_USERS   = 'veltrix_users';
const LS_SESSION = 'veltrix_session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(LS_USERS)) || {}; }
  catch { return {}; }
}

function saveUsers(obj) {
  localStorage.setItem(LS_USERS, JSON.stringify(obj));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(LS_SESSION)); }
  catch { return null; }
}

function setSession(user) {
  localStorage.setItem(LS_SESSION, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(LS_SESSION);
}

/* Update navbar & lab UI based on session */
function syncAuthUI() {
  const session  = getSession();
  const authGrp  = document.getElementById('auth-group');
  const userGrp  = document.getElementById('user-group');
  const nameEl   = document.getElementById('nav-username');
  const avatarEl = document.getElementById('nav-avatar');

  if (session) {
    if (authGrp)  authGrp.style.display  = 'none';
    if (userGrp)  userGrp.style.display  = 'flex';
    if (nameEl)   nameEl.textContent     = session.username;
    if (avatarEl) avatarEl.textContent   = session.username.charAt(0).toUpperCase();
  } else {
    if (authGrp)  authGrp.style.display  = 'flex';
    if (userGrp)  userGrp.style.display  = 'none';
  }

  // Lab page
  const gate    = document.getElementById('lab-gate');
  const ideWrap = document.getElementById('ide-wrap');
  if (gate && ideWrap) {
    if (session) {
      gate.style.display = 'none';
      ideWrap.classList.add('visible');
    } else {
      gate.style.display = 'flex';
      ideWrap.classList.remove('visible');
    }
  }
}

/* Modal helpers */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function initAuth() {
  /* ── Open modals ── */
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.openModal;
      closeModal('modal-login');
      closeModal('modal-signup');
      openModal(target);
    });
  });

  /* ── Close modals ── */
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    overlay.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => overlay.classList.remove('open'));
    });
  });

  /* ── Logout ── */
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      syncAuthUI();
    });
  }

  /* ── Signup form ── */
  const signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', e => {
      e.preventDefault();
      const fullname = signupForm.fullname.value.trim();
      const username = signupForm.username.value.trim().toLowerCase().replace(/\s+/g, '');
      const email    = signupForm.email.value.trim().toLowerCase();
      const password = signupForm.password.value;

      if (!fullname || !username || !email || !password) {
        return showFormError('err-signup', 'All fields are required.');
      }
      if (username.length < 3) {
        return showFormError('err-signup', 'Username must be at least 3 characters.');
      }
      if (password.length < 6) {
        return showFormError('err-signup', 'Password must be at least 6 characters.');
      }

      const users = getUsers();
      if (users[username]) {
        return showFormError('err-signup', 'That username is already taken.');
      }

      users[username] = { fullname, username, email, password };
      saveUsers(users);
      setSession({ fullname, username, email });
      signupForm.reset();
      closeModal('modal-signup');
      syncAuthUI();
    });
  }

  /* ── Login form ── */
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = loginForm.username.value.trim().toLowerCase();
      const password = loginForm.password.value;

      const users = getUsers();
      const user  = users[username];
      if (!user || user.password !== password) {
        return showFormError('err-login', 'Incorrect username or password.');
      }

      setSession({ fullname: user.fullname, username: user.username, email: user.email });
      loginForm.reset();
      closeModal('modal-login');
      syncAuthUI();
    });
  }
}

/* ============================================================
   LAB IDE
   ============================================================ */

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
</head>
<body>

  <h1>Hello, Veltrix IDE! 👋</h1>
  <p>Edit HTML, CSS, and JS tabs to build your project.</p>

</body>
</html>`;

const DEFAULT_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8f9fa;
  color: #1a1a1a;
  padding: 40px;
  line-height: 1.6;
}

h1 {
  font-size: 2rem;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

p {
  color: #555;
  font-size: 1rem;
}`;

const DEFAULT_JS = `// JavaScript — script.js
// Veltrix IDE Live Preview

document.addEventListener('DOMContentLoaded', () => {
  console.log('Veltrix IDE — project ready!');
});`;

const LS_LAB_HTML = 'veltrix_lab_html';
const LS_LAB_CSS  = 'veltrix_lab_css';
const LS_LAB_JS   = 'veltrix_lab_js';

function initLab() {
  const htmlEd = document.getElementById('editor-html');
  const cssEd  = document.getElementById('editor-css');
  const jsEd   = document.getElementById('editor-js');
  const frame  = document.getElementById('preview-frame');

  if (!htmlEd) return;

  // Load saved content
  htmlEd.value = localStorage.getItem(LS_LAB_HTML) || DEFAULT_HTML;
  cssEd.value  = localStorage.getItem(LS_LAB_CSS)  || DEFAULT_CSS;
  jsEd.value   = localStorage.getItem(LS_LAB_JS)   || DEFAULT_JS;

  /* Tab switching */
  document.querySelectorAll('.ide-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ide-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.code-editor').forEach(e => e.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('editor-' + tab.dataset.tab)?.classList.add('active');

      // Status bar language
      const langs = { html: 'HTML', css: 'CSS', js: 'JavaScript' };
      const statusLang = document.getElementById('status-lang');
      if (statusLang) statusLang.textContent = langs[tab.dataset.tab] || '';
    });
  });

  /* File tree sync with tabs */
  document.querySelectorAll('.tree-file[data-file]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.tree-file').forEach(f => f.classList.remove('active'));
      item.classList.add('active');
      // Click corresponding tab
      const tab = document.querySelector(`.ide-tab[data-tab="${item.dataset.file}"]`);
      if (tab) tab.click();
    });
  });

  /* Live preview render */
  function renderPreview() {
    const html = htmlEd.value;
    const css  = cssEd.value;
    const js   = jsEd.value;

    localStorage.setItem(LS_LAB_HTML, html);
    localStorage.setItem(LS_LAB_CSS, css);
    localStorage.setItem(LS_LAB_JS, js);

    const combined = html
      .replace('</head>', `<style>\n${css}\n</style>\n</head>`)
      .replace('</body>', `<script>\ntry{\n${js}\n}catch(e){console.error(e);}\n<\/script>\n</body>`);

    const blob = new Blob([combined], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    if (frame) {
      frame.src = url;
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }

  let debounceTimer;
  [htmlEd, cssEd, jsEd].forEach(ed => {
    ed.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderPreview, 650);
    });

    // Tab key → insert 2 spaces
    ed.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = ed.selectionStart;
        const end   = ed.selectionEnd;
        ed.value = ed.value.substring(0, start) + '  ' + ed.value.substring(end);
        ed.selectionStart = ed.selectionEnd = start + 2;
      }
    });
  });

  /* Refresh button */
  document.getElementById('btn-refresh')?.addEventListener('click', renderPreview);

  /* Add file button */
  document.getElementById('btn-add-file')?.addEventListener('click', () => {
    const name = prompt('Enter file name (e.g. utils.js):');
    if (!name || !name.trim()) return;
    const tree = document.getElementById('file-tree');
    const el = document.createElement('div');
    el.className = 'tree-file';
    el.innerHTML = `<span>📄</span> ${name.trim()}`;
    tree?.appendChild(el);
  });

  /* Add folder button */
  document.getElementById('btn-add-folder')?.addEventListener('click', () => {
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;
    const tree = document.getElementById('file-tree');
    const el = document.createElement('div');
    el.className = 'tree-folder';
    el.innerHTML = `<span>📁</span> ${name.trim()}/`;
    tree?.appendChild(el);
  });

  // Initial render after short delay
  setTimeout(renderPreview, 500);
}

/* ============================================================
   ACTIVE NAV LINK
   ============================================================ */

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    const isHome = (page === '' || page === 'index.html') && href === 'index.html';
    a.classList.toggle('active', href === page || isHome);
  });
}

/* ============================================================
   PWA SERVICE WORKER REGISTRATION
   ============================================================ */

function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuth();
  syncAuthUI();
  setActiveNav();
  initLab();
  registerSW();
});
