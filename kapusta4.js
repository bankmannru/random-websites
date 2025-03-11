// Получаем элементы DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const energyElement = document.getElementById('energy');
const eraElement = document.getElementById('era');
const startButton = document.getElementById('startButton');
const eraButtons = document.querySelectorAll('.era-button');

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
let currentEra = 'present'; // present, prehistoric, egypt, medieval, western, future
let platforms = [];
let enemies = [];
let collectibles = [];
let timePortals = [];
let particles = [];
let gameObjects = [];
let backgroundObjects = [];

// Игрок (капуста)
let player = {
    x: 0,
    y: 0,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpForce: 12,
    isJumping: false,
    isGrounded: false,
    direction: 'right',
    isInvulnerable: false,
    invulnerabilityTime: 0,
    invulnerabilityDuration: 1000,
    hasTimeMachine: false
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

// Константы физики
const gravity = 0.5;
const friction = 0.8;
const terminalVelocity = 10;

// Добавляем в начало файла после объявления переменных
let useCustomLevels = false;
let customLevelName = 'level1';

// Добавляем в HTML-интерфейс кнопку для переключения между стандартными и пользовательскими уровнями
const customLevelsButton = document.createElement('button');
customLevelsButton.id = 'customLevelsButton';
customLevelsButton.textContent = 'Использовать пользовательские уровни';
customLevelsButton.style.marginTop = '10px';
customLevelsButton.style.backgroundColor = '#2d2d4d';
customLevelsButton.style.color = '#fff';
customLevelsButton.style.border = '2px solid #4adc10';
customLevelsButton.style.padding = '8px 15px';
customLevelsButton.style.borderRadius = '5px';
customLevelsButton.style.cursor = 'pointer';

// Добавляем поле ввода для имени уровня
const levelNameInput = document.createElement('input');
levelNameInput.id = 'levelNameInput';
levelNameInput.placeholder = 'Название уровня';
levelNameInput.style.marginTop = '10px';
levelNameInput.style.padding = '8px';
levelNameInput.style.borderRadius = '5px';
levelNameInput.style.border = '2px solid #4adc10';
levelNameInput.style.backgroundColor = '#2d2d4d';
levelNameInput.style.color = '#fff';
levelNameInput.style.display = 'none';

// Добавляем ссылку на редактор уровней
const editorLink = document.createElement('a');
editorLink.href = 'kapusta4_editor.html';
editorLink.textContent = 'Открыть редактор уровней';
editorLink.className = 'button';
editorLink.style.marginTop = '10px';
editorLink.style.display = 'inline-block';
editorLink.style.backgroundColor = '#4adc10';
editorLink.style.color = '#000';
editorLink.style.textDecoration = 'none';
editorLink.style.padding = '8px 15px';
editorLink.style.borderRadius = '5px';
editorLink.style.display = 'none';

// Добавляем кнопку импорта уровня из файла
const importLevelButton = document.createElement('button');
importLevelButton.id = 'importLevelButton';
importLevelButton.textContent = 'Импорт уровня из файла';
importLevelButton.style.marginTop = '10px';
importLevelButton.style.backgroundColor = '#2d2d4d';
importLevelButton.style.color = '#fff';
importLevelButton.style.border = '2px solid #4adc10';
importLevelButton.style.padding = '8px 15px';
importLevelButton.style.borderRadius = '5px';
importLevelButton.style.cursor = 'pointer';
importLevelButton.style.display = 'none';

// Добавляем скрытый элемент для выбора файла
const importFileInput = document.createElement('input');
importFileInput.type = 'file';
importFileInput.id = 'importFileInput';
importFileInput.accept = '.json';
importFileInput.style.display = 'none';

// Инициализация размеров канваса
setupCanvas();
player.x = 50;
player.y = canvas.height - 150;

// Загрузка изображений
const playerImg = new Image();
playerImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60"><rect x="15" y="40" width="10" height="20" fill="#8B4513"/><circle cx="20" cy="25" r="15" fill="#4adc10"/><circle cx="15" cy="20" r="2" fill="#000"/><circle cx="25" cy="20" r="2" fill="#000"/><path d="M15 30 Q20 35 25 30" stroke="#000" stroke-width="2" fill="none"/></svg>');

const wormPrehistoricImg = new Image();
wormPrehistoricImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/><path d="M10 40 L15 35 M30 40 L25 35" stroke="#0a3c0a" stroke-width="2"/></svg>');

const wormEgyptImg = new Image();
wormEgyptImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/><path d="M5 10 L35 10 L20 0 Z" fill="#FFD700"/></svg>');

const wormMedievalImg = new Image();
wormMedievalImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/><path d="M10 5 L30 5 L30 15 L20 10 L10 15 Z" fill="#C0C0C0"/></svg>');

const wormWesternImg = new Image();
wormWesternImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/><path d="M10 5 L30 5 L30 10 L10 10 Z" fill="#8B4513"/></svg>');

const wormFutureImg = new Image();
wormFutureImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="#00ffff"/><circle cx="15" cy="18" r="1.5" fill="#0000ff"/><circle cx="25" cy="18" r="3" fill="#00ffff"/><circle cx="25" cy="18" r="1.5" fill="#0000ff"/><path d="M5 15 L35 15 M5 20 L35 20" stroke="#00ffff" stroke-width="1"/></svg>');

const platformImgs = {
    present: new Image(),
    prehistoric: new Image(),
    egypt: new Image(),
    medieval: new Image(),
    western: new Image(),
    future: new Image()
};

platformImgs.present.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30" viewBox="0 0 100 30"><rect width="100" height="30" fill="#8B4513"/><rect y="0" width="100" height="10" fill="#228B22"/></svg>');
platformImgs.prehistoric.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30" viewBox="0 0 100 30"><rect width="100" height="30" fill="#A0522D"/><rect y="0" width="100" height="10" fill="#556B2F"/></svg>');
platformImgs.egypt.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30" viewBox="0 0 100 30"><rect width="100" height="30" fill="#DAA520"/><line x1="0" y1="0" x2="100" y2="0" stroke="#8B4513" stroke-width="2"/></svg>');
platformImgs.medieval.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30" viewBox="0 0 100 30"><rect width="100" height="30" fill="#808080"/><rect y="0" width="100" height="5" fill="#A9A9A9"/></svg>');
platformImgs.western.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30" viewBox="0 0 100 30"><rect width="100" height="30" fill="#CD853F"/><rect y="0" width="20" height="5" fill="#8B4513"/><rect x="25" y="0" width="20" height="5" fill="#8B4513"/><rect x="50" y="0" width="20" height="5" fill="#8B4513"/><rect x="75" y="0" width="20" height="5" fill="#8B4513"/></svg>');
platformImgs.future.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30" viewBox="0 0 100 30"><rect width="100" height="30" fill="#1E90FF"/><rect y="0" width="100" height="5" fill="#00BFFF"/><line x1="10" y1="15" x2="90" y2="15" stroke="#00FFFF" stroke-width="2"/></svg>');

const collectibleImg = new Image();
collectibleImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#FFD700"/><circle cx="10" cy="10" r="4" fill="#FFA500"/></svg>');

const portalImg = new Image();
portalImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="80" viewBox="0 0 50 80"><ellipse cx="25" cy="40" rx="20" ry="35" fill="none" stroke="#4adc10" stroke-width="3"/><ellipse cx="25" cy="40" rx="10" ry="25" fill="none" stroke="#4adc10" stroke-width="2"/><path d="M25 5 L25 75" stroke="#4adc10" stroke-width="1" stroke-dasharray="5,5"/></svg>');

const timeMachineImg = new Image();
timeMachineImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#C0C0C0" stroke="#808080" stroke-width="2"/><circle cx="20" cy="20" r="12" fill="#4adc10" stroke="#808080" stroke-width="1"/><path d="M20 10 L20 20 L28 25" stroke="#000" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="2" fill="#000"/></svg>');

// Обработчики событий
startButton.addEventListener('click', startGame);

// Обработчики для кнопок эпох
eraButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (gameRunning && player.hasTimeMachine) {
            const era = button.getAttribute('data-era');
            changeEra(era);
            
            // Обновляем активную кнопку
            eraButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });
});

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

// Обработчики для мобильных устройств
if (isMobile) {
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        
        if (touchX > canvas.width / 2) {
            // Правая половина экрана - взаимодействие
            if (gameRunning) {
                keys.space = true;
                setTimeout(() => { keys.space = false; }, 100);
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
        currentEra = 'present';
        
        // Обновляем отображение
        scoreElement.textContent = score;
        energyElement.textContent = energy;
        eraElement.textContent = 'Настоящее';
        
        // Сбрасываем массивы объектов
        platforms = [];
        enemies = [];
        collectibles = [];
        timePortals = [];
        particles = [];
        gameObjects = [];
        backgroundObjects = [];
        
        // Сбрасываем состояние игрока
        player.x = 50;
        player.y = canvas.height - 150;
        player.velocityX = 0;
        player.velocityY = 0;
        player.isJumping = false;
        player.isGrounded = false;
        player.direction = 'right';
        player.isInvulnerable = false;
        player.hasTimeMachine = false;
        
        // Создаем уровень
        createLevel(currentEra);
        
        // Запускаем игровой цикл
        requestAnimationFrame(gameLoop);
    }
}

// Создание уровня для текущей эпохи
function createLevel(era) {
    // Очищаем существующие объекты
    platforms = [];
    enemies = [];
    collectibles = [];
    timePortals = [];
    gameObjects = [];
    backgroundObjects = [];
    
    if (useCustomLevels) {
        // Пытаемся загрузить пользовательский уровень
        const levelName = levelNameInput.value || customLevelName;
        const levelData = localStorage.getItem(`kapusta4_${levelName}_${era}`);
        
        if (levelData) {
            try {
                const parsedData = JSON.parse(levelData);
                
                // Загружаем объекты из пользовательского уровня
                platforms = parsedData.objects.platforms || [];
                enemies = parsedData.objects.enemies || [];
                collectibles = parsedData.objects.collectibles || [];
                timePortals = parsedData.objects.timePortals || [];
                gameObjects = parsedData.objects.gameObjects || [];
                
                console.log(`Загружен пользовательский уровень "${levelName}" для эпохи "${era}"`);
            } catch (error) {
                console.error('Ошибка при загрузке пользовательского уровня:', error);
                // В случае ошибки создаем стандартный уровень
                createStandardLevel(era);
            }
        } else {
            console.log(`Пользовательский уровень "${levelName}" для эпохи "${era}" не найден. Загружаем стандартный уровень.`);
            createStandardLevel(era);
        }
    } else {
        // Создаем стандартный уровень
        createStandardLevel(era);
    }
    
    // Обновляем текст эпохи
    updateEraText(era);
}

// Обновление текста эпохи
function updateEraText(era) {
    switch (era) {
        case 'present':
            eraElement.textContent = 'Настоящее';
            break;
        case 'prehistoric':
            eraElement.textContent = 'Доисторическая';
            break;
        case 'egypt':
            eraElement.textContent = 'Древний Египет';
            break;
        case 'medieval':
            eraElement.textContent = 'Средневековье';
            break;
        case 'western':
            eraElement.textContent = 'Дикий Запад';
            break;
        case 'future':
            eraElement.textContent = 'Будущее';
            break;
    }
}

// Создание эпохи "Настоящее"
function createPresentEra() {
    // Основная платформа
    platforms.push({
        x: 0,
        y: canvas.height - 30,
        width: canvas.width,
        height: 30,
        type: 'present'
    });
    
    // Дополнительные платформы
    platforms.push({
        x: 200,
        y: canvas.height - 120,
        width: 100,
        height: 30,
        type: 'present'
    });
    
    platforms.push({
        x: 400,
        y: canvas.height - 200,
        width: 150,
        height: 30,
        type: 'present'
    });
    
    // Машина времени (если игрок еще не имеет её)
    if (!player.hasTimeMachine) {
        gameObjects.push({
            x: 450,
            y: canvas.height - 240,
            width: 40,
            height: 40,
            type: 'timeMachine'
        });
    }
    
    // Враги
    enemies.push({
        x: 300,
        y: canvas.height - 80,
        width: 40,
        height: 50,
        velocityX: 2,
        direction: 'right',
        type: 'present'
    });
    
    // Коллекционные предметы
    collectibles.push({
        x: 230,
        y: canvas.height - 150,
        width: 20,
        height: 20
    });
    
    collectibles.push({
        x: 450,
        y: canvas.height - 230,
        width: 20,
        height: 20
    });
    
    // Порталы времени (если у игрока есть машина времени)
    if (player.hasTimeMachine) {
        timePortals.push({
            x: canvas.width - 100,
            y: canvas.height - 110,
            width: 50,
            height: 80,
            destination: 'prehistoric'
        });
    }
}

// Создание доисторической эпохи
function createPrehistoricEra() {
    // Фон и атмосфера доисторической эпохи
    
    // Основная платформа
    platforms.push({
        x: 0,
        y: canvas.height - 30,
        width: canvas.width,
        height: 30,
        type: 'prehistoric'
    });
    
    // Дополнительные платформы
    platforms.push({
        x: 150,
        y: canvas.height - 150,
        width: 120,
        height: 30,
        type: 'prehistoric'
    });
    
    platforms.push({
        x: 350,
        y: canvas.height - 220,
        width: 180,
        height: 30,
        type: 'prehistoric'
    });
    
    // Враги (доисторические вермизлюки)
    enemies.push({
        x: 200,
        y: canvas.height - 100,
        width: 40,
        height: 50,
        velocityX: 1.5,
        direction: 'right',
        type: 'prehistoric'
    });
    
    enemies.push({
        x: 400,
        y: canvas.height - 270,
        width: 40,
        height: 50,
        velocityX: 2,
        direction: 'left',
        type: 'prehistoric'
    });
    
    // Коллекционные предметы
    collectibles.push({
        x: 180,
        y: canvas.height - 180,
        width: 20,
        height: 20
    });
    
    collectibles.push({
        x: 420,
        y: canvas.height - 250,
        width: 20,
        height: 20
    });
    
    // Порталы времени
    timePortals.push({
        x: canvas.width - 100,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'egypt'
    });
    
    timePortals.push({
        x: 50,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'present'
    });
}

// Создание эпохи Древнего Египта
function createEgyptEra() {
    // Основная платформа
    platforms.push({
        x: 0,
        y: canvas.height - 30,
        width: canvas.width,
        height: 30,
        type: 'egypt'
    });
    
    // Пирамидальные платформы
    platforms.push({
        x: 100,
        y: canvas.height - 100,
        width: 200,
        height: 30,
        type: 'egypt'
    });
    
    platforms.push({
        x: 150,
        y: canvas.height - 170,
        width: 100,
        height: 30,
        type: 'egypt'
    });
    
    platforms.push({
        x: 400,
        y: canvas.height - 150,
        width: 150,
        height: 30,
        type: 'egypt'
    });
    
    // Враги (египетские вермизлюки)
    enemies.push({
        x: 150,
        y: canvas.height - 150,
        width: 40,
        height: 50,
        velocityX: 1,
        direction: 'right',
        type: 'egypt'
    });
    
    enemies.push({
        x: 450,
        y: canvas.height - 180,
        width: 40,
        height: 50,
        velocityX: 1.5,
        direction: 'left',
        type: 'egypt'
    });
    
    // Коллекционные предметы
    collectibles.push({
        x: 180,
        y: canvas.height - 200,
        width: 20,
        height: 20
    });
    
    collectibles.push({
        x: 450,
        y: canvas.height - 180,
        width: 20,
        height: 20
    });
    
    // Порталы времени
    timePortals.push({
        x: canvas.width - 100,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'medieval'
    });
    
    timePortals.push({
        x: 50,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'prehistoric'
    });
}

// Создание средневековой эпохи
function createMedievalEra() {
    // Основная платформа
    platforms.push({
        x: 0,
        y: canvas.height - 30,
        width: canvas.width,
        height: 30,
        type: 'medieval'
    });
    
    // Замковые платформы
    platforms.push({
        x: 100,
        y: canvas.height - 120,
        width: 150,
        height: 30,
        type: 'medieval'
    });
    
    platforms.push({
        x: 300,
        y: canvas.height - 180,
        width: 200,
        height: 30,
        type: 'medieval'
    });
    
    platforms.push({
        x: 550,
        y: canvas.height - 120,
        width: 150,
        height: 30,
        type: 'medieval'
    });
    
    // Враги (средневековые вермизлюки)
    enemies.push({
        x: 150,
        y: canvas.height - 170,
        width: 40,
        height: 50,
        velocityX: 1.2,
        direction: 'right',
        type: 'medieval'
    });
    
    enemies.push({
        x: 400,
        y: canvas.height - 230,
        width: 40,
        height: 50,
        velocityX: 1.8,
        direction: 'left',
        type: 'medieval'
    });
    
    // Коллекционные предметы
    collectibles.push({
        x: 150,
        y: canvas.height - 150,
        width: 20,
        height: 20
    });
    
    collectibles.push({
        x: 400,
        y: canvas.height - 210,
        width: 20,
        height: 20
    });
    
    // Порталы времени
    timePortals.push({
        x: canvas.width - 100,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'western'
    });
    
    timePortals.push({
        x: 50,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'egypt'
    });
}

// Создание эпохи Дикого Запада
function createWesternEra() {
    // Основная платформа
    platforms.push({
        x: 0,
        y: canvas.height - 30,
        width: canvas.width,
        height: 30,
        type: 'western'
    });
    
    // Платформы в стиле Дикого Запада
    platforms.push({
        x: 150,
        y: canvas.height - 100,
        width: 120,
        height: 30,
        type: 'western'
    });
    
    platforms.push({
        x: 350,
        y: canvas.height - 150,
        width: 150,
        height: 30,
        type: 'western'
    });
    
    platforms.push({
        x: 600,
        y: canvas.height - 200,
        width: 100,
        height: 30,
        type: 'western'
    });
    
    // Враги (вермизлюки-ковбои)
    enemies.push({
        x: 200,
        y: canvas.height - 150,
        width: 40,
        height: 50,
        velocityX: 2,
        direction: 'right',
        type: 'western'
    });
    
    enemies.push({
        x: 400,
        y: canvas.height - 200,
        width: 40,
        height: 50,
        velocityX: 2.5,
        direction: 'left',
        type: 'western'
    });
    
    // Коллекционные предметы
    collectibles.push({
        x: 180,
        y: canvas.height - 130,
        width: 20,
        height: 20
    });
    
    collectibles.push({
        x: 400,
        y: canvas.height - 180,
        width: 20,
        height: 20
    });
    
    collectibles.push({
        x: 630,
        y: canvas.height - 230,
        width: 20,
        height: 20
    });
    
    // Порталы времени
    timePortals.push({
        x: canvas.width - 100,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'future'
    });
    
    timePortals.push({
        x: 50,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'medieval'
    });
}

// Создание эпохи будущего
function createFutureEra() {
    // Основная платформа
    platforms.push({
        x: 0,
        y: canvas.height - 30,
        width: canvas.width,
        height: 30,
        type: 'future'
    });
    
    // Футуристические платформы
    platforms.push({
        x: 100,
        y: canvas.height - 120,
        width: 150,
        height: 30,
        type: 'future'
    });
    
    platforms.push({
        x: 300,
        y: canvas.height - 200,
        width: 200,
        height: 30,
        type: 'future'
    });
    
    platforms.push({
        x: 550,
        y: canvas.height - 280,
        width: 150,
        height: 30,
        type: 'future'
    });
    
    // Враги (футуристические вермизлюки)
    enemies.push({
        x: 150,
        y: canvas.height - 170,
        width: 40,
        height: 50,
        velocityX: 3,
        direction: 'right',
        type: 'future'
    });
    
    enemies.push({
        x: 400,
        y: canvas.height - 250,
        width: 40,
        height: 50,
        velocityX: 3.5,
        direction: 'left',
        type: 'future'
    });
    
    // Коллекционные предметы
    collectibles.push({
        x: 150,
        y: canvas.height - 150,
        width: 20,
        height: 20
    });
    
    collectibles.push({
        x: 400,
        y: canvas.height - 230,
        width: 20,
        height: 20
    });
    
    collectibles.push({
        x: 600,
        y: canvas.height - 310,
        width: 20,
        height: 20
    });
    
    // Порталы времени
    timePortals.push({
        x: 50,
        y: canvas.height - 110,
        width: 50,
        height: 80,
        destination: 'western'
    });
}

// Смена эпохи
function changeEra(era) {
    // Создаем эффект перехода
    createParticles(player.x + player.width / 2, player.y + player.height / 2, 50, '#4adc10');
    
    // Меняем эпоху
    currentEra = era;
    
    // Создаем новый уровень
    createLevel(era);
    
    // Обновляем текст эпохи
    updateEraText(era);
}

// Создание эффекта портала времени
function createTimePortalEffect() {
    // Создаем элемент для эффекта
    const portal = document.createElement('div');
    portal.className = 'time-portal';
    portal.style.width = '100px';
    portal.style.height = '100px';
    portal.style.left = `${player.x + player.width / 2 - 50}px`;
    portal.style.top = `${player.y + player.height / 2 - 50}px`;
    
    // Добавляем элемент на страницу
    document.body.appendChild(portal);
    
    // Удаляем элемент через 1 секунду
    setTimeout(() => {
        document.body.removeChild(portal);
    }, 1000);
}

// Обновление игры
function update() {
    // Обработка ввода с клавиатуры
    handleInput();
    
    // Применение физики
    applyPhysics();
    
    // Обновление врагов
    updateEnemies();
    
    // Проверка столкновений
    checkCollisions();
    
    // Обновление частиц
    updateParticles();
    
    // Проверка условий победы/поражения
    checkGameConditions();
}

// Обработка ввода
function handleInput() {
    // Сброс горизонтальной скорости
    player.velocityX = 0;
    
    // Обработка клавиатуры
    if (keys.a || keys.left) {
        player.velocityX = -player.speed;
        player.direction = 'left';
    }
    
    if (keys.d || keys.right) {
        player.velocityX = player.speed;
        player.direction = 'right';
    }
    
    // Прыжок
    if ((keys.w || keys.up || keys.space) && player.isGrounded) {
        player.velocityY = -player.jumpForce;
        player.isJumping = true;
        player.isGrounded = false;
    }
    
    // Обработка виртуального джойстика для мобильных устройств
    if (joystick.active) {
        const dx = joystick.moveX - joystick.startX;
        const dy = joystick.moveY - joystick.startY;
        
        // Горизонтальное движение
        if (Math.abs(dx) > 20) {
            player.velocityX = Math.sign(dx) * player.speed;
            player.direction = dx > 0 ? 'right' : 'left';
        }
        
        // Прыжок (свайп вверх)
        if (dy < -50 && player.isGrounded) {
            player.velocityY = -player.jumpForce;
            player.isJumping = true;
            player.isGrounded = false;
        }
    }
}

// Применение физики
function applyPhysics() {
    // Применяем гравитацию
    player.velocityY += gravity;
    
    // Ограничиваем максимальную скорость падения
    if (player.velocityY > terminalVelocity) {
        player.velocityY = terminalVelocity;
    }
    
    // Обновляем позицию игрока
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Сбрасываем состояние приземления
    player.isGrounded = false;
    
    // Проверяем столкновения с платформами
    for (const platform of platforms) {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height / 2 &&
            player.velocityY >= 0
        ) {
            player.isGrounded = true;
            player.velocityY = 0;
            player.y = platform.y - player.height;
        }
    }
    
    // Ограничиваем игрока границами экрана
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
    
    // Проверяем, не упал ли игрок за пределы экрана
    if (player.y > canvas.height) {
        // Уменьшаем энергию
        energy -= 10;
        energyElement.textContent = energy;
        
        // Возвращаем игрока на безопасную позицию
        player.x = 50;
        player.y = canvas.height - 150;
        player.velocityY = 0;
        
        // Проверяем, не закончилась ли игра
        if (energy <= 0) {
            gameOver();
        }
    }
}

// Обновление врагов
function updateEnemies() {
    for (const enemy of enemies) {
        // Обновляем позицию врага
        enemy.x += enemy.velocityX * (enemy.direction === 'right' ? 1 : -1);
        
        // Проверяем столкновения с краями платформ
        let isOnPlatform = false;
        let willFallOff = true;
        
        for (const platform of platforms) {
            // Проверяем, стоит ли враг на платформе
            if (
                enemy.x < platform.x + platform.width &&
                enemy.x + enemy.width > platform.x &&
                enemy.y + enemy.height >= platform.y &&
                enemy.y + enemy.height <= platform.y + 10
            ) {
                isOnPlatform = true;
                
                // Проверяем, не упадет ли враг с края платформы
                if (
                    (enemy.direction === 'right' && enemy.x + enemy.width + enemy.velocityX < platform.x + platform.width) ||
                    (enemy.direction === 'left' && enemy.x - enemy.velocityX > platform.x)
                ) {
                    willFallOff = false;
                }
            }
        }
        
        // Если враг достиг края платформы или стены, меняем направление
        if (
            enemy.x <= 0 ||
            enemy.x + enemy.width >= canvas.width ||
            (isOnPlatform && willFallOff)
        ) {
            enemy.direction = enemy.direction === 'right' ? 'left' : 'right';
        }
    }
}

// Проверка столкновений
function checkCollisions() {
    // Проверка столкновений с врагами
    for (const enemy of enemies) {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y &&
            !player.isInvulnerable
        ) {
            // Игрок столкнулся с врагом
            energy -= 10;
            energyElement.textContent = energy;
            
            // Делаем игрока неуязвимым на короткое время
            player.isInvulnerable = true;
            setTimeout(() => {
                player.isInvulnerable = false;
            }, player.invulnerabilityDuration);
            
            // Отталкиваем игрока
            player.velocityY = -5;
            player.velocityX = player.x < enemy.x ? -5 : 5;
            
            // Проверяем, не закончилась ли игра
            if (energy <= 0) {
                gameOver();
                return;
            }
        }
    }
    
    // Проверка столкновений с коллекционными предметами
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const collectible = collectibles[i];
        
        if (
            player.x < collectible.x + collectible.width &&
            player.x + player.width > collectible.x &&
            player.y < collectible.y + collectible.height &&
            player.y + player.height > collectible.y
        ) {
            // Игрок собрал предмет
            score += 10;
            scoreElement.textContent = score;
            
            // Удаляем предмет
            collectibles.splice(i, 1);
            
            // Создаем эффект сбора
            createParticles(
                collectible.x + collectible.width / 2,
                collectible.y + collectible.height / 2,
                10,
                '#FFD700'
            );
        }
    }
    
    // Проверка столкновений с порталами времени
    for (const portal of timePortals) {
        if (
            player.x < portal.x + portal.width &&
            player.x + player.width > portal.x &&
            player.y < portal.y + portal.height &&
            player.y + player.height > portal.y &&
            keys.space
        ) {
            // Игрок активировал портал
            changeEra(portal.destination);
            return;
        }
    }
    
    // Проверка столкновений с машиной времени
    for (let i = gameObjects.length - 1; i >= 0; i--) {
        const obj = gameObjects[i];
        
        if (
            obj.type === 'timeMachine' &&
            player.x < obj.x + obj.width &&
            player.x + player.width > obj.x &&
            player.y < obj.y + obj.height &&
            player.y + player.height > obj.y &&
            keys.space
        ) {
            // Игрок получил машину времени
            player.hasTimeMachine = true;
            
            // Удаляем объект
            gameObjects.splice(i, 1);
            
            // Создаем эффект получения
            createParticles(
                obj.x + obj.width / 2,
                obj.y + obj.height / 2,
                20,
                '#4adc10'
            );
            
            // Активируем кнопки эпох
            document.querySelector('.era-button[data-era="prehistoric"]').classList.add('active');
            
            // Создаем порталы времени
            createLevel(currentEra);
        }
    }
}

// Создание частиц
function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            color: color,
            life: 30
        });
    }
}

// Обновление частиц
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Обновляем позицию
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        
        // Уменьшаем время жизни
        particle.life--;
        
        // Удаляем частицу, если время жизни истекло
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Проверка условий победы/поражения
function checkGameConditions() {
    // Проверяем, собраны ли все предметы в текущей эпохе
    if (collectibles.length === 0 && currentEra === 'future') {
        // Игрок собрал все предметы в будущем - победа!
        victory();
    }
}

// Функция победы
function victory() {
    gameRunning = false;
    
    // Рисуем экран победы
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4adc10';
    ctx.font = isMobile ? '24px Arial' : '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Победа!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = isMobile ? '18px Arial' : '24px Arial';
    ctx.fillText(`Вы спасли временную линию!`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Ваш счёт: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    
    ctx.font = isMobile ? '14px Arial' : '18px Arial';
    ctx.fillText('Нажмите "Начать игру", чтобы сыграть снова', canvas.width / 2, canvas.height / 2 + 80);
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
    ctx.fillText(`Вермизлюки изменили историю!`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`Ваш счёт: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    
    ctx.font = isMobile ? '14px Arial' : '18px Arial';
    ctx.fillText('Нажмите "Начать игру", чтобы попробовать снова', canvas.width / 2, canvas.height / 2 + 80);
}

// Отрисовка игры
function draw() {
    // Очистка холста
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон в зависимости от эпохи
    drawBackground();
    
    // Рисуем платформы
    for (const platform of platforms) {
        ctx.drawImage(
            platformImgs[platform.type],
            platform.x,
            platform.y,
            platform.width,
            platform.height
        );
    }
    
    // Рисуем порталы времени
    for (const portal of timePortals) {
        ctx.drawImage(
            portalImg,
            portal.x,
            portal.y,
            portal.width,
            portal.height
        );
    }
    
    // Рисуем коллекционные предметы
    for (const collectible of collectibles) {
        ctx.drawImage(
            collectibleImg,
            collectible.x,
            collectible.y,
            collectible.width,
            collectible.height
        );
    }
    
    // Рисуем игровые объекты
    for (const obj of gameObjects) {
        if (obj.type === 'timeMachine') {
            ctx.drawImage(
                timeMachineImg,
                obj.x,
                obj.y,
                obj.width,
                obj.height
            );
        }
    }
    
    // Рисуем врагов
    for (const enemy of enemies) {
        let enemyImg;
        
        switch (enemy.type) {
            case 'prehistoric':
                enemyImg = wormPrehistoricImg;
                break;
            case 'egypt':
                enemyImg = wormEgyptImg;
                break;
            case 'medieval':
                enemyImg = wormMedievalImg;
                break;
            case 'western':
                enemyImg = wormWesternImg;
                break;
            case 'future':
                enemyImg = wormFutureImg;
                break;
            default:
                enemyImg = wormPrehistoricImg;
        }
        
        ctx.save();
        if (enemy.direction === 'left') {
            ctx.translate(enemy.x + enemy.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
                enemyImg,
                0,
                enemy.y,
                enemy.width,
                enemy.height
            );
        } else {
            ctx.drawImage(
                enemyImg,
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );
        }
        ctx.restore();
    }
    
    // Рисуем игрока
    ctx.save();
    if (player.direction === 'left') {
        ctx.translate(player.x + player.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
            playerImg,
            0,
            player.y,
            player.width,
            player.height
        );
    } else {
        ctx.drawImage(
            playerImg,
            player.x,
            player.y,
            player.width,
            player.height
        );
    }
    ctx.restore();
    
    // Рисуем частицы
    for (const particle of particles) {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Рисуем виртуальный джойстик для мобильных устройств
    if (isMobile && joystick.active) {
        // Основа джойстика
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(joystick.startX, joystick.startY, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Ручка джойстика
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        
        // Ограничиваем движение ручки
        const dx = joystick.moveX - joystick.startX;
        const dy = joystick.moveY - joystick.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 40;
        
        let joystickX = joystick.moveX;
        let joystickY = joystick.moveY;
        
        if (distance > maxDistance) {
            const ratio = maxDistance / distance;
            joystickX = joystick.startX + dx * ratio;
            joystickY = joystick.startY + dy * ratio;
        }
        
        ctx.arc(joystickX, joystickY, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Рисование фона в зависимости от эпохи
function drawBackground() {
    switch (currentEra) {
        case 'present':
            // Современный фон
            ctx.fillStyle = '#87CEEB'; // Голубое небо
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Облака
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(100, 80, 30, 0, Math.PI * 2);
            ctx.arc(130, 70, 40, 0, Math.PI * 2);
            ctx.arc(160, 80, 30, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(500, 120, 30, 0, Math.PI * 2);
            ctx.arc(530, 110, 40, 0, Math.PI * 2);
            ctx.arc(560, 120, 30, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'prehistoric':
            // Доисторический фон
            ctx.fillStyle = '#8B4513'; // Коричневое небо
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Вулкан
            ctx.fillStyle = '#A52A2A';
            ctx.beginPath();
            ctx.moveTo(600, canvas.height - 200);
            ctx.lineTo(700, 100);
            ctx.lineTo(800, canvas.height - 200);
            ctx.fill();
            
            // Лава
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(700, 100, 20, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'egypt':
            // Египетский фон
            ctx.fillStyle = '#F4A460'; // Песочное небо
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Пирамиды
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.moveTo(100, canvas.height - 100);
            ctx.lineTo(200, canvas.height - 200);
            ctx.lineTo(300, canvas.height - 100);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(400, canvas.height - 100);
            ctx.lineTo(550, canvas.height - 250);
            ctx.lineTo(700, canvas.height - 100);
            ctx.fill();
            
            // Солнце
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(700, 100, 40, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'medieval':
            // Средневековый фон
            ctx.fillStyle = '#708090'; // Серое небо
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Замок
            ctx.fillStyle = '#696969';
            ctx.fillRect(500, canvas.height - 300, 200, 200);
            
            // Башни
            ctx.fillStyle = '#808080';
            ctx.fillRect(480, canvas.height - 350, 40, 250);
            ctx.fillRect(680, canvas.height - 350, 40, 250);
            
            // Флаги
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(500, canvas.height - 350);
            ctx.lineTo(500, canvas.height - 380);
            ctx.lineTo(530, canvas.height - 365);
            ctx.lineTo(500, canvas.height - 350);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(700, canvas.height - 350);
            ctx.lineTo(700, canvas.height - 380);
            ctx.lineTo(730, canvas.height - 365);
            ctx.lineTo(700, canvas.height - 350);
            ctx.fill();
            break;
            
        case 'western':
            // Фон Дикого Запада
            ctx.fillStyle = '#F0E68C'; // Песочное небо
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Горы
            ctx.fillStyle = '#CD853F';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - 150);
            ctx.lineTo(200, canvas.height - 250);
            ctx.lineTo(400, canvas.height - 180);
            ctx.lineTo(600, canvas.height - 280);
            ctx.lineTo(800, canvas.height - 200);
            ctx.lineTo(800, canvas.height);
            ctx.lineTo(0, canvas.height);
            ctx.fill();
            
            // Кактусы
            ctx.fillStyle = '#2E8B57';
            ctx.fillRect(150, canvas.height - 180, 10, 50);
            ctx.fillRect(140, canvas.height - 160, 30, 10);
            
            ctx.fillRect(650, canvas.height - 220, 10, 70);
            ctx.fillRect(640, canvas.height - 180, 30, 10);
            break;
            
        case 'future':
            // Футуристический фон
            ctx.fillStyle = '#000033'; // Темно-синее небо
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Звезды
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 100; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = Math.random() * 2 + 1;
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Футуристические здания
            ctx.fillStyle = '#1E90FF';
            ctx.fillRect(100, canvas.height - 250, 50, 250);
            ctx.fillRect(200, canvas.height - 350, 70, 350);
            ctx.fillRect(350, canvas.height - 200, 60, 200);
            ctx.fillRect(500, canvas.height - 300, 80, 300);
            ctx.fillRect(650, canvas.height - 280, 50, 280);
            
            // Неоновые огни
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - 100);
            ctx.lineTo(canvas.width, canvas.height - 100);
            ctx.stroke();
            
            ctx.strokeStyle = '#FF00FF';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - 120);
            ctx.lineTo(canvas.width, canvas.height - 120);
            ctx.stroke();
            break;
    }
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
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 1;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Рисуем порталы времени
    ctx.strokeStyle = '#4adc10';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 4, canvas.height / 2, 50, 80, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(canvas.width * 3 / 4, canvas.height / 2, 50, 80, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Рисуем текст
    ctx.fillStyle = '#4adc10';
    ctx.font = isMobile ? '24px Arial' : '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Капуста 4: Путешествие во времени', canvas.width / 2, canvas.height / 2 - 100);
    
    ctx.font = isMobile ? '14px Arial' : '18px Arial';
    ctx.fillText('Вермизлюки захватили машину времени и пытаются изменить историю!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText('Путешествуйте через эпохи и остановите их план!', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillText('Нажмите "Начать игру", чтобы начать', canvas.width / 2, canvas.height / 2 + 100);
};

// Добавляем элементы в DOM после загрузки страницы
window.addEventListener('DOMContentLoaded', () => {
    const instructionsDiv = document.querySelector('.instructions');
    instructionsDiv.appendChild(customLevelsButton);
    instructionsDiv.appendChild(document.createElement('br'));
    instructionsDiv.appendChild(levelNameInput);
    instructionsDiv.appendChild(document.createElement('br'));
    instructionsDiv.appendChild(editorLink);
    instructionsDiv.appendChild(document.createElement('br'));
    instructionsDiv.appendChild(importLevelButton);
    instructionsDiv.appendChild(importFileInput);
    
    // Обработчик для кнопки пользовательских уровней
    customLevelsButton.addEventListener('click', toggleCustomLevels);
    
    // Обработчик для кнопки импорта уровня
    importLevelButton.addEventListener('click', () => {
        importFileInput.click();
    });
    
    // Обработчик для выбора файла
    importFileInput.addEventListener('change', importLevelFromFile);
});

// Функция переключения между стандартными и пользовательскими уровнями
function toggleCustomLevels() {
    useCustomLevels = !useCustomLevels;
    
    if (useCustomLevels) {
        customLevelsButton.textContent = 'Использовать стандартные уровни';
        customLevelsButton.style.backgroundColor = '#4adc10';
        customLevelsButton.style.color = '#000';
        levelNameInput.style.display = 'inline-block';
        editorLink.style.display = 'inline-block';
        importLevelButton.style.display = 'inline-block';
        
        // Устанавливаем имя уровня из поля ввода
        customLevelName = levelNameInput.value || 'level1';
    } else {
        customLevelsButton.textContent = 'Использовать пользовательские уровни';
        customLevelsButton.style.backgroundColor = '#2d2d4d';
        customLevelsButton.style.color = '#fff';
        levelNameInput.style.display = 'none';
        editorLink.style.display = 'none';
        importLevelButton.style.display = 'none';
    }
    
    // Если игра уже запущена, перезагружаем уровень
    if (gameRunning) {
        createLevel(currentEra);
    }
}

// Обновляем обработчик события для поля ввода имени уровня
levelNameInput.addEventListener('change', (e) => {
    customLevelName = e.target.value || 'level1';
    
    // Если игра уже запущена и используются пользовательские уровни, перезагружаем уровень
    if (gameRunning && useCustomLevels) {
        createLevel(currentEra);
    }
});

// Функция импорта уровня из файла
function importLevelFromFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const levelData = JSON.parse(event.target.result);
            
            // Проверяем, что файл содержит корректные данные уровня
            if (!levelData.era || !levelData.objects) {
                throw new Error('Некорректный формат файла уровня');
            }
            
            // Сохраняем уровень в localStorage
            const levelName = levelNameInput.value || 'imported_level';
            localStorage.setItem(`kapusta4_${levelName}_${levelData.era}`, JSON.stringify(levelData));
            
            // Обновляем имя уровня в поле ввода
            levelNameInput.value = levelName;
            customLevelName = levelName;
            
            // Если используются пользовательские уровни и игра запущена, перезагружаем уровень
            if (useCustomLevels && gameRunning) {
                // Если эпоха импортированного уровня отличается от текущей, меняем эпоху
                if (levelData.era !== currentEra) {
                    changeEra(levelData.era);
                } else {
                    createLevel(currentEra);
                }
            }
            
            alert(`Уровень "${levelName}" для эпохи "${levelData.era}" успешно импортирован!`);
        } catch (error) {
            alert('Ошибка при импорте уровня: ' + error.message);
        }
        
        // Сбрасываем значение input, чтобы можно было выбрать тот же файл повторно
        importFileInput.value = '';
    };
    
    reader.readAsText(file);
}

// Функция создания стандартного уровня
function createStandardLevel(era) {
    // Создаем платформы в зависимости от эпохи
    switch (era) {
        case 'present':
            createPresentEra();
            break;
        case 'prehistoric':
            createPrehistoricEra();
            break;
        case 'egypt':
            createEgyptEra();
            break;
        case 'medieval':
            createMedievalEra();
            break;
        case 'western':
            createWesternEra();
            break;
        case 'future':
            createFutureEra();
            break;
    }
}