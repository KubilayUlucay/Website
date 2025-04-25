document.addEventListener("DOMContentLoaded", () => {
    const cat = document.getElementById("chasing-cat-img");
    if (cat) {
      // initial positions at screen center
      let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
      let catX   = mouseX, catY = mouseY;
      const speed = 0.35, halfW = 32;
      let scaleX = 1, animating = false;
  
      // sprite frames
      const idleFrame  = "images/cat-3.png";
      const walkFrames = [
        "images/cat-1.png","images/cat-2.png",
        "images/cat-4.png","images/cat-5.png",
        "images/cat-6.png","images/cat-7.png",
        "images/cat-8.png"
      ];
      let walkIndex = 0, lastTime = 0, frameDelay = 250;
  
      function loop(now) {
        // 1) decide look direction
        const dxMouse = mouseX - catX;
        if (Math.abs(dxMouse) > 2) scaleX = dxMouse > 0 ? 1 : -1;
  
        // 2) compute target so head sits on cursor
        const targetX = mouseX - scaleX * halfW,
              targetY = mouseY;
  
        // 3) ease toward target
        const dx = targetX - catX, dy = targetY - catY,
              dist = Math.hypot(dx, dy), moving = dist > 5;
        if (dist > 1) {
          catX += dx * speed;
          catY += dy * speed;
        }
  
        // 4) position & mirror
        cat.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
  
        // 5) animate frames
        if (moving) {
          if (now - lastTime > frameDelay) {
            walkIndex = (walkIndex + 1) % walkFrames.length;
            cat.src   = walkFrames[walkIndex];
            lastTime  = now;
          }
        } else {
          cat.src   = idleFrame;
          walkIndex = 0;
        }
  
        if (animating) requestAnimationFrame(loop);
      }
  
      function start() {
        if (animating) return;
        animating        = true;
        cat.style.opacity = "0.9";
        cat.src           = idleFrame;
        lastTime         = performance.now();
        requestAnimationFrame(loop);
      }
  
      function stop() {
        animating         = false;
        cat.style.opacity = "0";
      }
  
      // mouse events
      document.addEventListener("mousemove", e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        start();
      });
      document.addEventListener("mouseleave", stop);
      document.addEventListener("mouseenter", start);
  
      // init
      cat.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
    }
  
    // --- Copyright year ---
    const yearSpan = document.getElementById("current-year");
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  
    // --- Mobile menu toggle ---
    const menuBtn    = document.getElementById("mobile-menu-button"),
          mobileMenu = document.getElementById("mobile-menu");
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
      mobileMenu.querySelectorAll("a").forEach(a =>
        a.addEventListener("click", () => mobileMenu.classList.add("hidden"))
      );
    }
  
    // --- Scroll reveal ---
    const sections = document.querySelectorAll("section");
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver((entries, o) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("opacity-100", "translate-y-0");
            e.target.classList.remove("opacity-0", "translate-y-5");
            o.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 });
  
      sections.forEach(sec => {
        if (sec.id !== "hero") {
          sec.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out");
          obs.observe(sec);
        }
      });
    } else {
      sections.forEach(sec => {
        if (sec.id !== "hero") {
          sec.classList.remove("opacity-0", "translate-y-5");
          sec.classList.add("opacity-100", "translate-y-0");
        }
      });
    }
  });
  