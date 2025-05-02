document.addEventListener("DOMContentLoaded", () => {

  /* ===== THEME TOGGLE ===== */
  const themeToggleButton = document.getElementById('theme-toggle');
  const body = document.body;
  const sunIcon = '<i class="fas fa-sun"></i>'; // Font Awesome sun icon
  const moonIcon = '<i class="fas fa-moon"></i>'; // Font Awesome moon icon

  // --- Cat Image Variables (will be updated by theme) ---
  let catIdleFrame = '';
  let catWalkFrames = [];
  const catElement = document.getElementById("chasing-cat-img"); // Get cat element once

  // --- Function to update cat images based on theme ---
  const updateCatImages = (theme) => {
    if (theme === 'dark') {
      // Use white cat for dark theme
      catIdleFrame = "images/white-cat-1.png"; // Assuming white-cat-3 is idle
      catWalkFrames = [
        "images/white-cat-4.png",
        "images/white-cat-5.png", "images/white-cat-6.png", "images/white-cat-7.png",
        "images/white-cat-8.png", "images/white-cat-9.png", "images/white-cat-10.png"
      ];
    } else {
      // Use black cat for light theme
      catIdleFrame = "images/cat-v1.png"; // Assuming cat-v3 is idle for black cat
      catWalkFrames = [
        "images/cat-v2.png", "images/cat-v4.png",
        "images/cat-v5.png", "images/cat-v6.png", "images/cat-v7.png",
        "images/cat-v8.png", "images/cat-v9.png", "images/cat-v10.png"
      ];
    }

    // If the cat element exists and is currently visible (or just loaded), update its src
    if (catElement && catElement.style.opacity !== "0") {
        const currentSrcFilename = catElement.src.split('/').pop();
        const newIdleFilename = catIdleFrame.split('/').pop();
        if (currentSrcFilename !== newIdleFilename) {
             catElement.src = catIdleFrame;
        }
    }
    // console.log(`Cat images updated for ${theme} theme. Idle: ${catIdleFrame}`);
  };


  // Function to apply the theme
  const applyTheme = (theme) => {
    // console.log(`Applying theme: ${theme}`);
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      if (themeToggleButton) themeToggleButton.innerHTML = sunIcon;
    } else {
      body.classList.remove('dark-theme');
      if (themeToggleButton) themeToggleButton.innerHTML = moonIcon;
    }
    updateCatImages(theme); // Update cat images based on the new theme
    if (window.drawCanvasBackground) {
        setTimeout(window.drawCanvasBackground, 0); // Redraw canvas
    }
  };

  // Function to toggle the theme
  const toggleTheme = () => {
    const currentTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
  };

  // Add event listener(s) to button(s)
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleTheme);
  }

  // Check local storage on load - Apply theme *before* initializing canvas AND cat
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    if (themeToggleButton) themeToggleButton.innerHTML = sunIcon;
  } else {
    if (themeToggleButton) themeToggleButton.innerHTML = moonIcon;
  }
  updateCatImages(savedTheme); // Set initial cat images


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
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color; ctx.fill(); ctx.closePath();
    }
    update() {
      if (!canvas) return;
      if (this.x + this.radius > canvas.width || this.x - this.radius < 0) { this.dx = -this.dx; }
      if (this.y + this.radius > canvas.height || this.y - this.radius < 0) { this.dy = -this.dy; }
      this.x += this.dx; this.y += this.dy; this.draw();
    }
  }

  function initParticles() {
    if (!canvas || !ctx) return;
    particles = []; canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let numberOfParticles = Math.floor((canvas.width * canvas.height) / 15000);
    numberOfParticles = Math.max(20, Math.min(numberOfParticles, 100));
    const currentParticleColor = getCssVariable('--particle-color');
    for (let i = 0; i < numberOfParticles; i++) {
      const radius = Math.random() * 1.5 + 0.5;
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      const y = Math.random() * (canvas.height - radius * 2) + radius;
      const dx = (Math.random() - 0.5) * 0.5; const dy = (Math.random() - 0.5) * 0.5;
      const newParticle = new Particle(x, y, radius, dx, dy);
      newParticle.color = currentParticleColor; particles.push(newParticle);
    }
  }

  function animateParticles() {
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); }
    animationFrameId = requestAnimationFrame(animateParticles);
    if (!ctx || !canvas) return;
    const bgColor = getCssVariable('--canvas-bg');
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => { particle.update(); });
    connectParticles();
  }

  function connectParticles() {
      if (!ctx || particles.length === 0) return;
      let opacityValue = 0.2; const lineColorBase = getCssVariable('--particle-color');
      for (let a = 0; a < particles.length; a++) {
          for (let b = a + 1; b < particles.length; b++) {
              const distance = Math.hypot(particles[a].x - particles[b].x, particles[a].y - particles[b].y);
              const maxDistance = 100;
              if (distance < maxDistance) {
                  opacityValue = 1 - (distance / maxDistance);
                  const rgbaColor = lineColorBase.replace(')', `, ${opacityValue.toFixed(2)})`).replace('rgb(', 'rgba(');
                  ctx.strokeStyle = rgbaColor; ctx.lineWidth = 0.5;
                  ctx.beginPath(); ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y);
                  ctx.stroke(); ctx.closePath();
              }
          }
      }
  }

  window.drawCanvasBackground = () => {
      if (!ctx || !canvas) { return; }
      const newParticleColor = getCssVariable('--particle-color');
      particles.forEach(particle => particle.color = newParticleColor);
      const bgColor = getCssVariable('--canvas-bg');
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => particle.draw()); connectParticles();
  };

  window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        if (canvas && ctx) { initParticles(); window.drawCanvasBackground(); }
    }, 100);
  });

  if (canvas) {
      ctx = canvas.getContext('2d');
      if (ctx) { initParticles(); animateParticles(); }
      else { console.error("Failed to get 2D context for canvas."); }
  } else { console.log("Background canvas not found."); }


  /* --- Cat Following Mouse --- */
  if (catElement) {
    let mouseX = window.innerWidth / 2; let mouseY = window.innerHeight / 2;
    let catX = mouseX, catY = mouseY;
    const speed = 0.08; const followDelay = 100;
    let followTimeout = null; let scaleX = 1; let animating = false;
    let walkIndex = 0, lastFrameTime = 0, frameInterval = 100;

    function loop(currentTime) {
      if (!animating || catWalkFrames.length === 0) return;
      const dxMouse = mouseX - catX;
      if (Math.abs(dxMouse) > 2) { scaleX = dxMouse > 0 ? 1 : -1; }
      const targetX = mouseX - scaleX * (catElement.offsetWidth / 2);
      const targetY = mouseY - (catElement.offsetHeight / 2);
      const dx = targetX - catX; const dy = targetY - catY;
      const dist = Math.hypot(dx, dy); const moving = dist > 5;
      if (dist > 1) { catX += dx * speed; catY += dy * speed; }
      catElement.style.transform = `translate(${catX.toFixed(2)}px, ${catY.toFixed(2)}px) scaleX(${scaleX})`;
      if (moving) {
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
      if (animating) return; animating = true; catElement.style.opacity = "0.9";
      catElement.src = catIdleFrame; lastFrameTime = performance.now();
      requestAnimationFrame(loop);
    }
    function stopFollowing() {
      animating = false; catElement.style.opacity = "0";
      if (followTimeout) { clearTimeout(followTimeout); }
    }
    document.addEventListener("mousemove", e => {
      mouseX = e.clientX; mouseY = e.clientY;
      if (!animating) { if (followTimeout) clearTimeout(followTimeout); followTimeout = setTimeout(startFollowing, followDelay); }
    });
    document.addEventListener("mouseleave", stopFollowing);
    document.addEventListener("mouseenter", e => { mouseX = e.clientX; mouseY = e.clientY; });
    catElement.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
  } // end if(catElement)


  /* --- Header Blur on Scroll --- */
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) { header.classList.add("scrolled"); }
      else { header.classList.remove("scrolled"); }
    });
  }


  /* --- Mobile Menu Toggle --- */
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", (e) => { e.stopPropagation(); mobileMenu.classList.toggle("hidden"); });
    mobileMenu.querySelectorAll("a").forEach(link => { link.addEventListener("click", () => { mobileMenu.classList.add("hidden"); }); });
    document.addEventListener('click', (event) => {
        if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
            mobileMenu.classList.add('hidden');
        }
    });
  }


  /* --- Scroll Reveal Sections --- */
  const sectionsToReveal = document.querySelectorAll("section");
  if (sectionsToReveal.length > 0) {
      sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { sec.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out"); } });
      const intersectionObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  entry.target.classList.remove("opacity-0", "translate-y-5"); entry.target.classList.add("opacity-100", "translate-y-0");
                  observer.unobserve(entry.target);
              }
          });
      }, { threshold: 0.1 });
      sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { intersectionObserver.observe(sec); } });
  }


  /* --- Footer Year --- */
  const yearEl = document.getElementById("current-year");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }


  /* --- Hi All! Font Changing Animation --- */
  const fontText = document.getElementById('font-change-text');
  if (fontText) {
    // FIX: Removed the duplicate placeholder comment line that caused the error.
    // const styles = [ /* ... styles array ... */ ]; // <<< THIS LINE WAS REMOVED

    // This is the correct declaration
    const styles = [
      { text: "Hi All!", fontFamily: "'Rubik', sans-serif" },
      { text: "Hi All!", fontFamily: "'Montserrat', sans-serif" },
      { text: "H̶̢̭̓i̸͈̓̂ ̵̥́̊A̴̪̎̒l̴̹̪̆ļ̵̼̊!̶̰̅", fontFamily: "'Rubik', sans-serif" }, // Glitch style
      { text: "Hi All!", fontFamily: "'Courier New', monospace" },
      { text: "Hi All!", fontFamily: "cursive" },
      { text: "Hi All!", fontFamily: "fantasy" },
      { text: "Hi All!", fontFamily: "'Honk', system-ui" } // Honk font
    ];
    let currentStyleIndex = 0;
    const changeInterval = 750;
    const glitchDuration = 150;

    function applyStyle(index) {
      if (index >= 0 && index < styles.length) {
          fontText.textContent = styles[index].text;
          fontText.style.fontFamily = styles[index].fontFamily;
      }
    }
    applyStyle(currentStyleIndex); // Apply initial style
    setInterval(() => {
        const nextStyleIndex = (currentStyleIndex + 1) % styles.length;
        if (styles[nextStyleIndex].text.includes('̶')) { // Check if glitch
            applyStyle(nextStyleIndex);
            setTimeout(() => {
                const afterGlitchIndex = (nextStyleIndex + 1) % styles.length;
                applyStyle(afterGlitchIndex);
                currentStyleIndex = afterGlitchIndex;
            }, glitchDuration);
        } else { // Normal style change
            applyStyle(nextStyleIndex);
            currentStyleIndex = nextStyleIndex;
        }
    }, changeInterval);
  } // end if(fontText)


  /* === Profile Picture Zoom and Tilt === */
  const profilePic = document.getElementById('profile-picture');
  if (profilePic) {
      let isHovering = false;
       profilePic.addEventListener('mouseenter', () => {
          isHovering = true; profilePic.classList.add('hovering');
          profilePic.style.transform = 'scale(1.2) rotateX(0deg) rotateY(0deg)';
      });
       profilePic.addEventListener('mousemove', (e) => {
          if (!isHovering) return;
          const rect = profilePic.getBoundingClientRect();
          const x = e.clientX - rect.left; const y = e.clientY - rect.top;
          const centerX = rect.width / 2; const centerY = rect.height / 2;
          let normalizedX = (x - centerX) / centerX; let normalizedY = (y - centerY) / centerY;
          normalizedX = Math.max(-1, Math.min(1, normalizedX)); normalizedY = Math.max(-1, Math.min(1, normalizedY));
          const rotateX = -normalizedY * 30; const rotateY = normalizedX * 30;
          profilePic.style.transform = `scale(1.5) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
       profilePic.addEventListener('mouseleave', () => {
          isHovering = false; profilePic.classList.remove('hovering');
          profilePic.style.transform = 'scale(1) rotateX(0deg) rotateY(0deg)';
      });
  }
  /* === End of Profile Picture Code === */

}); // End DOMContentLoaded
