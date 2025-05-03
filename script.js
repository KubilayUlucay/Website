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
  let musicPlayer = null; // Will hold the Tone.Player instance
  let musicVolume = null; // Will hold the Tone.Volume node
  let isAudioContextStarted = false;
  let previousVolumeBeforeMute = 50; // Store the volume before muting, default 50
  let isMusicPlaying = false; // Track player state

  // --- Define the music using Tone.Player ---
  // Moved player creation inside the click handler after Tone.start()
  function setupMusic() {
      // Make sure context is started before proceeding
      if (!isAudioContextStarted || Tone.context.state !== 'running') {
          console.warn("AudioContext not running. Cannot setup music yet.");
          return;
      }

      // Prevent setting up multiple times
      if (musicPlayer) {
          return;
      }

      console.log("Setting up music player...");

      // Create a volume node first
      musicVolume = new Tone.Volume(0).toDestination(); // Start volume at 0 initially

      // Create the Player
      musicPlayer = new Tone.Player({
          url: "audio/song.mp3", // *** PATH TO YOUR MP3 ***
          loop: true,
          autostart: false, // We will start it manually
          onload: () => {
              console.log("Music file loaded successfully.");
              // Enable controls now that the file is ready
              if (volumeToggleButton) volumeToggleButton.disabled = false;
              if (volumeSlider) volumeSlider.disabled = false;

              // Apply initial/saved volume AFTER player is loaded
              const savedVolumePercent = localStorage.getItem('musicVolumePercent');
              const initialPercent = savedVolumePercent !== null ? parseFloat(savedVolumePercent) : 50;
              volumeSlider.value = initialPercent;
              updateVolume(initialPercent); // This sets the actual volume and icon
              previousVolumeBeforeMute = initialPercent > 0 ? initialPercent : 50;

              // If the user intended to play (e.g., clicked unmute), start playing now
              if (parseFloat(volumeSlider.value) > 0) {
                  musicPlayer.start();
                  isMusicPlaying = true;
                  console.log("Music started automatically after load (volume was > 0).");
              } else {
                   console.log("Music loaded, but volume is 0. Ready to play on unmute.");
              }
          },
          onerror: (error) => {
              console.error("Error loading music file:", error);
              if (volumeToggleButton) {
                   volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                   volumeToggleButton.disabled = true;
              }
              if (volumeSlider) volumeSlider.disabled = true;
          }
      }).connect(musicVolume); // Connect player to the volume node

      console.log("Tone.Player created for song.mp3");
  }

  // --- Update Volume Function ---
  function updateVolume(percentValue) { // Takes 0-100
    const sliderValue = parseFloat(percentValue);
    const minDb = -50; const maxDb = 0;
    let db;
    if (sliderValue <= 0) { db = -Infinity; } // Mute
    else { db = minDb + (sliderValue / 100) * (maxDb - minDb); }

    if (musicVolume) { musicVolume.volume.value = db; }

    // Update volume icon
    if (volumeToggleButton) {
        if (sliderValue <= 0) {
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

  // --- Volume Toggle Button (Mute/Unmute & Play/Pause) ---
  if (volumeToggleButton) {
    volumeToggleButton.addEventListener('click', async () => {
      // 1. Start AudioContext if needed
      if (!isAudioContextStarted) {
        try {
            await Tone.start();
            isAudioContextStarted = true;
            console.log("AudioContext started via volume toggle.");
            // 2. Setup music AFTER context is started
            setupMusic(); // This will create the player
        } catch (e) {
            console.error("Error starting AudioContext:", e);
            return; // Stop if context fails
        }
      }

      // 3. Wait until the player is loaded (setupMusic handles this)
      if (!musicPlayer || !musicPlayer.loaded) {
          console.log("Music player not ready yet (still loading or setup failed).");
          // Optionally provide feedback to the user, e.g., change icon to spinner
          return;
      }

      // 4. Toggle Mute/Unmute AND Play/Pause
      const currentSliderValue = parseFloat(volumeSlider.value);

      if (isMusicPlaying) {
          // If playing: Stop player, set slider to 0, update icon to mute
          musicPlayer.stop();
          isMusicPlaying = false;
          if (currentSliderValue > 0) { previousVolumeBeforeMute = currentSliderValue; }
          volumeSlider.value = 0;
          updateVolume(0);
          console.log("Music stopped (muted).");
      } else {
          // If stopped/muted: Restore volume, start player, update icon
          const restoreValue = previousVolumeBeforeMute > 0 ? previousVolumeBeforeMute : 50;
          volumeSlider.value = restoreValue;
          updateVolume(restoreValue); // Set volume and update icon
          musicPlayer.start();
          isMusicPlaying = true;
          console.log("Music started (unmuted).");
      }
    });
  }

  // --- Volume Slider Logic ---
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const newVolumePercent = e.target.value;
      updateVolume(newVolumePercent); // Update volume and icon in real-time

      // If the audio context/player is ready, adjust playback based on slider
      if (isAudioContextStarted && musicPlayer && musicPlayer.loaded) {
          if (parseFloat(newVolumePercent) > 0 && !isMusicPlaying) {
              // Start playing if slider moved above 0 and wasn't playing
              musicPlayer.start();
              isMusicPlaying = true;
              console.log("Music started via slider unmute.");
          } else if (parseFloat(newVolumePercent) <= 0 && isMusicPlaying) {
              // Stop playing if slider moved to 0 and was playing
              musicPlayer.stop();
              isMusicPlaying = false;
              console.log("Music stopped via slider mute.");
          }
      }

      // Ensure audio context is started if user interacts with slider first
      // This is a fallback, primary start is via the toggle button click
      if (!isAudioContextStarted) {
          Tone.start().then(() => {
              isAudioContextStarted = true;
              console.log("AudioContext started via slider interaction.");
              if (!musicPlayer) { setupMusic(); } // Setup if not already done
          }).catch(e => console.error("Error starting AudioContext via slider:", e));
      }
    });
  }

  // --- Apply Initial Volume State ---
  // We need this separate from setupMusic because setupMusic might not run immediately
  // if the user hasn't interacted yet. This sets the initial icon correctly.
  if(volumeSlider && volumeToggleButton) {
      const initialVolumePercent = localStorage.getItem('musicVolumePercent') || 50;
      updateVolume(initialVolumePercent); // Sets initial icon
      volumeSlider.value = initialVolumePercent; // Ensure slider matches
  }


}); // End DOMContentLoaded
