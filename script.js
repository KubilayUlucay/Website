document.addEventListener("DOMContentLoaded", () => {

  /* ===== THEME TOGGLE ===== */
  const themeToggleButton = document.getElementById('theme-toggle');
  const body = document.body;
  const sunIcon = '<i class="fas fa-sun"></i>';
  const moonIcon = '<i class="fas fa-moon"></i>';
  let catIdleFrame = '';
  let catWalkFrames = [];
  const catElement = document.getElementById("chasing-cat-img");

  const updateCatImages = (theme) => { /* ... updateCatImages function ... */
    if (theme === 'dark') {
      catIdleFrame = "images/white-cat-1.png";
      catWalkFrames = ["images/white-cat-2.png", "images/white-cat-4.png", "images/white-cat-5.png", "images/white-cat-6.png", "images/white-cat-7.png", "images/white-cat-8.png", "images/white-cat-9.png", "images/white-cat-10.png"];
    } else {
      catIdleFrame = "images/cat-v1.png";
      catWalkFrames = ["images/cat-v2.png", "images/cat-v4.png", "images/cat-v5.png", "images/cat-v6.png", "images/cat-v7.png", "images/cat-v8.png", "images/cat-v9.png", "images/cat-v10.png"];
    }
    if (catElement && catElement.style.opacity !== "0") {
        const currentSrcFilename = catElement.src.split('/').pop();
        const newIdleFilename = catIdleFrame.split('/').pop();
        if (currentSrcFilename !== newIdleFilename) { catElement.src = catIdleFrame; }
    }
   };
  const applyTheme = (theme) => { /* ... applyTheme function ... */
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      if (themeToggleButton) themeToggleButton.innerHTML = sunIcon;
    } else {
      body.classList.remove('dark-theme');
      if (themeToggleButton) themeToggleButton.innerHTML = moonIcon;
    }
    updateCatImages(theme);
    if (window.drawCanvasBackground) { setTimeout(window.drawCanvasBackground, 0); }
  };
  const toggleTheme = () => { /* ... toggleTheme function ... */
    const currentTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
   };
  if (themeToggleButton) { themeToggleButton.addEventListener('click', toggleTheme); }
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    if (themeToggleButton) themeToggleButton.innerHTML = sunIcon;
  } else {
    if (themeToggleButton) themeToggleButton.innerHTML = moonIcon;
  }
  updateCatImages(savedTheme);


  /* ===== ANIMATED CANVAS BACKGROUND ===== */
  const canvas = document.getElementById('background-canvas');
  let ctx; let particles = []; let animationFrameId;
  const getCssVariable = (variableName) => getComputedStyle(document.body).getPropertyValue(variableName).trim();
  class Particle { /* ... Particle class definition ... */
    constructor(x, y, radius, dx, dy) { this.x = x; this.y = y; this.radius = radius; this.dx = dx; this.dy = dy; this.color = getCssVariable('--particle-color'); }
    updateColor() { this.color = getCssVariable('--particle-color'); }
    draw() { if (!ctx) return; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill(); ctx.closePath(); }
    update() { if (!canvas) return; if (this.x + this.radius > canvas.width || this.x - this.radius < 0) { this.dx = -this.dx; } if (this.y + this.radius > canvas.height || this.y - this.radius < 0) { this.dy = -this.dy; } this.x += this.dx; this.y += this.dy; this.draw(); }
   }
  function initParticles() { /* ... initParticles function ... */
    if (!canvas || !ctx) return; particles = []; canvas.width = window.innerWidth; canvas.height = window.innerHeight; let n = Math.floor((canvas.width * canvas.height) / 15000); n = Math.max(20, Math.min(n, 100)); const c = getCssVariable('--particle-color'); for (let i = 0; i < n; i++) { const r = Math.random() * 1.5 + 0.5; const x = Math.random() * (canvas.width - r * 2) + r; const y = Math.random() * (canvas.height - r * 2) + r; const dx = (Math.random() - 0.5) * 0.5; const dy = (Math.random() - 0.5) * 0.5; const p = new Particle(x, y, r, dx, dy); p.color = c; particles.push(p); }
   }
  function animateParticles() { /* ... animateParticles function ... */
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); } animationFrameId = requestAnimationFrame(animateParticles); if (!ctx || !canvas) return; const bg = getCssVariable('--canvas-bg'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); }); connectParticles();
   }
  function connectParticles() { /* ... connectParticles function ... */
      if (!ctx || particles.length === 0) return; let o = 0.2; const lc = getCssVariable('--particle-color'); for (let a = 0; a < particles.length; a++) { for (let b = a + 1; b < particles.length; b++) { const d = Math.hypot(particles[a].x - particles[b].x, particles[a].y - particles[b].y); const md = 100; if (d < md) { o = 1 - (d / md); let bc = lc.startsWith('rgba') ? lc.substring(0, lc.lastIndexOf(',')) : lc.replace('rgb', 'rgba').replace(')', ', 1'); const rc = `${bc.substring(0, bc.lastIndexOf(','))}, ${o.toFixed(2)})`; ctx.strokeStyle = rc; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke(); ctx.closePath(); } } }
   }
  window.drawCanvasBackground = () => { /* ... drawCanvasBackground function ... */
      if (!ctx || !canvas) { return; } const npc = getCssVariable('--particle-color'); particles.forEach(p => p.color = npc); const bg = getCssVariable('--canvas-bg'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); particles.forEach(p => p.draw()); connectParticles();
   };
  window.addEventListener('resize', () => { /* ... resize listener ... */
    clearTimeout(window.resizeTimeout); window.resizeTimeout = setTimeout(() => { if (canvas && ctx) { initParticles(); window.drawCanvasBackground(); } }, 100);
   });
  if (canvas) { /* ... canvas init ... */
      ctx = canvas.getContext('2d'); if (ctx) { initParticles(); animateParticles(); } else { console.error("Failed to get 2D context for canvas."); }
  } else { console.log("Background canvas not found."); }


  /* --- Cat Following Mouse --- */
  if (catElement) { /* ... cat following logic ... */
    let mouseX = window.innerWidth / 2; let mouseY = window.innerHeight / 2; let catX = mouseX, catY = mouseY; const speed = 0.08; const followDelay = 100; let followTimeout = null; let scaleX = 1; let animating = false; let walkIndex = 0, lastFrameTime = 0, frameInterval = 100;
    function loop(currentTime) { if (!animating || catWalkFrames.length === 0) return; const dxm = mouseX - catX; if (Math.abs(dxm) > 2) { scaleX = dxm > 0 ? 1 : -1; } const om = 0.6; const tx = mouseX - (catElement.offsetWidth * om) * scaleX; const ty = mouseY - (catElement.offsetHeight / 2); const dx = tx - catX; const dy = ty - catY; const d = Math.hypot(dx, dy); const m = d > 5; if (d > 1) { catX += dx * speed; catY += dy * speed; } catElement.style.transform = `translate(${catX.toFixed(2)}px, ${catY.toFixed(2)}px) scaleX(${scaleX})`; if (m) { if (currentTime - lastFrameTime > frameInterval) { walkIndex = (walkIndex + 1) % catWalkFrames.length; catElement.src = catWalkFrames[walkIndex]; lastFrameTime = currentTime; } } else { const csf = catElement.src.split('/').pop(); const idf = catIdleFrame.split('/').pop(); if (catElement.src && csf !== idf) { catElement.src = catIdleFrame; } walkIndex = 0; } requestAnimationFrame(loop); }
    function startFollowing() { if (animating) return; animating = true; catElement.style.opacity = "0.9"; catElement.src = catIdleFrame; lastFrameTime = performance.now(); requestAnimationFrame(loop); }
    function stopFollowing() { animating = false; catElement.style.opacity = "0"; if (followTimeout) { clearTimeout(followTimeout); } }
    document.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; if (!animating) { if (followTimeout) clearTimeout(followTimeout); followTimeout = setTimeout(startFollowing, followDelay); } });
    document.addEventListener("mouseleave", stopFollowing); document.addEventListener("mouseenter", e => { mouseX = e.clientX; mouseY = e.clientY; }); catElement.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
   }


  /* --- Header Blur on Scroll --- */
  const header = document.querySelector("header");
  if (header) { /* ... header scroll logic ... */
    window.addEventListener("scroll", () => { if (window.scrollY > 50) { header.classList.add("scrolled"); } else { header.classList.remove("scrolled"); } });
   }


  /* --- Mobile Menu Toggle --- */
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) { /* ... mobile menu logic ... */
    mobileMenuButton.addEventListener("click", (e) => { e.stopPropagation(); mobileMenu.classList.toggle("hidden"); }); mobileMenu.querySelectorAll("a").forEach(link => { link.addEventListener("click", () => { mobileMenu.classList.add("hidden"); }); }); document.addEventListener('click', (event) => { if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) { mobileMenu.classList.add('hidden'); } });
   }


  /* --- Scroll Reveal Sections --- */
  const sectionsToReveal = document.querySelectorAll("section");
  if (sectionsToReveal.length > 0) { /* ... scroll reveal logic ... */
      sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { sec.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out"); } }); const io = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove("opacity-0", "translate-y-5"); entry.target.classList.add("opacity-100", "translate-y-0"); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { io.observe(sec); } });
  }


  /* --- Footer Year --- */
  const yearEl = document.getElementById("current-year");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }


  /* --- Hi All! Font Changing Animation --- */
  const fontText = document.getElementById('font-change-text');
  if (fontText) { /* ... font changing logic ... */
    const styles = [ { text: "Hi All!", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Montserrat', sans-serif" }, { text: "H̶̢̭̓i̸͈̓̂ ̵̥́̊A̴̪̎̒l̴̹̪̆ļ̵̼̊!̶̰̅", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Courier New', monospace" }, { text: "Hi All!", fontFamily: "cursive" }, { text: "Hi All!", fontFamily: "fantasy" }, { text: "Hi All!", fontFamily: "'Honk', system-ui" } ]; let csi = 0; const ci = 750; const gd = 150; function applyStyle(i) { if (i >= 0 && i < styles.length) { fontText.textContent = styles[i].text; fontText.style.fontFamily = styles[i].fontFamily; } } applyStyle(csi); setInterval(() => { const nsi = (csi + 1) % styles.length; if (styles[nsi].text.includes('̶')) { applyStyle(nsi); setTimeout(() => { const agi = (nsi + 1) % styles.length; applyStyle(agi); csi = agi; }, gd); } else { applyStyle(nsi); csi = nsi; } }, ci);
   }


  /* === Profile Picture Zoom and Tilt === */
  const profilePic = document.getElementById('profile-picture');
  if (profilePic) { /* ... profile pic logic ... */
      let isHovering = false; profilePic.addEventListener('mouseenter', () => { isHovering = true; profilePic.classList.add('hovering'); profilePic.style.transform = 'scale(1.2) rotateX(0deg) rotateY(0deg)'; }); profilePic.addEventListener('mousemove', (e) => { if (!isHovering) return; const r = profilePic.getBoundingClientRect(); const x = e.clientX - r.left; const y = e.clientY - r.top; const cx = r.width / 2; const cy = r.height / 2; let nx = (x - cx) / cx; let ny = (y - cy) / cy; nx = Math.max(-1, Math.min(1, nx)); ny = Math.max(-1, Math.min(1, ny)); const rx = -ny * 30; const ry = nx * 30; profilePic.style.transform = `scale(1.5) rotateX(${rx}deg) rotateY(${ry}deg)`; }); profilePic.addEventListener('mouseleave', () => { isHovering = false; profilePic.classList.remove('hovering'); profilePic.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)'; });
  }


  /* ===== MUSIC CONTROLS (Using Tone.Player) ===== */
  const volumeToggleButton = document.getElementById('volume-toggle-button');
  const volumeSlider = document.getElementById('volume-slider');
  let musicPlayer = null;
  let musicVolume = null;
  let isAudioContextStarted = false;
  let previousVolumeBeforeMute = 50;
  let isMusicPlaying = false;
  let isMusicSetup = false;
  let hasUserInteracted = false; // New flag for first interaction

  // --- Function to setup Tone.js Player and Volume ---
  function setupMusic() {
      if (isMusicSetup || !isAudioContextStarted || Tone.context.state !== 'running') {
          console.warn("Conditions not met for setupMusic:", {isMusicSetup, isAudioContextStarted, state: Tone.context?.state});
          return;
      }
      isMusicSetup = true;
      console.log("Setting up music player...");
      if(volumeToggleButton) volumeToggleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Loading indicator

      musicVolume = new Tone.Volume(0).toDestination();

      musicPlayer = new Tone.Player({
          url: "audio/song.mp3",
          loop: true,
          autostart: false,
          onload: () => {
              console.log("Music file loaded successfully.");
              if (volumeToggleButton) volumeToggleButton.disabled = false;
              if (volumeSlider) volumeSlider.disabled = false;

              const savedVolumePercent = localStorage.getItem('musicVolumePercent');
              const initialPercent = savedVolumePercent !== null ? parseFloat(savedVolumePercent) : 50;
              volumeSlider.value = initialPercent;
              updateVolume(initialPercent); // Set initial volume and icon
              previousVolumeBeforeMute = initialPercent > 0 ? initialPercent : 50;

              // Now that it's loaded, if volume is > 0, start playing
              if (initialPercent > 0) {
                  musicPlayer.start();
                  isMusicPlaying = true;
                  console.log("Music started after load.");
              } else {
                  console.log("Music loaded, volume is 0.");
                  updateVolume(0); // Ensure icon is muted
              }
          },
          onerror: (error) => {
              console.error("Error loading music file:", error);
              if (volumeToggleButton) {
                   volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                   volumeToggleButton.disabled = true; // Keep disabled on error
              }
              if (volumeSlider) volumeSlider.disabled = true;
          }
      }).connect(musicVolume);
  }

  // --- Update Volume Function ---
  function updateVolume(percentValue) {
    const sliderValue = parseFloat(percentValue);
    const minDb = -50; const maxDb = 0;
    let db = (sliderValue <= 0) ? -Infinity : minDb + (sliderValue / 100) * (maxDb - minDb);

    // Update Tone.Volume only if it exists
    if (musicVolume) { musicVolume.volume.value = db; }

    // Update icon only if button exists
    if (volumeToggleButton) {
        // Don't show loading spinner here, only volume icons
        if (volumeToggleButton.innerHTML.includes('fa-spinner')) {
             // If loading, wait for onload to set the correct volume icon
        } else if (sliderValue <= 0) {
            volumeToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
            volumeToggleButton.setAttribute('aria-label', 'Unmute background music');
        } else if (sliderValue < 50) {
            volumeToggleButton.innerHTML = '<i class="fas fa-volume-down"></i>';
            volumeToggleButton.setAttribute('aria-label', 'Mute background music');
        } else {
            volumeToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            volumeToggleButton.setAttribute('aria-label', 'Mute background music');
        }
    }

    localStorage.setItem('musicVolumePercent', sliderValue.toString());
    if(sliderValue > 0) { previousVolumeBeforeMute = sliderValue; }
  }

  // --- Combined Initializer for Audio Context and Music Setup ---
  async function initializeAudio() {
      if (hasUserInteracted) return; // Only run once on first interaction
      hasUserInteracted = true; // Mark interaction

      console.log("User interaction detected, attempting to start AudioContext...");
      if (volumeToggleButton) volumeToggleButton.disabled = true; // Disable button during init
      if (volumeSlider) volumeSlider.disabled = true;

      try {
          await Tone.start();
          isAudioContextStarted = true;
          console.log("AudioContext started successfully.");
          // Now that context is started, setup the music player
          setupMusic();
      } catch (e) {
          console.error("Error starting AudioContext:", e);
          // Keep controls disabled if context fails
          if (volumeToggleButton) {
              volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
              volumeToggleButton.disabled = true;
          }
          if (volumeSlider) volumeSlider.disabled = true;
      }
  }

  // --- Volume Toggle Button (Handles FIRST interaction + Mute/Unmute/Play/Stop) ---
  if (volumeToggleButton) {
    volumeToggleButton.addEventListener('click', async () => {
      // 1. Handle FIRST user interaction (starts context, calls setupMusic)
      if (!hasUserInteracted) {
          await initializeAudio();
          // initializeAudio calls setupMusic which handles player loading and initial play state
          return; // First click's job is done
      }

      // 2. Subsequent Clicks: Toggle Play/Mute (only if player is loaded)
      if (!musicPlayer || !musicPlayer.loaded) {
          console.log("Music player not ready yet (still loading or setup failed).");
          return; // Don't toggle if not loaded
      }

      const currentSliderValue = parseFloat(volumeSlider.value);
      if (isMusicPlaying) {
          // Stop and Mute
          musicPlayer.stop();
          isMusicPlaying = false;
          if (currentSliderValue > 0) { previousVolumeBeforeMute = currentSliderValue; }
          volumeSlider.value = 0;
          updateVolume(0);
          console.log("Music stopped (muted).");
      } else {
          // Unmute and Play
          const restoreValue = previousVolumeBeforeMute > 0 ? previousVolumeBeforeMute : 50;
          volumeSlider.value = restoreValue;
          updateVolume(restoreValue);
          musicPlayer.start();
          isMusicPlaying = true;
          console.log("Music started (unmuted).");
      }
    });
  }

  // --- Volume Slider Logic ---
  if (volumeSlider) {
    volumeSlider.addEventListener('input', async (e) => {
      // 1. Handle FIRST user interaction (starts context, calls setupMusic)
       if (!hasUserInteracted) {
          await initializeAudio();
          // Don't proceed further on this first interaction via slider,
          // let the loading finish and user click toggle button to play.
          // Or alternatively, update volume but don't auto-play yet.
          updateVolume(e.target.value); // Update volume visually immediately
          return;
      }

      // 2. Subsequent Slider Moves: Update volume and potentially play/stop
      const newVolumePercent = e.target.value;
      updateVolume(newVolumePercent); // Update volume and icon

      if (musicPlayer && musicPlayer.loaded) {
          if (parseFloat(newVolumePercent) > 0 && !isMusicPlaying) {
              musicPlayer.start();
              isMusicPlaying = true;
              console.log("Music started via slider unmute.");
          } else if (parseFloat(newVolumePercent) <= 0 && isMusicPlaying) {
              musicPlayer.stop();
              isMusicPlaying = false;
              console.log("Music stopped via slider mute.");
          }
      }
    });
  }

  // --- Apply Initial Volume State (Icon and Slider Position) ---
  // This runs regardless of audio context state, just sets visual defaults
  if(volumeSlider && volumeToggleButton) {
      const initialVolumePercent = localStorage.getItem('musicVolumePercent') || 50;
      // Set initial icon based on stored/default volume, but don't change dB level yet
      if (parseFloat(initialVolumePercent) <= 0) {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
      } else if (parseFloat(initialVolumePercent) < 50) {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-down"></i>';
      } else {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
      }
      volumeSlider.value = initialVolumePercent; // Ensure slider matches visually
      // Keep controls disabled until player loads successfully
      volumeToggleButton.disabled = true;
      volumeSlider.disabled = true;
  }


}); // End DOMContentLoaded
