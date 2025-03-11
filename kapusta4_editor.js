// Редактор уровней для Капуста 4: Путешествие во времени
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const eraSelector = document.getElementById('eraSelector');
const objectTypeSelector = document.getElementById('objectTypeSelector');
const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const clearButton = document.getElementById('clearButton');
const exportButton = document.getElementById('exportButton');
const importButton = document.getElementById('importButton');
const levelNameInput = document.getElementById('levelName');

// Настройка размеров канваса
canvas.width = 800;
canvas.height = 600;

// Текущие настройки редактора
let currentEra = 'present';
let currentObjectType = 'platform';
let isPlacing = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let editorObjects = {
    platforms: [],
    enemies: [],
    collectibles: [],
    timePortals: [],
    gameObjects: []
};

// Загрузка изображений
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

const wormImgs = {
    present: new Image(),
    prehistoric: new Image(),
    egypt: new Image(),
    medieval: new Image(),
    western: new Image(),
    future: new Image()
};

wormImgs.present.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/></svg>');
wormImgs.prehistoric.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/><path d="M10 40 L15 35 M30 40 L25 35" stroke="#0a3c0a" stroke-width="2"/></svg>');
wormImgs.egypt.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/><path d="M5 10 L35 10 L20 0 Z" fill="#FFD700"/></svg>');
wormImgs.medieval.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/><path d="M10 5 L30 5 L30 15 L20 10 L10 15 Z" fill="#C0C0C0"/></svg>');
wormImgs.western.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="white"/><circle cx="15" cy="18" r="1.5" fill="black"/><circle cx="25" cy="18" r="3" fill="white"/><circle cx="25" cy="18" r="1.5" fill="black"/><path d="M10 5 L30 5 L30 10 L10 10 Z" fill="#8B4513"/></svg>');
wormImgs.future.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><ellipse cx="20" cy="25" rx="18" ry="23" fill="#0a5c0a" stroke="#0a3c0a" stroke-width="2"/><circle cx="15" cy="18" r="3" fill="#00ffff"/><circle cx="15" cy="18" r="1.5" fill="#0000ff"/><circle cx="25" cy="18" r="3" fill="#00ffff"/><circle cx="25" cy="18" r="1.5" fill="#0000ff"/><path d="M5 15 L35 15 M5 20 L35 20" stroke="#00ffff" stroke-width="1"/></svg>');

const collectibleImg = new Image();
collectibleImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#FFD700"/><circle cx="10" cy="10" r="4" fill="#FFA500"/></svg>');

const portalImg = new Image();
portalImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="50" height="80" viewBox="0 0 50 80"><ellipse cx="25" cy="40" rx="20" ry="35" fill="none" stroke="#4adc10" stroke-width="3"/><ellipse cx="25" cy="40" rx="10" ry="25" fill="none" stroke="#4adc10" stroke-width="2"/><path d="M25 5 L25 75" stroke="#4adc10" stroke-width="1" stroke-dasharray="5,5"/></svg>');

const timeMachineImg = new Image();
timeMachineImg.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#C0C0C0" stroke="#808080" stroke-width="2"/><circle cx="20" cy="20" r="12" fill="#4adc10" stroke="#808080" stroke-width="1"/><path d="M20 10 L20 20 L28 25" stroke="#000" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="2" fill="#000"/></svg>');

// Обработчики событий
eraSelector.addEventListener('change', (e) => {
    currentEra = e.target.value;
    drawEditor();
});

objectTypeSelector.addEventListener('change', (e) => {
    currentObjectType = e.target.value;
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isPlacing = true;
});

canvas.addEventListener('mousemove', (e) => {
    if (isPlacing) {
        const rect = canvas.getBoundingClientRect();
        currentX = e.clientX - rect.left;
        currentY = e.clientY - rect.top;
        drawEditor();
    }
});

canvas.addEventListener('mouseup', () => {
    if (isPlacing) {
        addObject();
        isPlacing = false;
        drawEditor();
    }
});

saveButton.addEventListener('click', saveLevel);
loadButton.addEventListener('click', loadLevel);
clearButton.addEventListener('click', clearLevel);
exportButton.addEventListener('click', exportLevel);
importButton.addEventListener('click', () => {
    document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', importLevel);

// Функции редактора
function drawEditor() {
    // Очищаем холст
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон в зависимости от эпохи
    drawBackground();
    
    // Рисуем сетку
    drawGrid();
    
    // Рисуем объекты
    drawObjects();
    
    // Рисуем текущий размещаемый объект
    if (isPlacing) {
        drawPlacingObject();
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Вертикальные линии
    for (let x = 0; x <= canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Горизонтальные линии
    for (let y = 0; y <= canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawBackground() {
    switch (currentEra) {
        case 'present':
            ctx.fillStyle = '#87CEEB';
            break;
        case 'prehistoric':
            ctx.fillStyle = '#8B4513';
            break;
        case 'egypt':
            ctx.fillStyle = '#F4A460';
            break;
        case 'medieval':
            ctx.fillStyle = '#708090';
            break;
        case 'western':
            ctx.fillStyle = '#F0E68C';
            break;
        case 'future':
            ctx.fillStyle = '#000033';
            break;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawObjects() {
    // Рисуем платформы
    for (const platform of editorObjects.platforms) {
        if (platform.type === currentEra) {
            ctx.drawImage(
                platformImgs[platform.type],
                platform.x,
                platform.y,
                platform.width,
                platform.height
            );
        }
    }
    
    // Рисуем врагов
    for (const enemy of editorObjects.enemies) {
        if (enemy.type === currentEra) {
            ctx.drawImage(
                wormImgs[enemy.type],
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );
        }
    }
    
    // Рисуем коллекционные предметы
    for (const collectible of editorObjects.collectibles) {
        ctx.drawImage(
            collectibleImg,
            collectible.x,
            collectible.y,
            collectible.width,
            collectible.height
        );
    }
    
    // Рисуем порталы времени
    for (const portal of editorObjects.timePortals) {
        ctx.drawImage(
            portalImg,
            portal.x,
            portal.y,
            portal.width,
            portal.height
        );
        
        // Рисуем текст с назначением портала
        ctx.fillStyle = '#4adc10';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            portal.destination,
            portal.x + portal.width / 2,
            portal.y - 5
        );
    }
    
    // Рисуем игровые объекты
    for (const obj of editorObjects.gameObjects) {
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
}

function drawPlacingObject() {
    const width = currentX - startX;
    const height = currentY - startY;
    
    // Определяем размеры объекта в зависимости от типа
    let objWidth, objHeight;
    
    switch (currentObjectType) {
        case 'platform':
            objWidth = Math.abs(width);
            objHeight = Math.abs(height);
            
            ctx.strokeStyle = '#4adc10';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                width > 0 ? startX : currentX,
                height > 0 ? startY : currentY,
                objWidth,
                objHeight
            );
            break;
            
        case 'enemy':
            objWidth = 40;
            objHeight = 50;
            
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                startX - objWidth / 2,
                startY - objHeight / 2,
                objWidth,
                objHeight
            );
            break;
            
        case 'collectible':
            objWidth = 20;
            objHeight = 20;
            
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                startX - objWidth / 2,
                startY - objHeight / 2,
                objWidth,
                objHeight
            );
            break;
            
        case 'portal':
            objWidth = 50;
            objHeight = 80;
            
            ctx.strokeStyle = '#4adc10';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                startX - objWidth / 2,
                startY - objHeight / 2,
                objWidth,
                objHeight
            );
            break;
            
        case 'timeMachine':
            objWidth = 40;
            objHeight = 40;
            
            ctx.strokeStyle = '#c0c0c0';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                startX - objWidth / 2,
                startY - objHeight / 2,
                objWidth,
                objHeight
            );
            break;
    }
}

function addObject() {
    const width = currentX - startX;
    const height = currentY - startY;
    
    switch (currentObjectType) {
        case 'platform':
            editorObjects.platforms.push({
                x: width > 0 ? startX : currentX,
                y: height > 0 ? startY : currentY,
                width: Math.abs(width),
                height: Math.abs(height),
                type: currentEra
            });
            break;
            
        case 'enemy':
            editorObjects.enemies.push({
                x: startX - 20,
                y: startY - 25,
                width: 40,
                height: 50,
                velocityX: 2,
                direction: 'right',
                type: currentEra
            });
            break;
            
        case 'collectible':
            editorObjects.collectibles.push({
                x: startX - 10,
                y: startY - 10,
                width: 20,
                height: 20
            });
            break;
            
        case 'portal':
            const destination = prompt('Введите назначение портала (present, prehistoric, egypt, medieval, western, future):');
            if (destination) {
                editorObjects.timePortals.push({
                    x: startX - 25,
                    y: startY - 40,
                    width: 50,
                    height: 80,
                    destination: destination
                });
            }
            break;
            
        case 'timeMachine':
            editorObjects.gameObjects.push({
                x: startX - 20,
                y: startY - 20,
                width: 40,
                height: 40,
                type: 'timeMachine'
            });
            break;
    }
}

function saveLevel() {
    const levelName = levelNameInput.value || 'level1';
    const levelData = {
        era: currentEra,
        objects: editorObjects
    };
    
    localStorage.setItem(`kapusta4_${levelName}_${currentEra}`, JSON.stringify(levelData));
    alert(`Уровень "${levelName}" для эпохи "${currentEra}" сохранен!`);
}

function loadLevel() {
    const levelName = levelNameInput.value || 'level1';
    const levelData = localStorage.getItem(`kapusta4_${levelName}_${currentEra}`);
    
    if (levelData) {
        const parsedData = JSON.parse(levelData);
        editorObjects = parsedData.objects;
        drawEditor();
        alert(`Уровень "${levelName}" для эпохи "${currentEra}" загружен!`);
    } else {
        alert(`Уровень "${levelName}" для эпохи "${currentEra}" не найден!`);
    }
}

function clearLevel() {
    if (confirm('Вы уверены, что хотите очистить текущий уровень?')) {
        editorObjects = {
            platforms: [],
            enemies: [],
            collectibles: [],
            timePortals: [],
            gameObjects: []
        };
        drawEditor();
    }
}

function exportLevel() {
    const levelName = levelNameInput.value || 'level1';
    const levelData = {
        era: currentEra,
        objects: editorObjects
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(levelData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `kapusta4_${levelName}_${currentEra}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importLevel(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const levelData = JSON.parse(event.target.result);
                currentEra = levelData.era;
                editorObjects = levelData.objects;
                
                // Обновляем селектор эпохи
                eraSelector.value = currentEra;
                
                drawEditor();
                alert('Уровень успешно импортирован!');
            } catch (error) {
                alert('Ошибка при импорте уровня: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Инициализация редактора
function init() {
    drawEditor();
}

// Запуск редактора после загрузки всех изображений
Promise.all([
    new Promise(resolve => platformImgs.present.onload = resolve),
    new Promise(resolve => wormImgs.present.onload = resolve),
    new Promise(resolve => collectibleImg.onload = resolve),
    new Promise(resolve => portalImg.onload = resolve),
    new Promise(resolve => timeMachineImg.onload = resolve)
]).then(init); 