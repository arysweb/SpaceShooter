class MysteryBox {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = GAME_CONFIG.MYSTERY_BOX.SIZE;
        this.coins = GAME_CONFIG.MYSTERY_BOX.COINS;
        this.points = GAME_CONFIG.MYSTERY_BOX.POINTS;
        this.rotation = 0;
        this.scale = 1.0;
        this.pulseDirection = 1;
        
        // Fade out properties
        this.lifespan = GAME_CONFIG.MYSTERY_BOX.LIFESPAN;
        this.creationTime = Date.now();
        this.opacity = 1.0;
        this.isFadingOut = false;
    }
    
    update() {
        // Make the box pulse (scale up and down)
        this.scale += this.pulseDirection * GAME_CONFIG.MYSTERY_BOX.PULSE_SPEED;
        
        // Reverse direction if reaching scale limits
        if (this.scale > 1.2) {
            this.scale = 1.2;
            this.pulseDirection = -1;
        } else if (this.scale < 0.8) {
            this.scale = 0.8;
            this.pulseDirection = 1;
        }
        
        // Check if it's time to start fading out
        const elapsedTime = Date.now() - this.creationTime;
        if (elapsedTime >= this.lifespan) {
            this.isFadingOut = true;
        }
        
        // Handle fade-out
        if (this.isFadingOut) {
            // Fade out using config speed
            this.opacity = Math.max(0, this.opacity - GAME_CONFIG.MYSTERY_BOX.FADE_SPEED);
        }
    }
    
    draw(ctx, image) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Apply opacity
        ctx.globalAlpha = this.opacity;
        
        // Check if image is loaded and not broken
        if (image && image.complete && image.naturalWidth > 0) {
            ctx.drawImage(
                image,
                -this.size / 2,
                -this.size / 2,
                this.size,
                this.size
            );
        } else {
            // Fallback: Draw a simple box if image is not available
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            
            // Draw question mark
            ctx.fillStyle = 'black';
            ctx.font = `${this.size / 2}px 'Press Start 2P'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', 0, 0);
        }
        
        ctx.restore();
    }
    
    static spawn(canvasWidth, canvasHeight) {
        // Random position within the visible area (with margin)
        const margin = 100;
        const x = margin + Math.random() * (canvasWidth - 2 * margin);
        const y = margin + Math.random() * (canvasHeight - 2 * margin);
        
        return new MysteryBox(x, y);
    }
    
    // Check if the box should be removed (completely faded out)
    isExpired() {
        return this.isFadingOut && this.opacity <= 0;
    }
}

// Explosion effect when mystery box is hit
class Explosion {
    constructor(x, y, size, powerupType) {
        this.x = x;
        this.y = y;
        this.size = size * GAME_CONFIG.MYSTERY_BOX.EXPLOSION.SIZE_MULTIPLIER;
        this.opacity = 0; // Start with 0 opacity and fade in
        this.fadeInComplete = false;
        this.creationTime = Date.now();
        this.lifespan = GAME_CONFIG.MYSTERY_BOX.EXPLOSION.LIFESPAN;
        this.scale = 0.5; // Start small
        this.maxScale = 1.0; // Grow to full size
        
        // Text effect properties
        this.powerupType = powerupType || 'damage'; // Default to damage
        this.text = this.getPowerupText(powerupType);
        this.textY = y; // Initial Y position same as explosion
        this.textOpacity = 1.0;
        this.textSpeed = GAME_CONFIG.MYSTERY_BOX.EXPLOSION.TEXT_SPEED;
        this.textLifespan = GAME_CONFIG.MYSTERY_BOX.EXPLOSION.TEXT_LIFESPAN;
    }
    
    getPowerupText(type) {
        // Find matching powerup type in config
        const powerupConfig = GAME_CONFIG.MYSTERY_BOX.POWERUPS.TYPES.find(p => p.TYPE === type);
        return powerupConfig ? powerupConfig.TEXT : GAME_CONFIG.MYSTERY_BOX.POWERUPS.TYPES[0].TEXT;
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
        
        // Update floating text
        this.textY -= this.textSpeed; // Move text upward
        
        // Text fades out more gradually over the entire lifespan
        this.textOpacity = Math.max(0, 1 - (elapsedTime / this.textLifespan));
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
        
        // Draw floating text
        ctx.save();
        ctx.globalAlpha = this.textOpacity;
        ctx.fillStyle = GAME_CONFIG.MYSTERY_BOX.EXPLOSION.TEXT_COLOR;
        ctx.font = GAME_CONFIG.MYSTERY_BOX.EXPLOSION.TEXT_FONT;
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.x, this.textY - this.size/2 - 5); // Position text above explosion
        ctx.restore();
    }
    
    isFinished() {
        return this.fadeInComplete && this.opacity <= 0.05; // Remove when almost invisible
    }
}

// Mystery box manager to handle spawning and updating
class MysteryBoxManager {
    constructor(game) {
        this.game = game;
        this.mysteryBoxes = [];
        this.explosions = [];
        this.spawnTimeout = null;
        
        // Get powerup types from config
        this.powerupTypes = GAME_CONFIG.MYSTERY_BOX.POWERUPS.TYPES.map(p => p.TYPE);
    }
    
    // Get a random powerup type with equal probability
    getRandomPowerupType() {
        // Get a random index from the powerup types array
        const randomIndex = Math.floor(Math.random() * this.powerupTypes.length);
        
        // Return the powerup type at that index
        return this.powerupTypes[randomIndex];
    }
    
    scheduleMysteryBoxSpawn() {
        // Prevent spawning if not allowed
        if (!window.gameState || !window.gameState.canSpawn) {
            return;
        }

        // Clear any existing timeout
        if (this.spawnTimeout) {
            clearTimeout(this.spawnTimeout);
            this.spawnTimeout = null;
        }
        
        // Don't schedule if game is over
        if (this.game.gameOver) return;
        
        // Random spawn interval between min and max
        const spawnInterval = Math.random() * 
            (GAME_CONFIG.MYSTERY_BOX.MAX_SPAWN_INTERVAL - GAME_CONFIG.MYSTERY_BOX.MIN_SPAWN_INTERVAL) + 
            GAME_CONFIG.MYSTERY_BOX.MIN_SPAWN_INTERVAL;
        
        // Schedule the spawn
        this.spawnTimeout = setTimeout(() => {
            // Only spawn if the game is not paused and there are no existing boxes
            if (!this.game.isPaused && !this.game.gameOver && this.mysteryBoxes.length === 0) {
                this.spawnMysteryBox();
            }
            // Always schedule next spawn unless game is over
            if (!this.game.gameOver) {
                this.scheduleMysteryBoxSpawn();
            }
        }, spawnInterval);
    }
    
    spawnMysteryBox() {
        // Spawn a mystery box
        this.mysteryBoxes.push(MysteryBox.spawn(this.game.canvas.width, this.game.canvas.height));
    }
    
    update() {
        // Don't update if game is paused or over
        if (this.game.isPaused || this.game.gameOver) {
            return;
        }
        
        // Update mystery boxes
        for (const box of this.mysteryBoxes) {
            box.update();
        }
        
        // Update explosions
        for (const explosion of this.explosions) {
            explosion.update();
        }
        
        // Remove expired boxes
        this.mysteryBoxes = this.mysteryBoxes.filter(box => !box.isExpired());
        
        // Remove finished explosions
        this.explosions = this.explosions.filter(explosion => !explosion.isFinished());
        
        // Schedule next spawn if needed
        if (this.mysteryBoxes.length === 0 && !this.spawnTimeout && !this.game.gameOver) {
            this.scheduleMysteryBoxSpawn();
        }
    }
    
    draw(ctx, mysteryBoxImage, explosionImage) {
        // Draw mystery boxes
        for (const box of this.mysteryBoxes) {
            box.draw(ctx, mysteryBoxImage);
        }
        
        // Draw explosions
        for (const explosion of this.explosions) {
            explosion.draw(ctx, explosionImage);
        }
    }
    
    checkCollisions(bullets, addScore, addCoins, createCoinEffect, createExplosionEffect, addLife) {
        // Check bullet collisions with mystery boxes
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            for (let j = this.mysteryBoxes.length - 1; j >= 0; j--) {
                const box = this.mysteryBoxes[j];
                
                if (this.checkBulletMysteryBoxCollision(bullet, box)) {
                    // Get random powerup type
                    const powerupType = this.getRandomPowerupType();
                    
                    // Apply powerup effect based on type
                    switch(powerupType) {
                        case 'damage':
                            // Increase player's damage
                            this.game.increaseDamage();
                            break;
                        case 'coins10':
                            // Find the powerup config to get the coin value
                            const coinPowerup = GAME_CONFIG.MYSTERY_BOX.POWERUPS.TYPES.find(p => p.TYPE === powerupType);
                            if (coinPowerup && coinPowerup.VALUE) {
                                addCoins(coinPowerup.VALUE);
                            }
                            break;
                        case 'heart':
                            if (addLife) addLife(); // Add life if function is provided
                            break;
                        case 'crit':
                            // Increase player's critical hit chance
                            this.game.increaseCritChance();
                            break;
                        case 'firerate':
                            // Increase player's fire rate
                            this.game.increaseFireRate();
                            break;
                    }
                    
                    // Create explosion effect with the powerup type
                    createExplosionEffect(box.x, box.y, box.size, powerupType);
                    
                    // Remove mystery box and bullet
                    this.mysteryBoxes.splice(j, 1);
                    bullets.splice(i, 1);
                    
                    // We found a collision, so break out of the inner loop
                    break;
                }
            }
        }
    }
    
    checkBulletMysteryBoxCollision(bullet, mysteryBox) {
        const dx = bullet.x - mysteryBox.x;
        const dy = bullet.y - mysteryBox.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < mysteryBox.size / 2;
    }
    
    reset() {
        // Clear all mystery boxes and explosions
        this.mysteryBoxes = [];
        this.explosions = [];
        
        // Clear spawn timer
        if (this.spawnTimeout) {
            clearTimeout(this.spawnTimeout);
            this.spawnTimeout = null;
        }
    }
    
    getMysteryBoxes() {
        return this.mysteryBoxes;
    }
    
    createExplosionEffect(x, y, size, powerupType) {
        this.explosions.push(new Explosion(x, y, size, powerupType));
    }
}

// Export the classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MysteryBox,
        MysteryBoxManager,
        Explosion
    };
} else {
    // For browser environment
    window.MysteryBox = MysteryBox;
    window.MysteryBoxManager = MysteryBoxManager;
    window.Explosion = Explosion;
}