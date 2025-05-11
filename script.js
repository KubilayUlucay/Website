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
    // Update volume slider appearance on theme change
    if (window.updateVolumeSliderAppearance) {
        window.updateVolumeSliderAppearance();
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
  applyTheme(savedTheme);


  /* ===== ANIMATED CANVAS BACKGROUND ===== */
  const canvas = document.getElementById('background-canvas');
  let ctx;
  let particles = [];
  let animationFrameId;

  const getCssVariable = (variableName) => getComputedStyle(document.body).getPropertyValue(variableName).trim();

  class Particle {
    constructor(x, y, radius, dx, dy) {
      this.x = x; this.y = y; this.radius = radius; this.dx = dx; this.dy = dy;
      this.color = getCssVariable('--particle-color');
    }
    updateColor() { this.color = getCssVariable('--particle-color'); }
    draw() {
      if (!ctx) return;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
    }
    update() {
      if (!canvas) return;
      if (this.x + this.radius > canvas.width || this.x - this.radius < 0) { this.dx = -this.dx; }
      if (this.y + this.radius > canvas.height || this.y - this.radius < 0) { this.dy = -this.dy; }
      this.x += this.dx; this.y += this.dy;
      this.draw();
    }
  }

  function initParticles() { /* ... (no changes in this function) ... */
    if (!canvas || !ctx) return;
    particles = [];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let numParticles = Math.floor((canvas.width * canvas.height) / 15000);
    numParticles = Math.max(20, Math.min(numParticles, 100));
    const initialParticleColor = getCssVariable('--particle-color');
    for (let i = 0; i < numParticles; i++) {
      const radius = Math.random() * 1.5 + 0.5;
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = Math.random() * (canvas.height - radius * 2) + radius;
      const dx = (Math.random() - 0.5) * 0.5;
      const dy = (Math.random() - 0.5) * 0.5;
      const particle = new Particle(x, y, radius, dx, dy);
      particle.color = initialParticleColor;
      particles.push(particle);
    }
  }
  function animateParticles() { /* ... (no changes in this function) ... */
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); }
    animationFrameId = requestAnimationFrame(animateParticles);
    if (!ctx || !canvas) return;
    const bgColor = getCssVariable('--canvas-bg');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
      particle.update();
    });
    connectParticles();
  }
  function connectParticles() { /* ... (no changes in this function) ... */
    if (!ctx || particles.length === 0) return;
    let opacityValue;
    const baseLineColorString = getCssVariable('--particle-line-color');
    const glowColor = getCssVariable('--particle-line-glow-color');
    const glowBlur = parseFloat(getCssVariable('--particle-line-glow-blur')) || 0;

    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const distance = Math.hypot(particles[a].x - particles[b].x, particles[a].y - particles[b].y);
        const maxDistance = 100;
        if (distance < maxDistance) {
          opacityValue = 1 - (distance / maxDistance);
          let finalLineColor;
          if (baseLineColorString.startsWith('rgba')) {
            finalLineColor = baseLineColorString.substring(0, baseLineColorString.lastIndexOf(',')) + `, ${opacityValue.toFixed(2)})`;
          } else if (baseLineColorString.startsWith('rgb')) {
            finalLineColor = baseLineColorString.replace('rgb', 'rgba').replace(')', `, ${opacityValue.toFixed(2)})`);
          } else {
            finalLineColor = baseLineColorString;
          }
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = glowBlur;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.strokeStyle = finalLineColor;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
          ctx.closePath();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
      }
    }
  }
  window.drawCanvasBackground = () => { /* ... (no changes in this function) ... */
    if (!ctx || !canvas) { return; }
    const newParticleColor = getCssVariable('--particle-color');
    particles.forEach(p => p.color = newParticleColor);
    const bgColor = getCssVariable('--canvas-bg');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => p.draw());
    connectParticles();
  };
  window.addEventListener('resize', () => { /* ... (no changes in this function) ... */
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      if (canvas && ctx) {
        initParticles();
        window.drawCanvasBackground();
      }
    }, 100);
  });
  if (canvas) { /* ... (no changes in this function) ... */
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
  if (catElement) { /* ... (no changes to cat logic) ... */
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
  const header = document.querySelector("header"); /* ... (no changes to header logic) ... */
  if (header) {
    window.addEventListener("scroll", () => { if (window.scrollY > 50) { header.classList.add("scrolled"); } else { header.classList.remove("scrolled"); } });
  }
  const mobileMenuButton = document.getElementById("mobile-menu-button"); /* ... (no changes to mobile menu logic) ... */
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", (e) => { e.stopPropagation(); mobileMenu.classList.toggle("hidden"); }); mobileMenu.querySelectorAll("a").forEach(link => { link.addEventListener("click", () => { mobileMenu.classList.add("hidden"); }); }); document.addEventListener('click', (event) => { if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) { mobileMenu.classList.add('hidden'); } });
  }
  const sectionsToReveal = document.querySelectorAll("section"); /* ... (no changes to scroll reveal logic) ... */
  if (sectionsToReveal.length > 0) {
    sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { sec.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out"); } }); const io = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove("opacity-0", "translate-y-5"); entry.target.classList.add("opacity-100", "translate-y-0"); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { io.observe(sec); } });
  }
  const yearElement = document.getElementById("current-year"); /* ... (no changes to footer year logic) ... */
  if (yearElement) { yearElement.textContent = new Date().getFullYear(); }
  const fontChangeTextElement = document.getElementById('font-change-text'); /* ... (no changes to font change logic) ... */
  if (fontChangeTextElement) {
    const styles = [ { text: "Hi All!", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Montserrat', sans-serif" }, { text: "H̶̢̭̓i̸͈̓̂ ̵̥́̊A̴̪̎̒l̴̹̪̆ļ̵̼̊!̶̰̅", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Courier New', monospace" }, { text: "Hi All!", fontFamily: "cursive" }, { text: "Hi All!", fontFamily: "fantasy" }, { text: "Hi All!", fontFamily: "'Honk', system-ui" } ]; let csi = 0; const ci = 750; const gd = 150; function applyStyle(i) { if (i >= 0 && i < styles.length) { fontChangeTextElement.textContent = styles[i].text; fontChangeTextElement.style.fontFamily = styles[i].fontFamily; } } applyStyle(csi); setInterval(() => { const nsi = (csi + 1) % styles.length; if (styles[nsi].text.includes('̶')) { applyStyle(nsi); setTimeout(() => { const agi = (nsi + 1) % styles.length; applyStyle(agi); csi = agi; }, gd); } else { applyStyle(nsi); csi = nsi; } }, ci);
  }

  /* ===== TOGGLEABLE SIDE MUSIC PLAYER (SOUNDCLOUD) ===== */
  const openPlayerBtn = document.getElementById('open-player-btn');
  const closePlayerBtn = document.getElementById('close-player-btn');
  const playerPanel = document.getElementById('side-music-player-panel');
  const soundcloudIframe = document.getElementById('soundcloud-iframe-player');
  // NEW: Volume control elements
  const volumeSlider = document.getElementById('volume-slider');
  const muteToggleButton = document.getElementById('mute-toggle-btn');
  let scWidget = null; // To store the SoundCloud widget instance
  let isMuted = false;
  let lastVolume = 50; // Default volume / volume before mute

  // Function to update the visual progress of the volume slider
  window.updateVolumeSliderAppearance = () => {
    if (!volumeSlider) return;
    const progressPercent = volumeSlider.value;
    const progressColor = getCssVariable('--volume-slider-progress-bg');
    const trackColor = getCssVariable('--volume-slider-track-bg');
    volumeSlider.style.background = `linear-gradient(to right, ${progressColor} ${progressPercent}%, ${trackColor} ${progressPercent}%)`;
  };


  if (soundcloudIframe) {
    scWidget = SC.Widget(soundcloudIframe); // Initialize the widget

    scWidget.bind(SC.Widget.Events.READY, () => {
      console.log('SoundCloud Widget is ready.');
      // Attempt to load saved volume or set a default
      const savedVolume = localStorage.getItem('soundcloudVolume');
      if (savedVolume !== null) {
        lastVolume = parseInt(savedVolume, 10);
        scWidget.setVolume(lastVolume);
        if (volumeSlider) volumeSlider.value = lastVolume;
      } else {
        scWidget.setVolume(lastVolume); // Default 50
        if (volumeSlider) volumeSlider.value = lastVolume;
      }
      window.updateVolumeSliderAppearance(); // Initial appearance update

      // Check if muted state was saved
      const savedMuteState = localStorage.getItem('soundcloudMuted');
      if (savedMuteState === 'true') {
          isMuted = true;
          scWidget.setVolume(0); // Mute by setting volume to 0 via API
          if (muteToggleButton) muteToggleButton.innerHTML = '<i class="fas fa-volume-mute text-[var(--text-color-secondary)]"></i>';
          if (volumeSlider) volumeSlider.value = 0; // Visually set slider to 0 when muted
      } else {
          isMuted = false;
          // Volume already set above
          if (muteToggleButton) muteToggleButton.innerHTML = '<i class="fas fa-volume-up text-[var(--text-color-secondary)]"></i>';
      }
      window.updateVolumeSliderAppearance();


      // Optional: Get current volume from player if needed (e.g. if player has its own UI)
      // scWidget.getVolume((volume) => {
      //   console.log('Initial player volume:', volume);
      //   if (volumeSlider && !savedVolume) volumeSlider.value = volume;
      //   lastVolume = volume;
      //   window.updateVolumeSliderAppearance();
      // });
    });

    // Error handling for the widget
    scWidget.bind(SC.Widget.Events.ERROR, (error) => {
        console.error("SoundCloud Widget Error:", error);
    });
  }


  if (volumeSlider && scWidget) {
    volumeSlider.addEventListener('input', () => {
      const newVolume = parseInt(volumeSlider.value, 10);
      scWidget.setVolume(newVolume);
      lastVolume = newVolume; // Update last known volume
      isMuted = newVolume === 0; // If volume is 0, consider it muted
      localStorage.setItem('soundcloudVolume', newVolume.toString());
      if (muteToggleButton) {
        muteToggleButton.innerHTML = isMuted ? '<i class="fas fa-volume-mute text-[var(--text-color-secondary)]"></i>' : '<i class="fas fa-volume-up text-[var(--text-color-secondary)]"></i>';
      }
      localStorage.setItem('soundcloudMuted', isMuted.toString());
      window.updateVolumeSliderAppearance();
    });
  }

  if (muteToggleButton && scWidget) {
    muteToggleButton.addEventListener('click', () => {
      isMuted = !isMuted;
      if (isMuted) {
        scWidget.getVolume((currentVolume) => { // Get current volume before muting
            if (currentVolume > 0) lastVolume = currentVolume; // Store it only if it wasn't already 0
            scWidget.setVolume(0); // Mute by setting volume to 0
            if (volumeSlider) volumeSlider.value = 0; // Also set slider to 0
            muteToggleButton.innerHTML = '<i class="fas fa-volume-mute text-[var(--text-color-secondary)]"></i>';
        });
      } else {
        scWidget.setVolume(lastVolume > 0 ? lastVolume : 50); // Unmute to last volume or default 50 if last was 0
        if (volumeSlider) volumeSlider.value = lastVolume > 0 ? lastVolume : 50;
        muteToggleButton.innerHTML = '<i class="fas fa-volume-up text-[var(--text-color-secondary)]"></i>';
      }
      localStorage.setItem('soundcloudMuted', isMuted.toString());
      if (!isMuted) localStorage.setItem('soundcloudVolume', volumeSlider.value); // Save current volume if unmuting
      window.updateVolumeSliderAppearance();
    });
  }


  if (openPlayerBtn && playerPanel) {
    openPlayerBtn.addEventListener('click', () => {
      playerPanel.classList.remove('translate-x-full');
      openPlayerBtn.classList.add('hidden');
      // When panel opens, ensure slider reflects current state
      if (scWidget && volumeSlider) {
        scWidget.getVolume((currentVolume) => {
            if (isMuted) {
                volumeSlider.value = 0;
            } else {
                volumeSlider.value = currentVolume;
                lastVolume = currentVolume;
            }
            window.updateVolumeSliderAppearance();
        });
      }
    });
  }

  const closeMusicPanel = () => {
    if (!playerPanel || playerPanel.classList.contains('translate-x-full')) {
      return;
    }
    playerPanel.classList.add('translate-x-full');
    setTimeout(() => {
      if (playerPanel.classList.contains('translate-x-full')) {
        openPlayerBtn.classList.remove('hidden');
      }
    }, 300);
  };

  if (closePlayerBtn && playerPanel) {
    closePlayerBtn.addEventListener('click', closeMusicPanel);
  }

  document.addEventListener('click', function(event) {
    if (playerPanel && !playerPanel.classList.contains('translate-x-full') &&
        !playerPanel.contains(event.target) &&
        !openPlayerBtn.contains(event.target)) {
      closeMusicPanel();
    }
  });
  // Initial call to set slider gradient based on default value
  window.updateVolumeSliderAppearance();
}); // End DOMContentLoaded
