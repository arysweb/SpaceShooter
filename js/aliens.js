class Alien {
    constructor(x, y, type, canvasWidth, canvasHeight, playerX, playerY) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.lastUpdateTime = Date.now();
        
        // Set properties based on alien type
        if (type === 0) { // Large alien
            this.size = GAME_CONFIG.ENEMY.LARGE.SIZE;
            this.speed = GAME_CONFIG.ENEMY.LARGE.SPEED;
            this.points = GAME_CONFIG.ENEMY.LARGE.POINTS;
            this.coins = GAME_CONFIG.ENEMY.LARGE.COINS;
            this.health = GAME_CONFIG.ENEMY.LARGE.HEALTH;
            this.maxHealth = GAME_CONFIG.ENEMY.LARGE.HEALTH;
        } else if (type === 1) { // Small alien
            this.size = GAME_CONFIG.ENEMY.SMALL.SIZE;
            this.speed = GAME_CONFIG.ENEMY.SMALL.SPEED;
            this.points = GAME_CONFIG.ENEMY.SMALL.POINTS;
            this.coins = GAME_CONFIG.ENEMY.SMALL.COINS;
            this.health = GAME_CONFIG.ENEMY.SMALL.HEALTH;
            this.maxHealth = GAME_CONFIG.ENEMY.SMALL.HEALTH;
        } else if (type === 2) { // L3 alien
            this.size = GAME_CONFIG.ENEMY.L3.SIZE;
            this.speed = GAME_CONFIG.ENEMY.L3.SPEED;
            this.points = GAME_CONFIG.ENEMY.L3.POINTS;
            this.coins = GAME_CONFIG.ENEMY.L3.COINS;
            this.health = GAME_CONFIG.ENEMY.L3.HEALTH;
            this.maxHealth = GAME_CONFIG.ENEMY.L3.HEALTH;
        } else if (type === 3) { // L4 alien
            this.size = GAME_CONFIG.ENEMY.L4.SIZE;
            this.speed = GAME_CONFIG.ENEMY.L4.SPEED;
            this.points = GAME_CONFIG.ENEMY.L4.POINTS;
            this.coins = GAME_CONFIG.ENEMY.L4.COINS;
            this.health = GAME_CONFIG.ENEMY.L4.HEALTH;
            this.maxHealth = GAME_CONFIG.ENEMY.L4.HEALTH;
        }
        
        // Calculate direction towards player instead of center of screen
        const targetX = playerX || canvasWidth / 2;
        const targetY = playerY || canvasHeight / 2;
        
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
        
        this.rotation = Math.atan2(dy, dx);
    }
    
    update(allAliens, playerX, playerY, isPaused) {
        // If game is paused, freeze all movement
        if (isPaused) {
            // Reset velocities to ensure no movement when unpaused
            this.vx = 0;
            this.vy = 0;
            return;
        }
        
        // Store current position before updating
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Calculate time since last update for smooth movement
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;
        
        // If player position is provided, update direction towards player
        if (playerX !== undefined && playerY !== undefined) {
            // Calculate direction towards player
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {  // Avoid division by zero
                // Gradually adjust velocity towards player (smoother tracking)
                const adjustmentFactor = 0.05; // Lower = smoother/slower adjustment
                
                // Calculate target velocity
                const targetVx = (dx / distance) * this.speed;
                const targetVy = (dy / distance) * this.speed;
                
                // Gradually adjust current velocity towards target
                this.vx += (targetVx - this.vx) * adjustmentFactor;
                this.vy += (targetVy - this.vy) * adjustmentFactor;
                
                // Update rotation to face movement direction
                this.rotation = Math.atan2(this.vy, this.vx);
            }
        }
        
        // Move alien
        this.x += this.vx * (deltaTime / 16); // Normalize to ~60fps
        this.y += this.vy * (deltaTime / 16);
        
        // Avoid collisions with other aliens if provided
        if (allAliens) {
            this.avoidCollisions(allAliens);
        }
    }
    
    avoidCollisions(allAliens) {
        const repulsionStrength = 0.3; // How strongly aliens repel each other
        const minDistance = this.size * 1.1; // Minimum distance to maintain
        
        for (const other of allAliens) {
            // Skip self
            if (other === this) continue;
            
            // Calculate distance between aliens
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If too close, apply repulsion force
            if (distance < minDistance) {
                // Calculate repulsion direction (normalized)
                const nx = dx / distance || 0; // Avoid division by zero
                const ny = dy / distance || 0;
                
                // Apply repulsion force (stronger when closer)
                const force = repulsionStrength * (1 - distance / minDistance);
                this.vx += nx * force;
                this.vy += ny * force;
            }
        }
    }
    
    draw(ctx, image) {
        const img = image;
        
        // Check if image is loaded and not broken
        if (img && img.complete && img.naturalWidth > 0) {
            // Draw the image without rotation, just centered at the alien's position
            ctx.drawImage(
                img,
                this.x - this.size/2,
                this.y - this.size/2,
                this.size,
                this.size
            );
        } else {
            // Fallback: Draw a simple shape if image is not available
            ctx.fillStyle = this.type === 0 ? '#ff0000' : this.type === 1 ? '#ff5555' : this.type === 2 ? '#ff00ff' : '#00ffff';
            
            // Draw alien shape
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw health bar
        this.drawHealthBar(ctx);
    }
    
    drawHealthBar(ctx) {
        // Health bar dimensions
        const barWidth = this.size * 0.8;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size / 2 - 10; // Position above the alien
        
        // Draw background (empty health bar)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Calculate health percentage
        const healthPercentage = this.health / this.maxHealth;
        
        // Use simple white color for the health bar
        ctx.fillStyle = '#ffffff';
        
        // Draw filled health bar
        ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
        
        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    isOffScreen() {
        // Add a buffer to prevent aliens from being removed too early
        const buffer = this.size * 2;
        
        // Check if alien is far outside the canvas boundaries
        return (
            this.x < -buffer ||
            this.x > this.canvasWidth + buffer ||
            this.y < -buffer ||
            this.y > this.canvasHeight + buffer
        );
    }
}

class AlienExplosion {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size * 0.75; // Make explosion smaller (75% of alien size)
        this.opacity = 0; // Start with 0 opacity and fade in
        this.fadeInComplete = false;
        this.creationTime = Date.now();
        this.lifespan = 300; // Reduced from 500ms to 300ms for faster removal
        this.scale = 0.5; // Start small
        this.maxScale = 1.0; // Grow to full size
    }
    
    update() {
        const elapsedTime = Date.now() - this.creationTime;
        const progress = Math.min(1, elapsedTime / this.lifespan);
        
        // First 20% of time: fade in and grow
        if (progress < 0.2) {
            // Reduce max opacity to 0.5 (50%)
            this.opacity = (progress / 0.2) * 0.5; 
            this.scale = 0.5 + (progress / 0.2) * 0.5; // Scale from 0.5 to 1.0
        } 
        // Middle 40%: stay fully visible
        else if (progress < 0.6) {
            this.opacity = 0.5; // 50% opacity
            this.scale = this.maxScale;
        }
        // Remaining 40%: fade out and grow slightly
        else {
            this.fadeInComplete = true;
            // Map remaining progress (0.6-1.0) to opacity (0.5-0)
            this.opacity = 0.5 - ((progress - 0.6) / 0.4) * 0.5;
            // Slightly increase scale for "dissipation" effect
            this.scale = this.maxScale + ((progress - 0.6) / 0.4) * 0.2;
        }
    }
    
    draw(ctx, image) {
        if (!image || !image.complete || image.naturalWidth === 0) return;
        
        // Draw explosion
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Calculate size with scale
        const currentSize = this.size * this.scale;
        
        // Draw centered explosion image
        ctx.drawImage(
            image,
            this.x - currentSize / 2,
            this.y - currentSize / 2,
            currentSize,
            currentSize
        );
        
        ctx.restore();
    }
    
    isFinished() {
        return this.fadeInComplete && this.opacity <= 0.05; // Remove when almost invisible
    }
}

class AlienManager {
    constructor(game) {
        this.game = game;
        this.aliens = [];
        this.explosions = [];
        this.alienSpawnerTimeout = null;
        this.gameStartTime = Date.now();
        this.availableTypes = [1]; // Start with small aliens (type 1)
    }
    
    updateAvailableTypes() {
        const elapsedSeconds = (Date.now() - this.gameStartTime) / 1000;
        
        // Add new alien types as time progresses
        if (elapsedSeconds >= 30 && !this.availableTypes.includes(0)) {
            this.availableTypes.push(0); // Add big aliens
            console.log('Big aliens now joining the fight!');
        }
        if (elapsedSeconds >= 60 && !this.availableTypes.includes(2)) {
            this.availableTypes.push(2); // Add L3 aliens
            console.log('L3 aliens now joining the fight!');
        }
        if (elapsedSeconds >= 90 && !this.availableTypes.includes(3)) {
            this.availableTypes.push(3); // Add L4 aliens
            console.log('L4 aliens now joining the fight!');
        }
    }
    
    getCurrentAlienType() {
        if (this.game.gameOver || this.game.isPaused) return 1; // small alien
        
        // Update available types first
        this.updateAvailableTypes();
        
        // Randomly select from available types
        const randomIndex = Math.floor(Math.random() * this.availableTypes.length);
        return this.availableTypes[randomIndex];
    }
    
    startAlienSpawner() {
        // Prevent spawning if not allowed
        if (!window.gameState || !window.gameState.canSpawn) {
            return;
        }

        // Clear any existing timeout to prevent multiple spawners
        if (this.alienSpawnerTimeout) {
            clearTimeout(this.alienSpawnerTimeout);
            this.alienSpawnerTimeout = null;
        }
        
        // Don't spawn if game is over
        if (this.game.gameOver) {
            console.log('Alien spawner not started - game is over');
            return;
        }
        
        // Spawn an alien
        this.spawnAlien();
        
        // Use fixed spawn interval from config
        const spawnInterval = GAME_CONFIG.ENEMY.SPAWN_INTERVAL;
        
        // Schedule next spawn
        this.alienSpawnerTimeout = setTimeout(() => {
            // Only continue spawning if the game is not over
            if (!this.game.gameOver) {
                this.startAlienSpawner();
            } else {
                // If game is over, we'll stop the spawner
                console.log('Alien spawner stopped - game is over');
                if (this.alienSpawnerTimeout) {
                    clearTimeout(this.alienSpawnerTimeout);
                    this.alienSpawnerTimeout = null;
                }
            }
        }, spawnInterval);
    }
    
    spawnAlien() {
        // Don't spawn if game is over or paused
        if (this.game.gameOver || this.game.isPaused) {
            return;
        }
        
        // Choose a random alien type from available types
        const alienType = this.getCurrentAlienType();
        
        // Choose a random spawn position along the edges
        let x, y;
        const spawnEdge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(spawnEdge) {
            case 0: // Top edge
                x = Math.random() * this.game.canvas.width;
                y = -50;
                break;
            case 1: // Right edge
                x = this.game.canvas.width + 50;
                y = Math.random() * this.game.canvas.height;
                break;
            case 2: // Bottom edge
                x = Math.random() * this.game.canvas.width;
                y = this.game.canvas.height + 50;
                break;
            case 3: // Left edge
                x = -50;
                y = Math.random() * this.game.canvas.height;
                break;
        }
        
        // Create and add the alien
        const alien = new Alien(
            x,
            y,
            alienType,
            this.game.canvas.width,
            this.game.canvas.height,
            this.game.player.x,
            this.game.player.y
        );
        
        // Add a small random variation to the alien's velocity
        // This helps prevent aliens from following the exact same path and overlapping
        const variationFactor = 0.15; // 15% maximum variation
        alien.vx *= (1 + (Math.random() * 2 - 1) * variationFactor);
        alien.vy *= (1 + (Math.random() * 2 - 1) * variationFactor);
        
        this.aliens.push(alien);
    }
    
    updateAliens() {
        // Update aliens with the game's pause state
        for (let i = this.aliens.length - 1; i >= 0; i--) {
            this.aliens[i].update(this.aliens, this.game.player.x, this.game.player.y, this.game.isPaused);
            
            // Only remove off-screen aliens if the game is not paused
            if (!this.game.isPaused && this.aliens[i].isOffScreen()) {
                this.aliens.splice(i, 1);
            }
        }
        
        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update();
            
            // Remove explosions that are finished
            if (this.explosions[i].isFinished()) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    resetAlienVelocities() {
        // Reset all alien velocities to 0 when game is paused
        for (const alien of this.aliens) {
            alien.vx = 0;
            alien.vy = 0;
        }
    }
    
    getRandomSpawnPosition() {
        // Determine spawn position (outside the screen)
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        let attempts = 0;
        const maxAttempts = 10; // Maximum number of attempts to find a non-overlapping position
        
        do {
            switch (side) {
                case 0: // top
                    x = Math.random() * this.game.canvas.width;
                    y = -50;
                    break;
                case 1: // right
                    x = this.game.canvas.width + 50;
                    y = Math.random() * this.game.canvas.height;
                    break;
                case 2: // bottom
                    x = Math.random() * this.game.canvas.width;
                    y = this.game.canvas.height + 50;
                    break;
                case 3: // left
                    x = -50;
                    y = Math.random() * this.game.canvas.height;
                    break;
            }
            
            // Check if this position would overlap with any existing aliens
            if (this.isPositionClear(x, y)) {
                return { x, y };
            }
            
            attempts++;
        } while (attempts < maxAttempts);
        
        // If we couldn't find a clear position after maxAttempts, return the last position
        // This is a fallback to prevent infinite loops
        return { x, y };
    }
    
    isPositionClear(x, y) {
        // Determine the minimum safe distance between aliens
        // This should be based on the largest alien size plus some buffer
        const safeDistance = GAME_CONFIG.ENEMY.LARGE.SIZE * 1.2; // 20% buffer
        
        // Check distance to all existing aliens
        for (const alien of this.aliens) {
            const dx = x - alien.x;
            const dy = y - alien.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If too close to an existing alien, position is not clear
            if (distance < safeDistance) {
                return false;
            }
        }
        
        // No overlaps found, position is clear
        return true;
    }
    
    reset() {
        // Clear all aliens and explosions
        this.aliens = [];
        this.explosions = [];
        
        // Reset spawn timer
        if (this.alienSpawnerTimeout) {
            clearTimeout(this.alienSpawnerTimeout);
            this.alienSpawnerTimeout = null;
        }
        
        // Reset game start time and available types
        this.gameStartTime = Date.now();
        this.availableTypes = [1]; // Reset to only small aliens
    }
    
    getAliens() {
        return this.aliens;
    }
    
    addExplosion(x, y, size) {
        const explosion = new AlienExplosion(x, y, size);
        this.explosions.push(explosion);
    }
    
    drawExplosions(ctx) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.draw(ctx, this.game.assets.getExplosionImage());
        }
    }
}

class AlienCollisionDetector {
    static checkBulletAlienCollision(bullet, alien) {
        const dx = bullet.x - alien.x;
        const dy = bullet.y - alien.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < alien.size / 2 + bullet.size / 2;
    }
    
    static checkPlayerAlienCollision(player, alien) {
        const dx = player.x - alien.x;
        const dy = player.y - alien.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < alien.size / 2 + player.size / 2;
    }
}

// Export the classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Alien,
        AlienExplosion,
        AlienManager,
        AlienCollisionDetector
    };
}