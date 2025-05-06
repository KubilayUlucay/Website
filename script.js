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
    let scaleX = 1; 
    let animating = false;
    let walkIndex = 0, lastFrameTime = 0, frameInterval = 100;

    function loop(currentTime) {
      if (!animating || catWalkFrames.length === 0) return;

      const deltaMouseX = mouseX - catX;
      if ( (scaleX === 1 && deltaMouseX < -catElement.offsetWidth / 3) || 
           (scaleX === -1 && deltaMouseX > catElement.offsetWidth / 3) ) { 
          scaleX *= -1; 
      }

      const catBodyWidth = catElement.offsetWidth;
      const spaceMultiplier = 0.3; 
      let desiredSpace = (catBodyWidth * spaceMultiplier);

      if (scaleX === 1) { 
          desiredSpace -=10; 
      } else { 
          desiredSpace = (catBodyWidth * spaceMultiplier) + 40; 
      }

      let targetX;
      if (scaleX === 1) { 
          targetX = mouseX - catBodyWidth - desiredSpace;
      } else { 
          targetX = mouseX + 70 - desiredSpace; 
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
  // let isAudioContextStarted = false; // Not strictly needed if we rely on Tone.context.state
  let isMusicSetup = false;      // Tracks if Tone.Player and Volume are created and audio loaded
  let isMusicPlaying = false;    // Tracks if music is currently playing
  let previousVolumeBeforeMute = 50; // Default volume to restore to
  let hasUserInteracted = false; // Tracks the very first user gesture for audio
  const audioFilePath = "audio/song.mp3";

  async function initializeAudioAndSetupMusic() {
      if (isMusicSetup) {
          console.log("[Music] initializeAudioAndSetupMusic: Music already set up.");
          if (Tone.context && Tone.context.state === 'suspended') {
              console.log("[Music] AudioContext is suspended, attempting to resume...");
              try {
                  await Tone.context.resume();
                  console.log("[Music] AudioContext resumed. State:", Tone.context.state);
              } catch (e) { console.error("[Music] Error resuming suspended AudioContext:", e); }
          }
          if (volumeToggleButton && volumeToggleButton.disabled) volumeToggleButton.disabled = false;
          if (volumeSlider && volumeSlider.disabled) volumeSlider.disabled = false;
          return;
      }
      
      hasUserInteracted = true; 

      console.log("[Music] User interaction. Current Tone.context.state:", Tone.context?.state);
      if (volumeToggleButton) volumeToggleButton.disabled = true;
      if (volumeSlider) volumeSlider.disabled = true;

      try {
          if (!Tone.context || Tone.context.state !== 'running') {
              console.log("[Music] Attempting Tone.start()...");
              await Tone.start(); 
              console.log("[Music] Tone.start() successful. AudioContext state:", Tone.context.state);
          } else {
              console.log("[Music] AudioContext already running.");
          }
          // isAudioContextStarted = true; // Context started or was already running

          if (Tone.context.state === 'running') {
              console.log("[Music] AudioContext is running. Proceeding to create Tone objects.");
              musicVolume = new Tone.Volume(0).toDestination(); // Initial actual volume to 0
              console.log("[Music] Tone.Volume created.");

              if(volumeToggleButton) volumeToggleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

              musicPlayer = new Tone.Player({
                  url: audioFilePath,
                  loop: true,
                  autostart: false, // IMPORTANT: Do not autostart
                  onload: () => {
                      console.log("[Music] Music file loaded successfully:", audioFilePath);
                      isMusicSetup = true; // Mark setup as complete
                      if (volumeToggleButton) volumeToggleButton.disabled = false;
                      if (volumeSlider) volumeSlider.disabled = false;

                      const savedVolumePercent = localStorage.getItem('musicVolumePercent');
                      const sliderInitialPercent = savedVolumePercent !== null ? parseFloat(savedVolumePercent) : 50; // Default slider to 50 or saved
                      
                      if (volumeSlider) volumeSlider.value = sliderInitialPercent;
                      
                      // Set Tone.Volume based on sliderInitialPercent, but DO NOT PLAY
                      updateVolume(sliderInitialPercent); 
                      
                      // If sliderInitialPercent was 0, it's already effectively "muted" icon and volume.
                      // If >0, icon and volume are set, but music is not started.
                      console.log("[Music] Music loaded. Ready to be played on user command. isMusicPlaying:", isMusicPlaying); // Should be false
                  },
                  onerror: (error) => {
                      console.error("[Music] Error loading music file:", audioFilePath, error);
                      isMusicSetup = false; 
                      if (volumeToggleButton) {
                          volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                          volumeToggleButton.disabled = true; 
                      }
                      if (volumeSlider) volumeSlider.disabled = true;
                  }
              }).connect(musicVolume);
              console.log("[Music] Tone.Player created and connect() called.");
          } else {
              console.error("[Music] AudioContext not 'running' after Tone.start() attempt. State:", Tone.context.state);
              if (volumeToggleButton) {
                  volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
              }
          }
      } catch (e) {
          console.error("[Music] Error during initializeAudioAndSetupMusic:", e);
          isMusicSetup = false; 
          if (volumeToggleButton) {
              volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
              volumeToggleButton.disabled = true;
          }
          if (volumeSlider) volumeSlider.disabled = true;
      }
  }

  function updateVolume(percentValue) {
    const sliderValue = parseFloat(percentValue);

    // Capture the volume level if it's audible, before it might be set to 0 (mute)
    if (sliderValue > 0) {
        previousVolumeBeforeMute = sliderValue;
    }

    const minDb = -50; const maxDb = 0;
    let db = (sliderValue <= 0) ? -Infinity : minDb + (sliderValue / 100) * (maxDb - minDb);

    if (musicVolume) { // musicVolume might be null if setup hasn't happened
        musicVolume.volume.value = db;
    }

    if (volumeToggleButton) {
        if (volumeToggleButton.innerHTML.includes('fa-spinner') || volumeToggleButton.innerHTML.includes('fa-exclamation-triangle')) {
            // Spinner or error is active, onload or error handler will set the correct icon eventually
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
    // console.log(`[Music] Volume updated to ${sliderValue}%, dB: ${db}, previousVolumeBeforeMute: ${previousVolumeBeforeMute}`);
  }


  if (volumeToggleButton) {
    volumeToggleButton.addEventListener('click', async () => {
        console.log("[Music] Volume toggle clicked. hasUserInteracted:", hasUserInteracted, "isMusicSetup:", isMusicSetup, "Player loaded:", musicPlayer?.loaded);
        
        if (!hasUserInteracted || !isMusicSetup) { 
            await initializeAudioAndSetupMusic(); 
            // After init, if setup failed, the following checks will prevent errors
        }

        if (!isMusicSetup || !musicPlayer || !musicPlayer.loaded) {
            console.error("[Music] Toggle clicked, but music setup is not complete or player not loaded.");
            if (volumeToggleButton && !volumeToggleButton.innerHTML.includes('fa-spinner')) { // Avoid overwriting spinner
                 volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            }
            return;
        }
        
        // Ensure AudioContext is running
        if (Tone.context.state !== 'running') {
            console.warn("[Music] AudioContext not running. Attempting to resume for playback via toggle.");
            try {
                await Tone.start(); // Or Tone.context.resume()
                if (Tone.context.state !== 'running') {
                    console.error("[Music] Could not resume AudioContext. Cannot play/stop music via toggle.");
                    return;
                }
                console.log("[Music] AudioContext resumed successfully for toggle.");
            } catch (e) {
                console.error("[Music] Error resuming AudioContext for toggle:", e);
                return;
            }
        }

        // Now, toggle play/stop
        if (isMusicPlaying) {
            console.log("[Music] Music is playing, stopping and muting via toggle.");
            // Capture current volume BEFORE muting if it's > 0
            if (volumeSlider && parseFloat(volumeSlider.value) > 0) {
                previousVolumeBeforeMute = parseFloat(volumeSlider.value);
            }
            musicPlayer.stop();
            isMusicPlaying = false;
            if (volumeSlider) volumeSlider.value = 0; 
            updateVolume(0); 
        } else { // Music is not playing, so start it
            console.log("[Music] Music is stopped/muted, attempting to play via toggle.");
            
            let playVolume = 50; // Default play volume
            const sliderCurrentActual = volumeSlider ? parseFloat(volumeSlider.value) : 0;

            if (sliderCurrentActual > 0) { // If slider is already unmuted, use its value
                playVolume = sliderCurrentActual;
            } else if (previousVolumeBeforeMute > 0) { // Otherwise, use the last known unmuted volume
                playVolume = previousVolumeBeforeMute;
            }
            // If both are 0 (e.g. fresh start or muted then reloaded), it defaults to 50.

            if (volumeSlider) volumeSlider.value = playVolume;
            updateVolume(playVolume); 

            musicPlayer.start();
            isMusicPlaying = true;
            console.log("[Music] Music started via toggle.");
        }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', async (e) => {
        const newVolumePercent = parseFloat(e.target.value);
        
        if (!hasUserInteracted || !isMusicSetup) {
            await initializeAudioAndSetupMusic();
            if (!isMusicSetup || !musicPlayer || !musicPlayer.loaded) {
                console.error("[Music] Slider moved, but music setup failed post-init attempt.");
                updateVolume(newVolumePercent); // Still update slider UI
                return;
            }
        }
        
        // After the above, if setup was successful, musicPlayer will be available.
        updateVolume(newVolumePercent);

        if (!musicPlayer || !musicPlayer.loaded) {
            console.error("[Music] Slider moved, but player is unexpectedly not loaded despite isMusicSetup=true.");
            return;
        }

        // Ensure AudioContext is running
        if (Tone.context.state !== 'running' && newVolumePercent > 0) { // Only try to resume if intending to play
            console.warn("[Music] Slider moved to play, but AudioContext not running. Attempting resume.");
            try {
                await Tone.start(); // Or Tone.context.resume()
                 if (Tone.context.state !== 'running') {
                    console.error("[Music] Could not resume AudioContext. Cannot play/stop music via slider.");
                    return;
                }
                console.log("[Music] AudioContext resumed successfully for slider.");
            } catch (e) {
                console.error("[Music] Error resuming AudioContext for slider:", e);
                return;
            }
        }

        if (newVolumePercent > 0 && !isMusicPlaying) {
            if (Tone.context.state === 'running') { // Double check before starting
                musicPlayer.start();
                isMusicPlaying = true;
                console.log("[Music] Music started via slider unmute.");
            } else {
                 console.warn("[Music] Slider unmute: Cannot start, AudioContext not running.");
            }
        } else if (newVolumePercent <= 0 && isMusicPlaying) {
            musicPlayer.stop();
            isMusicPlaying = false;
            console.log("[Music] Music stopped via slider mute.");
        }
    });
  }

  // Set initial visual state of controls (disabled until ready/first interaction)
  if(volumeSlider && volumeToggleButton) {
      const initialVolumePercent = localStorage.getItem('musicVolumePercent') !== null
          ? parseFloat(localStorage.getItem('musicVolumePercent'))
          : 50; // Default slider display
      
      // Set icon based on stored/default volume, but don't change dB level yet
      if (initialVolumePercent <= 0) {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
      } else if (initialVolumePercent < 50) {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-down"></i>';
      } else {
          volumeToggleButton.innerHTML = '<i class="fas fa-volume-up"></i>';
      }
      volumeSlider.value = initialVolumePercent;
      
      // Start controls as enabled to allow the first click for Tone.start()
      // They will be temporarily disabled during the async loading process.
      volumeToggleButton.disabled = false; 
      volumeSlider.disabled = false;     
      console.log("[Music] Initial visual state for controls set (enabled for first interaction).");
  }

}); // End DOMContentLoaded