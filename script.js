/* ============================================================
   VELTRIX IDE — script.js
   Theme | Auth | File System | Editor | Preview
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
    item.addEventListener('click', () => {
      applyTheme(item.dataset.themeId);
      toggleDD(false);
    });
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

function getUsers()  { try { return JSON.parse(localStorage.getItem(LS_USERS))   || {}; } catch { return {}; } }
function getSession(){ try { return JSON.parse(localStorage.getItem(LS_SESSION));        } catch { return null; } }
function saveUsers(o){ localStorage.setItem(LS_USERS,   JSON.stringify(o)); }
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
    clearSession();
    syncAuthUI();
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
      const un   = loginForm.username.value.trim().toLowerCase();
      const pw   = loginForm.password.value;
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
   localStorage key : "veltrix_files_v2"
   Schema:
   {
     activeId: string | null,
     files: [
       {
         id:        string,
         name:      string,
         type:      "file" | "folder",
         lang:      "html"|"css"|"js"|"text"|"image"|null,
         content:   string | null,   // text files
         dataURL:   string | null,   // image files (base64)
         createdAt: number           // timestamp for sorting newest-first
       }
     ]
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

/* IDE state (runtime) */
const FS = {
  files:    [],
  activeId: null,
};

/* Helpers */
function uid() {
  return 'f_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function detectLang(name) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['html','htm'].includes(ext))       return 'html';
  if (ext === 'css')                       return 'css';
  if (['js','mjs','ts'].includes(ext))    return 'js';
  if (['png','jpg','jpeg','svg','gif','webp','bmp'].includes(ext)) return 'image';
  return 'text';
}

function isImage(lang) { return lang === 'image'; }

function getIcon(file) {
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
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/* Sort files: newest createdAt first */
function sortedFiles() {
  return [...FS.files].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/* ── Persistence ── */
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
  localStorage.setItem(LS_FILES, JSON.stringify({
    activeId: FS.activeId,
    files:    FS.files,
  }));
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

  FS.files.unshift(file);          // add to beginning for newest-first

  if (type === 'file') {
    FS.activeId = file.id;
    saveToStorage();
    renderFileList();
    renderTabBar();
    openFileInEditor(file.id);
  } else {
    saveToStorage();
    renderFileList();
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

  saveToStorage();
  renderFileList();
  renderTabBar();

  if (FS.activeId) openFileInEditor(FS.activeId);
  else             clearEditor();
}

function duplicateFile(id) {
  const orig = FS.files.find(f => f.id === id);
  if (!orig || orig.type !== 'file') return;

  const parts    = orig.name.split('.');
  const ext      = parts.length > 1 ? '.' + parts.pop() : '';
  const base     = parts.join('.');
  let   copyName = `${base}-copy${ext}`;
  let   n = 1;
  while (FS.files.some(f => f.name === copyName)) {
    copyName = `${base}-copy${n}${ext}`;
    n++;
  }

  const dupe = {
    id:        uid(),
    name:      copyName,
    type:      'file',
    lang:      orig.lang,
    content:   orig.content,
    dataURL:   orig.dataURL,
    createdAt: Date.now(),       // newest → goes to top
  };

  FS.files.unshift(dupe);
  FS.activeId = dupe.id;

  saveToStorage();
  renderFileList();
  renderTabBar();
  openFileInEditor(dupe.id);
}

function renameFile(id) {
  const file = FS.files.find(f => f.id === id);
  if (!file) return;

  const newName = prompt(`Rename "${file.name}" to:`, file.name);
  if (!newName || !newName.trim() || newName.trim() === file.name) return;

  const trimmed = newName.trim();
  if (FS.files.some(f => f.name === trimmed && f.id !== id)) {
    alert(`A file named "${trimmed}" already exists.`);
    return;
  }

  file.name = trimmed;
  if (file.type === 'file') file.lang = detectLang(trimmed);

  saveToStorage();
  renderFileList();
  renderTabBar();
}

/* Upload a file from disk */
function uploadFile(nativeFile) {
  const name = nativeFile.name;
  const lang = detectLang(name);

  // Check duplicate
  let safeName = name;
  if (FS.files.some(f => f.name === safeName)) {
    const parts = safeName.split('.');
    const ext   = parts.length > 1 ? '.' + parts.pop() : '';
    const base  = parts.join('.');
    let n = 1;
    while (FS.files.some(f => f.name === safeName)) {
      safeName = `${base}-${n}${ext}`;
      n++;
    }
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const file = {
      id:        uid(),
      name:      safeName,
      type:      'file',
      lang,
      content:   isImage(lang) ? null : (e.target.result || ''),
      dataURL:   isImage(lang) ? (e.target.result || null) : null,
      createdAt: Date.now(),
    };

    FS.files.unshift(file);      // newest first
    FS.activeId = file.id;

    saveToStorage();
    renderFileList();
    renderTabBar();
    openFileInEditor(file.id);
  };

  if (isImage(lang)) {
    reader.readAsDataURL(nativeFile);
  } else {
    reader.readAsText(nativeFile);
  }
}

/* Flush editor textarea → active file */
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
   FILE TREE RENDER
   ============================================================ */

function renderFileList() {
  const tree = document.getElementById('file-tree');
  if (!tree) return;

  if (FS.files.length === 0) {
    tree.innerHTML = '<div class="tree-empty">No files yet.<br>Click + File or Upload to start.</div>';
    return;
  }

  const ordered  = sortedFiles();
  const folders  = ordered.filter(f => f.type === 'folder');
  const files    = ordered.filter(f => f.type === 'file');

  let html = '';

  // Folders first
  folders.forEach(folder => {
    html += `
      <div class="tree-row folder-row" data-id="${folder.id}">
        <span class="tree-icon">${getIcon(folder)}</span>
        <span class="folder-name">${escHtml(folder.name)}/</span>
        <div class="row-actions">
          <button class="row-btn" data-action="rename" data-id="${folder.id}" title="Rename">✏️</button>
          <button class="row-btn danger" data-action="delete" data-id="${folder.id}" title="Delete">🗑</button>
        </div>
      </div>`;
  });

  // Files — newest first
  files.forEach(file => {
    const active = file.id === FS.activeId;
    html += `
      <div class="tree-row file-row ${active ? 'active' : ''}"
           data-id="${file.id}"
           tabindex="0"
           role="treeitem"
           aria-selected="${active}">
        <span class="tree-icon">${getIcon(file)}</span>
        <span class="tree-filename">${escHtml(file.name)}</span>
        <div class="row-actions">
          <button class="row-btn" data-action="rename"    data-id="${file.id}" title="Rename">✏️</button>
          <button class="row-btn" data-action="duplicate" data-id="${file.id}" title="Duplicate">📄</button>
          <button class="row-btn danger" data-action="delete" data-id="${file.id}" title="Delete">🗑</button>
        </div>
      </div>`;
  });

  tree.innerHTML = html;

  /* ── Bind: open file on row click ── */
  tree.querySelectorAll('.file-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.row-btn')) return;
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

  /* ── Bind: action buttons ── */
  tree.querySelectorAll('.row-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const { action, id } = btn.dataset;
      if (action === 'delete')    deleteFile(id);
      if (action === 'duplicate') duplicateFile(id);
      if (action === 'rename')    renameFile(id);
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
      saveToStorage();
      renderFileList();
      renderTabBar();
      openFileInEditor(FS.activeId);
    });
  });

  bar.querySelectorAll('.tab-x').forEach(x => {
    x.addEventListener('click', e => {
      e.stopPropagation();
      flushToState();
      const closingId = x.dataset.close;
      if (FS.activeId === closingId) {
        const rest   = FS.files.filter(f => f.type === 'file' && f.id !== closingId);
        FS.activeId  = rest.length > 0 ? rest[0].id : null;
      }
      saveToStorage();
      renderFileList();
      renderTabBar();
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
    // Show image preview, hide textarea
    editor.style.display = 'none';
    if (imgPreview) {
      imgPreview.classList.add('visible');
      if (imgEl) imgEl.src = file.dataURL || '';
    }
    if (statusLang) statusLang.textContent = 'Image';
    if (statusFile) statusFile.textContent  = file.name;
    return;
  }

  // Text / code file
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

  if (editor) {
    editor.style.display = '';
    editor.disabled      = true;
    editor.value         = '';
    editor.placeholder   = 'No file open';
  }
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

  let doc = htmlFile.content || '';

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
  // Check for lab-specific elements
  const editor = document.getElementById('ide-code-editor');
  if (!editor) return;

  initState();
  renderFileList();
  renderTabBar();

  if (FS.activeId) openFileInEditor(FS.activeId);
  else             clearEditor();

  /* Editor events */
  editor.addEventListener('input', () => {
    flushToState();
    schedulePreview();
  });

  editor.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s   = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, s) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = s + 2;
      flushToState();
      schedulePreview();
    }
  });

  /* + File button */
  document.getElementById('btn-add-file')?.addEventListener('click', () => {
    const name = prompt('File name (e.g. about.html, utils.js, theme.css):');
    if (name && name.trim()) createFile(name, 'file');
  });

  /* + Dir (folder) button */
  document.getElementById('btn-add-folder')?.addEventListener('click', () => {
    const name = prompt('Folder name:');
    if (name && name.trim()) createFile(name, 'folder');
  });

  /* Upload button → trigger hidden file input */
  document.getElementById('btn-upload')?.addEventListener('click', () => {
    document.getElementById('upload-input')?.click();
  });

  /* Hidden file input → process upload */
  document.getElementById('upload-input')?.addEventListener('change', function () {
    const files = Array.from(this.files || []);
    files.forEach(f => uploadFile(f));
    this.value = '';   // reset so same file can be re-uploaded
  });

  /* Refresh preview */
  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    flushToState();
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
