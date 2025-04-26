// Wait for the HTML document to be fully loaded and parsed
document.addEventListener("DOMContentLoaded", () => {

    // --- Chasing Cat Logic ---
    const cat = document.getElementById("chasing-cat-img");
    if (cat) {
      // Initial mouse and cat positions (center of the screen)
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let catX = mouseX;
      let catY = mouseY;
  
      // Configuration for cat movement and animation
      const speed = 0.08;        // How fast the cat follows (lower is slower)
      const followDelay = 100;   // Milliseconds delay before the cat starts following
      let followTimeout = null;  // Timeout ID for the delay
      let scaleX = 1;            // Horizontal direction (-1 for left, 1 for right)
      let animating = false;     // Flag to track if the animation loop is running
      // --- Using original image paths ---
      const idleFrame = "images/cat-3.png"; // Original idle cat image
      const walkFrames = [       // Original array of images for walking animation
          "images/cat-1.png", "images/cat-2.png",
          "images/cat-4.png", "images/cat-5.png",
          "images/cat-6.png", "images/cat-7.png",
          "images/cat-8.png"
      ];
      // ---------------------------------
      let walkIndex = 0;         // Current frame index in walkFrames
      let lastFrameTime = 0;     // Timestamp of the last frame change
      let frameInterval = 100;   // Milliseconds between walk animation frames (Adjust as needed)
  
      // Main animation loop function
      function loop(currentTime) {
        // Stop the loop if animation is not active
        if (!animating) return;
  
        // Calculate distance between mouse and cat
        const dxMouse = mouseX - catX;
        const dyMouse = mouseY - catY;
  
        // Determine cat's horizontal direction based on mouse position
        if (Math.abs(dxMouse) > 2) {
            scaleX = dxMouse > 0 ? 1 : -1; // Point right if mouse is right, else left
        }
  
        // Calculate the target position for the cat (slightly behind/offset from the cursor)
        const targetX = mouseX - scaleX * (cat.offsetWidth / 2); // Offset horizontally based on direction
        const targetY = mouseY - (cat.offsetHeight / 2);       // Center vertically on the cursor
  
        // Calculate vector from cat to target position
        const dx = targetX - catX;
        const dy = targetY - catY;
        const dist = Math.hypot(dx, dy); // Calculate distance to target
        const moving = dist > 5;         // Check if the cat needs to move significantly
  
        // Move the cat towards the target position using the speed factor
        if (dist > 1) { // Only move if not already very close
          catX += dx * speed;
          catY += dy * speed;
        }
  
        // Apply the calculated position and direction to the cat image via CSS transform
        cat.style.transform = `translate(${catX.toFixed(2)}px, ${catY.toFixed(2)}px) scaleX(${scaleX})`;
  
        // Handle walking animation
        if (moving) {
          // If moving and enough time has passed since the last frame change
          if (currentTime - lastFrameTime > frameInterval) {
            walkIndex = (walkIndex + 1) % walkFrames.length; // Cycle through walk frames
            cat.src = walkFrames[walkIndex];                 // Update cat image source
            lastFrameTime = currentTime;                     // Record the time of this frame change
          }
        } else {
          // If not moving significantly, show the idle frame
          if (cat.src !== idleFrame) { // Only change if not already idle
              cat.src = idleFrame;
          }
          walkIndex = 0; // Reset walk animation cycle
        }
  
        // Request the next frame, continuing the loop
        requestAnimationFrame(loop);
      }
  
      // Function to start the cat following animation
      function startFollowing() {
          if (animating) return; // Don't start if already running
          animating = true;
          cat.style.opacity = "0.9"; // Make cat visible (assuming CSS transition)
          cat.src = idleFrame;       // Start with the idle image
          lastFrameTime = performance.now(); // Get current time for frame timing
          requestAnimationFrame(loop); // Start the animation loop
      }
  
      // Function to stop the cat following animation
      function stopFollowing() {
          animating = false;
          cat.style.opacity = "0"; // Hide the cat (assuming CSS transition)
          // Clear any pending start timeout
          if (followTimeout) {
              clearTimeout(followTimeout);
              followTimeout = null;
          }
      }
  
      // Event listener for mouse movement within the document
      document.addEventListener("mousemove", e => {
        // Update mouse coordinates
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Start the following animation after a short delay (debouncing)
        if (!animating) {
            if (followTimeout) clearTimeout(followTimeout); // Clear previous timeout
            // Set a new timeout to start following
            followTimeout = setTimeout(startFollowing, followDelay);
        }
      });
  
      // Event listener for when the mouse leaves the document window
      document.addEventListener("mouseleave", stopFollowing);
  
      // Event listener for when the mouse enters the document window
      document.addEventListener("mouseenter", e => {
          // Update mouse position immediately in case it was outside
          mouseX = e.clientX;
          mouseY = e.clientY;
          // Note: We don't automatically start following on mouseenter,
          // we wait for the mousemove event and its delay.
      });
  
      // Set initial cat position (centered but hidden by initial style/opacity)
      cat.style.transform = `translate(${catX}px, ${catY}px) scaleX(${scaleX})`;
    } // End of Chasing Cat Logic
  
    // --- Header Scroll Blur ---
    const header = document.querySelector("header");
    if (header) {
      // Add scroll event listener to the window
      window.addEventListener("scroll", () => {
        // Check if the page has been scrolled down more than 50 pixels
        if (window.scrollY > 50) {
          header.classList.add("scrolled"); // Add 'scrolled' class to header
        } else {
          header.classList.remove("scrolled"); // Remove 'scrolled' class
        }
      });
    } // End of Header Scroll Blur
  
    // --- Mobile Menu Toggle ---
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenuButton && mobileMenu) {
      // Toggle menu visibility when the button is clicked
      mobileMenuButton.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent this click from closing the menu immediately
          mobileMenu.classList.toggle("hidden"); // Tailwind class to show/hide
      });
  
      // Add event listeners to each link within the mobile menu
      mobileMenu.querySelectorAll("a").forEach(link => {
          link.addEventListener("click", () => {
              // Hide the menu when a link is clicked
              mobileMenu.classList.add("hidden");
          });
      });
  
      // Add event listener to the whole document to close the menu if clicked outside
      document.addEventListener('click', (event) => {
          // Check if the menu is visible AND the click was outside the menu AND outside the button
          if (!mobileMenu.classList.contains('hidden') &&
              !mobileMenu.contains(event.target) &&
              !mobileMenuButton.contains(event.target)) {
              mobileMenu.classList.add('hidden'); // Hide the menu
          }
      });
    } // End of Mobile Menu Toggle
  
    // --- Scroll Reveal Animation for Sections ---
    const sectionsToReveal = document.querySelectorAll("section");
    if (sectionsToReveal.length > 0) {
      // Initially hide sections (except hero) and prepare for transition
      sectionsToReveal.forEach(sec => {
        if (sec.id !== "hero") { // Don't hide or transform the hero section initially
          sec.classList.add("opacity-0", "translate-y-5", "transition-all", "duration-700", "ease-out");
        }
      });
  
      // Configure the Intersection Observer
      const observerOptions = {
        root: null, // Observe intersections relative to the viewport
        rootMargin: '0px', // No margin around the viewport
        threshold: 0.1 // Trigger when 10% of the section is visible
      };
  
      // Callback function for the observer
      const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
          // When a section becomes intersecting (visible)
          if (entry.isIntersecting) {
            // Remove the initial hidden/transformed classes to trigger the transition
            entry.target.classList.remove("opacity-0", "translate-y-5");
            entry.target.classList.add("opacity-100", "translate-y-0"); // Ensure final state classes are present
            // Stop observing this section once it has been revealed
            observer.unobserve(entry.target);
          }
        });
      };
  
      // Create the Intersection Observer instance
      const intersectionObserver = new IntersectionObserver(observerCallback, observerOptions);
  
      // Start observing all sections except the hero section
      sectionsToReveal.forEach(sec => {
        if (sec.id !== "hero") {
          intersectionObserver.observe(sec);
        }
      });
    } // End of Scroll Reveal
  
    // --- Current Year in Footer ---
    const yearEl = document.getElementById("current-year");
    if (yearEl) {
      // Set the text content to the current year
      yearEl.textContent = new Date().getFullYear();
    } // End of Current Year
  
    // --- Automatic Font Cycling & Glitch Logic for "Hi All!" Text ---
    const fontText = document.getElementById('font-change-text');
    if (fontText) {
      // Define the different styles (text content and font family)
      const styles = [
          { text: "Hi All!", fontFamily: "'Rubik', sans-serif" },
          { text: "Hi All!", fontFamily: "'Montserrat', sans-serif" },
          { text: "H̶̢̭̓i̸͈̓̂ ̵̥́̊A̴̪̎̒l̴̹̪̆ļ̵̼̊!̶̰̅", fontFamily: "'Rubik', sans-serif" }, // Predefined glitch text
          { text: "Hi All!", fontFamily: "'Courier New', monospace" },
          { text: "Hi All!", fontFamily: "cursive" },
          { text: "Hi All!", fontFamily: "fantasy" },
          { text: "Hi All!", fontFamily: "'Honk', system-ui" } // Example custom font
      ];
      let currentStyleIndex = 0; // Index of the currently displayed style
      const changeInterval = 3000; // Time (ms) between style changes (3 seconds)
      const glitchDuration = 200;  // Duration (ms) to show the glitch text
  
      // Function to apply a specific style from the array
      function applyStyle(index) {
          if (index >= 0 && index < styles.length) {
              fontText.textContent = styles[index].text;
              fontText.style.fontFamily = styles[index].fontFamily;
          }
      }
  
      // Apply the initial style when the page loads
      applyStyle(currentStyleIndex);
  
      // Function to change to the next style in the cycle
      function changeStyle() {
          const nextStyleIndex = (currentStyleIndex + 1) % styles.length; // Calculate the next index, looping back to 0
  
          // Check if the *next* style is the predefined glitch text
          // We identify it by checking for the combining character '̶'
          if (styles[nextStyleIndex].text.includes('̶')) {
               applyStyle(nextStyleIndex); // Show the glitch text immediately
               // Set a timeout to switch to the style *after* the glitch
               setTimeout(() => {
                   const afterGlitchIndex = (nextStyleIndex + 1) % styles.length; // Index after the glitch
                   applyStyle(afterGlitchIndex);
                   currentStyleIndex = afterGlitchIndex; // Update the current index to the post-glitch style
               }, glitchDuration); // Wait for the glitch duration
          } else {
              // If the next style is not the glitch text, apply it normally
              applyStyle(nextStyleIndex);
              currentStyleIndex = nextStyleIndex; // Update the current index
          }
      }
  
      // Set an interval to call changeStyle repeatedly
      setInterval(changeStyle, changeInterval);
    } // End of Font Cycling
  
    // --- Profile Picture Hover Effect (Flip, Scale, Tilt) ---
    const profilePic = document.getElementById('profile-picture');
    if (profilePic) {
        // Configuration for the hover effect
        const hoverScale = 1.15; // Scale factor on hover (1.15 = 115%)
        const flipAngle = 360;   // Degrees to rotate around the Y-axis on hover
        const maxTilt = 10;      // Maximum tilt angle (degrees) based on mouse position
        // NOTE: transitionDuration is now defined purely in CSS
  
        let handleMouseMove = null; // Variable to store the mousemove event listener function
  
        // Event listener for when the mouse enters the profile picture area
        profilePic.addEventListener('mouseenter', () => {
            // --- MODIFICATION START ---
            // Apply the target transform state (scale and flip) directly.
            // The CSS transition defined in style.css should handle the animation.
            profilePic.style.transform = `perspective(1000px) scale(${hoverScale}) rotateY(${flipAngle}deg)`;
            // --- MODIFICATION END ---
  
            // Define the function that handles mouse movement *while* hovering
            handleMouseMove = (event) => {
                const rect = profilePic.getBoundingClientRect(); // Get picture's position and size
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
  
                // Calculate mouse position relative to the center of the picture
                const offsetX = (event.clientX - centerX) / (rect.width / 2);
                const offsetY = (event.clientY - centerY) / (rect.height / 2);
  
                // Calculate tilt angles based on mouse offset
                const rotateY_tilt = Math.max(-1, Math.min(1, offsetX)) * maxTilt;
                const rotateX_tilt = Math.max(-1, Math.min(1, -offsetY)) * maxTilt; // Invert Y for natural tilt
  
                // --- MODIFICATION START ---
                // Apply the combined transform including the base flip/scale AND the tilt.
                // We are NOT manipulating the transition property here anymore.
                // If this causes jitter, we might need to re-add `transition: none` temporarily.
                profilePic.style.transform = `perspective(1000px) rotateX(${rotateX_tilt}deg) rotateY(${rotateY_tilt + flipAngle}deg) scale(${hoverScale})`;
                // --- MODIFICATION END ---
            };
  
            // Add the mousemove listener
            profilePic.addEventListener('mousemove', handleMouseMove);
        });
  
        // Event listener for when the mouse leaves the profile picture area
        profilePic.addEventListener('mouseleave', () => {
            // --- MODIFICATION START ---
            // Reset the transform style. The CSS transition handles animating back smoothly.
            // We are NOT manipulating the transition property here anymore.
            profilePic.style.transform = ''; // Resets to the default state (scale(1) rotateY(0deg))
            // --- MODIFICATION END ---
  
            // Remove the mousemove listener if it was added
            if (handleMouseMove) {
                profilePic.removeEventListener('mousemove', handleMouseMove);
                handleMouseMove = null; // Clear the stored function reference
            }
        });
    } // End of Profile Picture Hover Effect
  
  }); // End of DOMContentLoaded listener
  