// Получаем элементы DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('startButton');

// Определяем, является ли устройство мобильным
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Настройка размеров канваса
function setupCanvas() {
    // Устанавливаем размеры канваса
    if (isMobile) {
        // На мобильных устройствах делаем канвас меньше
        const screenWidth = Math.min(window.innerWidth - 20, 500);
        canvas.width = screenWidth;
        canvas.height = Math.floor(screenWidth * 1.5);
    } else {
        // На десктопе используем стандартные размеры
        canvas.width = 800;
        canvas.height = 600;
    }
    
    // Обновляем позицию игрока при изменении размеров
    if (player) {
        player.x = canvas.width / 2;
        player.y = canvas.height - 100;
    }
}

// Настройки игры
let gameRunning = false;
let score = 0;
let player = {
    x: 0,
    y: 0,
    width: 50,
    height: 80,
    speed: 5
};

let touchX = 0;
let mouseX = 0;
let cabbages = [];
let worms = [];
let lastWormTime = 0;
let wormInterval = 1500; // Интервал появления вермизлюков (мс)

// Инициализация размеров канваса
setupCanvas();
player.x = canvas.width / 2;
player.y = canvas.height - 100;

// Загрузка изображений
const playerImg = new Image();
playerImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="80" viewBox="0 0 50 80"><rect x="20" y="60" width="10" height="20" fill="#8B4513"/><circle cx="25" cy="40" r="20" fill="#FFD700"/><circle cx="18" cy="35" r="3" fill="#000"/><circle cx="32" cy="35" r="3" fill="#000"/><path d="M20 45 Q25 50 30 45" stroke="#000" stroke-width="2" fill="none"/></svg>');

const cabbageImg = new Image();
cabbageImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="#4a7c10"/><path d="M5 15 Q15 5 25 15" stroke="#d8f0c0" stroke-width="2" fill="none"/><path d="M5 20 Q15 10 25 20" stroke="#d8f0c0" stroke-width="2" fill="none"/></svg>');

const wormImg = new Image();
wormImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M5 10 Q10 5 15 10 Q20 15 25 10 Q30 5 35 10" stroke="#8B008B" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="5" cy="10" r="5" fill="#9932CC"/><circle cx="5" cy="8" r="1" fill="white"/><circle cx="7" cy="8" r="1" fill="white"/></svg>');

// Обработчики событий
startButton.addEventListener('click', startGame);

// Обработчики для десктопа
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});
canvas.addEventListener('click', throwCabbage);

// Обработчики для мобильных устройств
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Предотвращаем прокрутку страницы
    const rect = canvas.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    player.x = touchX;
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    touchX = e.touches[0].clientX - rect.left;
    player.x = touchX;
    throwCabbage();
}, { passive: false });

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
    setupCanvas();
    if (!gameRunning) {
        draw();
    }
});

// Функция запуска игры
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        score = 0;
        scoreElement.textContent = score;
        cabbages = [];
        worms = [];
        lastWormTime = Date.now();
        requestAnimationFrame(gameLoop);
    }
}

// Функция броска капусты
function throwCabbage() {
    if (gameRunning) {
        cabbages.push({
            x: player.x,
            y: player.y - player.height / 2,
            width: 30,
            height: 30,
            speed: 8
        });
    }
}

// Создание вермизлюка
function createWorm() {
    const wormX = Math.random() * (canvas.width - 40);
    worms.push({
        x: wormX,
        y: 0,
        width: 40,
        height: 20,
        speed: 2 + Math.random() * 2
    });
}

// Проверка столкновений
function checkCollisions() {
    for (let i = cabbages.length - 1; i >= 0; i--) {
        for (let j = worms.length - 1; j >= 0; j--) {
            if (
                cabbages[i].x < worms[j].x + worms[j].width &&
                cabbages[i].x + cabbages[i].width > worms[j].x &&
                cabbages[i].y < worms[j].y + worms[j].height &&
                cabbages[i].y + cabbages[i].height > worms[j].y
            ) {
                // Столкновение произошло
                cabbages.splice(i, 1);
                worms.splice(j, 1);
                score += 10;
                scoreElement.textContent = score;
                break;
            }
        }
    }
}

// Проверка проигрыша
function checkGameOver() {
    for (let i = 0; i < worms.length; i++) {
        if (worms[i].y + worms[i].height >= canvas.height) {
            gameRunning = false;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = 'white';
            ctx.font = isMobile ? '32px Arial' : '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Игра окончена!', canvas.width / 2, canvas.height / 2);
            
            ctx.font = isMobile ? '18px Arial' : '24px Arial';
            ctx.fillText(`Ваш счёт: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
            
            const restartText = 'Нажмите "Начать игру"';
            ctx.fillText(restartText, canvas.width / 2, canvas.height / 2 + 100);
            return true;
        }
    }
    return false;
}

// Обновление состояния игры
function update() {
    // Обновление позиции игрока (для десктопа)
    if (!isMobile) {
        player.x = mouseX;
    }
    
    // Ограничение движения игрока
    if (player.x < player.width / 2) {
        player.x = player.width / 2;
    } else if (player.x > canvas.width - player.width / 2) {
        player.x = canvas.width - player.width / 2;
    }
    
    // Обновление позиции капусты
    for (let i = cabbages.length - 1; i >= 0; i--) {
        cabbages[i].y -= cabbages[i].speed;
        
        // Удаление капусты, вышедшей за пределы экрана
        if (cabbages[i].y + cabbages[i].height < 0) {
            cabbages.splice(i, 1);
        }
    }
    
    // Обновление позиции вермизлюков
    for (let i = worms.length - 1; i >= 0; i--) {
        worms[i].y += worms[i].speed;
    }
    
    // Создание новых вермизлюков
    const currentTime = Date.now();
    if (currentTime - lastWormTime > wormInterval) {
        createWorm();
        lastWormTime = currentTime;
        
        // Уменьшаем интервал появления вермизлюков со временем
        wormInterval = Math.max(500, wormInterval - 10);
    }
    
    // Проверка столкновений
    checkCollisions();
}

// Отрисовка игры
function draw() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка игрока
    ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height, player.width, player.height);
    
    // Отрисовка капусты
    for (const cabbage of cabbages) {
        ctx.drawImage(cabbageImg, cabbage.x - cabbage.width / 2, cabbage.y, cabbage.width, cabbage.height);
    }
    
    // Отрисовка вермизлюков
    for (const worm of worms) {
        ctx.drawImage(wormImg, worm.x, worm.y, worm.width, worm.height);
    }
}

// Основной игровой цикл
function gameLoop() {
    if (gameRunning) {
        update();
        draw();
        
        if (!checkGameOver()) {
            requestAnimationFrame(gameLoop);
        }
    }
}

// Инициализация игры
playerImg.onload = () => {
    draw();
}; 