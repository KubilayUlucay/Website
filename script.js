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
  function initParticles() { /* ... (same as before, kept for brevity) ... */
    if (!canvas || !ctx) return; particles = []; canvas.width = window.innerWidth; canvas.height = window.innerHeight; let n = Math.floor((canvas.width * canvas.height) / 15000); n = Math.max(20, Math.min(n, 100)); const c = getCssVariable('--particle-color'); for (let i = 0; i < n; i++) { const r = Math.random() * 1.5 + 0.5; const x = Math.random() * (canvas.width - r * 2) + r; const y = Math.random() * (canvas.height - r * 2) + r; const dx = (Math.random() - 0.5) * 0.5; const dy = (Math.random() - 0.5) * 0.5; const p = new Particle(x, y, r, dx, dy); p.color = c; particles.push(p); }
  }
  function animateParticles() { /* ... (same as before, kept for brevity) ... */
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); } animationFrameId = requestAnimationFrame(animateParticles); if (!ctx || !canvas) return; const bg = getCssVariable('--canvas-bg'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); }); connectParticles();
  }
  function connectParticles() { /* ... (same as before, kept for brevity) ... */
    if (!ctx || particles.length === 0) return; let o = 0.2; const lc = getCssVariable('--particle-color'); for (let a = 0; a < particles.length; a++) { for (let b = a + 1; b < particles.length; b++) { const d = Math.hypot(particles[a].x - particles[b].x, particles[a].y - particles[b].y); const md = 100; if (d < md) { o = 1 - (d / md); let bc = lc.startsWith('rgba') ? lc.substring(0, lc.lastIndexOf(',')) : lc.replace('rgb', 'rgba').replace(')', ', 1'); const rc = `${bc.substring(0, bc.lastIndexOf(','))}, ${o.toFixed(2)})`; ctx.strokeStyle = rc; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke(); ctx.closePath(); } } }
  }
  window.drawCanvasBackground = () => { /* ... (same as before, kept for brevity) ... */
    if (!ctx || !canvas) { return; } const npc = getCssVariable('--particle-color'); particles.forEach(p => p.color = npc); const bg = getCssVariable('--canvas-bg'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); particles.forEach(p => p.draw()); connectParticles();
  };
  window.addEventListener('resize', () => { /* ... (same as before, kept for brevity) ... */
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
      if (Math.abs(deltaMouseX) > 2) {
          scaleX = deltaMouseX > 0 ? 1 : -1;
      }

      const catBodyWidth = catElement.offsetWidth;
      const spaceMultiplier = 0.3; // Adjust for more/less space (e.g., 0.3 = 30% of cat's width)
      const desiredSpace = (catBodyWidth * spaceMultiplier)-10;
      let targetX;

      if (scaleX === 1) { // Cat facing right (mouse is generally to the right of cat)
          // Place cat's right edge 'desiredSpace' to the left of the mouse cursor
          // targetX is the cat's left CSS position
          targetX = mouseX - catBodyWidth - desiredSpace;
      } else { // Cat facing left (scaleX === -1, mouse is generally to the left of cat)
          // Place cat's left edge 'desiredSpace' to the left of the mouse cursor
          targetX = mouseX+40 - desiredSpace;
      }
      // Vertical target remains the same (center cat vertically on cursor)
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

    function startFollowing() { /* ... (same as before, kept for brevity) ... */
        if (animating) return; animating = true; catElement.style.opacity = "0.9"; catElement.src = catIdleFrame; lastFrameTime = performance.now(); requestAnimationFrame(loop);
    }
    function stopFollowing() { /* ... (same as before, kept for brevity) ... */
        animating = false; catElement.style.opacity = "0"; if (followTimeout) { clearTimeout(followTimeout); }
    }
    document.addEventListener("mousemove", e => { /* ... (same as before, kept for brevity) ... */
        mouseX = e.clientX; mouseY = e.clientY; if (!animating) { if (followTimeout) clearTimeout(followTimeout); followTimeout = setTimeout(startFollowing, followDelay); }
    });
    document.addEventListener("mouseleave", stopFollowing);
    document.addEventListener("mouseenter", e => { mouseX = e.clientX; mouseY = e.clientY; });
    catElement.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
  }


  /* --- Header Blur on Scroll --- */
  const header = document.querySelector("header");
  if (header) { /* ... (same as before, kept for brevity) ... */
    window.addEventListener("scroll", () => { if (window.scrollY > 50) { header.classList.add("scrolled"); } else { header.classList.remove("scrolled"); } });
  }


  /* --- Mobile Menu Toggle --- */
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) { /* ... (same as before, kept for brevity) ... */
    mobileMenuButton.addEventListener("click", (e) => { e.stopPropagation(); mobileMenu.classList.toggle("hidden"); }); mobileMenu.querySelectorAll("a").forEach(link => { link.addEventListener("click", () => { mobileMenu.classList.add("hidden"); }); }); document.addEventListener('click', (event) => { if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) { mobileMenu.classList.add('hidden'); } });
  }


  /* --- Scroll Reveal Sections --- */
  const sectionsToReveal = document.querySelectorAll("section");
  if (sectionsToReveal.length > 0) { /* ... (same as before, kept for brevity) ... */
    sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { sec.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out"); } }); const io = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove("opacity-0", "translate-y-5"); entry.target.classList.add("opacity-100", "translate-y-0"); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { io.observe(sec); } });
  }


  /* --- Footer Year --- */
  const yearElement = document.getElementById("current-year");
  if (yearElement) { yearElement.textContent = new Date().getFullYear(); }


  /* --- Hi All! Font Changing Animation --- */
  const fontChangeTextElement = document.getElementById('font-change-text');
  if (fontChangeTextElement) { /* ... (same as before, kept for brevity) ... */
    const styles = [ { text: "Hi All!", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Montserrat', sans-serif" }, { text: "H̶̢̭̓i̸͈̓̂ ̵̥́̊A̴̪̎̒l̴̹̪̆ļ̵̼̊!̶̰̅", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Courier New', monospace" }, { text: "Hi All!", fontFamily: "cursive" }, { text: "Hi All!", fontFamily: "fantasy" }, { text: "Hi All!", fontFamily: "'Honk', system-ui" } ]; let csi = 0; const ci = 750; const gd = 150; function applyStyle(i) { if (i >= 0 && i < styles.length) { fontChangeTextElement.textContent = styles[i].text; fontChangeTextElement.style.fontFamily = styles[i].fontFamily; } } applyStyle(csi); setInterval(() => { const nsi = (csi + 1) % styles.length; if (styles[nsi].text.includes('̶')) { applyStyle(nsi); setTimeout(() => { const agi = (nsi + 1) % styles.length; applyStyle(agi); csi = agi; }, gd); } else { applyStyle(nsi); csi = nsi; } }, ci);
  }


  /* === Profile Picture (No Hover Effects) === */
  const profilePic = document.getElementById('profile-picture');
  if (profilePic) {
    // Event listeners for mouseenter, mousemove, mouseleave are removed.
    // CSS class 'hovering' and direct style manipulations for transform are no longer applied.
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
  let hasUserInteracted = false;
  const audioFilePath = "audio/song.mp3"; // Define path once for clarity

  function setupMusic() {
      console.log("[Music] Attempting setupMusic. isMusicSetup:", isMusicSetup, "isAudioContextStarted:", isAudioContextStarted, "Tone.context.state:", Tone.context?.state);
      if (isMusicSetup || !isAudioContextStarted || (Tone.context && Tone.context.state !== 'running')) {
          console.warn("[Music] Conditions not met for setupMusic. Aborting.");
          if (Tone.context && Tone.context.state !== 'running' && isAudioContextStarted) {
              console.error("[Music] AudioContext was started but is not running. State:", Tone.context.state);
          }
          return;
      }
      isMusicSetup = true;
      console.log("[Music] Setting up music player with file:", audioFilePath);
      if(volumeToggleButton) volumeToggleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      musicVolume = new Tone.Volume(0).toDestination();
      console.log("[Music] Tone.Volume created.");

      musicPlayer = new Tone.Player({
          url: audioFilePath,
          loop: true,
          autostart: false,
          onload: () => {
              console.log("[Music] Music file loaded successfully:", audioFilePath);
              if (volumeToggleButton) volumeToggleButton.disabled = false;
              if (volumeSlider) volumeSlider.disabled = false;

              const savedVolumePercent = localStorage.getItem('musicVolumePercent');
              const initialPercent = savedVolumePercent !== null ? parseFloat(savedVolumePercent) : 50;
              if (volumeSlider) volumeSlider.value = initialPercent;
              updateVolume(initialPercent); // This also sets previousVolumeBeforeMute if initialPercent > 0

              if (initialPercent > 0) {
                  if (musicPlayer && Tone.context.state === 'running') {
                      console.log("[Music] Attempting to start music post-load (initial volume > 0).");
                      musicPlayer.start();
                      isMusicPlaying = true;
                      console.log("[Music] Music started successfully after load.");
                  } else {
                      console.warn("[Music] Music loaded, but couldn't start. Tone.context.state:", Tone.context?.state);
                      updateVolume(0);
                  }
              } else {
                  console.log("[Music] Music loaded, initial volume is 0. Will not auto-play.");
                  updateVolume(0);
              }
          },
          onerror: (error) => {
              console.error("[Music] Error loading music file:", audioFilePath, error);
              if (volumeToggleButton) {
                  volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                  volumeToggleButton.disabled = true;
              }
              if (volumeSlider) volumeSlider.disabled = true;
          }
      }).connect(musicVolume);
      console.log("[Music] Tone.Player created and connect() called.");
  }

  function updateVolume(percentValue) { /* ... (same as before, kept for brevity) ... */
    const sliderValue = parseFloat(percentValue); const minDb = -50; const maxDb = 0; let db = (sliderValue <= 0) ? -Infinity : minDb + (sliderValue / 100) * (maxDb - minDb); if (musicVolume) { musicVolume.volume.value = db; } if (volumeToggleButton) { if (volumeToggleButton.innerHTML.includes('fa-spinner')) {} else if (sliderValue <= 0) { volumeToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>'; volumeToggleButton.setAttribute('aria-label', 'Unmute background music'); } else if (sliderValue < 50) { volumeToggleButton.innerHTML = '<i class="fas fa-volume-down"></i>'; volumeToggleButton.setAttribute('aria-label', 'Mute background music'); } else { volumeToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>'; volumeToggleButton.setAttribute('aria-label', 'Mute background music'); } } localStorage.setItem('musicVolumePercent', sliderValue.toString()); if(sliderValue > 0) { previousVolumeBeforeMute = sliderValue; } else if (sliderValue <=0 && !isMusicPlaying) { /* If muted via slider and not playing, keep previous for unmute */ } else { previousVolumeBeforeMute = 50; /* Default if muted to 0 while playing */ }
    // console.log(`[Music] Volume updated to ${sliderValue}%, dB: ${db}, previousVolumeBeforeMute: ${previousVolumeBeforeMute}`);
  }

  async function initializeAudio() {
      if (hasUserInteracted) {
          console.log("[Music] initializeAudio called, but user has already interacted.");
          // If context is started but not running, try to resume it.
          if (isAudioContextStarted && Tone.context && Tone.context.state === 'suspended') {
              console.log("[Music] AudioContext is suspended, attempting to resume...");
              try {
                  await Tone.context.resume();
                  console.log("[Music] AudioContext resumed. State:", Tone.context.state);
                  if (!isMusicSetup) setupMusic(); // Try setup again if not done
              } catch (e) {
                  console.error("[Music] Error resuming suspended AudioContext:", e);
              }
          }
          return;
      }
      hasUserInteracted = true;

      console.log("[Music] User interaction detected. Current Tone.context.state:", Tone.context?.state);
      if (volumeToggleButton) volumeToggleButton.disabled = true;
      if (volumeSlider) volumeSlider.disabled = true;

      try {
          if (Tone.context.state !== 'running') {
              console.log("[Music] Attempting Tone.start()...");
              await Tone.start();
              console.log("[Music] Tone.start() successful. AudioContext state:", Tone.context.state);
          } else {
              console.log("[Music] AudioContext already running.");
          }
          isAudioContextStarted = true;
          setupMusic();
      } catch (e) {
          console.error("[Music] Error during Tone.start() or initial setup:", e);
          if (volumeToggleButton) {
              volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
              volumeToggleButton.disabled = true;
          }
          if (volumeSlider) volumeSlider.disabled = true;
      }
  }

  if (volumeToggleButton) {
    volumeToggleButton.addEventListener('click', async () => {
      console.log("[Music] Volume toggle clicked. hasUserInteracted:", hasUserInteracted, "isMusicPlayerLoaded:", musicPlayer?.loaded);
      if (!hasUserInteracted) {
          await initializeAudio();
          return;
      }
      if (!musicPlayer || !musicPlayer.loaded) {
          console.warn("[Music] Toggle clicked, but player not ready. Attempting audio init/resume.");
          await initializeAudio(); // Try to init/resume if player isn't ready (e.g. context suspended)
          if (!musicPlayer || !musicPlayer.loaded) { // Check again
             console.error("[Music] Player still not ready after re-attempt. Aborting toggle action.");
             return;
          }
      }

      const currentSliderValue = volumeSlider ? parseFloat(volumeSlider.value) : 0;
      if (isMusicPlaying) {
          console.log("[Music] Music is playing, stopping and muting.");
          musicPlayer.stop();
          isMusicPlaying = false;
          if (currentSliderValue > 0) { previousVolumeBeforeMute = currentSliderValue; }
          if (volumeSlider) volumeSlider.value = 0;
          updateVolume(0);
      } else {
          console.log("[Music] Music is stopped/muted, attempting to play.");
          if (Tone.context.state !== 'running') {
              console.warn("[Music] AudioContext not running. Attempting to resume for playback.");
              await initializeAudio(); // This will try to resume context
              if (Tone.context.state !== 'running') {
                  console.error("[Music] Could not resume AudioContext. Cannot play music.");
                  return;
              }
          }
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
      // console.log(`[Music] Volume slider input: ${newVolumePercent}%. hasUserInteracted: ${hasUserInteracted}`);
      if (!hasUserInteracted) {
          await initializeAudio();
          // updateVolume is called inside initializeAudio->setupMusic->onload based on slider's initial value
          // For the first drag, we need to ensure the dragged value is applied if setup is complete.
          if (musicPlayer && musicPlayer.loaded) {
            updateVolume(newVolumePercent); // Apply the dragged volume
          }
          // Don't auto-play on first drag, let onload or toggle handle it.
          return;
      }

      updateVolume(newVolumePercent);

      if (musicPlayer && musicPlayer.loaded) {
          if (newVolumePercent > 0 && !isMusicPlaying) {
              if (Tone.context.state !== 'running') {
                  console.warn("[Music] Slider moved to play, but AudioContext not running. Attempting resume.");
                  await initializeAudio();
                  if (Tone.context.state !== 'running') {
                      console.error("[Music] Could not resume AudioContext. Cannot play music via slider.");
                      return;
                  }
              }
              musicPlayer.start();
              isMusicPlaying = true;
              console.log("[Music] Music started via slider unmute.");
          } else if (newVolumePercent <= 0 && isMusicPlaying) {
              musicPlayer.stop();
              isMusicPlaying = false;
              console.log("[Music] Music stopped via slider mute.");
          }
      }
    });
  }

  if(volumeSlider && volumeToggleButton) {
      const initialVolumePercent = localStorage.getItem('musicVolumePercent') !== null
          ? parseFloat(localStorage.getItem('musicVolumePercent'))
          : 50;
      if (initialVolumePercent <= 0) {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
          volumeToggleButton.setAttribute('aria-label', 'Unmute background music');
      } else if (initialVolumePercent < 50) {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-down"></i>';
          volumeToggleButton.setAttribute('aria-label', 'Mute background music');
      } else {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
          volumeToggleButton.setAttribute('aria-label', 'Mute background music');
      }
      volumeSlider.value = initialVolumePercent;
      volumeToggleButton.disabled = true;
      volumeSlider.disabled = true;
      console.log("[Music] Initial visual state for controls set.");
  }

}); // End DOMContentLoaded
