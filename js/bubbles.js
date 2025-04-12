document.addEventListener('DOMContentLoaded', function() {
    // Create a single unified bubble container for both sections
    const productSection = document.querySelector('.products-section');
    const missionSection = document.querySelector('.mission-section');
    
    if (productSection && missionSection) {
        // Create one bubble container for both sections
        const bubbleContainer = document.createElement('div');
        bubbleContainer.className = 'bubble-container';
        productSection.appendChild(bubbleContainer);
        
        // Create a separate bubble container for mission section
        const missionBubbleContainer = document.createElement('div');
        missionBubbleContainer.className = 'bubble-container';
        missionSection.appendChild(missionBubbleContainer);
        
        // Create bubbles with distribution across both sections
        const bubbleCounts = {
            tiny: 12,
            small: 8,
            medium: 6,
            large: 3
        };
        
        Object.entries(bubbleCounts).forEach(([size, count]) => {
            for (let i = 0; i < count; i++) {
                createBubble(bubbleContainer, size);
                // Create bubbles for mission section too
                createBubble(missionBubbleContainer, size);
            }
        });
    }
    
    // Create a single bubble
    function createBubble(container, size) {
        const bubble = document.createElement('div');
        bubble.className = `water-bubble ${size}`;
        
        // Random position
        const xPos = Math.random() * 100;
        const yPos = Math.random() * 100;
        bubble.style.left = `${xPos}%`;
        bubble.style.top = `${yPos}%`;
        
        // Random animation delay and duration
        const delay = Math.random() * 5;
        const duration = 15 + Math.random() * 15; // 15-30s duration
        bubble.style.animationDelay = `${delay}s`;
        bubble.style.animationDuration = `${duration}s`;
        
        // Add bounce on click/touch
        bubble.addEventListener('click', function() {
            this.classList.remove('bounce');
            void this.offsetWidth; // Trigger reflow
            this.classList.add('bounce');
        });
        
        container.appendChild(bubble);
    }
});


