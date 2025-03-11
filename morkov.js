// Получаем элементы DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const depthElement = document.getElementById('depth');
const nutrientsElement = document.getElementById('nutrients');
const healthElement = document.getElementById('health');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const gameOverScreen = document.getElementById('gameOver');
const finalDepthElement = document.getElementById('finalDepth');
const finalNutrientsElement = document.getElementById('finalNutrients');
const speedUpgradeButton = document.getElementById('speedUpgrade');
const strengthUpgradeButton = document.getElementById('strengthUpgrade');
const nutrientUpgradeButton = document.getElementById('nutrientUpgrade');

// Определяем, является ли устройство мобильным
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Настройка размеров канваса
function setupCanvas() {
    if (isMobile) {
        // На мобильных устройствах делаем канвас меньше
        const screenWidth = Math.min(window.innerWidth - 20, 400);
        canvas.width = screenWidth;
        canvas.height = Math.floor(screenWidth * 1.5);
    } else {
        // На десктопе используем стандартные размеры
        canvas.width = 600;
        canvas.height = 800;
    }
}

// Настройки игры
let gameRunning = false;
let depth = 0;
let nutrients = 0;
let health = 100;
let speed = 3;
let strength = 1;
let nutrientMultiplier = 1;

// Настройки морковки
let carrot = {
    x: 0,
    y: 0,
    width: 30,
    height: 60,
    segments: [],
    direction: { x: 0, y: 1 }, // По умолчанию растет вниз
    maxSegments: 20,
    growthSpeed: 3,
    lastGrowthTime: 0,
    growthInterval: 200 // миллисекунды между ростом
};

// Объекты на игровом поле
let soilLayers = [];
let rocks = [];
let nutrientSpots = [];
let pests = [];

// Инициализация размеров канваса
setupCanvas();

// Загрузка изображений
const carrotHeadImg = new Image();
carrotHeadImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="60" viewBox="0 0 30 60"><path d="M15 0 L5 15 L5 60 L25 60 L25 15 Z" fill="#ff8c00"/><path d="M5 15 L25 15 L15 0 Z" fill="#00aa00"/></svg>');

const carrotSegmentImg = new Image();
carrotSegmentImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><rect width="20" height="20" fill="#ff8c00"/></svg>');

const rockImg = new Image();
rockImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M10 30 L5 20 L15 10 L30 15 L35 25 L25 35 Z" fill="#808080"/><path d="M15 15 L25 20 L20 30 L10 25 Z" fill="#606060"/></svg>');

const nutrientImg = new Image();
nutrientImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#8B4513"/><circle cx="10" cy="10" r="4" fill="#A0522D"/></svg>');

const pestImg = new Image();
pestImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" fill="#663399"/><circle cx="10" cy="10" r="2" fill="#FFFFFF"/><circle cx="20" cy="10" r="2" fill="#FFFFFF"/><path d="M10 20 Q15 25 20 20" stroke="#FFFFFF" stroke-width="2" fill="none"/></svg>');

// Обработчики событий
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// Обработчики для улучшений
speedUpgradeButton.addEventListener('click', () => upgradeCarrot('speed'));
strengthUpgradeButton.addEventListener('click', () => upgradeCarrot('strength'));
nutrientUpgradeButton.addEventListener('click', () => upgradeCarrot('nutrient'));

// Обработчики для клавиатуры
window.addEventListener('keydown', handleKeyDown);

// Обработчики для мобильных устройств
if (isMobile) {
    setupTouchControls();
}

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
    setupCanvas();
    if (!gameRunning) {
        drawStartScreen();
    }
});

// Функция запуска игры
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        depth = 0;
        nutrients = 0;
        health = 100;
        speed = 3;
        strength = 1;
        nutrientMultiplier = 1;
        
        // Обновляем отображение
        depthElement.textContent = depth;
        nutrientsElement.textContent = nutrients;
        healthElement.textContent = health;
        
        // Инициализируем морковку
        carrot = {
            x: canvas.width / 2 - 15,
            y: 50,
            width: 30,
            height: 60,
            segments: [],
            direction: { x: 0, y: 1 },
            maxSegments: 20,
            growthSpeed: 3,
            lastGrowthTime: Date.now(),
            growthInterval: 200
        };
        
        // Генерируем начальный мир
        generateWorld();
        
        // Запускаем игровой цикл
        requestAnimationFrame(gameLoop);
    }
}

// Функция перезапуска игры
function restartGame() {
    gameOverScreen.style.display = 'none';
    startGame();
}

// Генерация игрового мира
function generateWorld() {
    soilLayers = [];
    rocks = [];
    nutrientSpots = [];
    pests = [];
    
    // Создаем слои почвы
    for (let y = 100; y < canvas.height + 1000; y += 100) {
        soilLayers.push({
            y: y,
            color: getSoilColor(y)
        });
    }
    
    // Размещаем камни
    for (let i = 0; i < 15; i++) {
        rocks.push({
            x: Math.random() * (canvas.width - 40),
            y: 150 + Math.random() * (canvas.height + 800),
            width: 40,
            height: 40
        });
    }
    
    // Размещаем питательные вещества
    for (let i = 0; i < 30; i++) {
        nutrientSpots.push({
            x: Math.random() * (canvas.width - 20),
            y: 150 + Math.random() * (canvas.height + 800),
            width: 20,
            height: 20,
            value: Math.floor(Math.random() * 10) + 5
        });
    }
    
    // Размещаем вредителей
    for (let i = 0; i < 10; i++) {
        pests.push({
            x: Math.random() * (canvas.width - 30),
            y: 200 + Math.random() * (canvas.height + 700),
            width: 30,
            height: 30,
            velocityX: (Math.random() - 0.5) * 2,
            damage: Math.floor(Math.random() * 5) + 5
        });
    }
}

// Получение цвета почвы в зависимости от глубины
function getSoilColor(y) {
    const depth = y / 100;
    
    if (depth < 3) {
        return '#8B4513'; // Верхний слой - темно-коричневый
    } else if (depth < 6) {
        return '#A0522D'; // Средний слой - коричневый
    } else if (depth < 10) {
        return '#CD853F'; // Глубокий слой - светло-коричневый
    } else {
        return '#D2691E'; // Самый глубокий слой - шоколадный
    }
}

// Обработка нажатий клавиш
function handleKeyDown(e) {
    if (!gameRunning) return;
    
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            carrot.direction = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            carrot.direction = { x: 1, y: 0 };
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            carrot.direction = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            carrot.direction = { x: 0, y: 1 };
            break;
    }
}

// Настройка сенсорных элементов управления для мобильных устройств
function setupTouchControls() {
    // Создаем виртуальные кнопки управления
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'touch-controls';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.bottom = '20px';
    controlsContainer.style.left = '50%';
    controlsContainer.style.transform = 'translateX(-50%)';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.gap = '10px';
    
    const directions = [
        { name: '←', x: -1, y: 0 },
        { name: '↑', x: 0, y: -1 },
        { name: '↓', x: 0, y: 1 },
        { name: '→', x: 1, y: 0 }
    ];
    
    directions.forEach(dir => {
        const button = document.createElement('button');
        button.textContent = dir.name;
        button.style.width = '50px';
        button.style.height = '50px';
        button.style.fontSize = '24px';
        button.style.backgroundColor = 'rgba(255, 140, 0, 0.7)';
        button.style.border = 'none';
        button.style.borderRadius = '50%';
        button.style.color = '#fff';
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            carrot.direction = { x: dir.x, y: dir.y };
        });
        
        controlsContainer.appendChild(button);
    });
    
    document.querySelector('.game-container').appendChild(controlsContainer);
}

// Улучшение морковки
function upgradeCarrot(type) {
    if (!gameRunning) return;
    
    const cost = 50;
    
    if (nutrients >= cost) {
        nutrients -= cost;
        nutrientsElement.textContent = nutrients;
        
        switch (type) {
            case 'speed':
                speed += 0.5;
                carrot.growthSpeed += 0.5;
                carrot.growthInterval = Math.max(100, carrot.growthInterval - 20);
                break;
            case 'strength':
                strength += 0.5;
                health = Math.min(100, health + 20);
                healthElement.textContent = health;
                break;
            case 'nutrient':
                nutrientMultiplier += 0.5;
                break;
        }
    }
}

// Обновление состояния игры
function update() {
    // Рост морковки
    const now = Date.now();
    if (now - carrot.lastGrowthTime > carrot.growthInterval) {
        growCarrot();
        carrot.lastGrowthTime = now;
    }
    
    // Движение морковки
    moveCarrot();
    
    // Движение вредителей
    movePests();
    
    // Проверка столкновений
    checkCollisions();
    
    // Обновление глубины
    const newDepth = Math.floor((carrot.y - 50) / 10);
    if (newDepth > depth) {
        depth = newDepth;
        depthElement.textContent = depth;
        
        // Генерируем новые объекты при достижении определенной глубины
        if (depth % 50 === 0) {
            generateNewObjects();
        }
    }
    
    // Проверка условий окончания игры
    if (health <= 0) {
        gameOver();
    }
}

// Рост морковки
function growCarrot() {
    // Добавляем новый сегмент в начало массива
    carrot.segments.unshift({
        x: carrot.x + carrot.width / 2 - 10,
        y: carrot.y + carrot.height - 20
    });
    
    // Ограничиваем количество сегментов
    if (carrot.segments.length > carrot.maxSegments) {
        carrot.segments.pop();
    }
}

// Движение морковки
function moveCarrot() {
    carrot.x += carrot.direction.x * speed;
    carrot.y += carrot.direction.y * speed;
    
    // Ограничиваем движение границами канваса
    carrot.x = Math.max(0, Math.min(canvas.width - carrot.width, carrot.x));
    carrot.y = Math.max(50, carrot.y); // Не даем морковке выйти за верхнюю границу
}

// Движение вредителей
function movePests() {
    for (const pest of pests) {
        pest.x += pest.velocityX;
        
        // Отражение от границ
        if (pest.x <= 0 || pest.x >= canvas.width - pest.width) {
            pest.velocityX = -pest.velocityX;
        }
    }
}

// Проверка столкновений
function checkCollisions() {
    // Проверка столкновений с камнями
    for (let i = rocks.length - 1; i >= 0; i--) {
        if (checkCollision(carrot, rocks[i])) {
            // Уменьшаем здоровье при столкновении с камнем
            health -= 5 / strength;
            health = Math.max(0, health);
            healthElement.textContent = Math.floor(health);
            
            // Меняем направление морковки
            carrot.direction = {
                x: -carrot.direction.x,
                y: -carrot.direction.y
            };
            
            // Отодвигаем морковку от камня
            carrot.x += carrot.direction.x * 10;
            carrot.y += carrot.direction.y * 10;
        }
    }
    
    // Проверка столкновений с питательными веществами
    for (let i = nutrientSpots.length - 1; i >= 0; i--) {
        if (checkCollision(carrot, nutrientSpots[i])) {
            // Собираем питательные вещества
            nutrients += Math.floor(nutrientSpots[i].value * nutrientMultiplier);
            nutrientsElement.textContent = nutrients;
            
            // Удаляем собранное питательное вещество
            nutrientSpots.splice(i, 1);
        }
    }
    
    // Проверка столкновений с вредителями
    for (let i = pests.length - 1; i >= 0; i--) {
        if (checkCollision(carrot, pests[i])) {
            // Уменьшаем здоровье при столкновении с вредителем
            health -= pests[i].damage / strength;
            health = Math.max(0, health);
            healthElement.textContent = Math.floor(health);
            
            // Отодвигаем вредителя
            pests[i].velocityX = -pests[i].velocityX;
            pests[i].x += pests[i].velocityX * 10;
        }
    }
}

// Функция проверки столкновения двух объектов
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// Генерация новых объектов
function generateNewObjects() {
    // Добавляем новые камни
    for (let i = 0; i < 5; i++) {
        rocks.push({
            x: Math.random() * (canvas.width - 40),
            y: carrot.y + canvas.height + Math.random() * 500,
            width: 40,
            height: 40
        });
    }
    
    // Добавляем новые питательные вещества
    for (let i = 0; i < 10; i++) {
        nutrientSpots.push({
            x: Math.random() * (canvas.width - 20),
            y: carrot.y + canvas.height + Math.random() * 500,
            width: 20,
            height: 20,
            value: Math.floor(Math.random() * 10) + 5 + depth / 50
        });
    }
    
    // Добавляем новых вредителей
    for (let i = 0; i < 3; i++) {
        pests.push({
            x: Math.random() * (canvas.width - 30),
            y: carrot.y + canvas.height + Math.random() * 500,
            width: 30,
            height: 30,
            velocityX: (Math.random() - 0.5) * 2,
            damage: Math.floor(Math.random() * 5) + 5 + depth / 100
        });
    }
}

// Отрисовка игры
function draw() {
    // Очистка холста
    ctx.fillStyle = '#5e3a1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Настраиваем камеру, чтобы следовать за морковкой
    const cameraY = Math.max(0, carrot.y - canvas.height / 3);
    
    // Рисуем слои почвы
    for (const layer of soilLayers) {
        if (layer.y - cameraY >= -100 && layer.y - cameraY <= canvas.height) {
            ctx.fillStyle = layer.color;
            ctx.fillRect(0, layer.y - cameraY, canvas.width, 100);
        }
    }
    
    // Рисуем камни
    for (const rock of rocks) {
        if (rock.y - cameraY >= -rock.height && rock.y - cameraY <= canvas.height) {
            ctx.drawImage(rockImg, rock.x, rock.y - cameraY, rock.width, rock.height);
        }
    }
    
    // Рисуем питательные вещества
    for (const nutrient of nutrientSpots) {
        if (nutrient.y - cameraY >= -nutrient.height && nutrient.y - cameraY <= canvas.height) {
            ctx.drawImage(nutrientImg, nutrient.x, nutrient.y - cameraY, nutrient.width, nutrient.height);
        }
    }
    
    // Рисуем вредителей
    for (const pest of pests) {
        if (pest.y - cameraY >= -pest.height && pest.y - cameraY <= canvas.height) {
            ctx.drawImage(pestImg, pest.x, pest.y - cameraY, pest.width, pest.height);
        }
    }
    
    // Рисуем сегменты морковки
    for (const segment of carrot.segments) {
        ctx.drawImage(carrotSegmentImg, segment.x, segment.y - cameraY, 20, 20);
    }
    
    // Рисуем голову морковки
    ctx.drawImage(carrotHeadImg, carrot.x, carrot.y - cameraY, carrot.width, carrot.height);
    
    // Рисуем верхний слой почвы (неподвижный)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    // Рисуем траву на поверхности
    ctx.fillStyle = '#228B22';
    for (let x = 0; x < canvas.width; x += 10) {
        const height = 5 + Math.random() * 10;
        ctx.fillRect(x, 50 - height, 2, height);
    }
}

// Функция отрисовки начального экрана
function drawStartScreen() {
    ctx.fillStyle = '#5e3a1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем слои почвы
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, canvas.width, 50);
    
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(0, 50, canvas.width, 100);
    
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(0, 150, canvas.width, 100);
    
    // Рисуем траву на поверхности
    ctx.fillStyle = '#228B22';
    for (let x = 0; x < canvas.width; x += 10) {
        const height = 5 + Math.random() * 10;
        ctx.fillRect(x, 50 - height, 2, height);
    }
    
    // Рисуем морковку на начальном экране
    ctx.drawImage(carrotHeadImg, canvas.width / 2 - 15, 50, 30, 60);
    
    // Рисуем текст
    ctx.fillStyle = '#fff';
    ctx.font = isMobile ? '24px Arial' : '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Морковь: Подземное приключение', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = isMobile ? '16px Arial' : '20px Arial';
    ctx.fillText('Нажмите "Начать игру", чтобы начать', canvas.width / 2, canvas.height / 2 + 50);
}

// Функция окончания игры
function gameOver() {
    gameRunning = false;
    
    // Показываем экран окончания игры
    finalDepthElement.textContent = depth;
    finalNutrientsElement.textContent = nutrients;
    gameOverScreen.style.display = 'flex';
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
carrotHeadImg.onload = () => {
    drawStartScreen();
};
