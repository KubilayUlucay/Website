document.addEventListener("DOMContentLoaded", () => {

  /* ===== THEME TOGGLE ===== */
  const themeToggleButton = document.getElementById('theme-toggle');
  const body = document.body;
  const sunIcon = '<i class="fas fa-sun"></i>';
  const moonIcon = '<i class="fas fa-moon"></i>';
  let catIdleFrame = '';
  let catWalkFrames = [];
  const catElement = document.getElementById("chasing-cat-img");

  const updateCatImages = (theme) => {
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
        if (currentSrcFilename !== newIdleFilename) {
            catElement.src = catIdleFrame;
        }
    }
  };
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      if (themeToggleButton) themeToggleButton.innerHTML = sunIcon;
    } else {
      body.classList.remove('dark-theme');
      if (themeToggleButton) themeToggleButton.innerHTML = moonIcon;
    }
    updateCatImages(theme);
    if (window.drawCanvasBackground) {
        setTimeout(window.drawCanvasBackground, 0);
    }
  };
  const toggleTheme = () => {
    const currentTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
  };
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleTheme);
  }
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
  let ctx;
  let particles = [];
  let animationFrameId;
  const getCssVariable = (variableName) => getComputedStyle(document.body).getPropertyValue(variableName).trim();

  class Particle {
    constructor(x, y, radius, dx, dy) { this.x = x; this.y = y; this.radius = radius; this.dx = dx; this.dy = dy; this.color = getCssVariable('--particle-color'); }
    updateColor() { this.color = getCssVariable('--particle-color'); }
    draw() { if (!ctx) return; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill(); ctx.closePath(); }
    update() { if (!canvas) return; if (this.x + this.radius > canvas.width || this.x - this.radius < 0) { this.dx = -this.dx; } if (this.y + this.radius > canvas.height || this.y - this.radius < 0) { this.dy = -this.dy; } this.x += this.dx; this.y += this.dy; this.draw(); }
  }
  function initParticles() {
    if (!canvas || !ctx) return; particles = []; canvas.width = window.innerWidth; canvas.height = window.innerHeight; let n = Math.floor((canvas.width * canvas.height) / 15000); n = Math.max(20, Math.min(n, 100)); const c = getCssVariable('--particle-color'); for (let i = 0; i < n; i++) { const r = Math.random() * 1.5 + 0.5; const x = Math.random() * (canvas.width - r * 2) + r; const y = Math.random() * (canvas.height - r * 2) + r; const dx = (Math.random() - 0.5) * 0.5; const dy = (Math.random() - 0.5) * 0.5; const p = new Particle(x, y, r, dx, dy); p.color = c; particles.push(p); }
  }
  function animateParticles() {
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); } animationFrameId = requestAnimationFrame(animateParticles); if (!ctx || !canvas) return; const bg = getCssVariable('--canvas-bg'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); }); connectParticles();
  }
  function connectParticles() {
    if (!ctx || particles.length === 0) return; let o = 0.2; const lc = getCssVariable('--particle-color'); for (let a = 0; a < particles.length; a++) { for (let b = a + 1; b < particles.length; b++) { const d = Math.hypot(particles[a].x - particles[b].x, particles[a].y - particles[b].y); const md = 100; if (d < md) { o = 1 - (d / md); let bc = lc.startsWith('rgba') ? lc.substring(0, lc.lastIndexOf(',')) : lc.replace('rgb', 'rgba').replace(')', ', 1'); const rc = `${bc.substring(0, bc.lastIndexOf(','))}, ${o.toFixed(2)})`; ctx.strokeStyle = rc; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke(); ctx.closePath(); } } }
  }
  window.drawCanvasBackground = () => {
    if (!ctx || !canvas) { return; } const npc = getCssVariable('--particle-color'); particles.forEach(p => p.color = npc); const bg = getCssVariable('--canvas-bg'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); particles.forEach(p => p.draw()); connectParticles();
  };
  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout); window.resizeTimeout = setTimeout(() => { if (canvas && ctx) { initParticles(); window.drawCanvasBackground(); } }, 100);
  });
  if (canvas) { ctx = canvas.getContext('2d'); if (ctx) { initParticles(); animateParticles(); } else { console.error("Failed to get 2D context for background canvas."); } } else { console.log("Background canvas element not found."); }


  /* --- Cat Following Mouse --- */
  if (catElement) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let catX = mouseX, catY = mouseY;
    const speed = 0.08;
    const followDelay = 100;
    let followTimeout = null;
    let scaleX = 1; // 1 for facing right, -1 for facing left
    let animating = false;
    let walkIndex = 0, lastFrameTime = 0, frameInterval = 100;

    function loop(currentTime) {
      if (!animating || catWalkFrames.length === 0) return;

      const deltaMouseX = mouseX - catX;
      // Determine cat direction (flip) only if there's significant movement towards the mouse
      // This threshold helps prevent instant flipping if mouse is only slightly past center of cat
      if ( (scaleX === 1 && deltaMouseX < -catElement.offsetWidth / 3) || // If facing right and mouse is significantly to the left
           (scaleX === -1 && deltaMouseX > catElement.offsetWidth / 3) ) { // If facing left and mouse is significantly to the right
          scaleX *= -1; // Flip direction
      }


      const catBodyWidth = catElement.offsetWidth;
      // spaceMultiplier determines how much of the cat's width is used as spacing.
      // desiredSpace is the gap you want between the cursor and the cat's leading edge.
      const spaceMultiplier = 0.3; // User adjusted this to 0.3
      let desiredSpace = (catBodyWidth * spaceMultiplier);

      // User's specific adjustments from previous turn
      if (scaleX === 1) { // Cat facing right (mouse moves left to right)
          desiredSpace -=10; // User's adjustment
      } else { // Cat facing left (mouse moves right to left)
          desiredSpace = (catBodyWidth * spaceMultiplier) + 40; // Apply the +40 offset only when moving right to left
      }


      let targetX;
      if (scaleX === 1) { // Cat facing right (mouse is to the right of cat's left edge)
          // Target cat's left edge to be 'desiredSpace' to the left of the mouse cursor
          targetX = mouseX - catBodyWidth - desiredSpace;
      } else { // Cat facing left (mouse is to the left of cat's right edge)
          // Target cat's left edge to be 'desiredSpace' to the left of the mouse cursor
          // When scaleX is -1, the cat's visual right edge is at its CSS 'left' position.
          // The cat's visual left edge is at 'left + catBodyWidth'.
          // We want the visual left edge (which is catX + catBodyWidth when drawn)
          // to be 'desiredSpace' to the left of the mouse.
          // So, (catX_target + catBodyWidth) = mouseX - desiredSpace
          // catX_target = mouseX - catBodyWidth - desiredSpace (This was the original logic for scaleX=1)
          // For scaleX = -1, we want the *actual* left rendering point (catX) to be such that
          // its *apparent* left side (which is effectively its right side due to flipping)
          // is 'desiredSpace' from the cursor.
          // Let's re-evaluate:
          // If cat faces left (scaleX = -1), its "nose" is on its CSS left.
          // We want this nose to be 'desiredSpace' to the left of the mouse.
          // So, targetX = mouseX - desiredSpace.
          targetX = mouseX+70 - desiredSpace; // Corrected for scaleX = -1
      }

      const targetY = mouseY - (catElement.offsetHeight / 2);

      const dx = targetX - catX;
      const dy = targetY - catY;
      const distance = Math.hypot(dx, dy);
      const isMoving = distance > 5;

      if (distance > 1) {
          catX += dx * speed;
          catY += dy * speed;
      }

      catElement.style.transform = `translate(${catX.toFixed(2)}px, ${catY.toFixed(2)}px) scaleX(${scaleX})`;

      if (isMoving) {
          if (currentTime - lastFrameTime > frameInterval) {
              walkIndex = (walkIndex + 1) % catWalkFrames.length;
              catElement.src = catWalkFrames[walkIndex];
              lastFrameTime = currentTime;
          }
      } else {
          const currentSrcFilename = catElement.src.split('/').pop();
          const idleFilename = catIdleFrame.split('/').pop();
          if (catElement.src && currentSrcFilename !== idleFilename) {
              catElement.src = catIdleFrame;
          }
          walkIndex = 0;
      }
      requestAnimationFrame(loop);
    }

    function startFollowing() {
        if (animating) return; animating = true; catElement.style.opacity = "0.9"; catElement.src = catIdleFrame; lastFrameTime = performance.now(); requestAnimationFrame(loop);
    }
    function stopFollowing() {
        animating = false; catElement.style.opacity = "0"; if (followTimeout) { clearTimeout(followTimeout); }
    }
    document.addEventListener("mousemove", e => {
        mouseX = e.clientX; mouseY = e.clientY; if (!animating) { if (followTimeout) clearTimeout(followTimeout); followTimeout = setTimeout(startFollowing, followDelay); }
    });
    document.addEventListener("mouseleave", stopFollowing);
    document.addEventListener("mouseenter", e => { mouseX = e.clientX; mouseY = e.clientY; });
    catElement.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
  }


  /* --- Header Blur on Scroll --- */
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener("scroll", () => { if (window.scrollY > 50) { header.classList.add("scrolled"); } else { header.classList.remove("scrolled"); } });
  }


  /* --- Mobile Menu Toggle --- */
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", (e) => { e.stopPropagation(); mobileMenu.classList.toggle("hidden"); }); mobileMenu.querySelectorAll("a").forEach(link => { link.addEventListener("click", () => { mobileMenu.classList.add("hidden"); }); }); document.addEventListener('click', (event) => { if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) { mobileMenu.classList.add('hidden'); } });
  }


  /* --- Scroll Reveal Sections --- */
  const sectionsToReveal = document.querySelectorAll("section");
  if (sectionsToReveal.length > 0) {
    sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { sec.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out"); } }); const io = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove("opacity-0", "translate-y-5"); entry.target.classList.add("opacity-100", "translate-y-0"); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { io.observe(sec); } });
  }


  /* --- Footer Year --- */
  const yearElement = document.getElementById("current-year");
  if (yearElement) { yearElement.textContent = new Date().getFullYear(); }


  /* --- Hi All! Font Changing Animation --- */
  const fontChangeTextElement = document.getElementById('font-change-text');
  if (fontChangeTextElement) {
    const styles = [ { text: "Hi All!", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Montserrat', sans-serif" }, { text: "H̶̢̭̓i̸͈̓̂ ̵̥́̊A̴̪̎̒l̴̹̪̆ļ̵̼̊!̶̰̅", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Courier New', monospace" }, { text: "Hi All!", fontFamily: "cursive" }, { text: "Hi All!", fontFamily: "fantasy" }, { text: "Hi All!", fontFamily: "'Honk', system-ui" } ]; let csi = 0; const ci = 750; const gd = 150; function applyStyle(i) { if (i >= 0 && i < styles.length) { fontChangeTextElement.textContent = styles[i].text; fontChangeTextElement.style.fontFamily = styles[i].fontFamily; } } applyStyle(csi); setInterval(() => { const nsi = (csi + 1) % styles.length; if (styles[nsi].text.includes('̶')) { applyStyle(nsi); setTimeout(() => { const agi = (nsi + 1) % styles.length; applyStyle(agi); csi = agi; }, gd); } else { applyStyle(nsi); csi = nsi; } }, ci);
  }


  /* === Profile Picture (No Hover Effects) === */
  const profilePic = document.getElementById('profile-picture');
  if (profilePic) {
    // Event listeners for mouseenter, mousemove, mouseleave are removed.
  }


  /* ===== MUSIC CONTROLS (Using Tone.Player) ===== */
  const volumeToggleButton = document.getElementById('volume-toggle-button');
  const volumeSlider = document.getElementById('volume-slider');
  let musicPlayer = null;
  let musicVolume = null;
  let isAudioContextStarted = false; // Tracks if Tone.start() has been attempted
  let isMusicSetup = false;      // Tracks if Tone.Player and Volume are created and audio loaded
  let isMusicPlaying = false;
  let previousVolumeBeforeMute = 50;
  let hasUserInteracted = false; // Tracks the very first user gesture for audio
  const audioFilePath = "audio/song.mp3";

  async function initializeAudioAndSetupMusic() {
      if (isMusicSetup) { // If already fully set up, just ensure context is running
          console.log("[Music] initializeAudioAndSetupMusic: Music already set up.");
          if (Tone.context && Tone.context.state === 'suspended') {
              console.log("[Music] AudioContext is suspended, attempting to resume...");
              try {
                  await Tone.context.resume();
                  console.log("[Music] AudioContext resumed. State:", Tone.context.state);
              } catch (e) { console.error("[Music] Error resuming suspended AudioContext:", e); }
          }
          // Ensure controls are enabled if they somehow got disabled
          if (volumeToggleButton && volumeToggleButton.disabled) volumeToggleButton.disabled = false;
          if (volumeSlider && volumeSlider.disabled) volumeSlider.disabled = false;
          return;
      }
      
      // This function should only be triggered by a user gesture
      hasUserInteracted = true; 

      console.log("[Music] User interaction. Current Tone.context.state:", Tone.context?.state);
      if (volumeToggleButton) volumeToggleButton.disabled = true; // Disable during init
      if (volumeSlider) volumeSlider.disabled = true;

      try {
          if (!Tone.context || Tone.context.state !== 'running') {
              console.log("[Music] Attempting Tone.start()...");
              await Tone.start(); // This initializes/resumes the AudioContext
              console.log("[Music] Tone.start() successful. AudioContext state:", Tone.context.state);
          } else {
              console.log("[Music] AudioContext already running.");
          }
          isAudioContextStarted = true; // Mark that Tone.start() has been processed

          if (Tone.context.state === 'running') {
              console.log("[Music] AudioContext is running. Proceeding to create Tone objects.");

              // Create Tone.js objects ONLY if context is running
              musicVolume = new Tone.Volume(0).toDestination();
              console.log("[Music] Tone.Volume created.");

              if(volumeToggleButton) volumeToggleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Show spinner while loading file

              musicPlayer = new Tone.Player({
                  url: audioFilePath,
                  loop: true,
                  autostart: false, // We will control start explicitly
                  onload: () => {
                      console.log("[Music] Music file loaded successfully:", audioFilePath);
                      isMusicSetup = true; // Crucial: Mark setup as complete ONLY after file loads
                                           // and player is ready.
                      if (volumeToggleButton) volumeToggleButton.disabled = false;
                      if (volumeSlider) volumeSlider.disabled = false;

                      const savedVolumePercent = localStorage.getItem('musicVolumePercent');
                      const initialPercent = savedVolumePercent !== null ? parseFloat(savedVolumePercent) : 50;
                      if (volumeSlider) volumeSlider.value = initialPercent;
                      updateVolume(initialPercent); // Set initial volume and icon

                      // Auto-play if initial volume was > 0
                      if (initialPercent > 0) {
                          // Context state should still be running here
                          console.log("[Music] Attempting to start music post-load (initial volume > 0).");
                          if (musicPlayer && Tone.context.state === 'running') {
                              musicPlayer.start();
                              isMusicPlaying = true;
                              console.log("[Music] Music started successfully after load.");
                          } else {
                               console.warn("[Music] Music loaded, but couldn't start. Player or Context issue. State:", Tone.context?.state);
                               updateVolume(0); // Visually mute
                          }
                      } else {
                          console.log("[Music] Music loaded, initial volume is 0. Will not auto-play.");
                          updateVolume(0); // Ensure icon is muted
                      }
                  },
                  onerror: (error) => {
                      console.error("[Music] Error loading music file:", audioFilePath, error);
                      isMusicSetup = false; // Ensure setup is marked as failed
                      if (volumeToggleButton) {
                          volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                          volumeToggleButton.disabled = true; // Keep disabled
                      }
                      if (volumeSlider) volumeSlider.disabled = true;
                  }
              }).connect(musicVolume);
              console.log("[Music] Tone.Player created and connect() called.");
          } else {
              console.error("[Music] AudioContext not 'running' after Tone.start() attempt. State:", Tone.context.state);
              // UI feedback for failure
              if (volumeToggleButton) {
                  volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                  // volumeToggleButton.disabled = true; // Already disabled
              }
              // if (volumeSlider) volumeSlider.disabled = true; // Already disabled
          }
      } catch (e) {
          console.error("[Music] Error during initializeAudioAndSetupMusic:", e);
          isMusicSetup = false; // Ensure setup is marked as failed
          if (volumeToggleButton) {
              volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
              volumeToggleButton.disabled = true;
          }
          if (volumeSlider) volumeSlider.disabled = true;
      }
  }

  function updateVolume(percentValue) {
    const sliderValue = parseFloat(percentValue);
    const minDb = -50; const maxDb = 0;
    let db = (sliderValue <= 0) ? -Infinity : minDb + (sliderValue / 100) * (maxDb - minDb);

    if (musicVolume) { // musicVolume might be null if setup hasn't happened
        musicVolume.volume.value = db;
    }

    if (volumeToggleButton) {
        if (volumeToggleButton.innerHTML.includes('fa-spinner')) {
            // Spinner is active, onload will set the correct icon
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
    if (sliderValue > 0) {
        previousVolumeBeforeMute = sliderValue;
    }
    // console.log(`[Music] Volume updated to ${sliderValue}%, dB: ${db}, previousVolumeBeforeMute: ${previousVolumeBeforeMute}`);
  }


  if (volumeToggleButton) {
    volumeToggleButton.addEventListener('click', async () => {
      console.log("[Music] Volume toggle clicked. hasUserInteracted:", hasUserInteracted, "isMusicSetup:", isMusicSetup, "Player loaded:", musicPlayer?.loaded);
      if (!hasUserInteracted || !isMusicSetup) { // If no interaction OR not fully setup (player not loaded)
          await initializeAudioAndSetupMusic(); // This will handle the first interaction or re-attempt setup
          // If it was the first interaction, initializeAudioAndSetupMusic's onload will handle initial play.
          // If it was a re-attempt and succeeded, the next click will be a normal toggle.
          // If it failed, controls remain disabled or show error.
          return; 
      }

      // From here, we assume isMusicSetup is true and musicPlayer is loaded.
      if (!musicPlayer || !musicPlayer.loaded) {
          console.error("[Music] Toggle clicked, but player is unexpectedly not loaded despite isMusicSetup=true. This shouldn't happen.");
          // You might want to re-attempt initialization or show an error.
          await initializeAudioAndSetupMusic(); // Try one more time.
          return;
      }
      
      if (Tone.context.state !== 'running') {
          console.warn("[Music] AudioContext not running. Attempting to resume for playback via toggle.");
          await initializeAudioAndSetupMusic(); // This will try to resume context
          if (Tone.context.state !== 'running') {
              console.error("[Music] Could not resume AudioContext. Cannot play/stop music via toggle.");
              return;
          }
      }

      const currentSliderValue = volumeSlider ? parseFloat(volumeSlider.value) : 0;
      if (isMusicPlaying) {
          console.log("[Music] Music is playing, stopping and muting via toggle.");
          musicPlayer.stop();
          isMusicPlaying = false;
          if (currentSliderValue > 0) { previousVolumeBeforeMute = currentSliderValue; }
          if (volumeSlider) volumeSlider.value = 0;
          updateVolume(0);
      } else {
          console.log("[Music] Music is stopped/muted, attempting to play via toggle.");
          const restoreValue = previousVolumeBeforeMute > 0 ? previousVolumeBeforeMute : 50;
          if (volumeSlider) volumeSlider.value = restoreValue;
          updateVolume(restoreValue);
          musicPlayer.start();
          isMusicPlaying = true;
          console.log("[Music] Music started via toggle.");
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', async (e) => {
      const newVolumePercent = parseFloat(e.target.value);
      // console.log(`[Music] Volume slider input: ${newVolumePercent}%. hasUserInteracted: ${hasUserInteracted}, isMusicSetup: ${isMusicSetup}`);
      
      if (!hasUserInteracted || !isMusicSetup) {
          await initializeAudioAndSetupMusic();
          // After the above, if setup was successful, musicPlayer will be available.
          // We still need to apply the current slider value.
          if (isMusicSetup && musicPlayer && musicPlayer.loaded) {
              updateVolume(newVolumePercent);
          }
          return; 
      }
      
      // If we are here, setup is complete.
      updateVolume(newVolumePercent);

      if (!musicPlayer || !musicPlayer.loaded) {
          console.error("[Music] Slider moved, but player is unexpectedly not loaded despite isMusicSetup=true.");
          return;
      }

      if (Tone.context.state !== 'running') {
          console.warn("[Music] Slider moved to play, but AudioContext not running. Attempting resume.");
          await initializeAudioAndSetupMusic(); // This will try to resume context
          if (Tone.context.state !== 'running') {
              console.error("[Music] Could not resume AudioContext. Cannot play/stop music via slider.");
              return;
          }
      }

      if (newVolumePercent > 0 && !isMusicPlaying) {
          musicPlayer.start();
          isMusicPlaying = true;
          console.log("[Music] Music started via slider unmute.");
      } else if (newVolumePercent <= 0 && isMusicPlaying) {
          musicPlayer.stop();
          isMusicPlaying = false;
          console.log("[Music] Music stopped via slider mute.");
      }
    });
  }

  // Set initial visual state of controls (disabled until ready)
  if(volumeSlider && volumeToggleButton) {
      const initialVolumePercent = localStorage.getItem('musicVolumePercent') !== null
          ? parseFloat(localStorage.getItem('musicVolumePercent'))
          : 50;
      // Set icon based on stored/default volume, but don't change dB level yet
      if (initialVolumePercent <= 0) {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
      } else if (initialVolumePercent < 50) {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-down"></i>';
      } else {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
      }
      volumeSlider.value = initialVolumePercent;
      volumeToggleButton.disabled = true; // Start disabled
      volumeSlider.disabled = true;     // Start disabled
      console.log("[Music] Initial visual state for controls set (disabled).");
  }

}); // End DOMContentLoaded
