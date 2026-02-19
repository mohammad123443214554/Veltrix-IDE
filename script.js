/* ============================================
   VELTRIX IDE — script.js
   Theme System, Auth, Lab, UI Logic
   ============================================ */

'use strict';

/* ====== THEME SYSTEM ====== */

const THEMES = [
  { id: 'aquatic', label: 'Aquatic', dot: '#d0d4da' },
  { id: 'desert',  label: 'Desert',  dot: '#ddd8ce' },
  { id: 'dusk',    label: 'Dusk',    dot: '#606060' },
  { id: 'night',   label: 'Night Sky', dot: '#2a2a2a' },
];

function getTheme() {
  return localStorage.getItem('veltrix_theme') || 'aquatic';
}

function setTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem('veltrix_theme', id);
  // Update dropdown
  document.querySelectorAll('.theme-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === id);
  });
  const active = THEMES.find(t => t.id === id);
  const labelEl = document.querySelector('.theme-btn .theme-label');
  if (labelEl && active) labelEl.textContent = active.label;
}

function initTheme() {
  setTheme(getTheme());
}

function buildThemeDropdown() {
  const dropdown = document.querySelector('.theme-dropdown');
  if (!dropdown) return;
  const current = getTheme();
  dropdown.innerHTML = THEMES.map(t => `
    <div class="theme-option ${t.id === current ? 'selected' : ''}" data-theme="${t.id}">
      <span class="theme-dot" style="background:${t.dot}"></span>
      ${t.label}
    </div>
  `).join('');
  dropdown.querySelectorAll('.theme-option').forEach(el => {
    el.addEventListener('click', () => {
      setTheme(el.dataset.theme);
      dropdown.classList.remove('open');
    });
  });
}

function initThemeToggle() {
  const btn = document.querySelector('.theme-btn');
  const dropdown = document.querySelector('.theme-dropdown');
  if (!btn || !dropdown) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown.classList.remove('open'));
}

/* ====== AUTH SYSTEM ====== */

function getUsers() {
  return JSON.parse(localStorage.getItem('veltrix_users') || '{}');
}

function saveUsers(users) {
  localStorage.setItem('veltrix_users', JSON.stringify(users));
}

function getSession() {
  return JSON.parse(localStorage.getItem('veltrix_session') || 'null');
}

function saveSession(user) {
  localStorage.setItem('veltrix_session', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('veltrix_session');
}

function updateNavAuth() {
  const session = getSession();
  const authBtns = document.getElementById('auth-btns');
  const userInfo = document.getElementById('user-info');
  const usernameEl = document.getElementById('nav-username');
  const avatarEl = document.getElementById('nav-avatar');

  if (session) {
    if (authBtns) authBtns.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
    if (usernameEl) usernameEl.textContent = session.username;
    if (avatarEl) avatarEl.textContent = session.username.charAt(0).toUpperCase();
  } else {
    if (authBtns) authBtns.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
  }

  // Lab page: show/hide IDE
  const labLocked = document.getElementById('lab-locked');
  const labIde = document.getElementById('lab-ide');
  if (labLocked && labIde) {
    if (session) {
      labLocked.style.display = 'none';
      labIde.classList.add('visible');
    } else {
      labLocked.style.display = 'flex';
      labIde.classList.remove('visible');
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

function initAuthModals() {
  // Open buttons
  const openLogin = document.querySelectorAll('[data-modal="login"]');
  const openSignup = document.querySelectorAll('[data-modal="signup"]');
  openLogin.forEach(b => b.addEventListener('click', () => { closeModal('signup-modal'); openModal('login-modal'); }));
  openSignup.forEach(b => b.addEventListener('click', () => { closeModal('login-modal'); openModal('signup-modal'); }));

  // Close on overlay click
  ['login-modal', 'signup-modal'].forEach(id => {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(id);
    });
    overlay.querySelector('.modal-close')?.addEventListener('click', () => closeModal(id));
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSession();
    updateNavAuth();
  });

  // Sign Up form
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const err = document.getElementById('signup-error');
      const name = signupForm.fullname.value.trim();
      const username = signupForm.username.value.trim().toLowerCase();
      const email = signupForm.email.value.trim().toLowerCase();
      const password = signupForm.password.value;

      if (!name || !username || !email || !password) {
        showError(err, 'All fields are required.'); return;
      }
      if (password.length < 6) {
        showError(err, 'Password must be at least 6 characters.'); return;
      }
      const users = getUsers();
      if (users[username]) {
        showError(err, 'Username already taken.'); return;
      }

      users[username] = { name, username, email, password };
      saveUsers(users);
      saveSession({ name, username, email });
      closeModal('signup-modal');
      signupForm.reset();
      updateNavAuth();
    });
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const err = document.getElementById('login-error');
      const username = loginForm.username.value.trim().toLowerCase();
      const password = loginForm.password.value;

      const users = getUsers();
      const user = users[username];
      if (!user || user.password !== password) {
        showError(err, 'Invalid username or password.'); return;
      }
      saveSession({ name: user.name, username: user.username, email: user.email });
      closeModal('login-modal');
      loginForm.reset();
      updateNavAuth();
    });
  }
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

/* ====== LAB IDE ====== */

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <style>
    /* CSS from the CSS tab will be injected here */
  </style>
</head>
<body>
  <h1>Hello, Veltrix IDE!</h1>
  <p>Start building something amazing.</p>
</body>
</html>`;

const DEFAULT_CSS = `body {
  font-family: sans-serif;
  padding: 2rem;
  background: #f5f5f5;
  color: #222;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}`;

const DEFAULT_JS = `// JavaScript goes here
console.log("Veltrix IDE — ready!");

document.addEventListener('DOMContentLoaded', () => {
  // Your code here
});`;

function initLab() {
  const htmlEditor = document.getElementById('editor-html');
  const cssEditor  = document.getElementById('editor-css');
  const jsEditor   = document.getElementById('editor-js');
  const preview    = document.getElementById('live-preview');

  if (!htmlEditor) return;

  // Load saved or default content
  htmlEditor.value = localStorage.getItem('veltrix_lab_html') || DEFAULT_HTML;
  cssEditor.value  = localStorage.getItem('veltrix_lab_css') || DEFAULT_CSS;
  jsEditor.value   = localStorage.getItem('veltrix_lab_js') || DEFAULT_JS;

  // Tab switching
  document.querySelectorAll('.ide-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ide-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.ide-editor').forEach(e => e.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('editor-' + tab.dataset.tab)?.classList.add('active');
    });
  });

  // Live preview update
  function updatePreview() {
    const html = htmlEditor.value;
    const css  = cssEditor.value;
    const js   = jsEditor.value;

    // Save to localStorage
    localStorage.setItem('veltrix_lab_html', html);
    localStorage.setItem('veltrix_lab_css', css);
    localStorage.setItem('veltrix_lab_js', js);

    const combined = html
      .replace('</head>', `<style>${css}</style></head>`)
      .replace('</body>', `<script>${js}<\/script></body>`);

    const blob = new Blob([combined], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    if (preview) {
      preview.src = url;
    }
  }

  let debounce;
  [htmlEditor, cssEditor, jsEditor].forEach(ed => {
    ed.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(updatePreview, 600);
    });
    // Tab key support
    ed.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = ed.selectionStart;
        const end = ed.selectionEnd;
        ed.value = ed.value.substring(0, start) + '  ' + ed.value.substring(end);
        ed.selectionStart = ed.selectionEnd = start + 2;
      }
    });
  });

  // Refresh button
  document.getElementById('refresh-preview')?.addEventListener('click', updatePreview);

  // Add file
  document.getElementById('add-file-btn')?.addEventListener('click', () => {
    const name = prompt('Enter file name (e.g. utils.js):');
    if (name) {
      const tree = document.getElementById('file-tree');
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `<span class="file-icon">📄</span> ${name}`;
      tree.appendChild(item);
    }
  });

  // Add folder
  document.getElementById('add-folder-btn')?.addEventListener('click', () => {
    const name = prompt('Enter folder name:');
    if (name) {
      const tree = document.getElementById('file-tree');
      const item = document.createElement('div');
      item.className = 'folder-item';
      item.innerHTML = `<span class="file-icon">📁</span> ${name}/`;
      tree.appendChild(item);
    }
  });

  // Initial preview
  setTimeout(updatePreview, 400);
}

/* ====== ACTIVE NAV LINK ====== */

function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === path || (path === '' && href === 'index.html'));
  });
}

/* ====== INIT ====== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  buildThemeDropdown();
  initThemeToggle();
  initAuthModals();
  updateNavAuth();
  setActiveNav();
  initLab();
});
