// Глобальные переменные
let tasks = [];
let tg = window.Telegram.WebApp;
let user = null;

// Инициализация приложения
function init() {
    console.log('Initializing Telegram Web App...');
    
    // Инициализируем Telegram Web App
    tg.expand();
    tg.enableClosingConfirmation();
    tg.BackButton.hide();
    
    // Получаем данные пользователя
    user = tg.initDataUnsafe ? tg.initDataUnsafe.user : null;
    console.log('User:', user);
    
    // Загружаем задачи
    loadTasks();
    
    // Настраиваем главную кнопку
    setupMainButton();
    
    // Добавляем обработчик Enter
    document.getElementById('newTask').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    showNotification('Добро пожаловать! 🎉', 'success');
}

// Настройка главной кнопки
function setupMainButton() {
    tg.MainButton.setText('💳 Поддержать проект');
    tg.MainButton.onClick(showDonateMenu);
    tg.MainButton.show();
}

// Показ уведомления
function showNotification(message, type) {
    if (type === void 0) { type = 'info'; }
    const notification = document.getElementById('notification');
    notification.textContent = message;
    
    // Цвета для разных типов уведомлений
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#ff9800'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.classList.add('show');
    
    setTimeout(function() {
        notification.classList.remove('show');
    }, 3000);
}

// Добавление новой задачи
function addTask() {
    const input = document.getElementById('newTask');
    const taskText = input.value.trim();
    
    if (taskText === '') {
        showNotification('Введите текст задачи!', 'warning');
        return;
    }
    
    if (taskText.length > 200) {
        showNotification('Задача слишком длинная! Макс. 200 символов.', 'error');
        return;
    }
    
    const newTask = {
        id: Date.now() + Math.random(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    tasks.unshift(newTask); // Добавляем в начало
    input.value = '';
    
    saveTasks();
    renderTasks();
    showNotification('Задача добавлена! ✅', 'success');
    
    // Вибрация (если поддерживается)
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Удаление задачи
function deleteTask(id) {
    tasks = tasks.filter(function(task) { return task.id !== id; });
    saveTasks();
    renderTasks();
    showNotification('Задача удалена 🗑️', 'info');
    
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// Переключение статуса задачи
function toggleTask(id) {
    const task = tasks.find(function(t) { return t.id === id; });
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        renderTasks();
        
        if (task.completed) {
            showNotification('Задача выполнена! 🎉', 'success');
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
        }
    }
}

// Сохранение задач
function saveTasks() {
    const storageKey = user ? 'tasks_' + user.id : 'tasks_local';
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    updateStats();
}

// Загрузка задач
function loadTasks() {
    const storageKey = user ? 'tasks_' + user.id : 'tasks_local';
    const savedTasks = localStorage.getItem(storageKey);
    
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (e) {
            console.error('Error loading tasks:', e);
            tasks = [];
        }
    }
    
    renderTasks();
}
// Отрисовка задач
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '\
            <div class="empty-state">\
                <div style="font-size: 48px; margin-bottom: 15px;">📝</div>\
                <h3 style="color: #666; margin-bottom: 10px;">Пока нет дел</h3>\
                <p style="color: #888; font-size: 14px;">\
                    Добавь свою первую задачу выше!<br>\
                    Напиши дело и нажми "Добавить" или Enter\
                </p>\
            </div>\
        ';
        return;
    }
    
    tasksList.innerHTML = tasks.map(function(task) {
        return '\
            <div class="task-item">\
                <input \
                    type="checkbox" \
                    class="task-checkbox" \
                    ' + (task.completed ? 'checked' : '') + '\
                    onchange="toggleTask(' + task.id + ')"\
                >\
                <div class="task-text ' + (task.completed ? 'completed' : '') + '">\
                    ' + escapeHtml(task.text) + '\
                    <div class="task-date">\
                        ' + formatDate(task.createdAt) + '\
                        ' + (task.completed ? ' • Выполнено: ' + formatDate(task.completedAt) : '') + '\
                    </div>\
                </div>\
                <button class="delete-btn" onclick="deleteTask(' + task.id + ')">×</button>\
            </div>\
        ';
    }).join('');
}

// Обновление статистики
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(function(task) { return task.completed; }).length;
    const pending = total - completed;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Сегодня в ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Вчера в ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Функция доната через Telegram Stars
function donate(amount) {
    console.log('Initiating donation of ' + amount + ' Stars');
    
    // Показываем подтверждение
    const confirmMessage = 'Ты уверен, что хочешь поддержать проект на ' + amount + ' Telegram Stars? 💝\\n\\nЭто реальная помощь разработчику!';
    
    if (tg.showConfirm) {
        tg.showConfirm(confirmMessage, function(confirmed) {
            if (confirmed) {
                processDonation(amount);
            }
        });
    } else {
        if (confirm(confirmMessage)) {
            processDonation(amount);
        }
    }
}

// Обработка доната
function processDonation(amount) {
    // В реальном приложении здесь будет вызов Telegram Payments
    // Для демо показываем успешное сообщение
    
    showNotification('Спасибо за ' + amount + ' Stars! 💖', 'success');
    
    // Вибрация успеха
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    // В реальном приложении:
    // tg.sendData(JSON.stringify({ type: 'donate', amount: amount }));
}
// Показ меню донатов
function showDonateMenu() {
    const message = '💫 Поддержать разработчика\\n\\n' +
                   'Telegram Stars = реальные деньги для меня!\\n\\n' +
                   'Выбери сумму доната или нажми кнопку внизу экрана 💝';
    
    if (tg.showAlert) {
        tg.showAlert(message);
    } else {
        alert(message);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', init);