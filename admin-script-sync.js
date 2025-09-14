// Админ-панель для результатов голосования с синхронизацией через GitHub
// Версия: 2.0 - Добавлена синхронизация данных

let votingResults = [];
let isDataLoading = false;

// URL для GitHub API
const ADMIN_GITHUB_API_URL = 'https://api.github.com/repos/palagina00/New/contents/data.json';
const ADMIN_GITHUB_RAW_URL = 'https://raw.githubusercontent.com/palagina00/New/main/data.json';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Админ-панель с синхронизацией загружена');
    
    // Загружаем данные голосования с GitHub
    loadVotingDataFromGitHub();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Автообновление данных каждые 10 секунд
    setInterval(loadVotingDataFromGitHub, 10000);
});

// Загрузка данных голосования с GitHub
async function loadVotingDataFromGitHub() {
    if (isDataLoading) return;
    
    isDataLoading = true;
    
    try {
        const response = await fetch(ADMIN_GITHUB_RAW_URL + '?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            
            // Преобразуем данные в формат для админки
            votingResults = [];
            if (data.votes) {
                Object.keys(data.votes).forEach(photoId => {
                    votingResults.push({
                        id: parseInt(photoId),
                        title: `Фото ${photoId}`,
                        image: `images/${photoId === 12 ? '1-1' : photoId === 13 ? '1-1-1' : photoId === 14 ? '1-1-2' : photoId === 15 ? '1-2' : photoId}.jpg`,
                        votes: data.votes[photoId]
                    });
                });
            }
            
            console.log('Данные загружены с GitHub:', votingResults);
            
            // Обновляем интерфейс
            updateAllData();
        } else {
            console.log('Файл data.json не найден');
            votingResults = [];
            updateAllData();
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Загружаем локальные данные как fallback
        loadLocalVotingData();
    } finally {
        isDataLoading = false;
    }
}

// Загрузка локальных данных как fallback
function loadLocalVotingData() {
    const votingData = localStorage.getItem('votingData');
    if (votingData) {
        const data = JSON.parse(votingData);
        votingResults = data.photos || [];
    } else {
        votingResults = [];
    }
    console.log('Загружены локальные данные:', votingResults);
    updateAllData();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обновление данных
    document.getElementById('refreshData').addEventListener('click', function() {
        loadVotingDataFromGitHub();
        showNotification('Данные обновлены!', 'success');
    });
    
    // Экспорт данных
    document.getElementById('exportData').addEventListener('click', exportData);
    
    // Очистка данных
    const clearDataBtn = document.getElementById('clearData');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }
}

// Обновление всех данных
function updateAllData() {
    updateStatistics();
    updateTable();
    updateTop5();
    updateLastUpdateTime();
}

// Обновление времени последнего обновления
function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleString();
    }
}

// Обновление статистики
function updateStatistics() {
    const totalVotes = votingResults.reduce((sum, photo) => sum + photo.votes, 0);
    const totalVoters = Math.floor(totalVotes / 5); // Предполагаем, что каждый голосовал максимум 5 раз
    const mostVoted = Math.max(...votingResults.map(photo => photo.votes), 0);
    const avgVotes = votingResults.length > 0 ? (totalVotes / votingResults.length).toFixed(1) : 0;
    
    document.getElementById('totalVotes').textContent = totalVotes;
    document.getElementById('totalVoters').textContent = totalVoters;
    document.getElementById('mostVoted').textContent = mostVoted;
    document.getElementById('avgVotes').textContent = avgVotes;
}

// Обновление таблицы
function updateTable() {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    // Сортируем результаты по количеству голосов
    const sortedResults = [...votingResults].sort((a, b) => b.votes - a.votes);
    const totalVotes = votingResults.reduce((sum, photo) => sum + photo.votes, 0);
    
    sortedResults.forEach((photo, index) => {
        const row = document.createElement('tr');
        const percentage = totalVotes > 0 ? ((photo.votes / totalVotes) * 100).toFixed(1) : 0;
        const progressWidth = totalVotes > 0 ? (photo.votes / Math.max(...votingResults.map(p => p.votes))) * 100 : 0;
        
        row.innerHTML = `
            <td class="rank rank-${index + 1}">${index + 1}</td>
            <td>
                <img src="${photo.image}" alt="${photo.title}" class="photo-preview">
            </td>
            <td>
                <div class="photo-title">${photo.title}</div>
            </td>
            <td class="vote-count">${photo.votes}</td>
            <td class="percentage">${percentage}%</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressWidth}%"></div>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Обновление топ-5
function updateTop5() {
    const topGrid = document.getElementById('topGrid');
    topGrid.innerHTML = '';
    
    // Сортируем и берем топ-5
    const top5 = [...votingResults].sort((a, b) => b.votes - a.votes).slice(0, 5);
    const totalVotes = votingResults.reduce((sum, photo) => sum + photo.votes, 0);
    
    top5.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = `top-item rank-${index + 1}`;
        const percentage = totalVotes > 0 ? ((photo.votes / totalVotes) * 100).toFixed(1) : 0;
        
        item.innerHTML = `
            <div class="top-rank">${index + 1}</div>
            <img src="${photo.image}" alt="${photo.title}" class="top-image">
            <div class="top-title">${photo.title}</div>
            <div class="top-votes">${photo.votes} голосов</div>
            <div class="top-percentage">${percentage}% от общего числа</div>
        `;
        
        topGrid.appendChild(item);
    });
}

// Очистка всех данных
async function clearAllData() {
    if (!confirm('Вы уверены, что хотите очистить все данные голосования? Это действие нельзя отменить!')) {
        return;
    }
    
    try {
        // Создаем пустые данные
        const emptyData = {
            votes: {},
            lastUpdate: new Date().toISOString()
        };
        
        // Сохраняем на GitHub
        const saved = await saveDataToGitHub(emptyData);
        
        if (saved) {
            // Очищаем локальные данные
            localStorage.removeItem('votingData');
            localStorage.removeItem('feedbacks');
            
            // Обновляем интерфейс
            votingResults = [];
            updateAllData();
            
            showNotification('Все данные очищены!', 'success');
        } else {
            throw new Error('Ошибка очистки данных на сервере');
        }
    } catch (error) {
        console.error('Ошибка очистки данных:', error);
        showNotification('Ошибка очистки данных. Попробуйте еще раз.', 'error');
    }
}

// Сохранение данных на GitHub
async function saveDataToGitHub(data) {
    try {
        // Получаем текущий файл
        const getResponse = await fetch(ADMIN_GITHUB_API_URL);
        let sha = null;
        
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }
        
        // Подготавливаем данные для отправки
        const content = btoa(JSON.stringify(data, null, 2));
        
        const updateData = {
            message: `Очистка данных голосования - ${new Date().toLocaleString()}`,
            content: content,
            sha: sha
        };
        
        // Отправляем обновление
        const response = await fetch(ADMIN_GITHUB_API_URL, {
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
        return false;
    }
}

// Получение токена GitHub
function getGitHubToken() {
    return localStorage.getItem('github_token') || '';
}

// Экспорт данных
function exportData() {
    const data = {
        timestamp: new Date().toISOString(),
        totalVotes: votingResults.reduce((sum, photo) => sum + photo.votes, 0),
        totalPhotos: votingResults.length,
        results: votingResults.sort((a, b) => b.votes - a.votes)
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `voting-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('Данные экспортированы!', 'success');
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
    }, 3000);
}

// CSS для анимации уведомлений
const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);
