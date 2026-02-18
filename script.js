// 1. Page Switching Logic
function switchPage(pageId) {
    document.querySelectorAll('.content-page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active');
    
    document.querySelectorAll('.nav-menu a').forEach(link => link.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// 2. Generate 30 Tutorials Dynamically
const videoGrid = document.getElementById('videoContainer');
for(let i=1; i<=30; i++) {
    videoGrid.innerHTML += `
        <div class="video-card">
            <div class="thumb"><i class="fas fa-play-circle fa-3x"></i></div>
            <h3>Lesson ${i}: Advanced Coding Techniques</h3>
        </div>
    `;
}

// 3. Theme Toggle (Light / Dark / Contrast)
let themeState = 0; // 0: Dark, 1: Light, 2: Contrast
document.getElementById('themeToggle').addEventListener('click', () => {
    const root = document.documentElement;
    themeState = (themeState + 1) % 3;
    if(themeState === 0) root.setAttribute('data-theme', 'dark');
    else if(themeState === 1) root.setAttribute('data-theme', 'light');
    else root.setAttribute('data-theme', 'contrast');
});

// 4. Modal Logic
function openAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
document.querySelector('.close-btn').onclick = () => { document.getElementById('authModal').style.display = 'none'; };

// 5. Account Creation Simulation
document.getElementById('signupForm').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const user = document.getElementById('regUser').value;
    
    // Update Profile UI
    document.getElementById('displayFullName').innerText = name;
    document.getElementById('displayUsername').innerText = "@" + user;
    
    alert("Welcome " + name + "! Your Veltrix Account is ready. Lab is now unlocked.");
    document.getElementById('authModal').style.display = 'none';
    
    // Unlock Lab logic
    document.getElementById('lab-page').innerHTML = `<h2>Welcome to Veltrix Lab</h2><p>Spck Editor features loading...</p>`;
};
