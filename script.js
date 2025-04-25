// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {

    // --- Custom Cursor Follower ---
    const cursorFollower = document.getElementById('cursor-follower');

    // Hide follower initially until mouse moves
    cursorFollower.style.opacity = '0';

    // Update follower position on mouse move
    document.addEventListener('mousemove', (e) => {
        // Use requestAnimationFrame for smoother performance
        requestAnimationFrame(() => {
            // Get mouse coordinates
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Update the position of the follower element
            // Using translate ensures smoother movement than top/left
            cursorFollower.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

            // Make follower visible once mouse moves
            if (cursorFollower.style.opacity === '0') {
                cursorFollower.style.opacity = '0.5'; // Set initial opacity (Tailwind class handles this too)
            }
        });
    });

    // Optional: Hide follower when mouse leaves the window
    document.addEventListener('mouseleave', () => {
         cursorFollower.style.opacity = '0';
    });
     // Optional: Show follower when mouse enters the window
    document.addEventListener('mouseenter', () => {
         cursorFollower.style.opacity = '0.5';
    });


    // --- Update Copyright Year ---
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Optional: Smooth Scroll Offset for Fixed Header ---
    // Tailwind's scroll-mt-20 class in the HTML handles this for sections,
    // but if you need finer control or dynamic header heights, you might add JS logic here.
    // For now, relying on the CSS/Tailwind approach.

    // --- Optional: Simple Scroll Animations (using Intersection Observer) ---
    // Example: Fade in sections as they enter the viewport
    const sections = document.querySelectorAll('section'); // Select all section elements

    const observerOptions = {
        root: null, // relative to document viewport
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add a class to trigger animation (e.g., using Tailwind's opacity/transition)
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-5'); // Remove initial state
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    };

    const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(section => {
        // Set initial state for animation
        section.classList.add('opacity-0', 'translate-y-5', 'transition-all', 'duration-700', 'ease-out');
        scrollObserver.observe(section);
    });

    // Note: The Hero section uses CSS keyframe animations defined in style.css instead of this observer.

}); // End DOMContentLoaded
