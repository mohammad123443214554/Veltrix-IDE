/* ============================================================
   VELTRIX IDE — script.js
   Theme | Auth | File System | Context Menu | Editor | Preview
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
  const dd = document.querySelector('.theme-dropdown');
  if (!dd) return;
  const current = getSavedTheme();
  dd.innerHTML = THEMES.map(t => `
    <div class="theme-item ${t.id === current ? 'active' : ''}" data-theme-id="${t.id}">
      <span class="theme-swatch" style="background:${t.swatch}"></span>${t.label}
    </div>`).join('');
  dd.querySelectorAll('.theme-item').forEach(item => {
    item.addEventListener('click', () => { applyTheme(item.dataset.themeId); toggleDD(false); });
  });
}

function toggleDD(force) {
  const btn  = document.querySelector('.theme-toggle-btn');
  const dd   = document.querySelector('.theme-dropdown');
  const open = typeof force === 'boolean' ? force : !dd?.classList.contains('open');
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
    toggleDD();
  });
  document.addEventListener('click', () => toggleDD(false));
}

/* ============================================================
   AUTHENTICATION
   ============================================================ */

const LS_USERS   = 'veltrix_users';
const LS_SESSION = 'veltrix_session';

function getUsers()   { try { return JSON.parse(localStorage.getItem(LS_USERS))  || {}; } catch { return {}; } }
function getSession() { try { return JSON.parse(localStorage.getItem(LS_SESSION));       } catch { return null; } }
function saveUsers(o) { localStorage.setItem(LS_USERS,   JSON.stringify(o)); }
function setSession(u){ localStorage.setItem(LS_SESSION, JSON.stringify(u)); }
function clearSession(){ localStorage.removeItem(LS_SESSION); }

function syncAuthUI() {
  const s       = getSession();
  const authGrp = document.getElementById('auth-group');
  const userGrp = document.getElementById('user-group');
  const nameEl  = document.getElementById('nav-username');
  const avEl    = document.getElementById('nav-avatar');

  if (s) {
    if (authGrp) authGrp.style.display = 'none';
    if (userGrp) userGrp.style.display = 'flex';
    if (nameEl)  nameEl.textContent    = s.username;
    if (avEl)    avEl.textContent      = s.username.charAt(0).toUpperCase();
  } else {
    if (authGrp) authGrp.style.display = 'flex';
    if (userGrp) userGrp.style.display = 'none';
  }

  const gate    = document.getElementById('lab-gate');
  const ideWrap = document.getElementById('ide-wrap');
  if (gate && ideWrap) {
    if (s) { gate.style.display = 'none'; ideWrap.classList.add('visible'); }
    else   { gate.style.display = 'flex'; ideWrap.classList.remove('visible'); }
  }
}

function openModal(id)  { document.getElementById(id)?.classList.add('open');    }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

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

  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
    ov.querySelector('.modal-close-btn')?.addEventListener('click', () => ov.classList.remove('open'));
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSession(); syncAuthUI();
  });

  const signupForm = document.getElementById('form-signup');
  if (signupForm) {
    signupForm.addEventListener('submit', e => {
      e.preventDefault();
      const fn = signupForm.fullname.value.trim();
      const un = signupForm.username.value.trim().toLowerCase().replace(/\s+/g, '');
      const em = signupForm.email.value.trim().toLowerCase();
      const pw = signupForm.password.value;
      if (!fn || !un || !em || !pw) return showFormError('err-signup', 'All fields are required.');
      if (un.length < 3)            return showFormError('err-signup', 'Username must be at least 3 characters.');
      if (pw.length < 6)            return showFormError('err-signup', 'Password must be at least 6 characters.');
      const users = getUsers();
      if (users[un])                return showFormError('err-signup', 'That username is already taken.');
      users[un] = { fullname: fn, username: un, email: em, password: pw };
      saveUsers(users);
      setSession({ fullname: fn, username: un, email: em });
      signupForm.reset();
      closeModal('modal-signup');
      syncAuthUI();
    });
  }

  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const un    = loginForm.username.value.trim().toLowerCase();
      const pw    = loginForm.password.value;
      const users = getUsers();
      const user  = users[un];
      if (!user || user.password !== pw) return showFormError('err-login', 'Incorrect username or password.');
      setSession({ fullname: user.fullname, username: user.username, email: user.email });
      loginForm.reset();
      closeModal('modal-login');
      syncAuthUI();
    });
  }
}

/* ============================================================
   FILE SYSTEM
   ============================================================
   Storage key: "veltrix_files_v2"
   {
     activeId: string|null,
     files: [{
       id, name, type("file"|"folder"),
       lang("html"|"css"|"js"|"text"|"image"|null),
       content(string|null), dataURL(string|null), createdAt(number)
     }]
   }
   ============================================================ */

const LS_FILES = 'veltrix_files_v2';

const DEFAULT_FILES = [
  {
    id: 'f-html', name: 'index.html', type: 'file', lang: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
</head>
<body>

  <h1>Hello, Veltrix IDE!</h1>
  <p>Edit the files in the explorer to build your project.</p>

</body>
</html>`,
    dataURL: null, createdAt: 3,
  },
  {
    id: 'f-css', name: 'style.css', type: 'file', lang: 'css',
    content: `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8f9fa;
  color: #1a1a1a;
  padding: 40px;
  line-height: 1.6;
}

h1 { font-size: 2rem; margin-bottom: 12px; }
p  { color: #555; }`,
    dataURL: null, createdAt: 2,
  },
  {
    id: 'f-js', name: 'script.js', type: 'file', lang: 'js',
    content: `document.addEventListener('DOMContentLoaded', () => {
  console.log('Veltrix IDE — ready!');
});`,
    dataURL: null, createdAt: 1,
  },
];

const FS = { files: [], activeId: null };

function uid() {
  return 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function detectLang(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['html','htm'].includes(ext))                              return 'html';
  if (ext === 'css')                                             return 'css';
  if (['js','mjs','ts'].includes(ext))                          return 'js';
  if (['png','jpg','jpeg','svg','gif','webp','bmp'].includes(ext)) return 'image';
  return 'text';
}

function isImage(lang) { return lang === 'image'; }

function getFileIcon(file) {
  if (file.type === 'folder') return '📁';
  const m = { html: '🌐', css: '🎨', js: '⚡', image: '🖼️', text: '📄' };
  return m[file.lang] || '📄';
}

function getLangLabel(lang) {
  const m = { html: 'HTML', css: 'CSS', js: 'JavaScript', image: 'Image', text: 'Plain Text' };
  return m[lang] || (lang || '').toUpperCase();
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function sortedFiles() {
  return [...FS.files].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_FILES);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.files)) return null;
    return p;
  } catch { return null; }
}

function saveToStorage() {
  localStorage.setItem(LS_FILES, JSON.stringify({ activeId: FS.activeId, files: FS.files }));
}

function initState() {
  const saved = loadFromStorage();
  if (saved && saved.files.length > 0) {
    FS.files    = saved.files;
    FS.activeId = saved.activeId || (saved.files.find(f => f.type === 'file')?.id ?? null);
  } else {
    FS.files    = JSON.parse(JSON.stringify(DEFAULT_FILES));
    FS.activeId = 'f-html';
    saveToStorage();
  }
}

/* ============================================================
   FILE OPERATIONS
   ============================================================ */

function createFile(name, type) {
  name = (name || '').trim();
  if (!name) return null;
  if (FS.files.some(f => f.name === name && f.type === type)) {
    alert(`A ${type} named "${name}" already exists.`);
    return null;
  }
  const file = {
    id:        uid(),
    name,
    type,
    lang:      type === 'file' ? detectLang(name) : null,
    content:   type === 'file' ? '' : null,
    dataURL:   null,
    createdAt: Date.now(),
  };
  FS.files.unshift(file);
  if (type === 'file') {
    FS.activeId = file.id;
    saveToStorage(); renderFileList(); renderTabBar(); openFileInEditor(file.id);
  } else {
    saveToStorage(); renderFileList();
  }
  return file;
}

function deleteFile(id) {
  const file = FS.files.find(f => f.id === id);
  if (!file) return;
  if (!confirm(`Delete "${file.name}"?\nThis cannot be undone.`)) return;
  FS.files = FS.files.filter(f => f.id !== id);
  if (FS.activeId === id) {
    const next = FS.files.find(f => f.type === 'file');
    FS.activeId = next ? next.id : null;
  }
  saveToStorage(); renderFileList(); renderTabBar();
  if (FS.activeId) openFileInEditor(FS.activeId);
  else             clearEditor();
}

function duplicateFile(id) {
  const orig = FS.files.find(f => f.id === id);
  if (!orig || orig.type !== 'file') return;
  const parts = orig.name.split('.');
  const ext   = parts.length > 1 ? '.' + parts.pop() : '';
  const base  = parts.join('.');
  let copyName = `${base}-copy${ext}`;
  let n = 1;
  while (FS.files.some(f => f.name === copyName)) { copyName = `${base}-copy${n}${ext}`; n++; }
  const dupe = { id: uid(), name: copyName, type: 'file', lang: orig.lang, content: orig.content, dataURL: orig.dataURL, createdAt: Date.now() };
  FS.files.unshift(dupe);
  FS.activeId = dupe.id;
  saveToStorage(); renderFileList(); renderTabBar(); openFileInEditor(dupe.id);
}

function renameFile(id) {
  const file = FS.files.find(f => f.id === id);
  if (!file) return;
  const newName = prompt(`Rename "${file.name}" to:`, file.name);
  if (!newName || !newName.trim() || newName.trim() === file.name) return;
  const trimmed = newName.trim();
  if (FS.files.some(f => f.name === trimmed && f.id !== id)) { alert(`A file named "${trimmed}" already exists.`); return; }
  file.name = trimmed;
  if (file.type === 'file') file.lang = detectLang(trimmed);
  saveToStorage(); renderFileList(); renderTabBar();
}

function uploadFile(nativeFile) {
  const name = nativeFile.name;
  const lang = detectLang(name);
  let safeName = name;
  if (FS.files.some(f => f.name === safeName)) {
    const parts = safeName.split('.');
    const ext   = parts.length > 1 ? '.' + parts.pop() : '';
    const base  = parts.join('.');
    let n = 1;
    while (FS.files.some(f => f.name === safeName)) { safeName = `${base}-${n}${ext}`; n++; }
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const file = { id: uid(), name: safeName, type: 'file', lang, content: isImage(lang) ? null : (e.target.result || ''), dataURL: isImage(lang) ? (e.target.result || null) : null, createdAt: Date.now() };
    FS.files.unshift(file);
    FS.activeId = file.id;
    saveToStorage(); renderFileList(); renderTabBar(); openFileInEditor(file.id);
  };
  isImage(lang) ? reader.readAsDataURL(nativeFile) : reader.readAsText(nativeFile);
}

function flushToState() {
  if (!FS.activeId) return;
  const file   = FS.files.find(f => f.id === FS.activeId);
  const editor = document.getElementById('ide-code-editor');
  if (file && editor && file.type === 'file' && !isImage(file.lang)) {
    file.content = editor.value;
    saveToStorage();
  }
}

/* ============================================================
   CONTEXT MENU — 3-dot dropdown
   ============================================================ */

let _activeCtxMenu = null;

function closeContextMenu() {
  if (_activeCtxMenu) {
    _activeCtxMenu.remove();
    _activeCtxMenu = null;
  }
}

function showContextMenu(anchorEl, fileId, fileType) {
  closeContextMenu();

  const isFile = fileType === 'file';

  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.setAttribute('role', 'menu');

  const items = [
    {
      action: 'open',
      icon: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5V3h2v-.5A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7H13v2h.5A1.5 1.5 0 0115 10.5v3A1.5 1.5 0 0113.5 15h-3A1.5 1.5 0 019 13.5V13H7v.5A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3A1.5 1.5 0 012.5 9H3V7h-.5A1.5 1.5 0 011 5.5v-3z"/></svg>`,
      label: 'Open',
      show: isFile,
    },
    {
      action: 'rename',
      icon: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.854.146a.5.5 0 00-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 000-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 016 13.5V13h-.5a.5.5 0 01-.5-.5V12h-.5a.5.5 0 01-.5-.5V11h-.5a.5.5 0 01-.5-.5V10h-.5a.499.499 0 01-.175-.032l-.179.178a.5.5 0 00-.11.168l-2 5a.5.5 0 00.65.65l5-2a.5.5 0 00.168-.11l.178-.178z"/></svg>`,
      label: 'Rename',
      show: true,
    },
    {
      action: 'duplicate',
      icon: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 1h8a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M2 5H1v8a2 2 0 002 2h8v-1H3a1 1 0 01-1-1V5z"/></svg>`,
      label: 'Duplicate',
      show: isFile,
    },
  ];

  const dangerItems = [
    {
      action: 'delete',
      icon: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" clip-rule="evenodd"/></svg>`,
      label: 'Delete',
      danger: true,
      show: true,
    },
  ];

  const visibleMain   = items.filter(i => i.show);
  const visibleDanger = dangerItems.filter(i => i.show);

  const renderItem = (item) => {
    const btn = document.createElement('button');
    btn.className  = 'ctx-item' + (item.danger ? ' danger' : '');
    btn.setAttribute('role', 'menuitem');
    btn.innerHTML  = item.icon + `<span>${item.label}</span>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeContextMenu();
      if (item.action === 'open')      { flushToState(); FS.activeId = fileId; saveToStorage(); renderFileList(); renderTabBar(); openFileInEditor(fileId); }
      if (item.action === 'rename')    renameFile(fileId);
      if (item.action === 'duplicate') duplicateFile(fileId);
      if (item.action === 'delete')    deleteFile(fileId);
    });
    return btn;
  };

  visibleMain.forEach(item => menu.appendChild(renderItem(item)));

  if (visibleMain.length > 0 && visibleDanger.length > 0) {
    const sep = document.createElement('div');
    sep.className = 'ctx-separator';
    menu.appendChild(sep);
  }

  visibleDanger.forEach(item => menu.appendChild(renderItem(item)));

  document.body.appendChild(menu);
  _activeCtxMenu = menu;

  // Position: right-align to anchor, appear below
  const r   = anchorEl.getBoundingClientRect();
  const mw  = 170;
  const mh  = menu.offsetHeight || 140;
  let  left = r.right - mw;
  let  top  = r.bottom + 4;

  if (left < 8)                            left = 8;
  if (left + mw > window.innerWidth - 8)  left = window.innerWidth - mw - 8;
  if (top + mh  > window.innerHeight - 8) top  = r.top - mh - 4;

  menu.style.left = left + 'px';
  menu.style.top  = top  + 'px';

  // Close on outside click (deferred so current click doesn't trigger it)
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
  }, 0);
}

/* ============================================================
   FILE TREE RENDER
   ============================================================ */

function renderFileList() {
  const tree = document.getElementById('file-tree');
  if (!tree) return;

  closeContextMenu();

  if (FS.files.length === 0) {
    tree.innerHTML = '<div class="tree-empty">No files yet.<br>Click + File or ↑ to upload.</div>';
    return;
  }

  const ordered = sortedFiles();
  const folders = ordered.filter(f => f.type === 'folder');
  const files   = ordered.filter(f => f.type === 'file');

  let html = '';

  folders.forEach(folder => {
    html += `
      <div class="tree-row folder-row" data-id="${folder.id}" data-type="folder">
        <span class="tree-icon">${getFileIcon(folder)}</span>
        <span class="folder-name">${escHtml(folder.name)}/</span>
        <button class="row-menu-btn" data-id="${folder.id}" data-type="folder" aria-label="Options" title="Options">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3"  r="1.2"/>
            <circle cx="8" cy="8"  r="1.2"/>
            <circle cx="8" cy="13" r="1.2"/>
          </svg>
        </button>
      </div>`;
  });

  files.forEach(file => {
    const active = file.id === FS.activeId;
    html += `
      <div class="tree-row file-row ${active ? 'active' : ''}"
           data-id="${file.id}"
           data-type="file"
           tabindex="0"
           role="treeitem"
           aria-selected="${active}">
        <span class="tree-icon">${getFileIcon(file)}</span>
        <span class="tree-filename">${escHtml(file.name)}</span>
        <button class="row-menu-btn" data-id="${file.id}" data-type="file" aria-label="Options for ${escHtml(file.name)}" title="Options">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3"  r="1.2"/>
            <circle cx="8" cy="8"  r="1.2"/>
            <circle cx="8" cy="13" r="1.2"/>
          </svg>
        </button>
      </div>`;
  });

  tree.innerHTML = html;

  // File row click → open
  tree.querySelectorAll('.file-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.row-menu-btn')) return;
      flushToState();
      FS.activeId = row.dataset.id;
      saveToStorage();
      renderFileList();
      renderTabBar();
      openFileInEditor(FS.activeId);
    });
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
    });
  });

  // 3-dot button → open context menu
  tree.querySelectorAll('.row-menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showContextMenu(btn, btn.dataset.id, btn.dataset.type);
    });
  });
}

/* ============================================================
   TAB BAR RENDER
   ============================================================ */

function renderTabBar() {
  const bar = document.getElementById('ide-tab-bar');
  if (!bar) return;

  const files = sortedFiles().filter(f => f.type === 'file');

  if (files.length === 0) {
    bar.innerHTML = '<span class="tab-bar-empty">No open files</span>';
    return;
  }

  bar.innerHTML = files.map(f => `
    <button class="ide-tab ${f.id === FS.activeId ? 'active' : ''}"
            data-fid="${f.id}"
            role="tab"
            aria-selected="${f.id === FS.activeId}"
            title="${escHtml(f.name)}">
      <span class="tab-label">${escHtml(f.name)}</span>
      <span class="tab-x" data-close="${f.id}" aria-label="Close" title="Close">&times;</span>
    </button>`).join('');

  bar.querySelectorAll('.ide-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      if (e.target.closest('.tab-x')) return;
      flushToState();
      FS.activeId = tab.dataset.fid;
      saveToStorage(); renderFileList(); renderTabBar(); openFileInEditor(FS.activeId);
    });
  });

  bar.querySelectorAll('.tab-x').forEach(x => {
    x.addEventListener('click', e => {
      e.stopPropagation();
      flushToState();
      const closingId = x.dataset.close;
      if (FS.activeId === closingId) {
        const rest  = FS.files.filter(f => f.type === 'file' && f.id !== closingId);
        FS.activeId = rest.length > 0 ? rest[0].id : null;
      }
      saveToStorage(); renderFileList(); renderTabBar();
      if (FS.activeId) openFileInEditor(FS.activeId);
      else             clearEditor();
    });
  });
}

/* ============================================================
   EDITOR — OPEN / CLEAR
   ============================================================ */

function openFileInEditor(id) {
  const file       = FS.files.find(f => f.id === id);
  const editor     = document.getElementById('ide-code-editor');
  const imgPreview = document.getElementById('ide-image-preview');
  const imgEl      = document.getElementById('ide-preview-img');
  const statusLang = document.getElementById('status-lang');
  const statusFile = document.getElementById('status-file');

  if (!editor) return;

  if (!file || file.type !== 'file') {
    editor.disabled    = true;
    editor.value       = '';
    editor.placeholder = 'Select a file to edit';
    if (imgPreview) imgPreview.classList.remove('visible');
    return;
  }

  if (isImage(file.lang)) {
    editor.style.display = 'none';
    if (imgPreview) { imgPreview.classList.add('visible'); if (imgEl) imgEl.src = file.dataURL || ''; }
    if (statusLang) statusLang.textContent = 'Image';
    if (statusFile) statusFile.textContent  = file.name;
    return;
  }

  if (imgPreview) imgPreview.classList.remove('visible');
  editor.style.display = '';
  editor.disabled      = false;
  editor.value         = file.content ?? '';
  editor.placeholder   = '';
  editor.scrollTop     = 0;
  editor.focus();

  if (statusLang) statusLang.textContent = getLangLabel(file.lang);
  if (statusFile) statusFile.textContent  = file.name;

  schedulePreview();
}

function clearEditor() {
  const editor     = document.getElementById('ide-code-editor');
  const imgPreview = document.getElementById('ide-image-preview');
  const statusLang = document.getElementById('status-lang');
  const statusFile = document.getElementById('status-file');

  if (editor) { editor.style.display = ''; editor.disabled = true; editor.value = ''; editor.placeholder = 'No file open'; }
  if (imgPreview) imgPreview.classList.remove('visible');
  if (statusLang) statusLang.textContent = '\u2014';
  if (statusFile) statusFile.textContent  = '\u2014';
}

/* ============================================================
   LIVE PREVIEW
   ============================================================ */

let _previewTimer = null;

function schedulePreview() {
  clearTimeout(_previewTimer);
  _previewTimer = setTimeout(renderPreview, 700);
}

function renderPreview() {
  const frame = document.getElementById('preview-frame');
  if (!frame) return;

  const htmlFile = FS.files.find(f => f.type === 'file' && f.lang === 'html');
  const cssFiles = FS.files.filter(f => f.type === 'file' && f.lang === 'css');
  const jsFiles  = FS.files.filter(f => f.type === 'file' && f.lang === 'js');

  if (!htmlFile) {
    frame.srcdoc = '<body style="font:14px/1.7 sans-serif;padding:24px;color:#888;background:#fff">Add an HTML file to see a live preview.</body>';
    return;
  }

  let doc    = htmlFile.content || '';
  const allCss = cssFiles.map(f => f.content || '').filter(Boolean).join('\n\n');
  const allJs  = jsFiles.map(f => f.content  || '').filter(Boolean).join('\n\n');

  if (allCss) {
    const tag = `<style>\n${allCss}\n</style>`;
    doc = doc.includes('</head>') ? doc.replace('</head>', tag + '\n</head>') : tag + '\n' + doc;
  }
  if (allJs) {
    const safe = `try{\n${allJs}\n}catch(_e){console.error('Preview error:',_e);}`;
    const tag  = `<script>${safe}<\/script>`;
    doc = doc.includes('</body>') ? doc.replace('</body>', tag + '\n</body>') : doc + '\n' + tag;
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
  renderTabBar();

  if (FS.activeId) openFileInEditor(FS.activeId);
  else             clearEditor();

  editor.addEventListener('input', () => { flushToState(); schedulePreview(); });

  editor.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = editor.selectionStart, end = editor.selectionEnd;
      editor.value = editor.value.substring(0, s) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = s + 2;
      flushToState(); schedulePreview();
    }
  });

  document.getElementById('btn-add-file')?.addEventListener('click', () => {
    const name = prompt('File name (e.g. about.html, utils.js, theme.css):');
    if (name && name.trim()) createFile(name, 'file');
  });

  document.getElementById('btn-add-folder')?.addEventListener('click', () => {
    const name = prompt('Folder name:');
    if (name && name.trim()) createFile(name, 'folder');
  });

  document.getElementById('btn-upload')?.addEventListener('click', () => {
    document.getElementById('upload-input')?.click();
  });

  document.getElementById('upload-input')?.addEventListener('change', function () {
    Array.from(this.files || []).forEach(f => uploadFile(f));
    this.value = '';
  });

  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    flushToState(); renderPreview();
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
