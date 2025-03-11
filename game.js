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

// Добавляем массив для power-up'ов
let powerUps = [];
let powerUpDuration = 5000; // Длительность действия power-up'а в мс
let speedBoostActive = false;
let shieldActive = false;

// Добавляем новые переменные для дополнительных фишек
let multiShotActive = false;      // Режим мульти-выстрела
let comboCounter = 0;             // Счетчик комбо
let lastKillTime = 0;             // Время последнего убийства вермизлюка
let comboTimeout = 2000;          // Время для продолжения комбо (мс)
let bigCabbageChance = 0.15;      // Шанс появления большой капусты

// Добавьте эту переменную в начало файла
let bestScore = 0;

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

// Добавьте эту функцию для анимации начала игры
function showStartAnimation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем текст
    ctx.fillStyle = 'white';
    ctx.font = isMobile ? '32px Arial' : '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Готовы?', canvas.width / 2, canvas.height / 2 - 50);
    
    // Обратный отсчет
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
        // Очищаем область для цифры
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width/2 - 50, canvas.height/2 - 30, 100, 100);
        
        // Рисуем цифру
        ctx.fillStyle = 'white';
        ctx.font = isMobile ? '48px Arial' : '72px Arial';
        ctx.fillText(countdown, canvas.width / 2, canvas.height / 2 + 30);
        
        countdown--;
        
        if (countdown < 0) {
            clearInterval(countdownInterval);
            gameRunning = true;
            requestAnimationFrame(gameLoop);
        }
    }, 1000);
}

// Модифицируем функцию startGame, чтобы убрать экран "Готовы?"
function startGame() {
    if (!gameRunning) {
        // Сбрасываем все переменные состояния
        gameRunning = true;
        score = 0;
        scoreElement.textContent = score;
        cabbages = [];
        worms = [];
        powerUps = [];
        lastWormTime = Date.now();
        
        // Сбрасываем все активные эффекты
        speedBoostActive = false;
        shieldActive = false;
        multiShotActive = false;
        
        // Сбрасываем счетчики комбо
        comboCounter = 0;
        lastKillTime = 0;
        
        // Сбрасываем интервал появления вермизлюков
        wormInterval = 1500;
        
        // Запускаем игровой цикл сразу, без анимации
        requestAnimationFrame(gameLoop);
    }
}

// Функция броска капусты
function throwCabbage() {
    if (gameRunning) {
        // Обычный выстрел
        const cabbage = {
            x: player.x,
            y: player.y - player.height / 2,
            width: 30,
            height: 30,
            speed: 8,
            isBig: Math.random() < bigCabbageChance // Шанс на большую капусту
        };
        
        // Если капуста большая, увеличиваем её размер
        if (cabbage.isBig) {
            cabbage.width = 45;
            cabbage.height = 45;
        }
        
        cabbages.push(cabbage);
        
        // Если активен режим мульти-выстрела, добавляем еще 2 капусты под углом
        if (multiShotActive) {
            cabbages.push({
                x: player.x - 20,
                y: player.y - player.height / 2,
                width: 30,
                height: 30,
                speed: 8,
                speedX: -1.5, // Движение влево
                isBig: false
            });
            
            cabbages.push({
                x: player.x + 20,
                y: player.y - player.height / 2,
                width: 30,
                height: 30,
                speed: 8,
                speedX: 1.5, // Движение вправо
                isBig: false
            });
        }
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

// Создание power-up'а
function createPowerUp() {
    const powerUpX = Math.random() * (canvas.width - 30);
    // Теперь у нас 3 типа power-up'ов с равной вероятностью
    const randomValue = Math.random();
    let type;
    
    if (randomValue < 0.33) {
        type = 'speed';
    } else if (randomValue < 0.66) {
        type = 'shield';
    } else {
        type = 'multishot';
    }
    
    powerUps.push({
        x: powerUpX,
        y: 0,
        width: 30,
        height: 30,
        speed: 2,
        type: type
    });
}

// Проверка столкновений
function checkCollisions() {
    let hitInThisFrame = false;
    
    for (let i = cabbages.length - 1; i >= 0; i--) {
        for (let j = worms.length - 1; j >= 0; j--) {
            if (
                cabbages[i].x < worms[j].x + worms[j].width &&
                cabbages[i].x + cabbages[i].width > worms[j].x &&
                cabbages[i].y < worms[j].y + worms[j].height &&
                cabbages[i].y + cabbages[i].height > worms[j].y
            ) {
                // Столкновение произошло
                hitInThisFrame = true;
                
                // Большая капуста может уничтожить несколько вермизлюков
                if (cabbages[i].isBig) {
                    // Проверяем соседних вермизлюков в радиусе
                    const blastRadius = 50;
                    const hitX = cabbages[i].x;
                    const hitY = cabbages[i].y;
                    
                    // Удаляем текущего вермизлюка
                    worms.splice(j, 1);
                    
                    // Проверяем других вермизлюков в радиусе взрыва
                    for (let k = worms.length - 1; k >= 0; k--) {
                        const dx = worms[k].x + worms[k].width/2 - hitX;
                        const dy = worms[k].y + worms[k].height/2 - hitY;
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        if (distance < blastRadius) {
                            worms.splice(k, 1);
                            score += 10;
                            comboCounter++;
                        }
                    }
                    
                    // Визуальный эффект взрыва
                    createExplosion(hitX, hitY);
                } else {
                    // Обычная капуста уничтожает одного вермизлюка
                    worms.splice(j, 1);
                }
                
                cabbages.splice(i, 1);
                
                // Обработка комбо
                const now = Date.now();
                if (now - lastKillTime < comboTimeout) {
                    comboCounter++;
                    // Бонус за комбо
                    const comboBonus = Math.min(comboCounter * 5, 50); // Максимум 50 очков бонуса
                    score += 10 + comboBonus;
                    
                    // Показываем текст комбо
                    showComboText(comboCounter);
                } else {
                    comboCounter = 1;
                    score += 10;
                }
                
                lastKillTime = now;
                scoreElement.textContent = score;
                break;
            }
        }
    }
    
    // Сбрасываем комбо, если не было попаданий за определенное время
    if (!hitInThisFrame && comboCounter > 0 && Date.now() - lastKillTime > comboTimeout) {
        comboCounter = 0;
    }
}

// Проверка столкновений с power-up'ами
function checkPowerUpCollisions() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (
            player.x - player.width/2 < powerUps[i].x + powerUps[i].width &&
            player.x + player.width/2 > powerUps[i].x &&
            player.y - player.height < powerUps[i].y + powerUps[i].height &&
            player.y > powerUps[i].y
        ) {
            // Столкновение с power-up'ом
            if (powerUps[i].type === 'speed') {
                activateSpeedBoost();
            } else if (powerUps[i].type === 'shield') {
                activateShield();
            } else if (powerUps[i].type === 'multishot') {
                activateMultiShot();
            }
            powerUps.splice(i, 1);
        }
    }
}

// Проверка проигрыша
function checkGameOver() {
    for (let i = 0; i < worms.length; i++) {
        if (worms[i].y + worms[i].height >= canvas.height) {
            if (shieldActive) {
                shieldActive = false;
                worms.splice(i, 1);
                continue;
            }
            gameRunning = false;
            
            // Обновляем лучший результат
            if (score > bestScore) {
                bestScore = score;
            }
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = 'white';
            ctx.font = isMobile ? '32px Arial' : '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Игра окончена!', canvas.width / 2, canvas.height / 2 - 70);
            
            ctx.font = isMobile ? '18px Arial' : '24px Arial';
            ctx.fillText(`Ваш счёт: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillText(`Лучший счёт: ${bestScore}`, canvas.width / 2, canvas.height / 2 + 20);
            
            const restartText = 'Нажмите "Начать игру"';
            ctx.fillText(restartText, canvas.width / 2, canvas.height / 2 + 70);
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
        // Вертикальное движение
        cabbages[i].y -= speedBoostActive ? cabbages[i].speed * 1.5 : cabbages[i].speed;
        
        // Горизонтальное движение для диагональных выстрелов
        if (cabbages[i].speedX) {
            cabbages[i].x += cabbages[i].speedX;
            
            // Проверка границ экрана
            if (cabbages[i].x < 0 || cabbages[i].x > canvas.width) {
                cabbages.splice(i, 1);
                continue;
            }
        }
        
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
    
    // Создание power-up'ов
    if (Math.random() < 0.005) { // Уменьшим шанс до 0.5% для более редкого появления
        createPowerUp();
    }
    
    // Проверка столкновений
    checkCollisions();
    checkPowerUpCollisions();
    updatePowerUps(); // Добавляем вызов функции обновления power-up'ов
}

// Отрисовка игры
function draw() {
    // Очистка холста
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка игрока
    ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height, player.width, player.height);
    
    // Отрисовка капусты
    for (const cabbage of cabbages) {
        if (cabbage.isBig) {
            // Большая капуста
            ctx.drawImage(cabbageImg, cabbage.x - cabbage.width / 2, cabbage.y, cabbage.width, cabbage.height);
            
            // Добавляем свечение для большой капусты
            ctx.save();
            ctx.shadowColor = '#4a7c10';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(cabbage.x, cabbage.y + cabbage.height/2, cabbage.width/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.restore();
        } else {
            // Обычная капуста
            ctx.drawImage(cabbageImg, cabbage.x - cabbage.width / 2, cabbage.y, cabbage.width, cabbage.height);
        }
    }
    
    // Отрисовка вермизлюков
    for (const worm of worms) {
        ctx.drawImage(wormImg, worm.x, worm.y, worm.width, worm.height);
    }
    
    // Отрисовка power-up'ов
    drawPowerUps();
    
    // Отрисовка активных эффектов
    drawActiveEffects();
    
    // Если щит активен, рисуем вокруг игрока защитное поле
    if (shieldActive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(65, 105, 225, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y - player.height / 2, player.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Активация ускорения
function activateSpeedBoost() {
    speedBoostActive = true;
    setTimeout(() => {
        speedBoostActive = false;
    }, powerUpDuration);
}

// Активация щита
function activateShield() {
    shieldActive = true;
}

// Активация мульти-выстрела
function activateMultiShot() {
    multiShotActive = true;
    setTimeout(() => {
        multiShotActive = false;
    }, powerUpDuration);
}

// Обновление состояния power-up'ов
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += powerUps[i].speed;
        if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

// Отрисовка power-up'ов
function drawPowerUps() {
    for (const powerUp of powerUps) {
        ctx.save();
        
        if (powerUp.type === 'speed') {
            // Рисуем иконку ускорения (молния)
            ctx.fillStyle = '#FFD700'; // Золотой цвет
            ctx.beginPath();
            ctx.moveTo(powerUp.x + 15, powerUp.y);
            ctx.lineTo(powerUp.x + 5, powerUp.y + 15);
            ctx.lineTo(powerUp.x + 15, powerUp.y + 15);
            ctx.lineTo(powerUp.x + 15, powerUp.y + 30);
            ctx.lineTo(powerUp.x + 25, powerUp.y + 15);
            ctx.lineTo(powerUp.x + 15, powerUp.y + 15);
            ctx.lineTo(powerUp.x + 15, powerUp.y);
            ctx.fill();
            
            // Добавляем обводку
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (powerUp.type === 'shield') {
            // Рисуем иконку щита
            ctx.fillStyle = '#4169E1'; // Синий цвет
            
            // Щит (овал)
            ctx.beginPath();
            ctx.ellipse(powerUp.x + 15, powerUp.y + 15, 12, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Обводка щита
            ctx.strokeStyle = '#000080';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Звезда в центре щита
            ctx.fillStyle = 'white';
            ctx.beginPath();
            const centerX = powerUp.x + 15;
            const centerY = powerUp.y + 15;
            const spikes = 5;
            const outerRadius = 6;
            const innerRadius = 3;
            
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / spikes) * i;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
        } else if (powerUp.type === 'multishot') {
            // Рисуем иконку мульти-выстрела (три капусты)
            ctx.fillStyle = '#32CD32'; // Зеленый цвет
            
            // Рисуем три маленьких круга
            const centerX = powerUp.x + 15;
            const centerY = powerUp.y + 15;
            
            // Левая капуста
            ctx.beginPath();
            ctx.arc(centerX - 8, centerY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Центральная капуста
            ctx.beginPath();
            ctx.arc(centerX, centerY - 8, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Правая капуста
            ctx.beginPath();
            ctx.arc(centerX + 8, centerY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Обводка
            ctx.strokeStyle = '#006400';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX - 8, centerY, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX, centerY - 8, 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX + 8, centerY, 6, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Добавим визуальную индикацию активных power-up'ов
function drawActiveEffects() {
    if (speedBoostActive || shieldActive || multiShotActive) {
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
        
        if (multiShotActive) {
            ctx.fillText('Мульти-выстрел активен!', 10, yPos);
        }
        
        ctx.restore();
    }
}

// Создаем визуальный эффект взрыва
function createExplosion(x, y) {
    ctx.save();
    
    // Рисуем круг взрыва
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 50);
    gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Анимация затухания взрыва
    let radius = 50;
    let opacity = 0.8;
    
    const explosionInterval = setInterval(() => {
        radius += 5;
        opacity -= 0.1;
        
        if (opacity <= 0) {
            clearInterval(explosionInterval);
        }
    }, 50);
}

// Показываем текст комбо
function showComboText(combo) {
    if (combo > 1) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Комбо x${combo}!`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.restore();
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