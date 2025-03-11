// Получаем элементы DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const energyElement = document.getElementById('energy');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('startButton');

// Определяем, является ли устройство мобильным
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Настройка размеров канваса
function setupCanvas() {
    if (isMobile) {
        const screenWidth = Math.min(window.innerWidth - 20, 500);
        canvas.width = screenWidth;
        canvas.height = Math.floor(screenWidth * 0.75);
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }
}

// Настройки игры
let gameRunning = false;
let score = 0;
let energy = 100;
let level = 1;
let stars = [];
let planets = [];
let asteroids = [];
let enemies = [];
let projectiles = [];
let powerUps = [];
let particles = [];
let gameSpeed = 1;

// Состояния power-up'ов
let shieldActive = false;
let rapidFireActive = false;
let doubleDamageActive = false;
let powerUpDuration = 10000; // 10 секунд

// Игрок (космический корабль)
let player = {
    x: 0,
    y: 0,
    width: 50,
    height: 60,
    speed: 5,
    fireRate: 500, // мс между выстрелами
    lastShot: 0,
    isInvulnerable: false,
    invulnerabilityTime: 0,
    invulnerabilityDuration: 2000 // 2 секунды неуязвимости после получения урона
};

// Виртуальный джойстик для мобильных устройств
let joystick = {
    active: false,
    startX: 0,
    startY: 0,
    moveX: 0,
    moveY: 0
};

// Управление
let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    up: false,
    down: false,
    left: false,
    right: false,
    space: false
};

// Добавим изображение космического вермизлюка
const wormImg = new Image();
wormImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/></svg>');

// Инициализация размеров канваса
setupCanvas();
player.x = canvas.width / 2 - player.width / 2;
player.y = canvas.height - player.height - 20;

// Загрузка изображений
const playerImg = new Image();
playerImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60"><path d="M25 0 L10 50 L25 40 L40 50 Z" fill="#4adc10"/><path d="M20 50 L25 60 L30 50 Z" fill="#4adc10"/><circle cx="25" cy="25" r="8" fill="#fff" opacity="0.8"/></svg>');

const asteroidImg = new Image();
asteroidImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M20 0 L30 10 L40 15 L35 25 L38 35 L25 40 L10 38 L0 25 L5 15 L15 5 Z" fill="#a67c52"/><circle cx="15" cy="15" r="3" fill="#8a6642"/><circle cx="28" cy="22" r="4" fill="#8a6642"/><circle cx="18" cy="30" r="2" fill="#8a6642"/></svg>');

const enemyImg = new Image();
enemyImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M20 0 L0 20 L20 40 L40 20 Z" fill="#ff4040"/><circle cx="20" cy="20" r="10" fill="#800000"/><circle cx="20" cy="20" r="5" fill="#ff0000"/></svg>');

const cabbageImg = new Image();
cabbageImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="#4adc10"/><path d="M5 15 Q15 5 25 15" stroke="#d8f0c0" stroke-width="2" fill="none"/><path d="M5 20 Q15 10 25 20" stroke="#d8f0c0" stroke-width="2" fill="none"/></svg>');

const planetImg = new Image();
planetImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#3498db"/><path d="M30 30 Q50 20 70 30 T90 50 T70 70 T50 80 T30 70 T10 50 T30 30" fill="#2980b9"/><circle cx="35" cy="40" r="10" fill="#1abc9c"/><circle cx="65" cy="60" r="15" fill="#1abc9c"/></svg>');

const shieldImg = new Image();
shieldImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="rgba(30, 144, 255, 0.5)"/><circle cx="15" cy="15" r="10" fill="none" stroke="rgba(255, 255, 255, 0.8)" stroke-width="2"/></svg>');

// Обработчики событий
startButton.addEventListener('click', startGame);

// Обработчики для десктопа
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = true;
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 's' || e.key === 'S') keys.s = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === ' ') keys.space = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') keys.w = false;
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 's' || e.key === 'S') keys.s = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === ' ') keys.space = false;
});

canvas.addEventListener('mousedown', () => {
    if (gameRunning) {
        fireProjectile();
    }
});

// Обработчики для мобильных устройств
if (isMobile) {
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        
        if (touchX > canvas.width / 2) {
            // Правая половина экрана - стрельба
            if (gameRunning) {
                fireProjectile();
            }
        } else {
            // Левая половина экрана - джойстик
            joystick.active = true;
            joystick.startX = e.touches[0].clientX - rect.left;
            joystick.startY = e.touches[0].clientY - rect.top;
            joystick.moveX = joystick.startX;
            joystick.moveY = joystick.startY;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystick.active) {
            const rect = canvas.getBoundingClientRect();
            joystick.moveX = e.touches[0].clientX - rect.left;
            joystick.moveY = e.touches[0].clientY - rect.top;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', () => {
        joystick.active = false;
    });
}

// Функция начала игры
function startGame() {
    if (!gameRunning) {
        // Сбрасываем все переменные
        gameRunning = true;
        score = 0;
        energy = 100;
        level = 1;
        gameSpeed = 1;
        
        // Обновляем отображение
        scoreElement.textContent = score;
        energyElement.textContent = energy;
        levelElement.textContent = level;
        
        // Сбрасываем массивы объектов
        stars = [];
        planets = [];
        asteroids = [];
        enemies = [];
        projectiles = [];
        powerUps = [];
        particles = [];
        
        // Сбрасываем состояния power-up'ов
        shieldActive = false;
        rapidFireActive = false;
        doubleDamageActive = false;
        
        // Создаем звезды
        createStars();
        
        // Создаем планеты
        createPlanets();
        
        // Запускаем игровой цикл
        requestAnimationFrame(gameLoop);
    }
}

// Создание звезд
function createStars() {
    const starCount = Math.floor(canvas.width * canvas.height / 1000);
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

// Создание планет
function createPlanets() {
    const planetCount = 2;
    for (let i = 0; i < planetCount; i++) {
        const size = Math.random() * 100 + 50;
        planets.push({
            x: Math.random() * (canvas.width - size),
            y: -size - Math.random() * canvas.height,
            width: size,
            height: size,
            speed: Math.random() * 0.2 + 0.1
        });
    }
}

// Создание астероидов
function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speedX: (Math.random() - 0.5) * 2,
        speedY: Math.random() * 2 + 1,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    });
}

// Создание врагов
function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: -50,
        width: 40,
        height: 50, // Увеличиваем высоту для яйцевидной формы
        speedX: (Math.random() - 0.5) * 2,
        speedY: Math.random() * 1.5 + 0.5,
        health: 2,
        shootTimer: 0,
        shootInterval: 2000, // мс между выстрелами
        isWorm: true, // Все враги - вермизлюки
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.03 // Медленное вращение
    });
}

// Создание power-up'ов
function spawnPowerUp() {
    const types = ['shield', 'rapidFire', 'doubleDamage', 'energy'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        type: type,
        speedY: 1.5
    });
}

// Активация power-up'а
function activatePowerUp(type) {
    switch (type) {
        case 'shield':
            shieldActive = true;
            setTimeout(() => { shieldActive = false; }, powerUpDuration);
            break;
        case 'rapidFire':
            rapidFireActive = true;
            setTimeout(() => { rapidFireActive = false; }, powerUpDuration);
            break;
        case 'doubleDamage':
            doubleDamageActive = true;
            setTimeout(() => { doubleDamageActive = false; }, powerUpDuration);
            break;
        case 'energy':
            energy = Math.min(energy + 25, 100);
            energyElement.textContent = energy;
            break;
    }
}

// Стрельба
function fireProjectile() {
    const now = Date.now();
    const fireRate = rapidFireActive ? player.fireRate / 2 : player.fireRate;
    
    if (now - player.lastShot < fireRate) {
        return;
    }
    
    player.lastShot = now;
    
    // Создаем снаряд (капусту)
    projectiles.push({
        x: player.x + player.width / 2 - 15,
        y: player.y - 10,
        width: 30,
        height: 30,
        speedY: -10,
        damage: doubleDamageActive ? 2 : 1
    });
    
    // Создаем частицы для эффекта выстрела
    createParticles(player.x + player.width / 2, player.y, 5, '#4adc10', 1);
}

// Создание частиц
function createParticles(x, y, count, color, speedFactor = 1) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 3 * speedFactor,
            speedY: (Math.random() - 0.5) * 3 * speedFactor,
            color: color,
            life: 30
        });
    }
}

// Обновление состояния игры
function update() {
    // Обработка джойстика на мобильных устройствах
    if (isMobile && joystick.active) {
        const dx = joystick.moveX - joystick.startX;
        const dy = joystick.moveY - joystick.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) { // Минимальное расстояние для активации
            const maxDistance = 50; // Максимальное расстояние для нормализации
            const factor = Math.min(distance, maxDistance) / maxDistance;
            
            // Нормализуем направление
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            // Применяем к скорости игрока
            player.x += normalizedDx * player.speed * factor;
            player.y += normalizedDy * player.speed * factor;
        }
    }
    
    // Обновление позиции игрока с клавиатуры - добавляем плавность
    let dx = 0;
    let dy = 0;
    
    if (keys.w || keys.up) dy -= player.speed;
    if (keys.s || keys.down) dy += player.speed;
    if (keys.a || keys.left) dx -= player.speed;
    if (keys.d || keys.right) dx += player.speed;
    
    // Нормализуем диагональное движение
    if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.sqrt(2);
        dx *= factor;
        dy *= factor;
    }
    
    // Применяем движение
    player.x += dx;
    player.y += dy;
    
    // Ограничиваем игрока границами экрана
    player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
    
    // Стрельба с клавиатуры
    if (keys.space) {
        fireProjectile();
    }
    
    // Обновление неуязвимости игрока
    if (player.isInvulnerable) {
        if (Date.now() > player.invulnerabilityTime) {
            player.isInvulnerable = false;
        }
    }
    
    // Обновление звезд
    for (let i = 0; i < stars.length; i++) {
        stars[i].y += stars[i].speed * gameSpeed;
        
        // Если звезда вышла за пределы экрана, возвращаем её наверх
        if (stars[i].y > canvas.height) {
            stars[i].y = 0;
            stars[i].x = Math.random() * canvas.width;
        }
    }
    
    // Обновление планет
    for (let i = 0; i < planets.length; i++) {
        planets[i].y += planets[i].speed * gameSpeed;
        
        // Если планета вышла за пределы экрана, возвращаем её наверх
        if (planets[i].y > canvas.height) {
            planets[i].y = -planets[i].height;
            planets[i].x = Math.random() * (canvas.width - planets[i].width);
        }
    }
    
    // Обновление астероидов
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y += asteroids[i].speedY * gameSpeed;
        asteroids[i].x += asteroids[i].speedX * gameSpeed;
        asteroids[i].rotation += asteroids[i].rotationSpeed;
        
        // Если астероид вышел за пределы экрана, удаляем его
        if (asteroids[i].y > canvas.height || 
            asteroids[i].x < -asteroids[i].width || 
            asteroids[i].x > canvas.width) {
            asteroids.splice(i, 1);
        }
    }
    
    // Обновление врагов
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speedY * gameSpeed;
        enemies[i].x += enemies[i].speedX * gameSpeed;
        
        // Если враг достиг края экрана, меняем направление по X
        if (enemies[i].x <= 0 || enemies[i].x >= canvas.width - enemies[i].width) {
            enemies[i].speedX = -enemies[i].speedX;
        }
        
        // Стрельба врагов
        enemies[i].shootTimer += 16; // Примерно 16 мс на кадр
        if (enemies[i].shootTimer >= enemies[i].shootInterval) {
            enemies[i].shootTimer = 0;
            
            // Создаем вражеский снаряд
            projectiles.push({
                x: enemies[i].x + enemies[i].width / 2 - 5,
                y: enemies[i].y + enemies[i].height,
                width: 10,
                height: 10,
                speedY: 5,
                isEnemy: true
            });
        }
        
        // Если враг вышел за пределы экрана, удаляем его
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
    
    // Обновление снарядов
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].y += projectiles[i].speedY;
        
        // Если снаряд вышел за пределы экрана, удаляем его
        if (projectiles[i].y < -projectiles[i].height || projectiles[i].y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Проверка столкновений снарядов игрока с астероидами и врагами
        if (!projectiles[i].isEnemy) {
            // Проверка столкновений с астероидами
            for (let j = asteroids.length - 1; j >= 0; j--) {
                if (checkCollision(projectiles[i], asteroids[j])) {
                    // Создаем частицы при попадании
                    createParticles(
                        projectiles[i].x + projectiles[i].width / 2,
                        projectiles[i].y,
                        10,
                        '#a67c52',
                        2
                    );
                    
                    // Удаляем астероид и снаряд
                    asteroids.splice(j, 1);
                    projectiles.splice(i, 1);
                    
                    // Увеличиваем счет
                    score += 10;
                    scoreElement.textContent = score;
                    
                    // Проверяем, нужно ли повысить уровень
                    checkLevelUp();
                    
                    break;
                }
            }
            
            // Если снаряд был удален, пропускаем остальные проверки
            if (i >= projectiles.length) continue;
            
            // Проверка столкновений с врагами
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (checkCollision(projectiles[i], enemies[j])) {
                    // Уменьшаем здоровье врага
                    enemies[j].health -= projectiles[i].damage || 1;
                    
                    // Создаем частицы при попадании
                    createParticles(
                        projectiles[i].x + projectiles[i].width / 2,
                        projectiles[i].y,
                        10,
                        '#ff4040',
                        2
                    );
                    
                    // Удаляем снаряд
                    projectiles.splice(i, 1);
                    
                    // Если враг уничтожен
                    if (enemies[j].health <= 0) {
                        // Создаем взрыв
                        createParticles(
                            enemies[j].x + enemies[j].width / 2,
                            enemies[j].y + enemies[j].height / 2,
                            20,
                            '#ff0000',
                            3
                        );
                        
                        // Удаляем врага
                        enemies.splice(j, 1);
                        
                        // Увеличиваем счет
                        score += 50;
                        scoreElement.textContent = score;
                        
                        // Проверяем, нужно ли повысить уровень
                        checkLevelUp();
                        
                        // Шанс появления power-up'а
                        if (Math.random() < 0.3) {
                            spawnPowerUp();
                        }
                    }
                    
                    break;
                }
            }
        } else {
            // Проверка столкновений вражеских снарядов с игроком
            if (!player.isInvulnerable && checkCollision(projectiles[i], player)) {
                // Создаем частицы при попадании
                createParticles(
                    projectiles[i].x + projectiles[i].width / 2,
                    projectiles[i].y,
                    10,
                    '#4adc10',
                    2
                );
                
                // Удаляем снаряд
                projectiles.splice(i, 1);
                
                // Если активен щит, не получаем урон
                if (!shieldActive) {
                    // Уменьшаем энергию
                    energy -= 10;
                    energyElement.textContent = energy;
                    
                    // Делаем игрока неуязвимым на короткое время
                    player.isInvulnerable = true;
                    player.invulnerabilityTime = Date.now() + player.invulnerabilityDuration;
                    
                    // Проверяем, не закончилась ли игра
                    if (energy <= 0) {
                        gameOver();
                    }
                }
                
                break;
            }
        }
    }
    
    // Обновление power-up'ов
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += powerUps[i].speedY * gameSpeed;
        
        // Если power-up вышел за пределы экрана, удаляем его
        if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1);
            continue;
        }
        
        // Проверка столкновений с игроком
        if (checkCollision(powerUps[i], player)) {
            // Активируем power-up
            activatePowerUp(powerUps[i].type);
            
            // Создаем эффект сбора power-up'а
            createParticles(
                powerUps[i].x + powerUps[i].width / 2,
                powerUps[i].y + powerUps[i].height / 2,
                15,
                '#ffffff',
                2
            );
            
            // Удаляем power-up
            powerUps.splice(i, 1);
        }
    }
    
    // Обновление частиц
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].speedX;
        particles[i].y += particles[i].speedY;
        particles[i].life--;
        
        // Если частица "умерла", удаляем её
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Проверка столкновений игрока с астероидами
    for (let i = asteroids.length - 1; i >= 0; i--) {
        if (!player.isInvulnerable && checkCollision(asteroids[i], player)) {
            // Создаем эффект столкновения
            createParticles(
                player.x + player.width / 2,
                player.y + player.height / 2,
                20,
                '#a67c52',
                3
            );
            
            // Удаляем астероид
            asteroids.splice(i, 1);
            
            // Если активен щит, не получаем урон
            if (!shieldActive) {
                // Уменьшаем энергию
                energy -= 20;
                energyElement.textContent = energy;
                
                // Делаем игрока неуязвимым на короткое время
                player.isInvulnerable = true;
                player.invulnerabilityTime = Date.now() + player.invulnerabilityDuration;
                
                // Проверяем, не закончилась ли игра
                if (energy <= 0) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Проверка столкновений игрока с врагами
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!player.isInvulnerable && checkCollision(enemies[i], player)) {
            // Создаем эффект столкновения
            createParticles(
                player.x + player.width / 2,
                player.y + player.height / 2,
                20,
                '#ff4040',
                3
            );
            
            // Удаляем врага
            enemies.splice(i, 1);
            
            // Если активен щит, не получаем урон
            if (!shieldActive) {
                // Уменьшаем энергию
                energy -= 30;
                energyElement.textContent = energy;
                
                // Делаем игрока неуязвимым на короткое время
                player.isInvulnerable = true;
                player.invulnerabilityTime = Date.now() + player.invulnerabilityDuration;
                
                // Проверяем, не закончилась ли игра
                if (energy <= 0) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Спавн новых объектов - уменьшаем частоту
    if (Math.random() < 0.005 * gameSpeed) {
        spawnAsteroid();
    }
    
    if (Math.random() < 0.003 * gameSpeed) {
        spawnEnemy();
    }
    
    if (Math.random() < 0.002 * gameSpeed) {
        spawnPowerUp();
    }
}

// Проверка столкновений
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// Проверка повышения уровня
function checkLevelUp() {
    const levelThreshold = level * 200; // 200 очков на уровень
    
    if (score >= levelThreshold) {
        level++;
        levelElement.textContent = level;
        
        // Ограничиваем максимальную скорость игры
        gameSpeed = Math.min(1 + level * 0.1, 2.0); // Максимум в 2 раза быстрее
        
        // Показываем сообщение о новом уровне
        showLevelUpMessage();
    }
}

// Функция для отображения сообщения о новом уровне
function showLevelUpMessage() {
    // Создаем элемент сообщения
    const message = document.createElement('div');
    message.textContent = `Уровень ${level}!`;
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.color = '#4adc10';
    message.style.fontSize = '36px';
    message.style.fontWeight = 'bold';
    message.style.textShadow = '0 0 10px #4adc10';
    message.style.zIndex = '1000';
    
    // Добавляем элемент на страницу
    document.body.appendChild(message);
    
    // Удаляем элемент через 2 секунды
    setTimeout(() => {
        document.body.removeChild(message);
    }, 2000);
}

// Отрисовка игры
function draw() {
    // Очистка холста
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем звезды
    ctx.fillStyle = '#fff';
    for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Рисуем планеты
    for (const planet of planets) {
        ctx.drawImage(planetImg, planet.x, planet.y, planet.width, planet.height);
    }
    
    // Рисуем астероиды
    for (const asteroid of asteroids) {
        ctx.save();
        ctx.translate(
            asteroid.x + asteroid.width / 2,
            asteroid.y + asteroid.height / 2
        );
        ctx.rotate(asteroid.rotation);
        ctx.drawImage(
            asteroidImg,
            -asteroid.width / 2,
            -asteroid.height / 2,
            asteroid.width,
            asteroid.height
        );
        ctx.restore();
    }
    
    // Рисуем врагов (вермизлюков)
    for (const enemy of enemies) {
        if (enemy.isWorm) {
            // Обновляем вращение
            enemy.rotation += enemy.rotationSpeed;
            
            // Рисуем круглого вермизлюка
            ctx.save();
            ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            ctx.rotate(enemy.rotation);
            ctx.drawImage(wormImg, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
            ctx.restore();
        } else {
            ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    }
    
    // Рисуем снаряды
    for (const projectile of projectiles) {
        if (!projectile.isEnemy) {
            // Снаряды игрока (капуста)
            ctx.drawImage(cabbageImg, projectile.x, projectile.y, projectile.width, projectile.height);
        } else {
            // Снаряды врагов
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(
                projectile.x + projectile.width / 2,
                projectile.y + projectile.height / 2,
                projectile.width / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    // Рисуем power-up'ы
    for (const powerUp of powerUps) {
        let color;
        switch (powerUp.type) {
            case 'shield':
                ctx.drawImage(shieldImg, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
                continue;
            case 'rapidFire':
                color = '#ffff00';
                break;
            case 'doubleDamage':
                color = '#ff0000';
                break;
            case 'energy':
                color = '#00ff00';
                break;
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            powerUp.width / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            powerUp.x + powerUp.width / 2,
            powerUp.y + powerUp.height / 2,
            powerUp.width / 2,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }
    
    // Рисуем частицы
    for (const particle of particles) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Рисуем игрока
    if (!player.isInvulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    }
    
    // Если активен щит, рисуем его вокруг игрока
    if (shieldActive) {
        ctx.strokeStyle = 'rgba(30, 144, 255, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
            player.x + player.width / 2,
            player.y + player.height / 2,
            player.width * 0.8,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }
    
    // Рисуем индикаторы активных эффектов
    let yPos = 30;
    ctx.fillStyle = '#4adc10';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    if (shieldActive) {
        ctx.fillText('Щит активен!', 10, yPos);
        yPos += 25;
    }
    
    if (rapidFireActive) {
        ctx.fillText('Скорострельность!', 10, yPos);
        yPos += 25;
    }
    
    if (doubleDamageActive) {
        ctx.fillText('Двойной урон!', 10, yPos);
    }
    
    // Рисуем виртуальный джойстик на мобильных устройствах
    if (isMobile && joystick.active) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        
        // Базовый круг
        ctx.beginPath();
        ctx.arc(joystick.startX, joystick.startY, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Индикатор направления
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(joystick.moveX, joystick.moveY, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Функция окончания игры
function gameOver() {
    gameRunning = false;
    
    // Рисуем экран окончания игры
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4adc10';
    ctx.font = isMobile ? '24px Arial' : '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Игра окончена!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = isMobile ? '18px Arial' : '24px Arial';
    ctx.fillText(`Ваш счёт: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Уровень: ${level}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText(`Космические вермизлюки победили!`, canvas.width / 2, canvas.height / 2 + 60);
    
    ctx.font = isMobile ? '14px Arial' : '18px Arial';
    ctx.fillText('Нажмите "Начать игру", чтобы попробовать снова', canvas.width / 2, canvas.height / 2 + 80);
}

// Основной игровой цикл
function gameLoop() {
    if (gameRunning) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Инициализация игры
playerImg.onload = () => {
    // Рисуем начальный экран
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Создаем звезды для начального экрана
    createStars();
    
    // Рисуем звезды
    ctx.fillStyle = '#fff';
    for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#4adc10';
    ctx.font = isMobile ? '24px Arial' : '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Капуста 3: Космическое приключение', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = isMobile ? '14px Arial' : '18px Arial';
    ctx.fillText('Нажмите "Начать игру", чтобы начать', canvas.width / 2, canvas.height / 2 + 50);
};