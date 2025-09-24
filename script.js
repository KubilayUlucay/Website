document.addEventListener("DOMContentLoaded", () => {

  /* ===== DİL DEĞİŞTİRME SİSTEMİ ===== */
  const langGbBtn = document.getElementById('lang-gb-btn');
  const langTrBtn = document.getElementById('lang-tr-btn');
  
  const setLanguage = (lang) => {
    // Tüm çevrilecek elementleri bul
    const elementsToTranslate = document.querySelectorAll('[data-lang-en], [data-lang-tr]');
    
    elementsToTranslate.forEach(el => {
        const text = el.getAttribute(`data-lang-${lang}`);
        if(text) el.innerHTML = text; // innerHTML kullanmak span gibi etiketleri korur
    });

    // Aktif butonu ayarla
    if(lang === 'tr') {
        langTrBtn.classList.add('active');
        langGbBtn.classList.remove('active');
    } else {
        langGbBtn.classList.add('active');
        langTrBtn.classList.remove('active');
    }
    
    // Seçimi hafızaya kaydet
    localStorage.setItem('language', lang);
  };

  if(langGbBtn && langTrBtn) {
    langGbBtn.addEventListener('click', () => setLanguage('en'));
    langTrBtn.addEventListener('click', () => setLanguage('tr'));
  }

  // Sayfa yüklendiğinde hafızadaki dili veya varsayılanı uygula
  const savedLang = localStorage.getItem('language') || 'en'; // Varsayılan İngilizce
  setLanguage(savedLang);


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

  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  /* ===== ANIMATED CANVAS BACKGROUND (No changes here, keeping it concise) ===== */
  const canvas = document.getElementById('background-canvas');
  let ctx;
  let particles = [];
  let animationFrameId;
  const getCssVariable = (variableName) => getComputedStyle(document.body).getPropertyValue(variableName).trim();
  class Particle { /* ... Particle class definition ... */
    constructor(x, y, radius, dx, dy) { this.x = x; this.y = y; this.radius = radius; this.dx = dx; this.dy = dy; this.color = getCssVariable('--particle-color');}
    updateColor() { this.color = getCssVariable('--particle-color'); }
    draw() { if (!ctx) return; ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill(); ctx.closePath();}
    update() { if (!canvas) return; if (this.x + this.radius > canvas.width || this.x - this.radius < 0) { this.dx = -this.dx; } if (this.y + this.radius > canvas.height || this.y - this.radius < 0) { this.dy = -this.dy; } this.x += this.dx; this.y += this.dy; this.draw();}
  }
  function initParticles() { /* ... initParticles ... */
    if (!canvas || !ctx) return; particles = []; canvas.width = window.innerWidth; canvas.height = window.innerHeight; let n = Math.floor((canvas.width * canvas.height) / 15000); n = Math.max(20, Math.min(n, 100)); const c = getCssVariable('--particle-color'); for (let i = 0; i < n; i++) { const r = Math.random() * 1.5 + 0.5; const x = Math.random() * (canvas.width - r * 2) + r; const y = Math.random() * (canvas.height - r * 2) + r; const dx = (Math.random() - 0.5) * 0.5; const dy = (Math.random() - 0.5) * 0.5; const p = new Particle(x, y, r, dx, dy); p.color = c; particles.push(p); }
  }
  function animateParticles() { /* ... animateParticles ... */
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); } animationFrameId = requestAnimationFrame(animateParticles); if (!ctx || !canvas) return; const bg = getCssVariable('--canvas-bg'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.update(); }); connectParticles();
  }
  function connectParticles() { /* ... connectParticles ... */
    if (!ctx || particles.length === 0) return; let o; const lc = getCssVariable('--particle-line-color'); const gc = getCssVariable('--particle-line-glow-color'); const gb = parseFloat(getCssVariable('--particle-line-glow-blur')) || 0; for (let a = 0; a < particles.length; a++) { for (let b = a + 1; b < particles.length; b++) { const d = Math.hypot(particles[a].x - particles[b].x, particles[a].y - particles[b].y); const md = 100; if (d < md) { o = 1 - (d / md); let flc; if (lc.startsWith('rgba')) { flc = lc.substring(0, lc.lastIndexOf(',')) + `, ${o.toFixed(2)})`; } else if (lc.startsWith('rgb')) { flc = lc.replace('rgb', 'rgba').replace(')', `, ${o.toFixed(2)})`); } else { flc = lc; } ctx.shadowColor = gc; ctx.shadowBlur = gb; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.strokeStyle = flc; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particles[a].x, particles[a].y); ctx.lineTo(particles[b].x, particles[b].y); ctx.stroke(); ctx.closePath(); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; } } }
  }
  window.drawCanvasBackground = () => { /* ... drawCanvasBackground ... */
    if (!ctx || !canvas) { return; } const npc = getCssVariable('--particle-color'); particles.forEach(p => p.color = npc); const bg = getCssVariable('--canvas-bg'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height); particles.forEach(p => p.draw()); connectParticles();
  };
  window.addEventListener('resize', () => { /* ... resize event ... */
    clearTimeout(window.resizeTimeout); window.resizeTimeout = setTimeout(() => { if (canvas && ctx) { initParticles(); window.drawCanvasBackground(); } }, 100);
  });
  if (canvas) { /* ... canvas init ... */
    ctx = canvas.getContext('2d'); if (ctx) { initParticles(); animateParticles(); } else { console.error("Failed to get 2D context for background canvas."); }
  } else { console.log("Background canvas element not found."); }

  /* ===== CAT FOLLOWING MOUSE (GÜNCELLENDİ)===== */
  if (catElement) { 
    const profilePicForCat = document.getElementById('profile-picture');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let catX = mouseX, catY = mouseY;
    const speed = 0.08;
    const followDelay = 100;
    let followTimeout = null;
    let scaleX = 1;
    let animating = false;
    let walkIndex = 0, lastFrameTime = 0, frameInterval = 100;

    let questPanelOpenedOnce = localStorage.getItem('questPanelOpenedOnce') === 'true';

    let isHinting = false;
    let hintTimeout = null;
    const thoughtBubble = document.createElement('div');
    thoughtBubble.innerHTML = '💡';
    Object.assign(thoughtBubble.style, {
        position: 'fixed',
        fontSize: '24px',
        opacity: '0',
        transition: 'opacity 0.3s, transform 0.3s',
        transform: 'translate(-50%, -100%) scale(0.5)',
        pointerEvents: 'none',
        zIndex: '51'
    });
    document.body.appendChild(thoughtBubble);

    const triggerHint = () => {
        if (!animating || isHinting || !profilePicForCat || questPanelOpenedOnce) return;
        
        isHinting = true;
        
        thoughtBubble.style.opacity = '1';
        thoughtBubble.style.transform = 'translate(-50%, -100%) scale(1)';

        if(hintTimeout) clearTimeout(hintTimeout);
        hintTimeout = setTimeout(() => {
            isHinting = false;
            thoughtBubble.style.opacity = '0';
            thoughtBubble.style.transform = 'translate(-50%, -100%) scale(0.5)';
        }, 3000); 
    };

    setInterval(triggerHint, 20000); 

    function loop(currentTime) {
        if (!animating || catWalkFrames.length === 0) return;

        let targetX, targetY;
        let isMoving = false;

        if (isHinting && profilePicForCat) {
            const picRect = profilePicForCat.getBoundingClientRect();
            // DÜZELTME: Hedef, fotoğrafın üstü değil yanı
            targetX = picRect.right + 30; 
            targetY = picRect.top + picRect.height / 2;

            const dx_hint = targetX - catX;
            scaleX = dx_hint > 0 ? 1 : -1;
            isMoving = Math.abs(dx_hint) > 5;

            thoughtBubble.style.left = `${catX + (catElement.offsetWidth / 2)}px`;
            thoughtBubble.style.top = `${catY}px`;
            
            const distance_hint = Math.hypot(dx_hint, targetY - catY);
            if (distance_hint > 20) {
                catX += dx_hint * speed * 0.5;
                catY += (targetY - catY) * speed * 0.5;
            }

        } else {
            // Normal takip mantığı...
            const deltaMouseX = mouseX - catX;
            if ((scaleX === 1 && deltaMouseX < -catElement.offsetWidth / 3) || (scaleX === -1 && deltaMouseX > catElement.offsetWidth / 3)) {
                scaleX *= -1;
            }
            
            const catBodyWidth = catElement.offsetWidth;
            const spaceMultiplier = 0.3;
            let desiredSpace = (catBodyWidth * spaceMultiplier);
            if (scaleX === 1) { desiredSpace -= 10; } 
            else { desiredSpace = (catBodyWidth * spaceMultiplier) + 40; }

            if (scaleX === 1) { targetX = mouseX - catBodyWidth - desiredSpace; } 
            else { targetX = mouseX + 70 - desiredSpace; }
            targetY = mouseY - (catElement.offsetHeight / 2);
            
            const dx = targetX - catX;
            const dy = targetY - catY;
            const distance = Math.hypot(dx, dy);
            isMoving = distance > 5;

            if (distance > 1) {
                catX += dx * speed;
                catY += dy * speed;
            }
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

    function startFollowing() { if (animating) return; animating = true; catElement.style.opacity = "0.9"; catElement.src = catIdleFrame; lastFrameTime = performance.now(); requestAnimationFrame(loop); }
    function stopFollowing() { animating = false; catElement.style.opacity = "0"; }
    document.addEventListener("mousemove", e => { mouseX = e.clientX; mouseY = e.clientY; if (!animating) { if (followTimeout) clearTimeout(followTimeout); followTimeout = setTimeout(startFollowing, followDelay); } });
    document.addEventListener("mouseleave", stopFollowing); document.addEventListener("mouseenter", e => { mouseX = e.clientX; mouseY = e.clientY; }); catElement.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
  }

  /* --- Header, Mobile Menu, Scroll Reveal, Footer Year, Font Change (No changes here) --- */
  const header = document.querySelector("header"); if (header) { window.addEventListener("scroll", () => { if (window.scrollY > 50) { header.classList.add("scrolled"); } else { header.classList.remove("scrolled"); } });}
  const mobileMenuButton = document.getElementById("mobile-menu-button"); const mobileMenu = document.getElementById("mobile-menu"); if (mobileMenuButton && mobileMenu) { mobileMenuButton.addEventListener("click", (e) => { e.stopPropagation(); mobileMenu.classList.toggle("hidden"); }); mobileMenu.querySelectorAll("a").forEach(link => { link.addEventListener("click", () => { mobileMenu.classList.add("hidden"); }); }); document.addEventListener('click', (event) => { if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) { mobileMenu.classList.add('hidden'); } });}
  const sectionsToReveal = document.querySelectorAll("section"); if (sectionsToReveal.length > 0) { sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { sec.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out"); } }); const io = new IntersectionObserver((entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove("opacity-0", "translate-y-5"); entry.target.classList.add("opacity-100", "translate-y-0"); observer.unobserve(entry.target); } }); }, { threshold: 0.1 }); sectionsToReveal.forEach(sec => { if (sec.id !== "hero") { io.observe(sec); } });}
  
  const setYear = () => {
    const yearElement = document.getElementById("current-year-en") || document.getElementById("current-year-tr") || document.getElementById("current-year");
    if(yearElement) yearElement.textContent = new Date().getFullYear();
  }
  setYear(); // Sayfa yüklenince yılı ayarla
  
  
  const fontChangeTextElement = document.getElementById('font-change-text'); if (fontChangeTextElement) { const styles = [ { text: "Hi All!", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Montserrat', sans-serif" }, { text: "H̶̢̭̓i̸͈̓̂ ̵̥́̊A̴̪̎̒l̴̹̪̆ļ̵̼̊!̶̰̅", fontFamily: "'Rubik', sans-serif" }, { text: "Hi All!", fontFamily: "'Courier New', monospace" }, { text: "Hi All!", fontFamily: "cursive" }, { text: "Hi All!", fontFamily: "fantasy" }, { text: "Hi All!", fontFamily: "'Honk', system-ui" } ]; let csi = 0; const ci = 750; const gd = 150; function applyStyle(i) { if (i >= 0 && i < styles.length) { fontChangeTextElement.textContent = styles[i].text; fontChangeTextElement.style.fontFamily = styles[i].fontFamily; } } applyStyle(csi); setInterval(() => { const nsi = (csi + 1) % styles.length; if (styles[nsi].text.includes('̶')) { applyStyle(nsi); setTimeout(() => { const agi = (nsi + 1) % styles.length; applyStyle(agi); csi = agi; }, gd); } else { applyStyle(nsi); csi = nsi; } }, ci);}


  /* ===== TOGGLEABLE SIDE MUSIC PLAYER (SOUNDCLOUD) ===== */
  const openPlayerBtn = document.getElementById('open-player-btn');
  const closePlayerBtn = document.getElementById('close-player-btn');
  const playerPanel = document.getElementById('side-music-player-panel');
  const soundcloudIframe = document.getElementById('soundcloud-iframe-player');
  const volumeSlider = document.getElementById('volume-slider');
  const muteToggleButton = document.getElementById('mute-toggle-btn');
  let scWidget = null;
  let isMuted = false;
  let lastVolume = 50; 
  let currentTrackURI = null;
  let currentTrackTime = 0;
  let isCurrentlyPlaying = false; 

  window.updateVolumeSliderAppearance = () => {
    if (!volumeSlider) return;
    const progressPercent = volumeSlider.value;
    const progressColor = getCssVariable('--volume-slider-progress-bg');
    const trackColor = getCssVariable('--volume-slider-track-bg');
    volumeSlider.style.background = `linear-gradient(to right, ${progressColor} ${progressPercent}%, ${trackColor} ${progressPercent}%)`;
  };

  if (soundcloudIframe && typeof SC !== 'undefined') { 
    scWidget = SC.Widget(soundcloudIframe);
    scWidget.bind(SC.Widget.Events.READY, () => {
      const savedVolume = localStorage.getItem('soundcloudVolume');
      if (savedVolume !== null) { lastVolume = parseInt(savedVolume, 10); scWidget.setVolume(lastVolume); if (volumeSlider) volumeSlider.value = lastVolume; } 
      else { scWidget.setVolume(lastVolume); if (volumeSlider) volumeSlider.value = lastVolume; }
      const savedMuteState = localStorage.getItem('soundcloudMuted');
      if (savedMuteState === 'true') { isMuted = true; scWidget.setVolume(0); if (muteToggleButton) muteToggleButton.innerHTML = '<i class="fas fa-volume-mute text-[var(--text-color-secondary)]"></i>'; if (volumeSlider) volumeSlider.value = 0; } 
      else { isMuted = false; if (muteToggleButton) muteToggleButton.innerHTML = '<i class="fas fa-volume-up text-[var(--text-color-secondary)]"></i>'; }
      window.updateVolumeSliderAppearance();
      scWidget.bind(SC.Widget.Events.PLAY, (eventData) => { isCurrentlyPlaying = true; if (eventData && eventData.currentSound && eventData.currentSound.uri) { currentTrackURI = eventData.currentSound.uri; } scWidget.getPosition(position => { currentTrackTime = position; }); });
      scWidget.bind(SC.Widget.Events.PAUSE, () => { isCurrentlyPlaying = false; scWidget.getPosition(position => { currentTrackTime = position; }); });
      scWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (eventData) => { if (eventData && typeof eventData.currentPosition === 'number') { currentTrackTime = eventData.currentPosition; } if (eventData && eventData.currentSound && eventData.currentSound.uri && eventData.currentSound.uri !== currentTrackURI) { currentTrackURI = eventData.currentSound.uri; } });
    });
    scWidget.bind(SC.Widget.Events.ERROR, (error) => { console.error("SoundCloud Widget Error on index.html:", error); });
  }

  if (volumeSlider && scWidget) {
    volumeSlider.addEventListener('input', () => {
      const newVolume = parseInt(volumeSlider.value, 10); scWidget.setVolume(newVolume); lastVolume = newVolume; isMuted = newVolume === 0; localStorage.setItem('soundcloudVolume', newVolume.toString());
      if (muteToggleButton) { muteToggleButton.innerHTML = isMuted ? '<i class="fas fa-volume-mute text-[var(--text-color-secondary)]"></i>' : '<i class="fas fa-volume-up text-[var(--text-color-secondary)]"></i>'; }
      localStorage.setItem('soundcloudMuted', isMuted.toString()); window.updateVolumeSliderAppearance();
    });
  }

  if (muteToggleButton && scWidget) {
    muteToggleButton.addEventListener('click', () => {
      isMuted = !isMuted;
      if (isMuted) { scWidget.getVolume((currentVolume) => { if (currentVolume > 0) lastVolume = currentVolume; scWidget.setVolume(0); if (volumeSlider) volumeSlider.value = 0; muteToggleButton.innerHTML = '<i class="fas fa-volume-mute text-[var(--text-color-secondary)]"></i>'; }); } 
      else { const restoreVolume = lastVolume > 0 ? lastVolume : 50; scWidget.setVolume(restoreVolume); if (volumeSlider) volumeSlider.value = restoreVolume; muteToggleButton.innerHTML = '<i class="fas fa-volume-up text-[var(--text-color-secondary)]"></i>'; }
      localStorage.setItem('soundcloudMuted', isMuted.toString()); if (!isMuted) localStorage.setItem('soundcloudVolume', volumeSlider.value); window.updateVolumeSliderAppearance();
    });
  }

  function saveMusicStateToLocalStorage() {
    if (scWidget) {
        scWidget.getVolume(vol => { localStorage.setItem('soundcloudVolume', vol.toString()); }); localStorage.setItem('soundcloudMuted', isMuted.toString());
        if (currentTrackURI) { localStorage.setItem('soundcloudTrackURI', currentTrackURI); scWidget.getPosition(position => { localStorage.setItem('soundcloudTrackTime', position.toString()); localStorage.setItem('soundcloudIsPlaying', isCurrentlyPlaying.toString()); }); } 
        else { localStorage.removeItem('soundcloudTrackURI'); localStorage.removeItem('soundcloudTrackTime'); localStorage.removeItem('soundcloudIsPlaying'); }
    }
  }

  document.querySelectorAll('a[href^="project-"], a[href^="BMS.html"]').forEach(link => { link.addEventListener('click', () => { if (link.hostname === window.location.hostname && link.pathname.endsWith('.html')) { saveMusicStateToLocalStorage(); } }); });
  window.addEventListener('pagehide', saveMusicStateToLocalStorage);

  if (openPlayerBtn && playerPanel) {
    openPlayerBtn.addEventListener('click', () => {
        playerPanel.classList.remove('translate-x-full'); openPlayerBtn.classList.add('hidden');
        if(window.completeQuest) window.completeQuest(3);
        if (scWidget && volumeSlider) { scWidget.getVolume((currentVolume) => { if (isMuted) { volumeSlider.value = 0; } else { volumeSlider.value = currentVolume; lastVolume = currentVolume; } window.updateVolumeSliderAppearance(); }); }
    });
  }
  const closeMusicPanel = () => { if (!playerPanel || playerPanel.classList.contains('translate-x-full')) { return; } playerPanel.classList.add('translate-x-full'); setTimeout(() => { if (playerPanel.classList.contains('translate-x-full')) { openPlayerBtn.classList.remove('hidden'); } }, 300); };
  if (closePlayerBtn && playerPanel) { closePlayerBtn.addEventListener('click', closeMusicPanel); }
  document.addEventListener('click', function(event) { if (playerPanel && !playerPanel.classList.contains('translate-x-full') && !playerPanel.contains(event.target) && !openPlayerBtn.contains(event.target)) { closeMusicPanel(); } });
  window.updateVolumeSliderAppearance();

  // ===== EASTER EGG SCRIPT =====
  const profilePicture = document.getElementById('profile-picture');
  const profileTooltip = document.getElementById('profile-tooltip'); 
  const questPanel = document.getElementById('quest-panel');
  const closeQuestBtn = document.getElementById('close-quest-btn');
  const congratsBtn = document.getElementById('congrats-btn');
  const congratsModal = document.getElementById('congrats-modal');
  const closeCongratsBtn = document.getElementById('close-congrats-btn');
  const easterEggCat = document.getElementById('easter-egg-cat');
  const questFontChangeText = document.getElementById('font-change-text'); 

  let profileClickCount = 0;
  const clicksNeeded = 10;
  let tooltipTimeout = null;

  const tooltips = {
    en: [ "...", "What are you doing?", "Hmm?", "Are you trying to find something?", "Curiosity is a great trait.", "Keep going...", "You're getting warmer.", "Almost there...", "Just a few more...", "Voilà!" ],
    tr: [ "...", "Ne yapıyorsun?", "Hmm?", "Bir şey mi bulmaya çalışıyorsun?", "Merak harika bir özelliktir.", "Devam et...", "Yaklaşıyorsun.", "Neredeyse orada.", "Sadece birkaç tane daha...", "İşte bu!" ]
  };
  
  let quests = JSON.parse(localStorage.getItem('quests')) || { 1: false, 2: false, 3: false };

  const updateQuestUI = () => {
      for (const id in quests) {
          const questItem = document.getElementById(`quest${id}`);
          if (questItem && quests[id]) {
              questItem.classList.add('completed');
              questItem.querySelector('i').className = 'fas fa-check-circle text-green-500 mr-3';
          }
      }
      const allComplete = Object.values(quests).every(status => status === true);
      if (allComplete) {
          congratsBtn.classList.remove('hidden');
      }
  };

  const completeQuest = (id) => {
      if (!quests[id]) {
          quests[id] = true;
          localStorage.setItem('quests', JSON.stringify(quests));
          updateQuestUI();
      }
  };
  window.completeQuest = completeQuest;

  if (profilePicture && profileTooltip) {
    profilePicture.addEventListener('click', () => {
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
      const currentLang = localStorage.getItem('language') || 'en';
      profileTooltip.textContent = tooltips[currentLang][profileClickCount % tooltips[currentLang].length];
      profileTooltip.classList.remove('opacity-0', 'invisible');
      profileTooltip.classList.add('opacity-100', 'visible');
      
      tooltipTimeout = setTimeout(() => {
          profileTooltip.classList.remove('opacity-100', 'visible');
          profileTooltip.classList.add('opacity-0', 'invisible');
      }, 2000); 

      profileClickCount++;
      if (profileClickCount >= clicksNeeded) {
        if(questPanel) {
            questPanel.classList.remove('-translate-x-full');
            if (!questPanelOpenedOnce) {
                questPanelOpenedOnce = true;
                localStorage.setItem('questPanelOpenedOnce', 'true');
            }
        }
        profileClickCount = 0; 
      }
    });
  }

  if (closeQuestBtn) { closeQuestBtn.addEventListener('click', () => { if(questPanel) questPanel.classList.add('-translate-x-full'); }); }
  if (easterEggCat) { easterEggCat.addEventListener('click', () => completeQuest(1)); }
  if (questFontChangeText) { questFontChangeText.addEventListener('click', () => completeQuest(2)); }

  if (congratsBtn) {
      congratsBtn.addEventListener('click', () => {
          if(congratsModal) {
            congratsModal.classList.remove('hidden');
            setTimeout(() => congratsModal.classList.remove('opacity-0'), 10);
          }
      });
  }

  const closeCongratsModal = () => {
    if(congratsModal) {
      congratsModal.classList.add('opacity-0');
      setTimeout(() => congratsModal.classList.add('hidden'), 400);
    }
  };
  
  if (closeCongratsBtn) { closeCongratsBtn.addEventListener('click', closeCongratsModal); }
  if (congratsModal) { congratsModal.addEventListener('click', (e) => { if (e.target === congratsModal) { closeCongratsModal(); } }); }
  
  updateQuestUI();

});

