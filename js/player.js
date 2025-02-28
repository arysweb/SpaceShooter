class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.rotation = 0;
        this.size = GAME_CONFIG.PLAYER.SIZE;
        this.lastFireTime = performance.now();  // Use performance.now() for precision
        
        // These values will be managed by PlayerStats
        this.damage = 1; // Initial value, will be updated by PlayerStats
        this.critChance = 0; // Initial value, will be updated by PlayerStats
        this.fireRate = 0; // Initial value, will be updated by PlayerStats
        
        // Disable shooting by default
        this.canShootFlag = false;
        
        this.isInvincible = false;
        this.invincibilityTime = 0;
        this.invincibilityDuration = 2000; // 2 seconds of invincibility after being hit
        
        // Store last mouse position for accurate shooting
        this.lastMouseX = x;
        this.lastMouseY = y;
    }
    
    enableShooting() {
        this.canShootFlag = true;
    }

    disableShooting() {
        this.canShootFlag = false;
    }
    
    updateRotation(mouseX, mouseY) {
        // Store exact mouse coordinates for shooting
        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
        
        // Update rotation to point towards mouse - direct, no smoothing
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        this.rotation = Math.atan2(dy, dx);
    }
    
    update(mouseX, mouseY) {
        // Completely disable shooting during initial phase
        if (!window.gameState || !window.gameState.canShoot) {
            this.isShooting = false;
            return;
        }

        // Update rotation using stored coordinates
        this.updateRotation(mouseX, mouseY);
        
        // Update invincibility if active
        if (this.isInvincible) {
            this.invincibilityTime += 16; // Approximate time per frame (ms)
            if (this.invincibilityTime >= this.invincibilityDuration) {
                this.isInvincible = false;
                this.invincibilityTime = 0;
                console.log("Player invincibility ended");
            }
        }
    }
    
    draw(ctx, playerImage) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Apply flashing effect if invincible
        if (this.isInvincible) {
            // Flash every 100ms
            if (Math.floor(this.invincibilityTime / 100) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
        }
        
        // Draw player image if available
        if (playerImage && playerImage.complete && playerImage.naturalWidth > 0) {
            const imageSize = this.size * 2; // Make the image a bit larger than the hitbox
            
            // First rotate to make the ship point upward (default orientation)
            // Then rotate based on the player's rotation
            const angle = this.rotation + Math.PI/2; // Add 90 degrees to make it point up
            
            ctx.rotate(angle);
            
            ctx.drawImage(
                playerImage,
                -imageSize / 2, // Center the image
                -imageSize / 2,
                imageSize,
                imageSize
            );
        } else {
            // Fallback: Draw a triangle if image is not available
            ctx.rotate(this.rotation);
            ctx.fillStyle = GAME_CONFIG.COLORS.FOREGROUND;
            ctx.beginPath();
            ctx.moveTo(this.size * 1.5, 0); // Tip (elongated)
            ctx.lineTo(-this.size / 2, -this.size / 2); // Bottom left
            ctx.lineTo(-this.size / 2, this.size / 2); // Bottom right
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    canFire() {
        // Comprehensive shooting prevention
        return this.canShootFlag && 
               window.gameState && 
               window.gameState.canShoot && 
               this.lastFireTime !== undefined && 
               performance.now() - this.lastFireTime >= this.fireDelay;
    }
    
    tryFire() {
        // Completely prevent shooting
        return null;
    }
    
    fire() {
        // Completely prevent shooting
        return null;
    }
    
    makeInvincible() {
        this.isInvincible = true;
        this.invincibilityTime = 0;
        console.log("Player is now invincible");
    }
}

class Bullet {
    constructor(x, y, vx, vy, size, damage = GAME_CONFIG.PLAYER.PROJECTILE_DAMAGE, isCritical = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.damage = damage;
        this.isCritical = isCritical;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw(ctx, projectileImage, critProjectileImage) {
        // Determine which image to use based on isCritical flag
        const image = this.isCritical ? critProjectileImage : projectileImage;
        
        // Check if image is loaded and not broken
        if (image && image.complete && image.naturalWidth > 0) {
            ctx.drawImage(
                image,
                this.x - this.size / 2,
                this.y - this.size / 2,
                this.size,
                this.size
            );
        } else {
            // Fallback: Draw a simple circle if image is not available
            ctx.fillStyle = this.isCritical ? '#ff0000' : GAME_CONFIG.COLORS.FOREGROUND;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    isOffScreen(canvasWidth, canvasHeight) {
        const margin = this.size * 2;
        return (
            this.x < -margin ||
            this.x > canvasWidth + margin ||
            this.y < -margin ||
            this.y > canvasHeight + margin
        );
    }
}