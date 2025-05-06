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
    if (catElement && catElement.style.opacity !== "0") { // Check if cat is visible
        const currentSrcFilename = catElement.src.split('/').pop();
        const newIdleFilename = catIdleFrame.split('/').pop();
        // Only update src if it's different to avoid animation interruption if not needed
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
    updateCatImages(theme); // Update cat images based on theme
    // Redraw canvas background if it exists and is initialized
    if (window.drawCanvasBackground) {
        setTimeout(window.drawCanvasBackground, 0); // Use setTimeout to ensure CSS vars are updated
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
  // Apply saved theme or default
  const savedTheme = localStorage.getItem('theme') || 'light'; // Default to light
  if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    if (themeToggleButton) themeToggleButton.innerHTML = sunIcon;
  } else {
    if (themeToggleButton) themeToggleButton.innerHTML = moonIcon;
  }
  updateCatImages(savedTheme); // Initial cat images based on saved/default theme


  /* ===== ANIMATED CANVAS BACKGROUND ===== */
  const canvas = document.getElementById('background-canvas');
  let ctx; // Canvas rendering context
  let particles = []; // Array to hold particle objects
  let animationFrameId; // ID for canceling animation frame

  // Helper to get CSS variable values
  const getCssVariable = (variableName) => getComputedStyle(document.body).getPropertyValue(variableName).trim();

  class Particle {
    constructor(x, y, radius, dx, dy) {
      this.x = x; this.y = y; this.radius = radius;
      this.dx = dx; this.dy = dy; // Velocities
      this.color = getCssVariable('--particle-color'); // Initial color
    }
    updateColor() { this.color = getCssVariable('--particle-color'); } // Method to update color if theme changes
    draw() {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
    }
    update() {
      if (!canvas) return;
      // Bounce off edges
      if (this.x + this.radius > canvas.width || this.x - this.radius < 0) { this.dx = -this.dx; }
      if (this.y + this.radius > canvas.height || this.y - this.radius < 0) { this.dy = -this.dy; }
      // Move particle
      this.x += this.dx; this.y += this.dy;
      this.draw();
    }
  }

  function initParticles() {
    if (!canvas || !ctx) return;
    particles = [];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Adjust particle count based on screen size for performance
    let numParticles = Math.floor((canvas.width * canvas.height) / 15000); // Density factor
    numParticles = Math.max(20, Math.min(numParticles, 100)); // Clamp between 20 and 100

    const initialColor = getCssVariable('--particle-color'); // Get color once for init

    for (let i = 0; i < numParticles; i++) {
      const radius = Math.random() * 1.5 + 0.5; // Random size
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = Math.random() * (canvas.height - radius * 2) + radius;
      const dx = (Math.random() - 0.5) * 0.5; // Random velocity
      const dy = (Math.random() - 0.5) * 0.5;
      const particle = new Particle(x, y, radius, dx, dy);
      particle.color = initialColor; // Set initial color
      particles.push(particle);
    }
  }

  function animateParticles() {
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); } // Clear previous frame
    animationFrameId = requestAnimationFrame(animateParticles); // Loop
    if (!ctx || !canvas) return;

    const backgroundColor = getCssVariable('--canvas-bg'); // Get current background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear canvas with current bg color

    particles.forEach(particle => { particle.update(); });
    connectParticles();
  }

  function connectParticles() {
    if (!ctx || particles.length === 0) return;
    let opacity = 0.2; // Base opacity for lines
    const lineColorBase = getCssVariable('--particle-color'); // Get current particle color for lines

    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) { // Avoid duplicate checks and self-check
        const distance = Math.hypot(particles[a].x - particles[b].x, particles[a].y - particles[b].y);
        const maxDistance = 100; // Max distance to draw a line

        if (distance < maxDistance) {
          opacity = 1 - (distance / maxDistance); // Line opacity based on distance
          // Ensure correct RGBA format for opacity
          let baseColor = lineColorBase.startsWith('rgba') ? lineColorBase.substring(0, lineColorBase.lastIndexOf(',')) : lineColorBase.replace('rgb', 'rgba').replace(')', ', 1');
          const rgbaColor = `${baseColor.substring(0, baseColor.lastIndexOf(','))}, ${opacity.toFixed(2)})`;

          ctx.strokeStyle = rgbaColor;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
          ctx.closePath();
        }
      }
    }
  }

  // Exposed function to redraw canvas, e.g., after theme change
  window.drawCanvasBackground = () => {
    if (!ctx || !canvas) { console.warn("Canvas or context not ready for drawCanvasBackground"); return; }
    const newParticleColor = getCssVariable('--particle-color');
    particles.forEach(particle => particle.color = newParticleColor); // Update all particle colors

    const backgroundColor = getCssVariable('--canvas-bg');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear with new background
    particles.forEach(particle => particle.draw()); // Redraw particles
    connectParticles(); // Redraw connections
  };

  // Resize listener
  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      if (canvas && ctx) {
        initParticles(); // Re-initialize particles for new size
        window.drawCanvasBackground(); // Redraw immediately
      }
    }, 100); // Debounce resize
  });

  // Initialize canvas if element exists
  if (canvas) {
    ctx = canvas.getContext('2d');
    if (ctx) {
      initParticles();
      animateParticles();
    } else {
      console.error("Failed to get 2D context for background canvas.");
    }
  } else {
    console.log("Background canvas element not found.");
  }


  /* --- Cat Following Mouse --- */
  if (catElement) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let catX = mouseX, catY = mouseY; // Cat's current position
    const speed = 0.08; // How fast the cat follows
    const followDelay = 100; // Milliseconds before cat starts following
    let followTimeout = null;
    let scaleX = 1; // For flipping cat image
    let animating = false; // Is the cat animation loop running?
    let walkIndex = 0, lastFrameTime = 0, frameInterval = 100; // For walk animation

    function loop(currentTime) {
      if (!animating || catWalkFrames.length === 0) return;

      const deltaMouseX = mouseX - catX;
      // Determine cat direction (flip) only if there's significant movement
      if (Math.abs(deltaMouseX) > 2) { // Threshold to prevent jittering
          scaleX = deltaMouseX > 0 ? 1 : -1;
      }

      // MODIFIED: Increased 'om' from 0.6 to 1.0 to push cat further left of cursor when moving right
      const om = 1.0; // Offset multiplier: 1.0 means cat's right edge aligns with cursor when moving right
      const targetX = mouseX - (catElement.offsetWidth * om) * scaleX;
      const targetY = mouseY - (catElement.offsetHeight / 2); // Center cat vertically on cursor

      const dx = targetX - catX;
      const dy = targetY - catY;
      const distance = Math.hypot(dx, dy);

      const isMoving = distance > 5; // Threshold for "moving" to trigger walk animation

      // Smoothly move cat towards target
      if (distance > 1) { // Only move if not already at target
          catX += dx * speed;
          catY += dy * speed;
      }

      catElement.style.transform = `translate(${catX.toFixed(2)}px, ${catY.toFixed(2)}px) scaleX(${scaleX})`;

      // Handle walking animation
      if (isMoving) {
          if (currentTime - lastFrameTime > frameInterval) {
              walkIndex = (walkIndex + 1) % catWalkFrames.length;
              catElement.src = catWalkFrames[walkIndex];
              lastFrameTime = currentTime;
          }
      } else { // Idle state
          const currentSrcFilename = catElement.src.split('/').pop();
          const idleFilename = catIdleFrame.split('/').pop();
          if (catElement.src && currentSrcFilename !== idleFilename) {
              catElement.src = catIdleFrame; // Revert to idle frame
          }
          walkIndex = 0; // Reset walk animation
      }
      requestAnimationFrame(loop);
    }

    function startFollowing() {
      if (animating) return;
      animating = true;
      catElement.style.opacity = "0.9"; // Make cat visible
      catElement.src = catIdleFrame; // Start with idle frame
      lastFrameTime = performance.now(); // Initialize for animation timing
      requestAnimationFrame(loop);
    }

    function stopFollowing() {
      animating = false;
      catElement.style.opacity = "0"; // Hide cat
      if (followTimeout) {
          clearTimeout(followTimeout);
      }
    }

    document.addEventListener("mousemove", e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!animating) { // If not already following, set a timeout to start
          if (followTimeout) clearTimeout(followTimeout);
          followTimeout = setTimeout(startFollowing, followDelay);
      }
    });
    document.addEventListener("mouseleave", stopFollowing); // Stop when mouse leaves window
    document.addEventListener("mouseenter", e => { // Update mouse position on re-entry
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Optionally, restart following immediately or with delay
    });

    // Initial position (off-screen or centered, then made visible by startFollowing)
    catElement.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
  }


  /* --- Header Blur on Scroll --- */
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) { // Add blur effect after scrolling down a bit
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });
  }


  /* --- Mobile Menu Toggle --- */
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent click from bubbling to document
      mobileMenu.classList.toggle("hidden");
    });
    // Close menu when a link is clicked
    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
      });
    });
    // Close menu if clicked outside
    document.addEventListener('click', (event) => {
      if (!mobileMenu.classList.contains('hidden') &&
          !mobileMenu.contains(event.target) &&
          !mobileMenuButton.contains(event.target)) {
        mobileMenu.classList.add('hidden');
      }
    });
  }


  /* --- Scroll Reveal Sections --- */
  const sectionsToReveal = document.querySelectorAll("section");
  if (sectionsToReveal.length > 0) {
    // Initially hide sections that are not the hero
    sectionsToReveal.forEach(section => {
      if (section.id !== "hero") { // Hero section has its own animations
        section.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out");
      }
    });

    const observerOptions = { threshold: 0.1 }; // Trigger when 10% of section is visible
    const intersectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("opacity-0", "translate-y-5");
          entry.target.classList.add("opacity-100", "translate-y-0");
          observer.unobserve(entry.target); // Stop observing once revealed
        }
      });
    }, observerOptions);

    sectionsToReveal.forEach(section => {
      if (section.id !== "hero") {
        intersectionObserver.observe(section);
      }
    });
  }


  /* --- Footer Year --- */
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }


  /* --- Hi All! Font Changing Animation --- */
  const fontChangeTextElement = document.getElementById('font-change-text');
  if (fontChangeTextElement) {
    const textStyles = [
        { text: "Hi All!", fontFamily: "'Rubik', sans-serif" },
        { text: "Hi All!", fontFamily: "'Montserrat', sans-serif" },
        { text: "H̶̢̭̓i̸͈̓̂ ̵̥́̊A̴̪̎̒l̴̹̪̆ļ̵̼̊!̶̰̅", fontFamily: "'Rubik', sans-serif" }, // Glitch effect
        { text: "Hi All!", fontFamily: "'Courier New', monospace" },
        { text: "Hi All!", fontFamily: "cursive" },
        { text: "Hi All!", fontFamily: "fantasy" },
        { text: "Hi All!", fontFamily: "'Honk', system-ui" } // Special font
    ];
    let currentStyleIndex = 0;
    const changeInterval = 750; // ms
    const glitchDuration = 150; // ms for how long glitch text stays

    function applyStyle(index) {
        if (index >= 0 && index < textStyles.length) {
            fontChangeTextElement.textContent = textStyles[index].text;
            fontChangeTextElement.style.fontFamily = textStyles[index].fontFamily;
        }
    }
    applyStyle(currentStyleIndex); // Apply initial style

    setInterval(() => {
        const nextStyleIndex = (currentStyleIndex + 1) % textStyles.length;
        if (textStyles[nextStyleIndex].text.includes('̶')) { // Check if it's the glitch text
            applyStyle(nextStyleIndex);
            setTimeout(() => { // After glitch duration, move to the style *after* glitch
                const afterGlitchIndex = (nextStyleIndex + 1) % textStyles.length;
                applyStyle(afterGlitchIndex);
                currentStyleIndex = afterGlitchIndex;
            }, glitchDuration);
        } else {
            applyStyle(nextStyleIndex);
            currentStyleIndex = nextStyleIndex;
        }
    }, changeInterval);
  }


  /* === Profile Picture Tilt (Scale effect removed) === */
  const profilePic = document.getElementById('profile-picture');
  if (profilePic) {
    let isHovering = false;
    profilePic.addEventListener('mouseenter', () => {
        isHovering = true;
        profilePic.classList.add('hovering');
        // REMOVED SCALING: No initial scale, just prepare for tilt
        profilePic.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });

    profilePic.addEventListener('mousemove', (e) => {
        if (!isHovering) return;
        const rect = profilePic.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        const y = e.clientY - rect.top;  // y position within the element.
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        let normalizedX = (x - centerX) / centerX; // -1 to 1
        let normalizedY = (y - centerY) / centerY; // -1 to 1

        // Clamp values to prevent extreme tilts if mouse moves too fast off element
        normalizedX = Math.max(-1, Math.min(1, normalizedX));
        normalizedY = Math.max(-1, Math.min(1, normalizedY));

        const rotateX = -normalizedY * 20; // Max rotation 20 degrees. Inverted Y for natural feel.
        const rotateY = normalizedX * 20;  // Max rotation 20 degrees.

        // REMOVED SCALING: Apply only rotation
        profilePic.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    profilePic.addEventListener('mouseleave', () => {
        isHovering = false;
        profilePic.classList.remove('hovering');
        // REMOVED SCALING: Reset to no rotation and no scale
        profilePic.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }


  /* ===== MUSIC CONTROLS (Using Tone.Player) ===== */
  const volumeToggleButton = document.getElementById('volume-toggle-button');
  const volumeSlider = document.getElementById('volume-slider');
  let musicPlayer = null;
  let musicVolume = null;
  let isAudioContextStarted = false;
  let previousVolumeBeforeMute = 50; // Default volume if unmuting from 0
  let isMusicPlaying = false;
  let isMusicSetup = false; // Flag to ensure setupMusic runs once
  let hasUserInteracted = false; // Flag for first user gesture

  // --- Function to setup Tone.js Player and Volume ---
  function setupMusic() {
      // Guard conditions: only setup if context is running and not already setup
      if (isMusicSetup || !isAudioContextStarted || (Tone.context && Tone.context.state !== 'running')) {
          console.warn("Conditions not met for setupMusic:", {isMusicSetup, isAudioContextStarted, contextState: Tone.context?.state});
          return;
      }
      isMusicSetup = true;
      console.log("Setting up music player...");
      if(volumeToggleButton) volumeToggleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Loading indicator

      musicVolume = new Tone.Volume(0).toDestination(); // Start with volume 0 (dB -Infinity)

      musicPlayer = new Tone.Player({
          url: "audio/song.mp3", // Ensure this path is correct
          loop: true,
          autostart: false, // We will manually start it
          onload: () => {
              console.log("Music file loaded successfully.");
              if (volumeToggleButton) volumeToggleButton.disabled = false;
              if (volumeSlider) volumeSlider.disabled = false;

              const savedVolumePercent = localStorage.getItem('musicVolumePercent');
              const initialPercent = savedVolumePercent !== null ? parseFloat(savedVolumePercent) : 50;
              if (volumeSlider) volumeSlider.value = initialPercent; // Set slider position
              updateVolume(initialPercent); // Set initial volume and icon

              // Store the initial percent if it's > 0 for unmuting later
              if (initialPercent > 0) {
                  previousVolumeBeforeMute = initialPercent;
              } else {
                  previousVolumeBeforeMute = 50; // Default if starting muted
              }

              // If initial volume is > 0, start playing now that it's loaded
              if (initialPercent > 0) {
                  if (musicPlayer && Tone.context.state === 'running') {
                      musicPlayer.start();
                      isMusicPlaying = true;
                      console.log("Music started after load (initial volume > 0).");
                  } else {
                      console.warn("Music loaded, but couldn't start (context not running or player issue).");
                      updateVolume(0); // Visually mute if can't play
                  }
              } else {
                  console.log("Music loaded, initial volume is 0. Will not auto-play.");
                  updateVolume(0); // Ensure icon is muted
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
      }).connect(musicVolume);
  }

  // --- Update Volume Function (handles dB conversion and icon) ---
  function updateVolume(percentValue) {
    const sliderValue = parseFloat(percentValue);
    // Logarithmic volume scaling (common for audio)
    // 0% = -Infinity dB (mute), 100% = 0 dB (max typical)
    const minDb = -50; // Quite soft
    const maxDb = 0;   // Full volume
    let db = (sliderValue <= 0) ? -Infinity : minDb + (sliderValue / 100) * (maxDb - minDb);

    if (musicVolume) { musicVolume.volume.value = db; }

    if (volumeToggleButton) {
        // Avoid changing icon if it's a spinner (during loading)
        if (volumeToggleButton.innerHTML.includes('fa-spinner')) {
            // Wait for onload to set the correct volume icon
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
    // If user sets volume > 0, update the previousVolumeBeforeMute
    if(sliderValue > 0) { previousVolumeBeforeMute = sliderValue; }
  }

  // --- Combined Initializer for Audio Context and Music Setup ---
  async function initializeAudio() {
      if (hasUserInteracted) return; // Only run once on first interaction
      hasUserInteracted = true;

      console.log("User interaction detected, attempting to start AudioContext...");
      if (volumeToggleButton) volumeToggleButton.disabled = true; // Disable buttons during init
      if (volumeSlider) volumeSlider.disabled = true;

      try {
          await Tone.start(); // Crucial for starting AudioContext in response to gesture
          isAudioContextStarted = true;
          console.log("AudioContext started successfully. State:", Tone.context.state); // ADDED LOG
          // Now that context is started, setup the music player
          setupMusic();
      } catch (e) {
          console.error("Error starting AudioContext:", e);
          if (volumeToggleButton) {
              volumeToggleButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
              volumeToggleButton.disabled = true; // Keep disabled on error
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
          // initializeAudio calls setupMusic which handles player loading and initial play state.
          // The actual play/mute toggle for the *first click* happens within setupMusic's onload
          // based on the initial/saved volume. So, just return here.
          return;
      }

      // 2. Subsequent Clicks: Toggle Play/Mute (only if player is loaded)
      if (!musicPlayer || !musicPlayer.loaded) {
          console.log("Music player not ready yet (still loading or setup failed).");
          return; // Don't toggle if not loaded
      }

      const currentSliderValue = volumeSlider ? parseFloat(volumeSlider.value) : 0;
      if (isMusicPlaying) {
          // Currently playing: Stop and Mute
          musicPlayer.stop();
          isMusicPlaying = false;
          // Save current volume if it was > 0 before muting via toggle
          if (currentSliderValue > 0) { previousVolumeBeforeMute = currentSliderValue; }
          if (volumeSlider) volumeSlider.value = 0;
          updateVolume(0); // This will set icon to mute
          console.log("Music stopped (muted by toggle).");
      } else {
          // Currently stopped/muted: Unmute and Play
          // Restore to previous volume or default if it was 0
          const restoreValue = previousVolumeBeforeMute > 0 ? previousVolumeBeforeMute : 50;
          if (volumeSlider) volumeSlider.value = restoreValue;
          updateVolume(restoreValue); // This sets volume and icon
          if (Tone.context.state === 'running') {
            musicPlayer.start();
            isMusicPlaying = true;
            console.log("Music started (unmuted by toggle).");
          } else {
            console.warn("Cannot start music, AudioContext not running.");
          }
      }
    });
  }

  // --- Volume Slider Logic ---
  if (volumeSlider) {
    volumeSlider.addEventListener('input', async (e) => {
      // 1. Handle FIRST user interaction (starts context, calls setupMusic)
       if (!hasUserInteracted) {
          await initializeAudio();
          // After initializeAudio, setupMusic will be called, and its onload will handle
          // setting the volume based on the slider's *initial* value (from localStorage or default).
          // For this first interaction via slider, we should still update the volume based on the drag.
          updateVolume(e.target.value);
          // We don't need to explicitly start/stop player here for first interaction,
          // as onload in setupMusic will handle initial play based on this new volume.
          return;
      }

      // 2. Subsequent Slider Moves: Update volume and potentially play/stop
      const newVolumePercent = parseFloat(e.target.value);
      updateVolume(newVolumePercent); // Update volume and icon

      if (musicPlayer && musicPlayer.loaded && Tone.context.state === 'running') {
          if (newVolumePercent > 0 && !isMusicPlaying) {
              musicPlayer.start();
              isMusicPlaying = true;
              console.log("Music started via slider unmute.");
          } else if (newVolumePercent <= 0 && isMusicPlaying) {
              musicPlayer.stop();
              isMusicPlaying = false;
              console.log("Music stopped via slider mute.");
          }
      } else if (newVolumePercent > 0 && musicPlayer && musicPlayer.loaded && Tone.context.state !== 'running') {
          console.warn("Slider moved to play, but AudioContext not running.");
      }
    });
  }

  // --- Apply Initial Visual State for Music Controls (before any interaction) ---
  // This runs on page load, setting up icons/slider based on localStorage,
  // but doesn't try to play audio or initialize Tone.js yet.
  if(volumeSlider && volumeToggleButton) {
      const initialVolumePercent = localStorage.getItem('musicVolumePercent') !== null
          ? parseFloat(localStorage.getItem('musicVolumePercent'))
          : 50; // Default to 50%

      // Set initial icon based on stored/default volume
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
      volumeSlider.value = initialVolumePercent; // Ensure slider matches visually

      // Keep controls disabled initially. They will be enabled in setupMusic's onload
      // or if AudioContext fails to start.
      volumeToggleButton.disabled = true;
      volumeSlider.disabled = true;
  }

}); // End DOMContentLoaded
