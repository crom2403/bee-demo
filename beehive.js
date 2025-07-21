
beehive.addEventListener('click', function(e) {
    e.stopPropagation();
    // Shake animation
    this.classList.add('shake');
    setTimeout(() => this.classList.remove('shake'), 500);
    
    // Spawn 1 new bees
    for (let i = 0; i < 1; i++) {
        // Delay each bee spawn slightly for a more natural effect
        setTimeout(() => {
            const newBee = createBee(bees[0]); // Use first bee as parent
            // Start bees from beehive position
            newBee.x = 60; // Approximate center of beehive (left: 20px + half of 150px width)
            newBee.y = 70; // Approximate center of beehive (top: 20px + half of 120px height)
            newBee.targetX = newBee.x + (Math.random() - 0.5) * 100; // Random initial target
            newBee.targetY = newBee.y + (Math.random() - 0.5) * 100;
            newBee.size = 40; // Set initial size to match reset size
            bees.push(newBee);
        }, i * 100); // 100ms delay between each bee
    }
});
