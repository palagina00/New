// Система голосования за белье с синхронизацией через GitHub
// Версия: 2.0 - Добавлена синхронизация данных

// Данные о фотографиях
const lingeriePhotos = [
    {
        id: 1,
        title: "",
        description: "",
        image: "images/1.jpg",
        votes: 0
    },
    {
        id: 2,
        title: "",
        description: "",
        image: "images/2.jpg",
        votes: 0
    },
    {
        id: 3,
        title: "",
        description: "",
        image: "images/3.jpg",
        votes: 0
    },
    {
        id: 4,
        title: "",
        description: "",
        image: "images/4.jpg",
        votes: 0
    },
    {
        id: 5,
        title: "",
        description: "",
        image: "images/5.jpg",
        votes: 0
    },
    {
        id: 6,
        title: "",
        description: "",
        image: "images/6.jpg",
        votes: 0
    },
    {
        id: 7,
        title: "",
        description: "",
        image: "images/7.jpg",
        votes: 0
    },
    {
        id: 8,
        title: "",
        description: "",
        image: "images/8.jpg",
        votes: 0
    },
    {
        id: 9,
        title: "",
        description: "",
        image: "images/9.jpg",
        votes: 0
    },
    {
        id: 10,
        title: "",
        description: "",
        image: "images/10.jpg",
        votes: 0
    },
    {
        id: 11,
        title: "",
        description: "",
        image: "images/11.jpg",
        votes: 0
    },
    {
        id: 12,
        title: "",
        description: "",
        image: "images/1-1.jpg",
        votes: 0
    },
    {
        id: 13,
        title: "",
        description: "",
        image: "images/1-1-1.jpg",
        votes: 0
    },
    {
        id: 14,
        title: "",
        description: "",
        image: "images/1-1-2.jpg",
        votes: 0
    },
    {
        id: 15,
        title: "",
        description: "",
        image: "images/1-2.jpg",
        votes: 0
    }
];

// Глобальные переменные
let selectedVotes = [];
let maxVotes = 5;
let hasVoted = false;
let isDataLoading = false;

// URL для GitHub API
const GITHUB_API_URL = 'https://api.github.com/repos/palagina00/1/contents/data.json';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/palagina00/1/main/data.json';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Система голосования с синхронизацией загружена');
    
    // Проверяем, голосовал ли пользователь уже
    checkVotingStatus();
    
    // Загружаем данные голосования с GitHub
    loadVotingDataFromGitHub();
    
    // Создаем интерфейс голосования
    createVotingInterface();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Настраиваем форму обратной связи
    setupFeedbackForm();
    
    // Автообновление данных каждые 30 секунд
    setInterval(loadVotingDataFromGitHub, 30000);
});

// Проверка статуса голосования
function checkVotingStatus() {
    const votingData = localStorage.getItem('votingData');
    if (votingData) {
        const data = JSON.parse(votingData);
        hasVoted = data.hasVoted || false;
        selectedVotes = data.selectedVotes || [];
        
        if (hasVoted) {
            showVotingComplete();
        }
    }
}

// Загрузка данных голосования с GitHub
async function loadVotingDataFromGitHub() {
    if (isDataLoading) return;
    
    isDataLoading = true;
    
    try {
        const response = await fetch(GITHUB_RAW_URL + '?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            
            // Обновляем количество голосов для каждой фотографии
            if (data.votes) {
                lingeriePhotos.forEach(photo => {
                    if (data.votes[photo.id]) {
                        photo.votes = data.votes[photo.id];
                    }
                });
            }
            
            console.log('Данные загружены с GitHub:', data);
            
            // Обновляем интерфейс
            updateVotingInterface();
        } else {
            console.log('Файл data.json не найден, создаем новый');
            await createInitialDataFile();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Загружаем локальные данные как fallback
        loadLocalVotingData();
    } finally {
        isDataLoading = false;
    }
}

// Создание начального файла данных
async function createInitialDataFile() {
    const initialData = {
        votes: {},
        lastUpdate: new Date().toISOString()
    };
    
    lingeriePhotos.forEach(photo => {
        initialData.votes[photo.id] = 0;
    });
    
    try {
        await saveDataToGitHub(initialData);
    } catch (error) {
        console.error('Ошибка создания файла данных:', error);
    }
}

// Сохранение данных на GitHub
async function saveDataToGitHub(data) {
    try {
        // Получаем текущий файл
        const getResponse = await fetch(GITHUB_API_URL);
        let sha = null;
        
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }
        
        // Подготавливаем данные для отправки
        const content = btoa(JSON.stringify(data, null, 2));
        
        const updateData = {
            message: `Обновление голосования - ${new Date().toLocaleString()}`,
            content: content,
            sha: sha
        };
        
        // Отправляем обновление
        const response = await fetch(GITHUB_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'token ' + getGitHubToken()
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            console.log('Данные сохранены на GitHub');
            return true;
        } else {
            throw new Error('Ошибка сохранения на GitHub');
        }
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        // Fallback: сохраняем локально
        saveLocalVotingData(data);
        return false;
    }
}

// Получение токена GitHub
function getGitHubToken() {
    // Токен берется из localStorage для безопасности
    // Чтобы добавить токен, выполните в консоли браузера:
    // localStorage.setItem('github_token', 'ваш_токен_здесь');
    return localStorage.getItem('github_token') || '';
}

// Загрузка локальных данных как fallback
function loadLocalVotingData() {
    const votingData = localStorage.getItem('votingData');
    if (votingData) {
        const data = JSON.parse(votingData);
        if (data.photos) {
            data.photos.forEach(photo => {
                const existingPhoto = lingeriePhotos.find(p => p.id === photo.id);
                if (existingPhoto) {
                    existingPhoto.votes = photo.votes;
                }
            });
        }
    }
}

// Сохранение локальных данных как fallback
function saveLocalVotingData(data) {
    const votingData = {
        photos: lingeriePhotos,
        hasVoted: hasVoted,
        selectedVotes: selectedVotes,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('votingData', JSON.stringify(votingData));
    console.log('Данные сохранены локально');
}

// Создание интерфейса голосования
function createVotingInterface() {
    const grid = document.getElementById('votingGrid');
    
    // Проверяем, что элемент существует
    if (!grid) {
        console.error('Элемент #votingGrid не найден!');
        return;
    }
    
    grid.innerHTML = '';
    
    lingeriePhotos.forEach(photo => {
        const votingItem = createVotingItem(photo);
        grid.appendChild(votingItem);
    });
    
    updateVoteCounter();
}

// Обновление интерфейса голосования
function updateVotingInterface() {
    const items = document.querySelectorAll('.voting-item');
    items.forEach(item => {
        const photoId = parseInt(item.dataset.photoId);
        const photo = lingeriePhotos.find(p => p.id === photoId);
        if (photo) {
            const voteCount = item.querySelector('.vote-count');
            if (voteCount) {
                voteCount.textContent = photo.votes;
            }
        }
    });
}

// Создание элемента голосования
function createVotingItem(photo) {
    const item = document.createElement('div');
    item.className = 'voting-item';
    item.dataset.photoId = photo.id;
    
    // Проверяем, выбрана ли эта фотография
    if (selectedVotes.includes(photo.id)) {
        item.classList.add('selected');
    }
    
    // Если уже голосовали, блокируем выбор
    if (hasVoted) {
        item.classList.add('max-selected');
    }
    
    item.innerHTML = `
        <img src="${photo.image}" alt="${photo.title}" class="voting-image">
        <div class="vote-count">${photo.votes}</div>
        <div class="voting-content">
            <h3 class="voting-title">${photo.title}</h3>
            <p class="voting-description">${photo.description}</p>
            <button class="vote-button ${selectedVotes.includes(photo.id) ? 'voted' : ''}" 
                    data-photo-id="${photo.id}"
                    ${hasVoted ? 'disabled' : ''}>
                ${selectedVotes.includes(photo.id) ? '✅ Проголосовано' : '🗳️ Проголосовать'}
            </button>
        </div>
    `;
    
    return item;
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчик клика по кнопке голосования
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('vote-button') && !e.target.disabled) {
            handleVoteClick(e.target.dataset.photoId);
        }
    });
    
    // Обработчик отправки голосов
    document.getElementById('submitVotes').addEventListener('click', submitVotes);
    
    // Обработчик сброса голосов
    document.getElementById('resetVotes').addEventListener('click', resetVotes);
}

// Обработка клика по голосованию
function handleVoteClick(photoId) {
    if (hasVoted) return;
    
    const photoIdNum = parseInt(photoId);
    const item = document.querySelector(`[data-photo-id="${photoId}"]`);
    const button = item.querySelector('.vote-button');
    
    if (selectedVotes.includes(photoIdNum)) {
        // Убираем голос
        selectedVotes = selectedVotes.filter(id => id !== photoIdNum);
        item.classList.remove('selected');
        button.textContent = '🗳️ Проголосовать';
        button.classList.remove('voted');
    } else {
        // Добавляем голос, если не превышен лимит
        if (selectedVotes.length < maxVotes) {
            selectedVotes.push(photoIdNum);
            item.classList.add('selected');
            button.textContent = '✅ Проголосовано';
            button.classList.add('voted');
        } else {
            alert(`Максимум ${maxVotes} голосов!`);
            return;
        }
    }
    
    updateVoteCounter();
    updateSubmitButton();
}

// Обновление счетчика голосов
function updateVoteCounter() {
    const counter = document.getElementById('votesUsed');
    counter.textContent = selectedVotes.length;
}

// Обновление кнопки отправки
function updateSubmitButton() {
    const submitBtn = document.getElementById('submitVotes');
    submitBtn.disabled = selectedVotes.length === 0;
}

// Отправка голосов
async function submitVotes() {
    if (selectedVotes.length === 0) {
        alert('Выберите хотя бы одну фотографию!');
        return;
    }
    
    // Показываем индикатор загрузки
    const submitBtn = document.getElementById('submitVotes');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Отправка...';
    submitBtn.disabled = true;
    
    try {
        // Обновляем количество голосов
        selectedVotes.forEach(photoId => {
            const photo = lingeriePhotos.find(p => p.id === photoId);
            if (photo) {
                photo.votes++;
            }
        });
        
        // Подготавливаем данные для сохранения
        const dataToSave = {
            votes: {},
            lastUpdate: new Date().toISOString()
        };
        
        lingeriePhotos.forEach(photo => {
            dataToSave.votes[photo.id] = photo.votes;
        });
        
        // Сохраняем на GitHub
        const saved = await saveDataToGitHub(dataToSave);
        
        if (saved) {
            // Сохраняем локально как backup
            saveLocalVotingData(dataToSave);
            
            // Отмечаем, что пользователь проголосовал
            hasVoted = true;
            
            // Показываем сообщение об успехе
            showVotingComplete();
            
            // Блокируем интерфейс
            blockVotingInterface();
            
            showNotification('Голосование успешно отправлено!', 'success');
        } else {
            throw new Error('Ошибка сохранения на сервере');
        }
    } catch (error) {
        console.error('Ошибка отправки голосов:', error);
        showNotification('Ошибка отправки голосов. Попробуйте еще раз.', 'error');
    } finally {
        // Восстанавливаем кнопку
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Показ сообщения об успешном голосовании
function showVotingComplete() {
    const header = document.querySelector('.header');
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
        <h2>✅ Спасибо за голосование!</h2>
        <p>Ваши голоса учтены. Результаты будут доступны администратору.</p>
    `;
    successMessage.style.cssText = `
        background: #d4edda;
        color: #155724;
        padding: 20px;
        border-radius: 10px;
        margin: 20px 0;
        text-align: center;
        border: 1px solid #c3e6cb;
    `;
    
    header.appendChild(successMessage);
}

// Блокировка интерфейса голосования
function blockVotingInterface() {
    const items = document.querySelectorAll('.voting-item');
    items.forEach(item => {
        item.classList.add('max-selected');
        const button = item.querySelector('.vote-button');
        button.disabled = true;
        if (selectedVotes.includes(parseInt(item.dataset.photoId))) {
            button.textContent = '✅ Проголосовано';
            button.classList.add('voted');
        }
    });
    
    document.getElementById('submitVotes').disabled = true;
    document.getElementById('resetVotes').style.display = 'none';
}

// Сброс голосов
function resetVotes() {
    if (hasVoted) return;
    
    selectedVotes = [];
    
    // Обновляем интерфейс
    const items = document.querySelectorAll('.voting-item');
    items.forEach(item => {
        item.classList.remove('selected');
        const button = item.querySelector('.vote-button');
        button.textContent = '🗳️ Проголосовать';
        button.classList.remove('voted');
    });
    
    updateVoteCounter();
    updateSubmitButton();
}

// Функция для администратора - получение результатов
function getVotingResults() {
    return lingeriePhotos.map(photo => ({
        id: photo.id,
        title: photo.title,
        votes: photo.votes
    })).sort((a, b) => b.votes - a.votes);
}

// Обработка формы обратной связи
function setupFeedbackForm() {
    const form = document.getElementById('feedbackForm');
    const fileInput = document.getElementById('feedbackPhoto');
    const photoPreview = document.getElementById('photoPreview');
    let selectedFiles = [];
    
    // Обработчик отправки формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFeedbackSubmit(selectedFiles);
    });
    
    // Обработчик выбора файлов
    fileInput.addEventListener('change', function(e) {
        handleFileSelect(e.target.files);
    });
    
    // Обработчик drag & drop
    const fileUpload = document.querySelector('.file-upload');
    
    fileUpload.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileUpload.classList.add('dragover');
    });
    
    fileUpload.addEventListener('dragleave', function(e) {
        e.preventDefault();
        fileUpload.classList.remove('dragover');
    });
    
    fileUpload.addEventListener('drop', function(e) {
        e.preventDefault();
        fileUpload.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files);
    });
    
    // Обработчик сброса формы
    form.addEventListener('reset', function() {
        selectedFiles = [];
        updatePhotoPreview();
    });
    
    // Функция обработки выбранных файлов
    function handleFileSelect(files) {
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (newFiles.length > 0) {
            selectedFiles = [...selectedFiles, ...newFiles];
            updatePhotoPreview();
        }
    }
    
    // Обновление превью фотографий
    function updatePhotoPreview() {
        photoPreview.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'photo-preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button type="button" class="photo-preview-remove" data-index="${index}">×</button>
                    <div class="photo-preview-name">${file.name}</div>
                `;
                
                // Обработчик удаления фото
                previewItem.querySelector('.photo-preview-remove').addEventListener('click', function() {
                    selectedFiles.splice(index, 1);
                    updatePhotoPreview();
                });
                
                photoPreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
}

// Обработка отправки формы обратной связи
function handleFeedbackSubmit(files) {
    const form = document.getElementById('feedbackForm');
    const formData = new FormData(form);
    
    // Добавляем файлы в FormData
    files.forEach((file, index) => {
        formData.append(`photo_${index}`, file);
    });
    
    // Получаем данные формы
    const feedbackData = {
        name: formData.get('name') || 'Аноним',
        message: formData.get('message'),
        photos: files.length,
        timestamp: new Date().toISOString(),
        files: files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
        }))
    };
    
    // Сохраняем обратную связь
    saveFeedback(feedbackData);
    
    // Показываем уведомление
    showNotification('Спасибо за ваше предложение! Мы рассмотрим его в ближайшее время.', 'success');
    
    // Очищаем форму
    form.reset();
    
    console.log('Обратная связь отправлена:', feedbackData);
}

// Сохранение обратной связи
function saveFeedback(feedbackData) {
    let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
    feedbacks.push(feedbackData);
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
}

// Показ уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Добавляем CSS для анимации уведомлений
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

// Экспорт функций для использования в админ-панели
window.getVotingResults = getVotingResults;
window.getFeedbacks = function() {
    return JSON.parse(localStorage.getItem('feedbacks') || '[]');
};
