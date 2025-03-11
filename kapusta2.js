// Получаем элементы DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const healthElement = document.getElementById('health');
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
let health = 100;
let gameMap = [];
let mapWidth = 40;
let mapHeight = 40;
let tileSize = 40;
let visibleRadius = 6; // Радиус видимости вокруг игрока (в тайлах)
let flashlightOn = true;

// Игрок
let player = {
    x: 0,
    y: 0,
    width: 50,
    height: 80,
    speed: 3,
    direction: 'down', // down, up, left, right
    moving: false,
    lastShot: 0,
    shotCooldown: 500 // мс между выстрелами
};

// Массивы для игровых объектов
let cabbages = [];
let worms = [];
let buildings = [];
let trees = [];
let powerUps = [];

// Состояния power-up'ов
let speedBoostActive = false;
let shieldActive = false;
let flashlightBoostActive = false;
let powerUpDuration = 10000; // 10 секунд

// Управление
let keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Виртуальный джойстик для мобильных устройств
let joystick = {
    active: false,
    startX: 0,
    startY: 0,
    moveX: 0,
    moveY: 0
};

// Камера
let camera = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};

// Инициализация размеров канваса
setupCanvas();
camera.width = canvas.width;
camera.height = canvas.height;

// Загрузка изображений
const playerImg = new Image();
playerImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="80" viewBox="0 0 50 80"><rect x="20" y="60" width="10" height="20" fill="#8B4513"/><circle cx="25" cy="40" r="20" fill="#FFD700"/><circle cx="18" cy="35" r="3" fill="#000"/><circle cx="32" cy="35" r="3" fill="#000"/><path d="M20 45 Q25 50 30 45" stroke="#000" stroke-width="2" fill="none"/></svg>');

const cabbageImg = new Image();
cabbageImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="#4a7c10"/><path d="M5 15 Q15 5 25 15" stroke="#d8f0c0" stroke-width="2" fill="none"/><path d="M5 20 Q15 10 25 20" stroke="#d8f0c0" stroke-width="2" fill="none"/></svg>');

const wormImg = new Image();
wormImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M5 10 Q10 5 15 10 Q20 15 25 10 Q30 5 35 10" stroke="#8B008B" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="5" cy="10" r="5" fill="#9932CC"/><circle cx="5" cy="8" r="1.5" fill="white"/><circle cx="8" cy="8" r="1.5" fill="white"/></svg>');

const treeImg = new Image();
treeImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60"><rect x="15" y="40" width="10" height="20" fill="#8B4513"/><polygon points="20,0 5,20 10,20 0,40 40,40 30,20 35,20" fill="#006400"/></svg>');

const buildingImg = new Image();
buildingImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect x="10" y="20" width="60" height="60" fill="#696969"/><rect x="20" y="30" width="10" height="15" fill="#000"/><rect x="50" y="30" width="10" height="15" fill="#000"/><rect x="35" y="50" width="10" height="30" fill="#000"/><polygon points="10,20 40,0 70,20" fill="#A52A2A"/></svg>');

const grassImg = new Image();
grassImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#1a3300"/><path d="M5 20 Q10 15 15 20 M25 15 Q30 10 35 15 M15 30 Q20 25 25 30" stroke="#2a5500" stroke-width="2" stroke-linecap="round" fill="none"/></svg>');

// Обработчики событий
startButton.addEventListener('click', startGame);

// Обработчики для десктопа
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === 'f' || e.key === 'F') toggleFlashlight();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.d = false;
});

canvas.addEventListener('mousedown', throwCabbage);

// Обработчики для мобильных устройств
if (isMobile) {
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        
        if (touchX > canvas.width / 2) {
            // Правая половина экрана - бросок капусты
            throwCabbage(e);
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
        keys.w = false;
        keys.a = false;
        keys.s = false;
        keys.d = false;
    });
}

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
    setupCanvas();
    camera.width = canvas.width;
    camera.height = canvas.height;
    if (!gameRunning) {
        draw();
    }
});

// Функция запуска игры
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        score = 0;
        health = 100;
        scoreElement.textContent = score;
        healthElement.textContent = health;
        
        // Сбрасываем все массивы
        cabbages = [];
        worms = [];
        buildings = [];
        trees = [];
        powerUps = [];
        
        // Сбрасываем все эффекты
        speedBoostActive = false;
        shieldActive = false;
        flashlightBoostActive = false;
        
        // Генерируем карту
        generateMap();
        
        // Размещаем игрока в начальной позиции
        player.x = mapWidth * tileSize / 2;
        player.y = mapHeight * tileSize / 2;
        
        // Обновляем камеру
        updateCamera();
        
        // Запускаем игровой цикл
        requestAnimationFrame(gameLoop);
    }
}

// Генерация карты
function generateMap() {
    // Создаем пустую карту
    gameMap = [];
    for (let y = 0; y < mapHeight; y++) {
        gameMap[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            gameMap[y][x] = 0; // 0 - трава
        }
    }
    
    // Добавляем деревья (случайно)
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * mapWidth);
        const y = Math.floor(Math.random() * mapHeight);
        
        // Не ставим деревья в центре карты (начальная позиция игрока)
        if (Math.abs(x - mapWidth/2) > 2 || Math.abs(y - mapHeight/2) > 2) {
            trees.push({
                x: x * tileSize,
                y: y * tileSize,
                width: 40,
                height: 60
            });
        }
    }
    
    // Добавляем заброшенные здания (теперь с дверями)
    for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * (mapWidth - 2));
        const y = Math.floor(Math.random() * (mapHeight - 2));
        
        // Не ставим здания в центре карты
        if (Math.abs(x - mapWidth/2) > 3 || Math.abs(y - mapHeight/2) > 3) {
            buildings.push({
                x: x * tileSize,
                y: y * tileSize,
                width: 80,
                height: 80,
                hasInterior: true,  // Здание имеет внутреннее пространство
                doorX: x * tileSize + 35,  // Позиция двери
                doorY: y * tileSize + 80,  // Дверь внизу здания
                doorWidth: 10,
                doorHeight: 1
            });
        }
    }
    
    // Добавляем вермизлюков
    for (let i = 0; i < 10; i++) {
        spawnWorm();
    }
}

// Функция броска капусты
function throwCabbage(e) {
    if (gameRunning) {
        const now = Date.now();
        if (now - player.lastShot < player.shotCooldown) {
            return;
        }
        
        player.lastShot = now;
        
        // Получаем координаты мыши/касания
        const rect = canvas.getBoundingClientRect();
        const clickX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const clickY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        
        // Переводим координаты клика в мировые координаты
        const worldClickX = clickX + camera.x;
        const worldClickY = clickY + camera.y;
        
        // Вычисляем направление от игрока к точке клика
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        const dx = worldClickX - playerCenterX;
        const dy = worldClickY - playerCenterY;
        
        // Нормализуем вектор направления
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / length;
        const dirY = dy / length;
        
        // Обновляем направление игрока для анимации
        if (Math.abs(dirX) > Math.abs(dirY)) {
            player.direction = dirX > 0 ? 'right' : 'left';
        } else {
            player.direction = dirY > 0 ? 'down' : 'up';
        }
        
        cabbages.push({
            x: playerCenterX - 15, // Центрируем капусту (30x30)
            y: playerCenterY - 15,
            width: 30,
            height: 30,
            dirX: dirX,
            dirY: dirY,
            speed: speedBoostActive ? 8 : 5,
            distance: 0,
            maxDistance: 400
        });
    }
}

// Создание вермизлюка
function spawnWorm() {
    let x, y;
    do {
        x = Math.floor(Math.random() * mapWidth) * tileSize;
        y = Math.floor(Math.random() * mapHeight) * tileSize;
    } while (
        Math.abs(x - player.x) < 200 && 
        Math.abs(y - player.y) < 200
    );
    
    worms.push({
        x: x,
        y: y,
        width: 40,
        height: 20,
        speed: 1 + Math.random(),
        direction: Math.random() * Math.PI * 2,
        changeDirectionTime: Date.now() + Math.random() * 5000
    });
}

// Создание power-up'а
function spawnPowerUp() {
    // Выбираем случайную позицию
    const x = Math.floor(Math.random() * mapWidth) * tileSize;
    const y = Math.floor(Math.random() * mapHeight) * tileSize;
    
    // Выбираем случайный тип power-up'а
    const types = ['speed', 'shield', 'flashlight'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        width: 30,
        height: 30,
        type: type
    });
}

// Переключение фонарика
function toggleFlashlight() {
    flashlightOn = !flashlightOn;
}

// Активация power-up'ов
function activatePowerUp(type) {
    switch (type) {
        case 'speed':
            speedBoostActive = true;
            setTimeout(() => { speedBoostActive = false; }, powerUpDuration);
            break;
        case 'shield':
            shieldActive = true;
            break;
        case 'flashlight':
            flashlightBoostActive = true;
            setTimeout(() => { flashlightBoostActive = false; }, powerUpDuration);
            break;
    }
}

// Обновление камеры
function updateCamera() {
    // Камера следует за игроком
    camera.x = player.x + player.width / 2 - camera.width / 2;
    camera.y = player.y + player.height / 2 - camera.height / 2;
    
    // Ограничиваем камеру границами карты
    camera.x = Math.max(0, Math.min(camera.x, mapWidth * tileSize - camera.width));
    camera.y = Math.max(0, Math.min(camera.y, mapHeight * tileSize - camera.height));
}

// Проверка столкновений
function checkCollisions() {
    // Проверка столкновений капусты с вермизлюками
    for (let i = cabbages.length - 1; i >= 0; i--) {
        for (let j = worms.length - 1; j >= 0; j--) {
            if (
                cabbages[i].x < worms[j].x + worms[j].width &&
                cabbages[i].x + cabbages[i].width > worms[j].x &&
                cabbages[i].y < worms[j].y + worms[j].height &&
                cabbages[i].y + cabbages[i].height > worms[j].y
            ) {
                // Уничтожаем вермизлюка
                worms.splice(j, 1);
                cabbages.splice(i, 1);
                score += 10;
                scoreElement.textContent = score;
                
                // Шанс появления power-up'а
                if (Math.random() < 0.2) { // 20% шанс
                    spawnPowerUp();
                }
                
                // Создаем нового вермизлюка
                setTimeout(spawnWorm, 3000);
                
                break;
            }
        }
    }
    
    // Проверка столкновений игрока с вермизлюками
    for (let i = worms.length - 1; i >= 0; i--) {
        if (
            player.x < worms[i].x + worms[i].width &&
            player.x + player.width > worms[i].x &&
            player.y < worms[i].y + worms[i].height &&
            player.y + player.height > worms[i].y
        ) {
            if (shieldActive) {
                // Щит защищает от одного вермизлюка
                shieldActive = false;
                worms.splice(i, 1);
                setTimeout(spawnWorm, 3000);
            } else {
                // Игрок получает урон
                health -= 10;
                healthElement.textContent = health;
                
                // Отталкиваем игрока от вермизлюка
                const pushX = player.x - worms[i].x;
                const pushY = player.y - worms[i].y;
                const pushDist = Math.sqrt(pushX * pushX + pushY * pushY);
                
                player.x += (pushX / pushDist) * 30;
                player.y += (pushY / pushDist) * 30;
                
                // Проверка проигрыша
                if (health <= 0) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Проверка столкновений игрока с power-up'ами
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (
            player.x < powerUps[i].x + powerUps[i].width &&
            player.x + player.width > powerUps[i].x &&
            player.y < powerUps[i].y + powerUps[i].height &&
            player.y + player.height > powerUps[i].y
        ) {
            // Активируем power-up
            activatePowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
        }
    }
    
    // Проверка столкновений с деревьями и зданиями
    for (const tree of trees) {
        if (
            player.x < tree.x + tree.width &&
            player.x + player.width > tree.x &&
            player.y < tree.y + tree.height &&
            player.y + player.height > tree.y
        ) {
            // Отталкиваем игрока от дерева
            handleCollisionWithObject(tree);
        }
    }
    
    // Отдельно обрабатываем здания
    for (const building of buildings) {
        if (
            player.x < building.x + building.width &&
            player.x + player.width > building.x &&
            player.y < building.y + building.height &&
            player.y + player.height > building.y
        ) {
            // Проверяем, находится ли игрок у двери
            const isAtDoor = 
                player.x + player.width/2 > building.doorX && 
                player.x + player.width/2 < building.doorX + building.doorWidth &&
                player.y < building.doorY + building.doorHeight;
            
            // Если игрок не у двери, отталкиваем его
            if (!isAtDoor) {
                handleCollisionWithObject(building);
            }
        }
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
            const angle = Math.atan2(dy, dx);
            
            // Сбрасываем все клавиши
            keys.w = false;
            keys.a = false;
            keys.s = false;
            keys.d = false;
            
            // Определяем направление движения
            if (angle > -Math.PI * 0.75 && angle < -Math.PI * 0.25) {
                keys.w = true;
                player.direction = 'up';
            } else if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) {
                keys.s = true;
                player.direction = 'down';
            }
            
            if (angle > -Math.PI * 0.25 && angle < Math.PI * 0.25) {
                keys.d = true;
                player.direction = 'right';
            } else if (angle > Math.PI * 0.75 || angle < -Math.PI * 0.75) {
                keys.a = true;
                player.direction = 'left';
            }
        }
    }
    
    // Обновление позиции игрока
    let dx = 0;
    let dy = 0;
    
    if (keys.w) {
        dy -= player.speed;
        player.direction = 'up';
        player.moving = true;
    }
    if (keys.s) {
        dy += player.speed;
        player.direction = 'down';
        player.moving = true;
    }
    if (keys.a) {
        dx -= player.speed;
        player.direction = 'left';
        player.moving = true;
    }
    if (keys.d) {
        dx += player.speed;
        player.direction = 'right';
        player.moving = true;
    }
    
    // Применяем ускорение, если активно
    if (speedBoostActive) {
        dx *= 1.5;
        dy *= 1.5;
    }
    
    // Обновляем позицию игрока
    player.x += dx;
    player.y += dy;
    
    // Ограничиваем игрока границами карты
    player.x = Math.max(0, Math.min(player.x, mapWidth * tileSize - player.width));
    player.y = Math.max(0, Math.min(player.y, mapHeight * tileSize - player.height));
    
    // Обновляем камеру
    updateCamera();
    
    // Обновляем позицию капусты
    for (let i = cabbages.length - 1; i >= 0; i--) {
        cabbages[i].x += cabbages[i].dirX * cabbages[i].speed;
        cabbages[i].y += cabbages[i].dirY * cabbages[i].speed;
        
        // Увеличиваем пройденное расстояние
        cabbages[i].distance += cabbages[i].speed;
        
        // Удаляем капусту, если она пролетела максимальное расстояние
        if (cabbages[i].distance >= cabbages[i].maxDistance) {
            cabbages.splice(i, 1);
        }
    }
    
    // Обновляем позицию вермизлюков
    for (let i = worms.length - 1; i >= 0; i--) {
        // Проверяем, не пора ли сменить направление
        const now = Date.now();
        if (now > worms[i].changeDirectionTime) {
            worms[i].direction = Math.random() * Math.PI * 2;
            worms[i].changeDirectionTime = now + Math.random() * 5000;
        }
        
        // Двигаем вермизлюка в текущем направлении
        worms[i].x += Math.cos(worms[i].direction) * worms[i].speed;
        worms[i].y += Math.sin(worms[i].direction) * worms[i].speed;

        // Ограничиваем вермизлюка границами карты
        if (worms[i].x < 0) {
            worms[i].x = 0;
            worms[i].direction = Math.PI - worms[i].direction;
        } else if (worms[i].x > mapWidth * tileSize - worms[i].width) {
            worms[i].x = mapWidth * tileSize - worms[i].width;
            worms[i].direction = Math.PI - worms[i].direction;
        }

        if (worms[i].y < 0) {
            worms[i].y = 0;
            worms[i].direction = -worms[i].direction;
        } else if (worms[i].y > mapHeight * tileSize - worms[i].height) {
            worms[i].y = mapHeight * tileSize - worms[i].height;
            worms[i].direction = -worms[i].direction;
        }
    }
    
    // Проверка столкновений
    checkCollisions();

    // Случайное появление вермизлюков
    if (worms.length < 10 + Math.floor(score / 100)) {
        if (Math.random() < 0.01) { // 1% шанс каждый кадр
            spawnWorm();
        }
    }
}

// Отрисовка игры
function draw() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Если фонарик включен, сначала рисуем темный фон
    if (flashlightOn) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Рисуем фон (трава)
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const screenX = x * tileSize - camera.x;
            const screenY = y * tileSize - camera.y;
            
            // Рисуем только видимые тайлы
            if (
                screenX > -tileSize && 
                screenX < canvas.width && 
                screenY > -tileSize && 
                screenY < canvas.height
            ) {
                // Если фонарик включен, проверяем расстояние до игрока
                if (!flashlightOn || isInLightRadius(x * tileSize, y * tileSize)) {
                    ctx.drawImage(grassImg, screenX, screenY, tileSize, tileSize);
                }
            }
        }
    }
    
    // Рисуем деревья
    for (const tree of trees) {
        const screenX = tree.x - camera.x;
        const screenY = tree.y - camera.y;
        
        if (
            screenX > -tree.width && 
            screenX < canvas.width && 
            screenY > -tree.height && 
            screenY < canvas.height
        ) {
            if (!flashlightOn || isInLightRadius(tree.x, tree.y)) {
                ctx.drawImage(treeImg, screenX, screenY, tree.width, tree.height);
            }
        }
    }
    
    // Рисуем здания
    for (const building of buildings) {
        const screenX = building.x - camera.x;
        const screenY = building.y - camera.y;
        
        if (
            screenX > -building.width && 
            screenX < canvas.width && 
            screenY > -building.height && 
            screenY < canvas.height
        ) {
            if (!flashlightOn || isInLightRadius(building.x, building.y)) {
                ctx.drawImage(buildingImg, screenX, screenY, building.width, building.height);
            }
        }
    }
    
    // Рисуем power-up'ы
    for (const powerUp of powerUps) {
        const screenX = powerUp.x - camera.x;
        const screenY = powerUp.y - camera.y;
        
        if (
            screenX > -powerUp.width && 
            screenX < canvas.width && 
            screenY > -powerUp.height && 
            screenY < canvas.height
        ) {
            // Рисуем разные иконки в зависимости от типа power-up'а
            ctx.save();
            
            switch (powerUp.type) {
                case 'speed':
                    // Ускорение - желтая молния
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.moveTo(screenX + 15, screenY);
                    ctx.lineTo(screenX + 5, screenY + 15);
                    ctx.lineTo(screenX + 15, screenY + 15);
                    ctx.lineTo(screenX + 15, screenY + 30);
                    ctx.lineTo(screenX + 25, screenY + 15);
                    ctx.lineTo(screenX + 15, screenY + 15);
                    ctx.closePath();
                    ctx.fill();
                    break;
                    
                case 'shield':
                    // Щит - синий щит
                    ctx.fillStyle = '#4169E1';
                    ctx.beginPath();
                    ctx.moveTo(screenX + 15, screenY);
                    ctx.lineTo(screenX, screenY + 10);
                    ctx.lineTo(screenX + 5, screenY + 30);
                    ctx.lineTo(screenX + 15, screenY + 25);
                    ctx.lineTo(screenX + 25, screenY + 30);
                    ctx.lineTo(screenX + 30, screenY + 10);
                    ctx.closePath();
                    ctx.fill();
                    break;
                    
                case 'flashlight':
                    // Фонарик - белый круг с желтым ореолом
                    const gradient = ctx.createRadialGradient(
                        screenX + 15, screenY + 15, 5,
                        screenX + 15, screenY + 15, 15
                    );
                    gradient.addColorStop(0, 'white');
                    gradient.addColorStop(1, 'rgba(255, 255, 0, 0.5)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(screenX + 15, screenY + 15, 15, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            
            ctx.restore();
        }
    }
    
    // Рисуем капусту
    for (const cabbage of cabbages) {
        const screenX = cabbage.x - camera.x;
        const screenY = cabbage.y - camera.y;
        
        if (
            screenX > -cabbage.width && 
            screenX < canvas.width && 
            screenY > -cabbage.height && 
            screenY < canvas.height
        ) {
            ctx.drawImage(cabbageImg, screenX, screenY, cabbage.width, cabbage.height);
        }
    }
    
    // Рисуем вермизлюков
    for (const worm of worms) {
        const screenX = worm.x - camera.x;
        const screenY = worm.y - camera.y;
        
        if (
            screenX > -worm.width && 
            screenX < canvas.width && 
            screenY > -worm.height && 
            screenY < canvas.height
        ) {
            ctx.drawImage(wormImg, screenX, screenY, worm.width, worm.height);
        }
    }
    
    // Рисуем игрока всегда (он освещен своим фонариком)
    const screenX = player.x - camera.x;
    const screenY = player.y - camera.y;
    ctx.drawImage(playerImg, screenX, screenY, player.width, player.height);
    
    // Рисуем эффект света от фонарика
    if (flashlightOn) {
        const radius = flashlightBoostActive ? visibleRadius * 2 * tileSize : visibleRadius * tileSize;
        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Создаем градиент для света
        const gradient = ctx.createRadialGradient(
            screenX + player.width / 2, 
            screenY + player.height / 2, 
            0,
            screenX + player.width / 2, 
            screenY + player.height / 2, 
            radius
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            screenX + player.width / 2, 
            screenY + player.height / 2, 
            radius, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    }
    
    // Рисуем виртуальный джойстик на мобильных устройствах
    if (isMobile && joystick.active) {
        ctx.save();
        
        // Внешний круг
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(joystick.startX, joystick.startY, 50, 0, Math.PI * 2);
        ctx.stroke();
        
        // Внутренний круг (положение джойстика)
        const dx = joystick.moveX - joystick.startX;
        const dy = joystick.moveY - joystick.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 50;
        
        let joyX = joystick.startX;
        let joyY = joystick.startY;
        
        if (distance > 0) {
            const limitedDistance = Math.min(distance, maxDistance);
            joyX = joystick.startX + (dx / distance) * limitedDistance;
            joyY = joystick.startY + (dy / distance) * limitedDistance;
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(joyX, joyY, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Рисуем индикаторы активных эффектов
    if (speedBoostActive || shieldActive || flashlightBoostActive) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Arial';
        
        let yPos = 30;
        
        if (speedBoostActive) {
            ctx.fillText('Ускорение активно!', 10, yPos);
            yPos += 20;
        }
        
        if (shieldActive) {
            ctx.fillText('Щит активен!', 10, yPos);
            yPos += 20;
        }
        
        if (flashlightBoostActive) {
            ctx.fillText('Улучшенный фонарик активен!', 10, yPos);
        }
        
        ctx.restore();
    }
    
    // Если щит активен, рисуем вокруг игрока защитное поле
    if (shieldActive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(65, 105, 225, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(
            screenX + player.width / 2, 
            screenY + player.height / 2, 
            player.width * 1.2, 
            0, 
            Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
    }
}

// Добавим функцию для проверки, находится ли объект в радиусе света
function isInLightRadius(x, y) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    
    const dx = x - playerCenterX;
    const dy = y - playerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const radius = flashlightBoostActive ? visibleRadius * 2 * tileSize : visibleRadius * tileSize;
    
    return distance <= radius;
}

// Функция окончания игры
function gameOver() {
    gameRunning = false;
    
    // Рисуем экран окончания игры
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = isMobile ? '24px Arial' : '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Игра окончена!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = isMobile ? '18px Arial' : '24px Arial';
    ctx.fillText(`Ваш счёт: ${score}`, canvas.width / 2, canvas.height / 2);
    
    ctx.font = isMobile ? '14px Arial' : '18px Arial';
    ctx.fillText('Нажмите "Начать игру", чтобы попробовать снова', canvas.width / 2, canvas.height / 2 + 50);
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
    ctx.fillStyle = '#1a3300';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = isMobile ? '24px Arial' : '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Капуста 2: Тёмный лес', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = isMobile ? '14px Arial' : '18px Arial';
    ctx.fillText('Нажмите "Начать игру", чтобы начать', canvas.width / 2, canvas.height / 2 + 50);
};

// Вспомогательная функция для обработки столкновений
function handleCollisionWithObject(obj) {
    // Определяем с какой стороны произошло столкновение
    const overlapLeft = player.x + player.width - obj.x;
    const overlapRight = obj.x + obj.width - player.x;
    const overlapTop = player.y + player.height - obj.y;
    const overlapBottom = obj.y + obj.height - player.y;
    
    // Находим минимальное перекрытие
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    
    if (minOverlap === overlapLeft) {
        player.x = obj.x - player.width;
    } else if (minOverlap === overlapRight) {
        player.x = obj.x + obj.width;
    } else if (minOverlap === overlapTop) {
        player.y = obj.y - player.height;
    } else if (minOverlap === overlapBottom) {
        player.y = obj.y + obj.height;
    }
}