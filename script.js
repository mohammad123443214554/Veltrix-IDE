/* ============================================================
   VELTRIX IDE — script.js
   Theme | Auth | File Explorer | Editor | Live Preview
   ============================================================ */

'use strict';

/* ============================================================
   THEME SYSTEM
   ============================================================ */

const THEMES = [
  { id: 'aquatic', label: 'Aquatic',   swatch: '#e4e6ea' },
  { id: 'desert',  label: 'Desert',    swatch: '#d8d0c4' },
  { id: 'dusk',    label: 'Dusk',      swatch: '#48484c' },
  { id: 'night',   label: 'Night Sky', swatch: '#242424' },
];

const LS_THEME = 'veltrix_theme';

function getSavedTheme() {
  return localStorage.getItem(LS_THEME) || 'aquatic';
}

function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem(LS_THEME, id);
  const found   = THEMES.find(t => t.id === id);
  const labelEl = document.querySelector('.theme-label');
  if (labelEl && found) labelEl.textContent = found.label;
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
      toggleThemeDropdown(false);
    });
  });
}

function toggleThemeDropdown(force) {
  const btn  = document.querySelector('.theme-toggle-btn');
  const dd   = document.querySelector('.theme-dropdown');
  const open = (typeof force === 'boolean') ? force : !dd?.classList.contains('open');
  dd?.classList.toggle('open', open);
  btn?.classList.toggle('open', open);
}

function initTheme() {
  const saved = getSavedTheme();
  document.documentElement.setAttribute('data-theme', saved);
  buildThemeDropdown();
  applyTheme(saved);
  document.querySelector('.theme-toggle-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    toggleThemeDropdown();
  });
  document.addEventListener('click', () => toggleThemeDropdown(false));
}

/* ============================================================
   AUTHENTICATION
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

function syncAuthUI() {
  const session  = getSession();
  const authGrp  = document.getElementById('auth-group');
  const userGrp  = document.getElementById('user-group');
  const nameEl   = document.getElementById('nav-username');
  const avatarEl = document.getElementById('nav-avatar');

  if (session) {
    if (authGrp)  authGrp.style.display = 'none';
    if (userGrp)  userGrp.style.display = 'flex';
    if (nameEl)   nameEl.textContent    = session.username;
    if (avatarEl) avatarEl.textContent  = session.username.charAt(0).toUpperCase();
  } else {
    if (authGrp)  authGrp.style.display = 'flex';
    if (userGrp)  userGrp.style.display = 'none';
  }

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

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent   = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function initAuth() {
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal('modal-login');
      closeModal('modal-signup');
      openModal(btn.dataset.openModal);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    overlay.querySelector('.modal-close-btn')?.addEventListener('click', () => {
      overlay.classList.remove('open');
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSession();
    syncAuthUI();
  });

  const signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', e => {
      e.preventDefault();
      const fullname = signupForm.fullname.value.trim();
      const username = signupForm.username.value.trim().toLowerCase().replace(/\s+/g, '');
      const email    = signupForm.email.value.trim().toLowerCase();
      const password = signupForm.password.value;
      if (!fullname || !username || !email || !password)
        return showFormError('err-signup', 'All fields are required.');
      if (username.length < 3)
        return showFormError('err-signup', 'Username must be at least 3 characters.');
      if (password.length < 6)
        return showFormError('err-signup', 'Password must be at least 6 characters.');
      const users = getUsers();
      if (users[username])
        return showFormError('err-signup', 'That username is already taken.');
      users[username] = { fullname, username, email, password };
      saveUsers(users);
      setSession({ fullname, username, email });
      signupForm.reset();
      closeModal('modal-signup');
      syncAuthUI();
    });
  }

  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = loginForm.username.value.trim().toLowerCase();
      const password = loginForm.password.value;
      const users    = getUsers();
      const user     = users[username];
      if (!user || user.password !== password)
        return showFormError('err-login', 'Incorrect username or password.');
      setSession({ fullname: user.fullname, username: user.username, email: user.email });
      loginForm.reset();
      closeModal('modal-login');
      syncAuthUI();
    });
  }
}

/* ============================================================
   FILE EXPLORER — Storage Schema
   ============================================================
   localStorage key: "veltrix_lab_files"
   Value (JSON):
   {
     activeFileId: "string|null",
     files: [
       {
         id:      "unique string",
         name:    "index.html",
         type:    "file" | "folder",
         lang:    "html" | "css" | "js" | "text" | null,
         content: "string" | null
       }
     ]
   }
   ============================================================ */

const LS_FILES = 'veltrix_lab_files';

const DEFAULT_FILES = [
  {
    id:      'default-html',
    name:    'index.html',
    type:    'file',
    lang:    'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
</head>
<body>

  <h1>Hello, Veltrix IDE! \u{1F44B}</h1>
  <p>Edit the files in the explorer to build your project.</p>

</body>
</html>`,
  },
  {
    id:      'default-css',
    name:    'style.css',
    type:    'file',
    lang:    'css',
    content: `* {
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
}`,
  },
  {
    id:      'default-js',
    name:    'script.js',
    type:    'file',
    lang:    'js',
    content: `// script.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('Veltrix IDE \u2014 ready!');
});`,
  },
];

/* ── IDE global state ── */
const IDE = {
  files:        [],
  activeFileId: null,
};

/* ── Utilities ── */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function detectLang(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'css')                   return 'css';
  if (ext === 'js'  || ext === 'mjs' || ext === 'ts') return 'js';
  return 'text';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getFileIcon(file) {
  if (file.type === 'folder') return '&#128193;';
  const icons = { html: '&#127760;', css: '&#127912;', js: '&#9889;', text: '&#128196;' };
  return icons[file.lang] || '&#128196;';
}

function getLangLabel(lang) {
  const map = { html: 'HTML', css: 'CSS', js: 'JavaScript', text: 'Plain Text' };
  return map[lang] || lang.toUpperCase();
}

/* ── Persistence ── */

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_FILES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.files)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage() {
  localStorage.setItem(LS_FILES, JSON.stringify({
    activeFileId: IDE.activeFileId,
    files:        IDE.files,
  }));
}

/* ── State init ── */

function initState() {
  const saved = loadFromStorage();
  if (saved && saved.files.length > 0) {
    IDE.files        = saved.files;
    IDE.activeFileId = saved.activeFileId || (saved.files.find(f => f.type === 'file')?.id ?? null);
  } else {
    IDE.files        = JSON.parse(JSON.stringify(DEFAULT_FILES));
    IDE.activeFileId = 'default-html';
    saveToStorage();
  }
}

/* ============================================================
   FILE OPERATIONS
   ============================================================ */

function createFile(name, type) {
  name = name.trim();
  if (!name) return;

  const duplicate = IDE.files.some(f => f.name === name && f.type === type);
  if (duplicate) {
    alert(`A ${type} named "${name}" already exists.`);
    return;
  }

  const file = {
    id:      uid(),
    name,
    type,
    lang:    type === 'file' ? detectLang(name) : null,
    content: type === 'file' ? '' : null,
  };

  IDE.files.push(file);

  if (type === 'file') {
    IDE.activeFileId = file.id;
  }

  saveToStorage();
  renderFileList();
  renderEditorTabs();

  if (type === 'file') {
    openFileInEditor(file.id);
  }
}

function deleteFile(id) {
  const file = IDE.files.find(f => f.id === id);
  if (!file) return;

  if (!confirm(`Delete "${file.name}"?\nThis action cannot be undone.`)) return;

  IDE.files = IDE.files.filter(f => f.id !== id);

  if (IDE.activeFileId === id) {
    const remaining  = IDE.files.filter(f => f.type === 'file');
    IDE.activeFileId = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
  }

  saveToStorage();
  renderFileList();
  renderEditorTabs();

  if (IDE.activeFileId) {
    openFileInEditor(IDE.activeFileId);
  } else {
    clearEditor();
  }
}

function duplicateFile(id) {
  const file = IDE.files.find(f => f.id === id);
  if (!file || file.type !== 'file') return;

  const parts    = file.name.split('.');
  const ext      = parts.length > 1 ? '.' + parts.pop() : '';
  const base     = parts.join('.');
  let   copyName = `${base}-copy${ext}`;
  let   n        = 1;

  while (IDE.files.some(f => f.name === copyName)) {
    copyName = `${base}-copy${n}${ext}`;
    n++;
  }

  const dupe = {
    id:      uid(),
    name:    copyName,
    type:    'file',
    lang:    file.lang,
    content: file.content,
  };

  const idx = IDE.files.findIndex(f => f.id === id);
  IDE.files.splice(idx + 1, 0, dupe);
  IDE.activeFileId = dupe.id;

  saveToStorage();
  renderFileList();
  renderEditorTabs();
  openFileInEditor(dupe.id);
}

function renameFile(id) {
  const file = IDE.files.find(f => f.id === id);
  if (!file) return;

  const newName = prompt(`Rename "${file.name}" to:`, file.name);
  if (!newName || !newName.trim() || newName.trim() === file.name) return;

  const trimmed = newName.trim();
  const taken   = IDE.files.some(f => f.name === trimmed && f.id !== id);
  if (taken) {
    alert(`A file named "${trimmed}" already exists.`);
    return;
  }

  file.name = trimmed;
  if (file.type === 'file') {
    file.lang = detectLang(trimmed);
  }

  saveToStorage();
  renderFileList();
  renderEditorTabs();
}

/* Flush the currently displayed editor content into state */
function flushEditorToState() {
  if (!IDE.activeFileId) return;
  const file   = IDE.files.find(f => f.id === IDE.activeFileId);
  const editor = document.getElementById('ide-code-editor');
  if (file && editor && file.type === 'file') {
    file.content = editor.value;
    saveToStorage();
  }
}

/* ============================================================
   CONTEXT MENU (3-dot dropdown)
   ============================================================ */

let _activeMenu = null;

function closeAllContextMenus() {
  if (_activeMenu) {
    _activeMenu.remove();
    _activeMenu = null;
  }
}

function showContextMenu(triggerEl, fileId, fileType) {
  closeAllContextMenus();

  const menu = document.createElement('div');
  menu.className = 'tree-context-menu';

  const isFile = fileType === 'file';

  menu.innerHTML = `
    <button class="ctx-item" data-action="rename">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
      </svg>
      Rename
    </button>
    ${isFile ? `
    <button class="ctx-item" data-action="duplicate">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8 2a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2V8l-4-4H8zm4 4V3l4 4h-4z"/>
      </svg>
      Duplicate
    </button>` : ''}
    <div class="ctx-divider"></div>
    <button class="ctx-item ctx-danger" data-action="delete">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd"/>
      </svg>
      Delete
    </button>
  `;

  document.body.appendChild(menu);
  _activeMenu = menu;

  // Position: below trigger, right-aligned
  const rect = triggerEl.getBoundingClientRect();
  const mW   = 160;
  let left    = rect.right - mW;
  let top     = rect.bottom + 4;

  if (left < 4)                             left = 4;
  if (top + 130 > window.innerHeight - 8)  top  = rect.top - 134;

  menu.style.left = left + 'px';
  menu.style.top  = top  + 'px';

  // Action handlers
  menu.querySelectorAll('.ctx-item').forEach(item => {
    item.addEventListener('click', e => {
      e.stopPropagation();
      const action = item.dataset.action;
      closeAllContextMenus();
      if (action === 'rename')    renameFile(fileId);
      if (action === 'duplicate') duplicateFile(fileId);
      if (action === 'delete')    deleteFile(fileId);
    });
  });

  // Close on outside click (next tick)
  setTimeout(() => {
    document.addEventListener('click', closeAllContextMenus, { once: true });
  }, 0);
}

/* ============================================================
   FILE TREE RENDER
   ============================================================ */

function renderFileList() {
  const tree = document.getElementById('file-tree');
  if (!tree) return;

  closeAllContextMenus();

  const folders = IDE.files.filter(f => f.type === 'folder');
  const files   = IDE.files.filter(f => f.type === 'file');

  if (IDE.files.length === 0) {
    tree.innerHTML = '<div class="tree-empty">No files yet.<br>Click + File to start.</div>';
    return;
  }

  let html = '';

  folders.forEach(folder => {
    html += `
      <div class="tree-row tree-folder-row" data-id="${folder.id}">
        <span class="tree-icon">${getFileIcon(folder)}</span>
        <span class="tree-name">${escapeHtml(folder.name)}/</span>
        <button class="tree-menu-btn" data-id="${folder.id}" data-type="folder" aria-label="Options" title="Options">&#8942;</button>
      </div>`;
  });

  files.forEach(file => {
    const isActive = file.id === IDE.activeFileId;
    html += `
      <div class="tree-row tree-file-row ${isActive ? 'active' : ''}"
           data-id="${file.id}"
           tabindex="0"
           role="treeitem"
           aria-selected="${isActive}">
        <span class="tree-icon">${getFileIcon(file)}</span>
        <span class="tree-name">${escapeHtml(file.name)}</span>
        <button class="tree-menu-btn" data-id="${file.id}" data-type="file" aria-label="Options for ${escapeHtml(file.name)}" title="Options">&#8942;</button>
      </div>`;
  });

  tree.innerHTML = html;

  // File row → open
  tree.querySelectorAll('.tree-file-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.tree-menu-btn')) return;
      flushEditorToState();
      IDE.activeFileId = row.dataset.id;
      saveToStorage();
      renderFileList();
      renderEditorTabs();
      openFileInEditor(IDE.activeFileId);
    });

    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });
  });

  // 3-dot menu button
  tree.querySelectorAll('.tree-menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showContextMenu(btn, btn.dataset.id, btn.dataset.type);
    });
  });
}

/* ============================================================
   EDITOR TABS RENDER
   ============================================================ */

function renderEditorTabs() {
  const tabBar = document.getElementById('ide-tab-bar');
  if (!tabBar) return;

  const fileItems = IDE.files.filter(f => f.type === 'file');

  if (fileItems.length === 0) {
    tabBar.innerHTML = '<span class="tab-placeholder">No open files</span>';
    return;
  }

  tabBar.innerHTML = fileItems.map(file => {
    const isActive = file.id === IDE.activeFileId;
    return `
      <button class="ide-tab ${isActive ? 'active' : ''}"
              data-file-id="${file.id}"
              role="tab"
              aria-selected="${isActive}"
              title="${escapeHtml(file.name)}">
        <span class="tab-name">${escapeHtml(file.name)}</span>
        <span class="tab-close" data-close-id="${file.id}" aria-label="Close ${escapeHtml(file.name)}" title="Close tab">&times;</span>
      </button>`;
  }).join('');

  // Tab click → switch file
  tabBar.querySelectorAll('.ide-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      if (e.target.closest('.tab-close')) return;
      flushEditorToState();
      IDE.activeFileId = tab.dataset.fileId;
      saveToStorage();
      renderFileList();
      renderEditorTabs();
      openFileInEditor(IDE.activeFileId);
    });
  });

  // Tab close
  tabBar.querySelectorAll('.tab-close').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      flushEditorToState();
      const closingId = btn.dataset.closeId;

      if (IDE.activeFileId === closingId) {
        const remaining = IDE.files.filter(f => f.type === 'file' && f.id !== closingId);
        IDE.activeFileId = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }

      saveToStorage();
      renderFileList();
      renderEditorTabs();

      if (IDE.activeFileId) {
        openFileInEditor(IDE.activeFileId);
      } else {
        clearEditor();
      }
    });
  });
}

/* ============================================================
   EDITOR — Open / Clear
   ============================================================ */

function openFileInEditor(id) {
  const file        = IDE.files.find(f => f.id === id);
  const editor      = document.getElementById('ide-code-editor');
  const statusLang  = document.getElementById('status-lang');
  const statusFile  = document.getElementById('status-file');

  if (!editor) return;

  if (!file || file.type !== 'file') {
    editor.value       = '';
    editor.disabled    = true;
    editor.placeholder = 'Select a file to edit';
    return;
  }

  editor.disabled    = false;
  editor.value       = file.content ?? '';
  editor.placeholder = '';
  editor.scrollTop   = 0;

  if (statusLang) statusLang.textContent = getLangLabel(file.lang);
  if (statusFile) statusFile.textContent  = file.name;

  schedulePreview();
}

function clearEditor() {
  const editor     = document.getElementById('ide-code-editor');
  const statusLang = document.getElementById('status-lang');
  const statusFile = document.getElementById('status-file');

  if (editor) {
    editor.value       = '';
    editor.disabled    = true;
    editor.placeholder = 'No file open';
  }
  if (statusLang) statusLang.textContent = '\u2014';
  if (statusFile) statusFile.textContent  = '\u2014';
}

/* ============================================================
   LIVE PREVIEW
   ============================================================ */

let _previewTimer = null;

function schedulePreview() {
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(renderPreview, 650);
}

function renderPreview() {
  const frame = document.getElementById('preview-frame');
  if (!frame) return;

  const htmlFile = IDE.files.find(f => f.type === 'file' && f.lang === 'html');
  const cssFiles = IDE.files.filter(f => f.type === 'file' && f.lang === 'css');
  const jsFiles  = IDE.files.filter(f => f.type === 'file' && f.lang === 'js');

  if (!htmlFile) {
    frame.srcdoc = '<body style="font:14px/1.6 sans-serif;padding:24px;color:#888">Add an HTML file to see a live preview.</body>';
    return;
  }

  let doc = htmlFile.content || '';

  const allCss = cssFiles.map(f => f.content || '').filter(Boolean).join('\n\n');
  const allJs  = jsFiles.map(f => f.content || '').filter(Boolean).join('\n\n');

  if (allCss) {
    const styleTag = `<style>\n${allCss}\n</style>`;
    doc = doc.includes('</head>')
      ? doc.replace('</head>', styleTag + '\n</head>')
      : styleTag + '\n' + doc;
  }

  if (allJs) {
    const safeJs  = `try{\n${allJs}\n}catch(_e){console.error('Preview JS error:',_e);}`;
    const scriptTag = `<script>${safeJs}<\/script>`;
    doc = doc.includes('</body>')
      ? doc.replace('</body>', scriptTag + '\n</body>')
      : doc + '\n' + scriptTag;
  }

  frame.srcdoc = doc;
}

/* ============================================================
   LAB INIT
   ============================================================ */

function initLab() {
  const editor = document.getElementById('ide-code-editor');
  if (!editor) return;

  initState();
  renderFileList();
  renderEditorTabs();

  if (IDE.activeFileId) {
    openFileInEditor(IDE.activeFileId);
  } else {
    clearEditor();
  }

  // Editor → save + preview on input
  editor.addEventListener('input', () => {
    flushEditorToState();
    schedulePreview();
  });

  // Tab key → 2 spaces
  editor.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, s) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = s + 2;
      flushEditorToState();
      schedulePreview();
    }
  });

  // Toolbar: Add File
  document.getElementById('btn-add-file')?.addEventListener('click', () => {
    const name = prompt('File name (e.g. about.html, utils.js, theme.css):');
    if (name && name.trim()) createFile(name, 'file');
  });

  // Toolbar: Add Folder
  document.getElementById('btn-add-folder')?.addEventListener('click', () => {
    const name = prompt('Folder name:');
    if (name && name.trim()) createFile(name, 'folder');
  });

  // Refresh preview
  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    flushEditorToState();
    renderPreview();
  });
}

/* ============================================================
   ACTIVE NAV LINK
   ============================================================ */

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href   = a.getAttribute('href');
    const isHome = (page === '' || page === 'index.html') && href === 'index.html';
    a.classList.toggle('active', href === page || isHome);
  });
}

/* ============================================================
   PWA
   ============================================================ */

function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    });
  }
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuth();
  syncAuthUI();
  setActiveNav();
  initLab();
  registerSW();
});
