// Получаем элементы DOM
const gameBoard = document.getElementById('game-board');
const cabbageCount = document.getElementById('cabbage-count');
const moneyCount = document.getElementById('money-count');
const waveNumber = document.getElementById('wave-number');
const wormsLeft = document.getElementById('worms-left');
const timeToNextWave = document.getElementById('time-to-next-wave');
const startButton = document.getElementById('start-button');
const sellAllButton = document.getElementById('sell-all-button');
const restartButton = document.getElementById('restart-button');
const gameOverScreen = document.getElementById('game-over');
const wavesSurvived = document.getElementById('waves-survived');
const tools = document.querySelectorAll('.tool');

// Настройки игры
const GRID_SIZE = window.innerWidth < 768 ? 8 : 10;
const CELL_TYPES = {
    EMPTY: 'empty',
    SOIL: 'soil',
    CABBAGE_SEED: 'cabbage-seed',
    CABBAGE_GROWING: 'cabbage-growing',
    CABBAGE_READY: 'cabbage-ready',
    TOWER: 'tower',
    WORM: 'worm'
};

// Состояние игры
let gameRunning = false;
let currentTool = 'soil';
let cabbage = 0;
let money = 100;
let wave = 1;
let worms = 0;
let timeToNext = 30;
let grid = [];
let wormPositions = [];
let gameLoopInterval;
let waveInterval;
let growthIntervals = [];

// Инициализация игрового поля
function initializeGrid() {
    console.log("Инициализация игрового поля");
    gameBoard.innerHTML = '';
    grid = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
        const row = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener('click', () => handleCellClick(x, y));
            
            gameBoard.appendChild(cell);
            row.push({
                type: CELL_TYPES.EMPTY,
                element: cell,
                growthStage: 0,
                growthTime: 0,
                health: 100
            });
        }
        grid.push(row);
    }
}

// Обработка клика по ячейке
function handleCellClick(x, y) {
    console.log(`Клик по ячейке [${x}, ${y}], текущий инструмент: ${currentTool}, gameRunning: ${gameRunning}`);
    
    if (!gameRunning) {
        console.log("Игра не запущена, клик игнорируется");
        return;
    }
    
    const cell = grid[y][x];
    console.log(`Тип ячейки: ${cell.type}, деньги: ${money}`);
    
    switch (currentTool) {
        case 'soil':
            if (cell.type === CELL_TYPES.EMPTY && money >= 10) {
                console.log("Вспахиваем землю");
                cell.type = CELL_TYPES.SOIL;
                cell.element.className = 'cell soil';
                money -= 10;
                updateUI();
            }
            break;
            
        case 'seed':
            if (cell.type === CELL_TYPES.SOIL && money >= 5) {
                console.log("Сажаем семена");
                cell.type = CELL_TYPES.CABBAGE_SEED;
                cell.element.className = 'cell cabbage-seed';
                cell.growthStage = 1;
                cell.growthTime = 0;
                money -= 5;
                updateUI();
                
                // Запускаем рост капусты
                startGrowth(x, y);
            }
            break;
            
        case 'harvest':
            if (cell.type === CELL_TYPES.CABBAGE_READY) {
                console.log("Собираем урожай");
                cabbage += 1;
                cell.type = CELL_TYPES.SOIL;
                cell.element.className = 'cell soil';
                cell.growthStage = 0;
                updateUI();
            }
            break;
            
        case 'tower':
            if ((cell.type === CELL_TYPES.EMPTY || cell.type === CELL_TYPES.SOIL) && money >= 50) {
                console.log("Строим башню");
                cell.type = CELL_TYPES.TOWER;
                cell.element.className = 'cell tower';
                
                // Добавляем визуальный индикатор радиуса атаки
                const radius = document.createElement('div');
                radius.className = 'tower-radius';
                cell.element.appendChild(radius);
                
                money -= 50;
                updateUI();
            }
            break;
    }
}

// Запуск роста капусты
function startGrowth(x, y) {
    console.log(`Запускаем рост капусты в [${x}, ${y}]`);
    const growthInterval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(growthInterval);
            return;
        }
        
        const cell = grid[y][x];
        
        if (cell.type === CELL_TYPES.CABBAGE_SEED) {
            cell.growthTime += 1;
            console.log(`Рост семян: ${cell.growthTime}/10`);
            
            if (cell.growthTime >= 10) {
                console.log("Семена выросли в молодую капусту");
                cell.type = CELL_TYPES.CABBAGE_GROWING;
                cell.element.className = 'cell cabbage-growing';
                cell.growthStage = 2;
                cell.growthTime = 0;
            }
        } else if (cell.type === CELL_TYPES.CABBAGE_GROWING) {
            cell.growthTime += 1;
            console.log(`Рост молодой капусты: ${cell.growthTime}/15`);
            
            if (cell.growthTime >= 15) {
                console.log("Капуста созрела");
                cell.type = CELL_TYPES.CABBAGE_READY;
                cell.element.className = 'cell cabbage-ready';
                cell.growthStage = 3;
                clearInterval(growthInterval);
            }
        } else {
            console.log("Рост капусты прерван");
            clearInterval(growthInterval);
        }
    }, 1000);
    
    growthIntervals.push(growthInterval);
}

// Обновление интерфейса
function updateUI() {
    cabbageCount.textContent = cabbage;
    moneyCount.textContent = money;
    waveNumber.textContent = wave;
    wormsLeft.textContent = worms + wormPositions.length;
    timeToNextWave.textContent = timeToNext;
}

// Запуск волны вермизлюков
function spawnWave() {
    console.log(`Запуск волны ${wave}`);
    // Количество вермизлюков зависит от номера волны
    worms = Math.min(5 + wave * 2, 30);
    timeToNext = 30 + wave * 5; // Больше времени между волнами с каждой волной
    
    // Обновляем интерфейс
    updateUI();
    
    // Спавним вермизлюков по краям поля
    for (let i = 0; i < Math.min(worms, 10); i++) {
        setTimeout(() => {
            if (gameRunning) {
                spawnWorm();
            }
        }, i * 1000); // Появление с интервалом в 1 секунду
    }
}

// Спавн одного вермизлюка
function spawnWorm() {
    console.log("Спавн вермизлюка");
    // Выбираем случайную сторону поля
    const side = Math.floor(Math.random() * 4); // 0 - верх, 1 - право, 2 - низ, 3 - лево
    let x, y;
    
    switch (side) {
        case 0: // верх
            x = Math.floor(Math.random() * GRID_SIZE);
            y = 0;
            break;
        case 1: // право
            x = GRID_SIZE - 1;
            y = Math.floor(Math.random() * GRID_SIZE);
            break;
        case 2: // низ
            x = Math.floor(Math.random() * GRID_SIZE);
            y = GRID_SIZE - 1;
            break;
        case 3: // лево
            x = 0;
            y = Math.floor(Math.random() * GRID_SIZE);
            break;
    }
    
    console.log(`Позиция вермизлюка: [${x}, ${y}]`);
    
    // Проверяем, что ячейка не занята
    if (grid[y][x].type !== CELL_TYPES.WORM) {
        // Сохраняем оригинальный тип ячейки
        const originalType = grid[y][x].type;
        const originalClass = grid[y][x].element.className;
        
        // Размещаем вермизлюка
        grid[y][x].type = CELL_TYPES.WORM;
        grid[y][x].element.className = 'cell worm';
        grid[y][x].originalType = originalType;
        grid[y][x].originalClass = originalClass;
        grid[y][x].health = 100; // Здоровье вермизлюка
        
        // Добавляем позицию вермизлюка
        wormPositions.push({ x, y });
        worms--; // Уменьшаем счетчик оставшихся вермизлюков
        updateUI();
    } else {
        // Если ячейка занята, пробуем еще раз
        spawnWorm();
    }
}

// Перемещение вермизлюков
function moveWorms() {
    if (wormPositions.length === 0) return;
    
    console.log(`Перемещение вермизлюков (${wormPositions.length})`);
    
    // Восстанавливаем оригинальный тип ячеек
    for (const pos of wormPositions) {
        grid[pos.y][pos.x].type = grid[pos.y][pos.x].originalType;
        grid[pos.y][pos.x].element.className = grid[pos.y][pos.x].originalClass;
    }
    
    const newPositions = [];
    
    for (const { x, y } of wormPositions) {
        // Ищем ближайшую капусту
        let targetX = x;
        let targetY = y;
        let minDistance = Infinity;
        
        for (let cy = 0; cy < GRID_SIZE; cy++) {
            for (let cx = 0; cx < GRID_SIZE; cx++) {
                if (grid[cy][cx].type === CELL_TYPES.CABBAGE_SEED || 
                    grid[cy][cx].type === CELL_TYPES.CABBAGE_GROWING || 
                    grid[cy][cx].type === CELL_TYPES.CABBAGE_READY) {
                    const distance = Math.abs(cx - x) + Math.abs(cy - y);
                    if (distance < minDistance) {
                        minDistance = distance;
                        targetX = cx;
                        targetY = cy;
                    }
                }
            }
        }
        
        // Определяем направление движения
        let newX = x;
        let newY = y;
        
        if (targetX < x) newX--;
        else if (targetX > x) newX++;
        
        if (targetY < y) newY--;
        else if (targetY > y) newY++;
        
        // Проверяем, что новая позиция в пределах поля
        newX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
        newY = Math.max(0, Math.min(GRID_SIZE - 1, newY));
        
        // Проверяем, что новая позиция не занята другим вермизлюком
        let positionOccupied = false;
        for (const pos of newPositions) {
            if (pos.x === newX && pos.y === newY) {
                positionOccupied = true;
                break;
            }
        }
        
        if (!positionOccupied) {
            // Если вермизлюк достиг капусты, уничтожаем её
            if (grid[newY][newX].type === CELL_TYPES.CABBAGE_SEED || 
                grid[newY][newX].type === CELL_TYPES.CABBAGE_GROWING || 
                grid[newY][newX].type === CELL_TYPES.CABBAGE_READY) {
                console.log(`Вермизлюк уничтожил капусту в [${newX}, ${newY}]`);
                grid[newY][newX].type = CELL_TYPES.SOIL;
                grid[newY][newX].element.className = 'cell soil';
                grid[newY][newX].growthStage = 0;
            }
            
            // Сохраняем оригинальный тип ячейки
            const originalType = grid[newY][newX].type;
            const originalClass = grid[newY][newX].element.className;
            
            // Перемещаем вермизлюка
            grid[newY][newX].type = CELL_TYPES.WORM;
            grid[newY][newX].element.className = 'cell worm';
            grid[newY][newX].originalType = originalType;
            grid[newY][newX].originalClass = originalClass;
            grid[newY][newX].health = grid[y][x].health;
            
            newPositions.push({ x: newX, y: newY });
        } else {
            // Если позиция занята, остаемся на месте
            newPositions.push({ x, y });
        }
    }
    
    wormPositions = newPositions;
    
    // Проверяем, остались ли вермизлюки
    if (worms <= 0 && wormPositions.length === 0) {
        // Волна завершена
        console.log(`Волна ${wave} завершена`);
        wave++;
        timeToNext = 30;
        updateUI();
    }
    
    // Проверяем, остались ли капустные поля
    let hasCabbage = false;
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x].type === CELL_TYPES.CABBAGE_SEED || 
                grid[y][x].type === CELL_TYPES.CABBAGE_GROWING || 
                grid[y][x].type === CELL_TYPES.CABBAGE_READY) {
                hasCabbage = true;
                break;
            }
        }
        if (hasCabbage) break;
    }
    
    // Если капусты нет и нет возможности посадить новую, игра окончена
    if (!hasCabbage && money < 15) { // 10 для почвы + 5 для семян
        console.log("Игра окончена - нет капусты и недостаточно денег");
        gameOver();
    }
}

// Атака башен
function towerAttack() {
    // Для каждой башни ищем ближайшего вермизлюка в радиусе 2 клеток
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x].type === CELL_TYPES.TOWER) {
                for (let i = 0; i < wormPositions.length; i++) {
                    const worm = wormPositions[i];
                    const distance = Math.abs(worm.x - x) + Math.abs(worm.y - y);
                    
                    if (distance <= 2) {
                        // Наносим урон вермизлюку
                        grid[worm.y][worm.x].health -= 25;
                        console.log(`Башня в [${x}, ${y}] атакует вермизлюка в [${worm.x}, ${worm.y}], здоровье: ${grid[worm.y][worm.x].health}`);
                        
                        // Визуальный эффект атаки
                        grid[worm.y][worm.x].element.style.backgroundColor = '#FF0000';
                        setTimeout(() => {
                            if (grid[worm.y][worm.x].type === CELL_TYPES.WORM) {
                                grid[worm.y][worm.x].element.style.backgroundColor = '';
                            }
                        }, 200);
                        
                        // Если вермизлюк уничтожен
                        if (grid[worm.y][worm.x].health <= 0) {
                            console.log(`Вермизлюк в [${worm.x}, ${worm.y}] уничтожен`);
                            grid[worm.y][worm.x].type = grid[worm.y][worm.x].originalType;
                            grid[worm.y][worm.x].element.className = grid[worm.y][worm.x].originalClass;
                            wormPositions.splice(i, 1);
                            i--;
                            updateUI();
                        }
                        
                        break; // Башня атакует только одного вермизлюка за раз
                    }
                }
            }
        }
    }
}

// Продажа всей капусты
function sellAllCabbage() {
    console.log(`Продаем ${cabbage} капусты за ${cabbage * 20} денег`);
    money += cabbage * 20; // 20 денег за каждую капусту
    cabbage = 0;
    updateUI();
}

// Игра окончена
function gameOver() {
    console.log("Игра окончена");
    gameRunning = false;
    clearInterval(gameLoopInterval);
    clearInterval(waveInterval);
    
    for (const interval of growthIntervals) {
        clearInterval(interval);
    }
    growthIntervals = [];
    
    wavesSurvived.textContent = wave - 1;
    gameOverScreen.style.display = 'flex';
}

// Перезапуск игры
function restartGame() {
    console.log("Перезапуск игры");
    gameOverScreen.style.display = 'none';
    startGame();
}

// Запуск игры
function startGame() {
    console.log("Запуск игры");
    // Сбрасываем состояние игры
    gameRunning = true;
    currentTool = 'soil';
    cabbage = 0;
    money = 100;
    wave = 1;
    worms = 0;
    timeToNext = 30;
    wormPositions = [];
    
    // Очищаем интервалы
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (waveInterval) clearInterval(waveInterval);
    for (const interval of growthIntervals) {
        clearInterval(interval);
    }
    growthIntervals = [];
    
    // Обновляем активный инструмент
    tools.forEach(tool => {
        tool.classList.remove('active');
        if (tool.dataset.tool === currentTool) {
            tool.classList.add('active');
        }
    });
    
    // Инициализируем игровое поле
    initializeGrid();
    updateUI();
    
    // Запускаем игровой цикл
    gameLoopInterval = setInterval(() => {
        moveWorms();
        towerAttack();
    }, 1000);
    
    // Запускаем таймер волн
    waveInterval = setInterval(() => {
        if (timeToNext > 0) {
            timeToNext--;
            updateUI();
        } else {
            // Запускаем новую волну
            spawnWave();
        }
    }, 1000);
}

// Обработчики событий
tools.forEach(tool => {
    tool.addEventListener('click', () => {
        if (!gameRunning) return;
        
        currentTool = tool.dataset.tool;
        console.log(`Выбран инструмент: ${currentTool}`);
        
        // Обновляем активный инструмент
        tools.forEach(t => t.classList.remove('active'));
        tool.classList.add('active');
    });
});

// Убедимся, что обработчики событий добавлены правильно
console.log("Добавление обработчиков событий");
startButton.addEventListener('click', () => {
    console.log("Нажата кнопка 'Начать игру'");
    startGame();
});

sellAllButton.addEventListener('click', () => {
    console.log("Нажата кнопка 'Продать всю капусту'");
    sellAllCabbage();
});

restartButton.addEventListener('click', () => {
    console.log("Нажата кнопка 'Начать заново'");
    restartGame();
});

// Инициализация игры
console.log("Инициализация игры");
initializeGrid();
updateUI();

// Проверка, что все элементы DOM найдены
console.log("Проверка элементов DOM:");
console.log("gameBoard:", gameBoard);
console.log("startButton:", startButton);
console.log("sellAllButton:", sellAllButton);
console.log("restartButton:", restartButton);