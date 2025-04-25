// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {

    // --- Simple Blue Dot Cursor Follower (Disabled) ---
    /* ... (code remains commented out) ... */

    // --- Chasing Cat Cursor (NEW - Targets #chasing-cat) ---
    const chasingCat = document.getElementById('chasing-cat'); // Changed variable name for clarity

    if (chasingCat) { // Check if the chasing cat element exists
        let mouseX = -100; // Start mouse position off-screen
        let mouseY = -100;
        let catX = -100;   // Start cat position off-screen
        let catY = -100;
        let speed = 0.07; // Controls how fast the cat catches up (lower is slower)
        let isMoving = false;

        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!isMoving) {
                // Start the animation loop if it's not already running
                isMoving = true;
                requestAnimationFrame(animateChasingCat); // Use specific function name
                 // Make cat visible when mouse first moves
                 chasingCat.style.opacity = '0.8'; // Use the Tailwind opacity class value
            }
        });

         // Hide cat when mouse leaves the window
        document.addEventListener('mouseleave', () => {
            mouseX = -100; // Move target off-screen
            mouseY = -100;
            // Optional: fade out smoothly
            // chasingCat.style.opacity = '0';
        });
        // Make cat visible when mouse enters again
         document.addEventListener('mouseenter', () => {
             chasingCat.style.opacity = '0.8';
            if (!isMoving) {
                 isMoving = true;
                 requestAnimationFrame(animateChasingCat); // Use specific function name
            }
         });


        // Animation function for the chasing cat
        function animateChasingCat() {
            // Calculate distance between cat and mouse
            let dx = mouseX - catX;
            let dy = mouseY - catY;

            // Move cat towards mouse using easing
            catX += dx * speed;
            catY += dy * speed;

            // Apply the position using transform for better performance
            // The -50% translates it so the center of the cat aligns with the coordinates
            chasingCat.style.transform = `translate(calc(${catX}px - 50%), calc(${catY}px - 50%))`;

            // Check if the cat is close enough to the target or if mouse left window
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && mouseX === -100) {
                 isMoving = false; // Stop the loop if mouse left and cat reached target
                 // Optional: Hide cat completely when stopped off-screen
                 // chasingCat.style.opacity = '0';
            } else {
                 requestAnimationFrame(animateChasingCat); // Continue the animation loop
            }
        }

        // Initial call to position the cat off-screen correctly
        chasingCat.style.transform = `translate(calc(${catX}px - 50%), calc(${catY}px - 50%))`;

    } // End if(chasingCat)


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
            if (section.id !== 'hero') {
                 section.classList.add('opacity-0', 'translate-y-5', 'transition-all', 'duration-700', 'ease-out');
                 scrollObserver.observe(section);
            }
        });
    } else {
        sections.forEach(section => {
             if (section.id !== 'hero') {
                section.classList.remove('opacity-0', 'translate-y-5');
                section.classList.add('opacity-100', 'translate-y-0');
             }
        });
    }

}); // End DOMContentLoaded
