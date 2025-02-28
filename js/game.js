class CoinEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10; // default size
        this.alpha = 1;
        this.vy = -2; // Move upward
        this.lifeTime = 0;
        this.maxLifeTime = 60; // frames
    }
    
    update() {
        this.y += this.vy;
        this.lifeTime++;
        this.alpha = 1 - (this.lifeTime / this.maxLifeTime);
    }
    
    draw(ctx, image) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
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
            // Fallback: Draw a simple coin if image is not available
            ctx.fillStyle = '#ffcc00'; // default color
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some detail
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    isDead() {
        return this.lifeTime >= this.maxLifeTime;
    }
    
    static createMultiple(x, y, count) {
        const effects = [];
        
        for (let i = 0; i < count; i++) {
            // Add some random offset to make it look more natural
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = (Math.random() - 0.5) * 30;
            
            effects.push(new CoinEffect(x + offsetX, y + offsetY));
        }
        
        return effects;
    }
}

class CriticalHitEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = 1;
        this.scale = 1;
        this.lifeTime = 0;
        this.maxLifeTime = 30; // frames
    }
    
    update() {
        this.lifeTime++;
        this.alpha = Math.max(0, 1 - (this.lifeTime / this.maxLifeTime));
        this.scale += 0.1;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#ff0000';
        ctx.font = `bold ${16 * this.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('CRIT!', this.x, this.y);
        ctx.restore();
    }
    
    isDead() {
        return this.lifeTime >= this.maxLifeTime;
    }
}

class DamageEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = 1;
        this.scale = 1;
        this.lifeTime = 0;
        this.maxLifeTime = 30; // frames
    }
    
    update() {
        this.lifeTime++;
        this.alpha = Math.max(0, 1 - (this.lifeTime / this.maxLifeTime));
        this.scale += 0.1;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#ff3333';
        ctx.font = `bold ${20 * this.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('-1 LIFE', this.x, this.y);
        ctx.restore();
    }
    
    isDead() {
        return this.lifeTime >= this.maxLifeTime;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.coins = 0;
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Initialize managers and UI
        this.ui = new GameUI();
        this.assets = new AssetLoader();
        this.shop = new Shop(this);
        
        // Initialize player stats manager (after UI)
        this.playerStats = new PlayerStats(this);
        
        // Set up high frequency player updates
        this.lastPlayerUpdate = 0;
        this.playerUpdateInterval = 1000 / 144; // 144 Hz updates for player rotation
        
        // Initialize game objects after canvas setup
        this.setupCanvas();
        this.setupInputHandling();
        this.setupPauseHandler();
        this.initializeGameObjects();
        
        // Initialize UI
        this.ui.updateScore(this.score);
        this.ui.updateCoins(this.coins);
        this.ui.updateLives(3); // default lives
        
        // Start game loop
        this.gameLoop();
    }
    
    initializeGameObjects() {
        // Initialize game state
        this.lives = 3; // default lives
        this.gameStartTime = Date.now();
        
        // Initialize empty arrays for game entities
        this.bullets = [];
        this.coinEffects = [];
        this.criticalHitEffects = [];
        this.damageEffects = [];
        
        // Initialize managers
        this.alienManager = new AlienManager(this);
        this.mysteryBoxManager = new MysteryBoxManager(this);
        this.cloudManager = new CloudManager(this);
        
        // Create player in center of screen
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this);
        
        // Now update UI with player properties
        this.ui.updateCritChance(0); // Start with no crit chance
        this.ui.updateDamage(1); // default damage
        this.ui.updateFireRate(0); // default fire rate (no bonus)
        
        // Initialize mouse position
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        // Set up input handling
        this.setupInputHandling();
        
        // Set up initial clouds
        this.cloudManager.setupInitialClouds();
        
        // Start spawners
        this.alienManager.startAlienSpawner();
        this.cloudManager.startCloudSpawner();
        this.mysteryBoxManager.scheduleMysteryBoxSpawn();
        
        // Set up shop button
        document.getElementById('shopButton').addEventListener('click', () => {
            this.openShop();
        });
        
        // Set up restart button
        this.ui.setupRestartButton(() => this.resetGame());
        
        // Set up shop from pause button
        document.getElementById('shopFromPauseButton').addEventListener('click', () => {
            // Hide pause overlay
            document.getElementById('pauseOverlay').style.display = 'none';
            // Open shop
            this.openShop();
        });
    }
    
    resetGame() {
        // Reset game state
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.coins = 0;
        this.lives = 3; // default lives
        this.gameStartTime = Date.now();
        
        // Reset all entities
        this.bullets = [];
        this.coinEffects = [];
        this.criticalHitEffects = [];
        this.damageEffects = [];
        
        // Create player in center of screen with default stats
        this.player = new Player(
            this.canvas.width / 2,
            this.canvas.height / 2,
            this
        );
        
        // Reset player stats using the PlayerStats manager
        this.playerStats.reset();
        
        // Reset all managers
        this.alienManager.reset();
        this.mysteryBoxManager.reset();
        this.cloudManager.reset();
        this.shop.reset();
        
        // Hide all overlays
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('shopOverlay').style.display = 'none';
        document.getElementById('pauseOverlay').style.display = 'none';
        
        // Update UI
        this.ui.updateScore(this.score);
        this.ui.updateCoins(this.coins);
        this.ui.updateCritChance(this.player.critChance);
        this.ui.updateDamage(this.player.damage);
        this.ui.updateFireRate(this.player.fireRate);
        this.ui.updateLives(this.lives);
        this.ui.hideGameOver();
        
        // Restart game systems
        this.alienManager.startAlienSpawner();
        this.cloudManager.startCloudSpawner();
        this.mysteryBoxManager.scheduleMysteryBoxSpawn();
    }
    
    startGame() {
        console.log('Game started');
        
        // Reset game state
        this.gameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.coins = 0;
        
        // Reset player stats
        this.playerStats.reset();
        
        // Reset UI
        this.ui.updateScore(this.score);
        this.ui.updateCoins(this.coins);
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('pauseOverlay').style.display = 'none';
        
        // Reset alien manager's game start time and available types
        this.alienManager.gameStartTime = Date.now();
        this.alienManager.availableTypes = [1]; // Reset to only small aliens
        
        // Start spawners
        this.alienManager.startAlienSpawner();
        this.mysteryBoxManager.scheduleMysteryBoxSpawn();
        this.cloudManager.startCloudSpawner();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Keep player in center of screen after resize
        if (this.player) {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height / 2;
        }
    }
    
    setupInputHandling() {
        // Get canvas rect once and update it on resize
        let canvasRect = this.canvas.getBoundingClientRect();
        window.addEventListener('resize', () => {
            canvasRect = this.canvas.getBoundingClientRect();
        });
        
        // Handle mouse movement with high precision
        this.canvas.addEventListener('mousemove', (event) => {
            // Use client coordinates and canvas scale for pixel-perfect accuracy
            const scaleX = this.canvas.width / canvasRect.width;
            const scaleY = this.canvas.height / canvasRect.height;
            
            this.mouseX = (event.clientX - canvasRect.left) * scaleX;
            this.mouseY = (event.clientY - canvasRect.top) * scaleY;
            
            // Immediately update player rotation for responsive aiming
            if (this.player) {
                this.player.updateRotation(this.mouseX, this.mouseY);
            }
        });
        
        // Handle mouse click
        this.canvas.addEventListener('mousedown', () => {
            this.isMouseDown = true;
        });
        
        // Handle mouse release
        this.canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
        
        // Handle mouse leaving canvas
        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
        });
        
        // Handle keyboard input
        document.addEventListener('keydown', (event) => {
            // ESC key - Toggle pause
            if (event.key === 'Escape') {
                if (this.shop.isOpen) {
                    // If shop is open, close it
                    this.shop.close();
                    
                    // Always pause the game when ESC is pressed
                    this.isPaused = true;
                    document.getElementById('pauseOverlay').style.display = 'block';
                } else {
                    // Toggle pause state
                    this.togglePause();
                }
                // Prevent default behavior (like browser's ESC functions)
                event.preventDefault();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupPauseHandler() {
        // Handle pause with ESC key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (this.gameOver) return;
                
                this.isPaused = !this.isPaused;
                
                // Update UI
                document.getElementById('pauseOverlay').style.display = this.isPaused ? 'flex' : 'none';
                
                // Reset velocities when pausing
                if (this.isPaused) {
                    this.alienManager.resetAlienVelocities();
                }
            }
        });
    }
    
    tryPlayerShoot() {
        if (this.gameOver || this.isPaused || !this.player) return;
        
        const bullet = this.player.tryFire();
        if (bullet) {
            // Determine if this specific bullet is a critical hit based on player's crit chance
            const isCriticalHit = Math.random() * 100 < this.player.critChance;
            
            this.bullets.push(new Bullet(
                bullet.x,
                bullet.y,
                bullet.vx,
                bullet.vy,
                bullet.size,
                bullet.damage,
                isCriticalHit // Pass whether this specific bullet is a critical hit
            ));
        }
    }
    
    updateEntities() {
        // Don't update if the game is paused or over
        if (this.isPaused || this.gameOver) {
            return;
        }
        
        // Try to fire automatically - do this first for best responsiveness
        this.tryPlayerShoot();
        
        // Update player at higher frequency
        const now = performance.now();
        if (now - this.lastPlayerUpdate >= this.playerUpdateInterval) {
            this.player.update(this.mouseX, this.mouseY);
            this.lastPlayerUpdate = now;
        }
        
        // Update bullets
        this.updateBullets();
        
        // Update coin effects
        this.updateCoinEffects();
        
        // Update critical hit effects
        this.updateCriticalHitEffects();
        
        // Update damage effects
        this.updateDamageEffects();
        
        // Update mystery boxes
        this.mysteryBoxManager.update();
        
        // Update clouds
        this.cloudManager.update();
        
        // Check for collisions
        this.checkCollisions();
    }
    
    addCoinEffect(x, y, count) {
        const effects = CoinEffect.createMultiple(x, y, count);
        this.coinEffects.push(...effects);
    }
    
    addCriticalHitEffect(x, y) {
        this.criticalHitEffects.push(new CriticalHitEffect(x, y));
    }
    
    addDamageEffect(x, y) {
        this.damageEffects.push(new DamageEffect(x, y));
    }
    
    checkCollisions() {
        // Don't check collisions if the game is paused or over
        if (this.isPaused || this.gameOver) {
            return;
        }
        
        // Check bullet collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            let bulletHit = false;
            
            // Check collision with aliens
            const aliens = this.alienManager.getAliens();
            for (let j = aliens.length - 1; j >= 0; j--) {
                const alien = aliens[j];
                
                if (AlienCollisionDetector.checkBulletAlienCollision(bullet, alien)) {
                    // Check if this is a critical hit bullet
                    if (bullet.isCritical) {
                        // Critical hit - instantly kill the alien
                        alien.health = 0;
                        
                        // Visual feedback for critical hit
                        this.addCriticalHitEffect(alien.x, alien.y);
                    } else {
                        // Normal hit - reduce alien health by bullet damage
                        alien.health -= bullet.damage;
                    }
                    
                    // Remove bullet regardless of whether alien is destroyed
                    this.bullets.splice(i, 1);
                    bulletHit = true;
                    
                    // Check if alien is destroyed
                    if (alien.health <= 0) {
                        // Add score
                        this.score += alien.points;
                        
                        // Add coins
                        this.coins += alien.coins;
                        
                        // Create coin effect
                        this.addCoinEffect(alien.x, alien.y, alien.coins);
                        
                        // Create explosion effect
                        this.alienManager.addExplosion(alien.x, alien.y, alien.size);
                        
                        // Remove alien
                        aliens.splice(j, 1);
                        
                        // Update displays
                        this.ui.updateScore(this.score);
                        this.ui.updateCoins(this.coins);
                    }
                    
                    break;
                }
            }
            
            // If bullet already hit something, continue to next bullet
            if (bulletHit) continue;
            
            // Check collision with mystery boxes
            this.mysteryBoxManager.checkCollisions(
                this.bullets, 
                (points) => {
                    this.score += points;
                    this.ui.updateScore(this.score);
                },
                (coins) => {
                    this.coins += coins;
                    this.ui.updateCoins(this.coins);
                },
                (x, y, amount) => this.addCoinEffect(x, y, amount),
                (x, y, size, type) => this.addExplosionEffect(x, y, size, type),
                () => this.addLife()
            );
        }
        
        // Check player collision with aliens
        if (!this.gameOver && this.player) {
            const aliens = this.alienManager.getAliens();
            for (const alien of aliens) {
                if (!this.player.isInvincible && AlienCollisionDetector.checkPlayerAlienCollision(this.player, alien)) {
                    console.log(`Player hit by alien! Lives remaining: ${this.lives}`);
                    // Player hit by alien, lose a life
                    this.lives--;
                    this.ui.updateLives(this.lives);
                    
                    // Visual feedback for damage
                    this.addDamageEffect(this.player.x, this.player.y);
                    
                    // Make player invincible for a short time to prevent multiple hits
                    this.player.makeInvincible();
                    
                    if (this.lives <= 0) {
                        this.gameOver = true;
                        this.ui.showGameOver(this.score, this.coins);
                        this.ui.setupRestartButton(() => this.resetGame());
                    }
                }
            }
        }
    }
    
    drawEntities() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds (background)
        this.cloudManager.draw(this.ctx, this.assets.getCloudImages());
        
        // Draw mystery boxes
        this.mysteryBoxManager.draw(
            this.ctx, 
            this.assets.getMysteryBoxImage(),
            this.assets.getExplosionImage()
        );
        
        // Draw aliens
        const aliens = this.alienManager.getAliens();
        for (const alien of aliens) {
            alien.draw(this.ctx, this.assets.getAlienImage(alien.type));
        }
        
        // Draw alien explosions
        this.alienManager.drawExplosions(this.ctx);
        
        // Draw player
        this.player.draw(this.ctx, this.assets.getPlayerImage());
        
        // Draw bullets
        for (const bullet of this.bullets) {
            bullet.draw(this.ctx, this.assets.getPlayerProjectileImage(), this.assets.getCritProjectileImage());
        }
        
        // Draw coin effects
        for (const effect of this.coinEffects) {
            effect.draw(this.ctx, this.assets.getCoinImage());
        }
        
        // Draw critical hit effects
        for (const effect of this.criticalHitEffects) {
            effect.draw(this.ctx);
        }
        
        // Draw damage effects
        for (const effect of this.damageEffects) {
            effect.draw(this.ctx);
        }
    }
    
    gameLoop() {
        // Check if game is paused globally
        if (window.gamePaused) {
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Always update aliens to handle pause state
        this.alienManager.updateAliens();
        
        // Check if game is over
        if (this.gameOver) {
            // Still draw the entities in their final positions
            this.drawEntities();
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        // Check if game is paused
        if (this.isPaused) {
            // When paused, just draw the current state without updating
            this.drawEntities();
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        // Update all other game entities
        this.updateEntities();
        
        // Draw all entities
        this.drawEntities();
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    handleMouseMove(event) {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }
    
    handleClick() {
        if (this.gameOver || this.isPaused) return;
        
        // Create a bullet
        const angle = this.player.rotation;
        const bulletSpeed = 10; // default speed
        const bulletSize = 10; // default size
        
        // Calculate bullet velocity based on player rotation
        const vx = Math.cos(angle) * bulletSpeed;
        const vy = Math.sin(angle) * bulletSpeed;
        
        // Determine if this specific bullet is a critical hit based on player's crit chance
        const isCriticalHit = Math.random() * 100 < this.player.critChance;
        
        // Create bullet at player position
        this.bullets.push(new Bullet(
            this.player.x,
            this.player.y,
            vx,
            vy,
            bulletSize,
            this.player.damage,
            isCriticalHit // Pass whether this specific bullet is a critical hit
        ));
    }
    
    updateBullets() {
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            
            // Remove bullets that are off-screen
            if (this.bullets[i].isOffScreen(this.canvas.width, this.canvas.height)) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateCoinEffects() {
        // Update coin effects
        for (let i = this.coinEffects.length - 1; i >= 0; i--) {
            this.coinEffects[i].update();
            
            // Remove coin effects that are done
            if (this.coinEffects[i].isDead()) {
                this.coinEffects.splice(i, 1);
            }
        }
    }
    
    updateCriticalHitEffects() {
        // Update critical hit effects
        for (let i = this.criticalHitEffects.length - 1; i >= 0; i--) {
            this.criticalHitEffects[i].update();
            
            // Remove critical hit effects that are done
            if (this.criticalHitEffects[i].isDead()) {
                this.criticalHitEffects.splice(i, 1);
            }
        }
    }
    
    updateDamageEffects() {
        // Update damage effects
        for (let i = this.damageEffects.length - 1; i >= 0; i--) {
            this.damageEffects[i].update();
            
            // Remove damage effects that are done
            if (this.damageEffects[i].isDead()) {
                this.damageEffects.splice(i, 1);
            }
        }
    }
    
    addLife() {
        // Find the heart powerup config to get the value
        const heartPowerup = GAME_CONFIG.MYSTERY_BOX.POWERUPS.TYPES.find(p => p.TYPE === 'heart');
        const livesToAdd = (heartPowerup && heartPowerup.VALUE) ? heartPowerup.VALUE : 1;
        
        // Ensure MAX_LIVES is capped at 6
        GAME_CONFIG.PLAYER.MAX_LIVES = Math.min(GAME_CONFIG.PLAYER.MAX_LIVES, 6);
        
        if (this.lives < GAME_CONFIG.PLAYER.MAX_LIVES) {
            this.lives = Math.min(this.lives + livesToAdd, GAME_CONFIG.PLAYER.MAX_LIVES);
            console.log(`Player lives increased to ${this.lives}`);
            this.ui.updateLives(this.lives);
        }
    }
    
    increaseDamage() {
        // Use PlayerStats to increase damage level (uses default 0.5 increment)
        this.playerStats.increaseDamageLevel();
    }
    
    increaseCritChance() {
        // Use PlayerStats to increase crit chance level (uses default 0.5 increment)
        this.playerStats.increaseCritChanceLevel();
    }
    
    increaseFireRate() {
        // Use PlayerStats to increase fire rate level (uses default 0.5 increment)
        this.playerStats.increaseFireRateLevel();
    }
    
    addExplosionEffect(x, y, size, powerupType) {
        this.mysteryBoxManager.createExplosionEffect(x, y, size, powerupType);
    }
    
    pauseGame() {
        if (this.gameOver) return;
        
        console.log('Game paused');
        
        // Set pause state
        this.isPaused = true;
        
        // Stop all spawners immediately
        if (this.alienManager.alienSpawnerTimeout) {
            clearTimeout(this.alienManager.alienSpawnerTimeout);
            this.alienManager.alienSpawnerTimeout = null;
        }
        
        if (this.mysteryBoxManager.mysteryBoxTimeout) {
            clearTimeout(this.mysteryBoxManager.mysteryBoxTimeout);
            this.mysteryBoxManager.mysteryBoxTimeout = null;
        }
        
        if (this.cloudManager.cloudSpawnerTimeout) {
            clearTimeout(this.cloudManager.cloudSpawnerTimeout);
            this.cloudManager.cloudSpawnerTimeout = null;
        }
        
        // Only show pause overlay if shop is not open
        if (!this.shop.isOpen) {
            document.getElementById('pauseOverlay').style.display = 'block';
        }
    }
    
    resumeGame() {
        if (this.gameOver || this.shop.isOpen) return;
        
        console.log('Game resumed');
        
        // Set resume state
        this.isPaused = false;
        
        // Restart spawners if they were stopped
        this.alienManager.startAlienSpawner();
        this.mysteryBoxManager.scheduleMysteryBoxSpawn();
        this.cloudManager.startCloudSpawner();
        
        // Hide pause overlay
        document.getElementById('pauseOverlay').style.display = 'none';
    }
    
    togglePause() {
        if (this.gameOver || this.shop.isOpen) return;
        
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
        
        console.log(`Game is now ${this.isPaused ? 'paused' : 'running'}`);
    }
    
    openShop() {
        if (this.gameOver) return;
        this.isPaused = true;
        document.getElementById('pauseOverlay').style.display = 'none';
        this.shop.show();
    }
    
    closeShop() {
        this.shop.hide();
        this.isPaused = false;
        // Resume the game and restart alien spawning
        this.alienManager.startAlienSpawner();
    }
}

// Initialize game when the window loads
window.addEventListener('load', () => {
    window.gameInstance = new Game();
});
