// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkSession();
        this.setupEventListeners();
        this.updateUI();
    }

    checkSession() {
        const userData = localStorage.getItem('veltrix_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    setupEventListeners() {
        // Login modal
        const loginBtn = document.getElementById('loginBtn');
        const loginModalClose = document.getElementById('loginModalClose');
        const loginForm = document.getElementById('loginForm');
        const loginModal = document.getElementById('loginModal');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.openLoginModal());
        }

        if (loginModalClose) {
            loginModalClose.addEventListener('click', () => this.closeLoginModal());
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup modal
        const signupBtn = document.getElementById('signupBtn');
        const signupModalClose = document.getElementById('signupModalClose');
        const signupForm = document.getElementById('signupForm');
        const signupModal = document.getElementById('signupModal');

        if (signupBtn) {
            signupBtn.addEventListener('click', () => this.openSignupModal());
        }

        if (signupModalClose) {
            signupModalClose.addEventListener('click', () => this.closeSignupModal());
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Switch between modals
        const switchToSignup = document.getElementById('switchToSignup');
        const switchToLogin = document.getElementById('switchToLogin');

        if (switchToSignup) {
            switchToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeLoginModal();
                this.openSignupModal();
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeSignupModal();
                this.openLoginModal();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Lab page locked buttons
        const lockedLoginBtn = document.getElementById('lockedLoginBtn');
        const lockedSignupBtn = document.getElementById('lockedSignupBtn');

        if (lockedLoginBtn) {
            lockedLoginBtn.addEventListener('click', () => this.openLoginModal());
        }

        if (lockedSignupBtn) {
            lockedSignupBtn.addEventListener('click', () => this.openSignupModal());
        }

        // Close modals on outside click
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.closeLoginModal();
                }
            });
        }

        if (signupModal) {
            signupModal.addEventListener('click', (e) => {
                if (e.target === signupModal) {
                    this.closeSignupModal();
                }
            });
        }
    }

    openLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    openSignupModal() {
        const modal = document.getElementById('signupModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeSignupModal() {
        const modal = document.getElementById('signupModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const users = JSON.parse(localStorage.getItem('veltrix_users') || '[]');
        const user = users.find(u => 
            (u.username === username || u.email === username) && u.password === password
        );

        if (user) {
            this.currentUser = {
                fullName: user.fullName,
                username: user.username,
                email: user.email
            };
            localStorage.setItem('veltrix_user', JSON.stringify(this.currentUser));
            this.closeLoginModal();
            this.updateUI();
            alert('Login successful!');
            
            // Reload if on lab page
            if (window.location.pathname.includes('lab.html')) {
                window.location.reload();
            }
        } else {
            alert('Invalid credentials. Please try again.');
        }
    }

    handleSignup(e) {
        e.preventDefault();
        const fullName = document.getElementById('signupFullName').value;
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;

        const users = JSON.parse(localStorage.getItem('veltrix_users') || '[]');
        
        // Check if username or email already exists
        if (users.find(u => u.username === username)) {
            alert('Username already exists. Please choose another.');
            return;
        }

        if (users.find(u => u.email === email)) {
            alert('Email already registered. Please login.');
            return;
        }

        // Add new user
        const newUser = { fullName, username, email, password };
        users.push(newUser);
        localStorage.setItem('veltrix_users', JSON.stringify(users));

        // Auto login
        this.currentUser = { fullName, username, email };
        localStorage.setItem('veltrix_user', JSON.stringify(this.currentUser));
        
        this.closeSignupModal();
        this.updateUI();
        alert('Account created successfully!');
        
        // Reload if on lab page
        if (window.location.pathname.includes('lab.html')) {
            window.location.reload();
        }
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.currentUser = null;
            localStorage.removeItem('veltrix_user');
            this.updateUI();
            
            // Reload if on lab page
            if (window.location.pathname.includes('lab.html')) {
                window.location.reload();
            }
        }
    }

    updateUI() {
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const userAvatar = document.getElementById('userAvatar');

        if (this.currentUser) {
            if (authSection) authSection.classList.add('hidden');
            if (userSection) userSection.classList.remove('hidden');
            if (usernameDisplay) usernameDisplay.textContent = this.currentUser.username;
            if (userAvatar) {
                userAvatar.textContent = this.currentUser.username.charAt(0).toUpperCase();
            }
        } else {
            if (authSection) authSection.classList.remove('hidden');
            if (userSection) userSection.classList.add('hidden');
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// Theme System
class ThemeSystem {
    constructor() {
        this.currentTheme = 'light';
        this.themes = ['light', 'dark', 'high-contrast'];
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('veltrix_theme') || 'light';
        this.setTheme(savedTheme);
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.setTheme(this.themes[nextIndex]);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('veltrix_theme', theme);
    }
}

// Lab System
class LabSystem {
    constructor() {
        this.htmlCode = '';
        this.cssCode = '';
        this.jsCode = '';
        this.currentTab = 'html';
        this.init();
    }

    init() {
        if (!window.location.pathname.includes('lab.html')) return;

        const auth = new AuthSystem();
        
        if (auth.isLoggedIn()) {
            this.showLab();
            this.setupEventListeners();
            this.loadSavedCode();
            this.updatePreview();
        } else {
            this.showLocked();
        }
    }

    showLab() {
        const labLocked = document.getElementById('labLocked');
        const labWorkspace = document.getElementById('labWorkspace');
        
        if (labLocked) labLocked.classList.add('hidden');
        if (labWorkspace) labWorkspace.classList.remove('hidden');
    }

    showLocked() {
        const labLocked = document.getElementById('labLocked');
        const labWorkspace = document.getElementById('labWorkspace');
        
        if (labLocked) labLocked.classList.remove('hidden');
        if (labWorkspace) labWorkspace.classList.add('hidden');
    }

    setupEventListeners() {
        // Tab switching
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tab-close')) {
                    this.switchTab(tab.dataset.tab);
                }
            });
        });

        // Code editors
        const htmlEditor = document.getElementById('htmlEditor');
        const cssEditor = document.getElementById('cssEditor');
        const jsEditor = document.getElementById('jsEditor');

        if (htmlEditor) {
            htmlEditor.addEventListener('input', () => {
                this.htmlCode = htmlEditor.value;
                this.saveCode();
                this.updatePreview();
            });
        }

        if (cssEditor) {
            cssEditor.addEventListener('input', () => {
                this.cssCode = cssEditor.value;
                this.saveCode();
                this.updatePreview();
            });
        }

        if (jsEditor) {
            jsEditor.addEventListener('input', () => {
                this.jsCode = jsEditor.value;
                this.saveCode();
                this.updatePreview();
            });
        }

        // Preview refresh
        const previewRefresh = document.getElementById('previewRefresh');
        if (previewRefresh) {
            previewRefresh.addEventListener('click', () => this.updatePreview());
        }

        // File operations
        const addFileBtn = document.getElementById('addFileBtn');
        const addFolderBtn = document.getElementById('addFolderBtn');

        if (addFileBtn) {
            addFileBtn.addEventListener('click', () => this.addFile());
        }

        if (addFolderBtn) {
            addFolderBtn.addEventListener('click', () => this.addFolder());
        }

        // File tree items
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.addEventListener('click', () => {
                const fileName = item.dataset.file;
                this.openFile(fileName);
            });
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update editors
        const editors = document.querySelectorAll('.code-editor');
        editors.forEach(editor => {
            editor.classList.remove('active');
        });

        if (tabName === 'html') {
            document.getElementById('htmlEditor').classList.add('active');
        } else if (tabName === 'css') {
            document.getElementById('cssEditor').classList.add('active');
        } else if (tabName === 'js') {
            document.getElementById('jsEditor').classList.add('active');
        }
    }

    loadSavedCode() {
        const savedProject = localStorage.getItem('veltrix_project');
        if (savedProject) {
            const project = JSON.parse(savedProject);
            this.htmlCode = project.html || '';
            this.cssCode = project.css || '';
            this.jsCode = project.js || '';

            document.getElementById('htmlEditor').value = this.htmlCode;
            document.getElementById('cssEditor').value = this.cssCode;
            document.getElementById('jsEditor').value = this.jsCode;
        } else {
            // Default starter code
            this.htmlCode = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Project</title>\n</head>\n<body>\n    <h1>Hello, Veltrix IDE!</h1>\n    <p>Start coding here...</p>\n</body>\n</html>';
            this.cssCode = '/* Write your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 20px;\n    background-color: #f5f5f5;\n}\n\nh1 {\n    color: #1e40af;\n}';
            this.jsCode = '// Write your JavaScript here\nconsole.log("Welcome to Veltrix IDE!");';

            document.getElementById('htmlEditor').value = this.htmlCode;
            document.getElementById('cssEditor').value = this.cssCode;
            document.getElementById('jsEditor').value = this.jsCode;
        }
    }

    saveCode() {
        const project = {
            html: this.htmlCode,
            css: this.cssCode,
            js: this.jsCode
        };
        localStorage.setItem('veltrix_project', JSON.stringify(project));
    }

    updatePreview() {
        const previewFrame = document.getElementById('previewFrame');
        if (!previewFrame) return;

        const previewContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${this.cssCode}</style>
            </head>
            <body>
                ${this.htmlCode}
                <script>${this.jsCode}<\/script>
            </body>
            </html>
        `;

        const blob = new Blob([previewContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        previewFrame.src = url;
    }

    addFile() {
        const fileName = prompt('Enter file name (e.g., newfile.html):');
        if (fileName) {
            alert(`File "${fileName}" would be created. This is a demo feature.`);
        }
    }

    addFolder() {
        const folderName = prompt('Enter folder name:');
        if (folderName) {
            alert(`Folder "${folderName}" would be created. This is a demo feature.`);
        }
    }

    openFile(fileName) {
        alert(`Opening ${fileName}. This is a demo feature.`);
    }
}

// Mobile Menu
class MobileMenu {
    constructor() {
        this.init();
    }

    init() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navLinks = document.getElementById('navLinks');

        if (mobileMenuToggle && navLinks) {
            mobileMenuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav-container')) {
                    navLinks.classList.remove('active');
                }
            });

            // Close menu when clicking a link
            const links = navLinks.querySelectorAll('.nav-link');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                });
            });
        }
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Initialize systems when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const auth = new AuthSystem();
    const theme = new ThemeSystem();
    const lab = new LabSystem();
    const mobileMenu = new MobileMenu();
});

// Google AdSense Integration Instructions
// ========================================
// 1. Sign up for Google AdSense at https://www.google.com/adsense
// 2. Get your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
// 3. Add this script to the <head> section of each HTML file:
//
// <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
//      crossorigin="anonymous"></script>
//
// 4. Replace the comment placeholders in HTML files with actual ad units:
//
// <ins class="adsbygoogle"
//      style="display:block"
//      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
//      data-ad-slot="YYYYYYYYYY"
//      data-ad-format="auto"
//      data-full-width-responsive="true"></ins>
// <script>
//      (adsbygoogle = window.adsbygoogle || []).push({});
// </script>
//
// 5. Get your ad slot IDs from AdSense dashboard and replace YYYYYYYYYY
