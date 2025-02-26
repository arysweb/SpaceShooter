const GAME_CONFIG = {
    // Player settings
    PLAYER: {
        SIZE: 20,
        FIRE_RATE: 300, // 300ms between shots
        PROJECTILE_SPEED: 10,
        PROJECTILE_SIZE: 10,
        PROJECTILE_DAMAGE: 1, // Default damage per projectile
        IMAGE: 'img/player/player.png',
        PROJECTILE_IMAGE: 'img/player_projectile.png',
        CRIT_PROJECTILE_IMAGE: 'img/crit_projectile.png',
        STARTING_LIVES: 3,
        MAX_LIVES: 6
    },
    
    // Enemy settings
    ENEMY: {
        SPAWN_INTERVAL: 1000, // 1 second (was 2 seconds)
        LARGE: {
            SIZE: 70,
            SPEED: 0.8,
            POINTS: 15,
            COINS: 2,
            HEALTH: 4, // Health points for large aliens
            IMAGE: 'img/aliens/alien_big.png'
        },
        SMALL: {
            SIZE: 50,
            SPEED: 1,
            POINTS: 10,
            COINS: 1,
            HEALTH: 2, // Health points for small aliens
            IMAGE: 'img/aliens/alien_small.png'
        }
    },
    
    // Background elements
    BACKGROUND: {
        CLOUD_IMAGES: [
            'img/bg_elements/bg_cloud_1.png',
            'img/bg_elements/bg_cloud_2.png',
            'img/bg_elements/bg_cloud_3.png'
        ],
        CLOUD_SIZES: [500, 450, 400], // Increased sizes
        CLOUD_SPEEDS: [1, 0.7, 0.5],
        CLOUD_SPAWN_INTERVAL: 10000, 
        MIN_CLOUD_DISTANCE: 1000  // Minimum distance between clouds to prevent overlap
    },
    
    // Mystery box settings
    MYSTERY_BOX: {
        SPAWN_INTERVAL: 15000, // 15 seconds
        MIN_SPAWN_INTERVAL: 25000, // 25 seconds
        MAX_SPAWN_INTERVAL: 35000, // 35 seconds
        SIZE: 40,
        POINTS: 0,
        COINS: 5,
        IMAGE: 'img/mystery_box.png',
        ROTATION_SPEED: 0.01,
        PULSE_SPEED: 0.005,
        LIFESPAN: 5000, // 5 seconds
        FADE_SPEED: 0.05,
        EXPLOSION: {
            SIZE_MULTIPLIER: 1.2,
            LIFESPAN: 800, // milliseconds
            TEXT_LIFESPAN: 1500, // milliseconds
            TEXT_SPEED: 0.4,
            TEXT_FONT: 'bold 18px Arial',
            TEXT_COLOR: '#FFFFFF'
        },
        POWERUPS: {
            TYPES: [
                { TYPE: 'damage', TEXT: 'DAMAGE +1', WEIGHT: 5 },
                { TYPE: 'coins10', TEXT: 'COINS +10', WEIGHT: 20, VALUE: 10 },
                { TYPE: 'coins20', TEXT: 'COINS +20', WEIGHT: 15, VALUE: 20 },
                { TYPE: 'coins30', TEXT: 'COINS +30', WEIGHT: 10, VALUE: 30 },
                { TYPE: 'heart', TEXT: 'HEART +1', WEIGHT: 35 },
                { TYPE: 'crit', TEXT: 'CRIT +1', WEIGHT: 5, VALUE: 2.5 }
            ],
            EXPLOSION_IMAGE: 'img/enemy_defeted.png'
        }
    },
    
    // Visual settings
    VISUAL: {
        PIXEL_SIZE: 2,
        HEART_SIZE: 25,
        HEART_SPACING: 35,
        HEART_Y_POSITION: 30,
        HEART_IMAGE: 'img/heart.png',
        COIN_SIZE: 20,
        COIN_IMAGE: 'img/coin.png'
    },
    
    // UI settings
    UI: {
        FONT: '16px "Press Start 2P", monospace',
        MEDIUM_FONT: '20px "Press Start 2P", monospace',
        LARGE_FONT: '32px "Press Start 2P", monospace',
        HEART_SIZE: 25,
        HEART_SPACING: 35,
        HEART_Y_POSITION: 30
    },
    
    // Colors
    COLORS: {
        BACKGROUND: 'black',
        FOREGROUND: 'white',
        HEART_COLOR: '#ff3366',
        COIN_COLOR: '#ffd700'
    }
};
