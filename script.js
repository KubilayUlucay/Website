// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {

    // --- Simple Blue Dot Cursor Follower (Disabled) ---
    /* ... (code remains commented out) ... */

    // --- Chasing Cat Image Animation (Using separate images) ---
    const catImg = document.getElementById('chasing-cat-img'); // Target the img tag

    if (catImg) { // Check if the cat element exists
        let mouseX = window.innerWidth / 2; // Actual mouse position
        let mouseY = window.innerHeight / 2;
        let catX = window.innerWidth / 2;   // Cat's current center position
        let catY = window.innerHeight / 2;
        let targetX = mouseX; // The point the cat is trying to reach
        let targetY = mouseY;
        let speed = 0.25; // Cat follow speed
        let isAnimating = false;
        let animationFrameId = null;
        let isMouseInside = false;
        let scaleX = 1; // For mirroring

        // --- Offset: Adjust where the cat aims relative to the cursor ---
        const offsetX = 15; // Aim slightly to the right of the cursor
        const offsetY = 15; // Aim slightly below the cursor

        // --- Image Animation Variables ---
        const idleImageSrc = 'images/cat-3.png'; // Idle frame
        const walkImageFiles = [ // Array of walking frame filenames
            'images/cat-1.png',
            'images/cat-2.png',
            'images/cat-4.png',
            'images/cat-5.png',
            'images/cat-6.png',
            'images/cat-7.png',
            'images/cat-8.png',
        ];
        let currentWalkFrameIndex = 0;
        let lastFrameTime = 0;
        const frameInterval = 250; // Animation pace (milliseconds)
        let isCatMoving = false;

        // Function to start the animation loop
        function startAnimationLoop() {
            if (!isAnimating) {
                isAnimating = true;
                catImg.style.opacity = '0.9';
                catImg.src = idleImageSrc;
                lastFrameTime = performance.now();
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = requestAnimationFrame(animateCatPosition);
            }
        }

        // Function to stop the animation loop
        function stopAnimationLoop() {
            if (isAnimating) {
                isAnimating = false;
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
                catImg.style.opacity = '0';
                catX = -200;
                catY = -200;
                catImg.style.transform = `translate(calc(${catX}px - 50%), calc(${catY}px - 50%)) scaleX(${scaleX})`;
                catImg.src = idleImageSrc;
                currentWalkFrameIndex = 0;
            }
        }

        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; // Update actual mouse position
            mouseY = e.clientY;
            // Update the target for the cat, including the offset
            targetX = mouseX + offsetX;
            targetY = mouseY + offsetY;
            if (isMouseInside) startAnimationLoop();
        });

        // Handle mouse leaving the window
        document.addEventListener('mouseleave', () => {
            isMouseInside = false;
            // Set target off-screen (offset doesn't matter much here)
            targetX = -200;
            targetY = -200;
        });

         // Handle mouse entering the window
         document.addEventListener('mouseenter', (e) => { // Get initial position on enter
            isMouseInside = true;
            mouseX = e.clientX; // Update actual mouse position on enter
            mouseY = e.clientY;
            // Reset cat position near the entry point
            catX = mouseX;
            catY = mouseY;
            targetX = mouseX + offsetX; // Set initial target with offset
            targetY = mouseY + offsetY;
            startAnimationLoop();
         });

        // Animation function for position and frame updates
        function animateCatPosition(currentTime) {
            // Calculate distance from cat's current position to its target position
            let dx = targetX - catX;
            let dy = targetY - catY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if the cat should be considered "moving"
            isCatMoving = distance > 5; // Threshold to consider moving

            // Move cat towards target
            if (distance > 1) { // Only move if not already very close
                catX += dx * speed;
                catY += dy * speed;
            } else if (!isMouseInside) { // If mouse is outside AND cat reached off-screen target
                stopAnimationLoop();
                return; // Exit the function early
            }

            // Determine direction for mirroring based on movement towards target
            if (Math.abs(dx) > 1) { // Only change direction if moving horizontally significantly
                scaleX = (dx > 0) ? 1 : -1; // Mirror if dx is negative (moving left)
            }

            // Update cat image element's position and apply mirroring via scaleX
            // The calculation centers the image element at (catX, catY)
            catImg.style.transform = `translate(calc(${catX}px - 50%), calc(${catY}px - 50%)) scaleX(${scaleX})`;

            // Update image source based on movement
            if (isCatMoving) {
                // Walking Animation: Cycle through walkImageFiles
                if (currentTime - lastFrameTime > frameInterval) {
                    currentWalkFrameIndex = (currentWalkFrameIndex + 1) % walkImageFiles.length;
                    catImg.src = walkImageFiles[currentWalkFrameIndex];
                    lastFrameTime = currentTime;
                }
            } else {
                // Idle Animation: Set to the idle image
                if (catImg.src !== idleImageSrc) { // Only set if not already idle
                    catImg.src = idleImageSrc;
                }
                currentWalkFrameIndex = 0; // Reset walk cycle index
            }

            // Continue the loop if it should still be animating
            if (isAnimating) {
                animationFrameId = requestAnimationFrame(animateCatPosition);
            }
        }

        // Initial setup
        catImg.style.opacity = '0'; // Start hidden
        catImg.src = idleImageSrc; // Start with idle frame
        catImg.style.transform = `translate(calc(${catX}px - 50%), calc(${catY}px - 50%)) scaleX(${scaleX})`;


    } // End if(catImg)


    // --- Update Copyright Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Mobile Menu Toggle ---
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // --- Scroll Animations (Intersection Observer) ---
    const sections = document.querySelectorAll('section');

    if ("IntersectionObserver" in window) {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-5');
                    observer.unobserve(entry.target);
                }
            });
        };
        const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
        sections.forEach(section => {
            // Exclude hero section if it uses CSS keyframe animations
            if (section.id !== 'hero') {
                 section.classList.add('opacity-0', 'translate-y-5', 'transition-all', 'duration-700', 'ease-out');
                 scrollObserver.observe(section);
            }
        });
    } else {
        // Fallback for older browsers
        sections.forEach(section => {
             if (section.id !== 'hero') {
                section.classList.remove('opacity-0', 'translate-y-5');
                section.classList.add('opacity-100', 'translate-y-0');
             }
        });
    }

}); // End DOMContentLoaded
