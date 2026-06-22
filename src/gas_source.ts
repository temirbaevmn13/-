export const GOOGLE_SHEETS_LAYOUT = {
  sheets: [
    {
      name: "Users",
      description: "Список пользователей системы (Администраторы и Мойщики)",
      columns: ["ID", "Имя", "Телефон", "Пароль", "Роль", "Ставка %", "Дата Создания"],
      defaultRows: [
        ["USR_ADMIN_1", "Администратор", "+79998887766", "admin", "admin", "100", "2026-06-22"],
        ["USR_WRK_1", "Иван Мойщик", "+79991112233", "12345", "worker", "50", "2026-06-22"],
        ["USR_WRK_2", "Сергей Мойщик", "+79994445566", "12345", "worker", "45", "2026-06-22"]
      ]
    },
    {
      name: "Orders",
      description: "Все текущие и завершенные заказы",
      columns: [
        "ID", "Имя Клиента", "Телефон Клиента", "Адрес", "Дата", "Время", "Описание",
        "Общая Цена", "Сумма Мойщику", "Прибыль Админа", "ID Мойщика", "Имя Мойщика",
        "Статус", "Фото До", "Фото После", "Комментарий", "Дата Создания"
      ],
      defaultRows: [
        [
          "ORD_1001", "Алексей Смирнов", "+79001234567", "ул. Ленина, д. 15, кв. 42",
          "2026-06-23", "10:00", "Окна 3-комн. квартиры (4 окна, балконные блоки)",
          "5000", "2500", "2500", "USR_WRK_1", "Иван Мойщик", "Новый",
          "", "", "", "2026-06-22"
        ],
        [
          "ORD_1002", "Мария Иванова", "+79119876543", "пр. Просвещения, д. 28, оф. 5",
          "2026-06-22", "14:00", "Витражные окна в офисе (высота 3м, 6 секций)",
          "12000", "5400", "6600", "USR_WRK_2", "Сергей Мойщик", "Выполнено",
          "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=500", "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500", "Все отлично отмыли, клиент доволен!", "2026-06-21"
        ]
      ]
    }
  ]
};

export const CODE_GS_CONTENT = `/**
 * CRM ДЛЯ МОЙКИ ОКОН — GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * 
 * Настройки:
 * 1. Создайте Google Таблицу по инструкции.
 * 2. Скопируйте ID вашей таблицы и вставьте его ниже в переменную SPREADSHEET_ID.
 * 3. Нажмите "Развернуть" -> "Новое развертывание" -> тип "Веб-приложение".
 * 4. Запустите от своего имени ("Я"), доступ — "Все" (Anyone).
 */

// Укажите ID вашей Google Таблицы (находится в URL-адресе таблицы между /d/ и /edit)
const SPREADSHEET_ID = "ВСТАВЬТЕ_СЮДА_ID_ВАШЕЙ_ТАБЛИЦЫ";

/**
 * Инициализация веб-приложения: отдает HTML-страницу Index.html
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('CRM Мойка Окон')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Функция для подключения к таблице
 */
function getDb() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf("ВСТАВЬТЕ") !== -1) {
    throw new Error("КРИТИЧЕСКАЯ ОШИБКА: Пожалуйста, откройте Code.gs в Google Apps Script и укажите ваш SPREADSHEET_ID.");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Вход в систему по номеру телефона и паролю
 */
function loginUser(phone, password) {
  try {
    const sheet = getDb().getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    
    // Очистка телефона от лишних символов для сравнения
    const cleanPhone = phone.toString().replace(/\\D/g, "");
    
    for (let i = 1; i < data.length; i++) {
      const userPhone = data[i][2].toString().replace(/\\D/g, "");
      const userPassword = data[i][3].toString();
      
      if (userPhone === cleanPhone && userPassword === password) {
        return {
          success: true,
          user: {
            id: data[i][0].toString(),
            name: data[i][1].toString(),
            phone: data[i][2].toString(),
            role: data[i][4].toString(), // 'admin' или 'worker'
            rate: parseFloat(data[i][5]) || 50
          }
        };
      }
    }
    return { success: false, message: "Неверный номер телефона или пароль" };
  } catch (e) {
    return { success: false, message: "Ошибка авторизации: " + e.message };
  }
}

/**
 * Получение списка всех мойщиков (для администратора)
 */
function getWorkersList() {
  try {
    const sheet = getDb().getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    const workers = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][4].toString() === "worker") {
        workers.push({
          id: data[i][0].toString(),
          name: data[i][1].toString(),
          phone: data[i][2].toString(),
          rate: parseFloat(data[i][5]) || 50,
          dateCreated: data[i][6].toString()
        });
      }
    }
    return { success: true, workers: workers };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Создание аккаунта нового мойщика
 */
function createWorkerAccount(name, phone, password, rate) {
  try {
    const sheet = getDb().getSheetByName("Users");
    const data = sheet.getDataRange().getValues();
    
    // Проверка уникальности номера телефона
    const cleanPhone = phone.replace(/\\D/g, "");
    for (let i = 1; i < data.length; i++) {
      if (data[i][2].toString().replace(/\\D/g, "") === cleanPhone) {
        return { success: false, message: "Пользователь с таким номером телефона уже существует!" };
      }
    }
    
    const workerId = "WRK_" + Math.floor(100000 + Math.random() * 900000);
    const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    sheet.appendRow([
      workerId,
      name,
      phone,
      password,
      "worker",
      parseFloat(rate) || 50,
      dateStr
    ]);
    
    return { success: true, workerId: workerId };
  } catch (e) {
    return { success: false, message: "Ошибка добавления: " + e.message };
  }
}

/**
 * Создание нового заказа (Администратором)
 */
function createNewOrder(orderData) {
  try {
    const sheet = getDb().getSheetByName("Orders");
    const orderId = "ORD_" + Math.floor(1000 + Math.random() * 9000);
    const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    const price = parseFloat(orderData.price) || 0;
    const rate = parseFloat(orderData.workerRate) || 50;
    
    const workerPay = Math.round(price * (rate / 100));
    const adminProfit = price - workerPay;
    
    sheet.appendRow([
      orderId,
      orderData.clientName,
      orderData.clientPhone,
      orderData.address,
      orderData.date,
      orderData.time,
      orderData.description,
      price,
      workerPay,
      adminProfit,
      orderData.workerId,
      orderData.workerName,
      "Новый",
      "", // Фото До
      "", // Фото После
      "", // Комментарий
      dateStr
    ]);
    
    return { success: true, orderId: orderId };
  } catch (e) {
    return { success: false, message: "Ошибка создания заказа: " + e.message };
  }
}

/**
 * Получение списка заказов (Для админа — все, для мойщика — только его)
 */
function getOrdersList(userId, role) {
  try {
    const sheet = getDb().getSheetByName("Orders");
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      const order = {};
      for (let j = 0; j < headers.length; j++) {
        // Преобразуем заголовки на английский ключ для простоты работы во фронтенде
        const key = getOrderKeyByColIndex(j);
        order[key] = data[i][j];
      }
      
      // Сортировка/фильтрация по роли
      if (role === "admin" || order.workerId === userId) {
        // Форматирование дат и чисел для отправки в JSON
        order.price = parseFloat(order.price) || 0;
        order.workerPay = parseFloat(order.workerPay) || 0;
        order.adminProfit = parseFloat(order.adminProfit) || 0;
        orders.push(order);
      }
    }
    
    // Сортируем: сначала новые и в работе, потом выполненные (по умолчанию самые свежие сверху)
    orders.reverse();
    return { success: true, orders: orders };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Маппинг колонок таблицы Orders на понятные ключи
 */
function getOrderKeyByColIndex(idx) {
  const keys = [
    "id", "clientName", "clientPhone", "address", "date", "time", "description",
    "price", "workerPay", "adminProfit", "workerId", "workerName",
    "status", "photoBefore", "photoAfter", "comment", "dateCreated"
  ];
  return keys[idx] || "col_" + idx;
}

/**
 * Обновление данных заказа мойщиком (Статус, комментарий, фото)
 */
function updateOrderProgress(orderId, status, comment, photoBeforeBase64, photoAfterBase64) {
  try {
    const sheet = getDb().getSheetByName("Orders");
    const range = sheet.getDataRange();
    const data = range.getValues();
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === orderId) {
        rowIndex = i + 1; // 1-based index в Sheets
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, message: "Заказ не найден в базе данных" };
    }
    
    // Обновляем статус
    sheet.getCell(rowIndex, 13).setValue(status); // Столбец Статус (13-я колонка)
    
    // Обновляем комментарий, если передан
    if (comment !== undefined && comment !== null) {
      sheet.getCell(rowIndex, 16).setValue(comment); // Столбец Комментарий (16-я колонка)
    }
    
    // Обработка Фото До
    if (photoBeforeBase64) {
      const linkBefore = uploadToDrive(photoBeforeBase64, orderId + "_before.jpg");
      if (linkBefore) {
        sheet.getCell(rowIndex, 14).setValue(linkBefore); // Столбец Фото До (14-я колонка)
      }
    }
    
    // Обработка Фото После
    if (photoAfterBase64) {
      const linkAfter = uploadToDrive(photoAfterBase64, orderId + "_after.jpg");
      if (linkAfter) {
        sheet.getCell(rowIndex, 15).setValue(linkAfter); // Столбец Фото После (15-я колонка)
      }
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, message: "Ошибка сохранения изменений: " + e.message };
  }
}

/**
 * Загрузка фото в Google Drive и получение публичной ссылки
 */
function uploadToDrive(base64Data, filename) {
  try {
    // Извлечение чистого base64, если передан data URL
    let cleanBase64 = base64Data;
    if (base64Data.indexOf(",") !== -1) {
      cleanBase64 = base64Data.split(",")[1];
    }
    
    const decoded = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decoded, "image/jpeg", filename);
    
    // Поиск или создание папки для фотографий мойки окон в корне Google Диска
    const folderName = "CRM_Window_Cleaning_Photos";
    let folders = DriveApp.getFoldersByName(folderName);
    let folder;
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    Logger.log("Не удалось загрузить фото на Диск: " + e.message);
    return ""; // Возвращаем пустую строку в случае неудачи, чтобы не ломать поток
  }
}

/**
 * Удаление или отмена заказа (только для Админа)
 */
function markOrderCanceled(orderId) {
  try {
    const sheet = getDb().getSheetByName("Orders");
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === orderId) {
        sheet.getCell(i + 1, 13).setValue("Отмена");
        return { success: true };
      }
    }
    return { success: false, message: "Заказ не найден" };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
`;

export const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    <title>CRM Мойка Окон</title>
    <!-- Подключаем Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Шрифты и Иконки Lucide -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: #f3f4f6;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .custom-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scroll::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
    </style>
  </head>
  <body class="text-slate-800 antialiased">
    
    <!-- КНОПКА ЗАГРУЗКИ / ЭКРАН ОЖИДАНИЯ -->
    <div id="app-loading" class="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-dashed border-sky-400"></div>
      <h1 class="text-xl font-bold mt-6 tracking-wide text-sky-400">CRM МОЙКА ОКОН</h1>
      <p class="text-xs text-slate-400 mt-2">Загрузка системы баз данных Google Sheets...</p>
    </div>

    <div id="app-container" class="min-h-screen flex flex-col max-w-md mx-auto bg-white shadow-2xl relative">
      
      <!-- ХЕДЕР -->
      <header id="app-header" class="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div class="flex items-center gap-2">
          <div class="bg-sky-500 text-slate-900 p-1.5 rounded-lg">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
          </div>
          <div>
            <h2 class="font-bold text-sm tracking-wide uppercase leading-none">Чистые Окна</h2>
            <span class="text-[10px] text-slate-400" id="header-user-role">Авторизуйтесь</span>
          </div>
        </div>
        
        <button id="logout-btn" class="hidden text-slate-400 hover:text-white transition-colors p-1" onclick="handleLogout()">
          <i data-lucide="log-out" class="w-5 h-5"></i>
        </button>
      </header>

      <!-- 1. ЭКРАН АВТОРИЗАЦИИ -->
      <div id="view-login" class="flex-1 flex flex-col px-6 py-10 justify-center">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-black text-slate-900 mb-2">Добро пожаловать!</h2>
          <p class="text-slate-500 text-sm">Введите ваши данные от CRM для входа</p>
        </div>

        <div id="login-error" class="hidden bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs mb-4 border border-red-100 flex items-center gap-2">
          <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
          <span id="login-error-text">Неверный логин или пароль</span>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Номер Телефона</label>
            <div class="relative">
              <i data-lucide="phone" class="w-5 h-5 text-slate-400 absolute left-3 top-3.5"></i>
              <input type="tel" id="login-phone" placeholder="+7 (999) 000-00-00" 
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Пароль</label>
            <div class="relative">
              <i data-lucide="lock" class="w-5 h-5 text-slate-400 absolute left-3 top-3.5"></i>
              <input type="password" id="login-password" placeholder="••••••••" 
                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm" />
            </div>
          </div>

          <button onclick="submitLogin()" id="login-btn-submit" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl mt-6 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
            Войти в систему
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="mt-8 text-center text-xs text-slate-400">
          Данные хранятся в вашей Google-таблице.<br>
          Для первого входа используйте телефон и пароль администратора.
        </div>
      </div>

      <!-- 2. ЭКРАН АДМИНА -->
      <div id="view-admin" class="hidden flex-1 flex flex-col">
        <!-- Мини-вкладки админа -->
        <div class="bg-slate-100 p-1 flex border-b border-slate-200">
          <button onclick="switchAdminSubTab('orders')" id="subtab-admin-orders" class="flex-1 text-center py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow">
            Заказы
          </button>
          <button onclick="switchAdminSubTab('add')" id="subtab-admin-add" class="flex-1 text-center py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800">
            + Создать
          </button>
          <button onclick="switchAdminSubTab('workers')" id="subtab-admin-workers" class="flex-1 text-center py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800">
            Мойщики
          </button>
          <button onclick="switchAdminSubTab('finance')" id="subtab-admin-finance" class="flex-1 text-center py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800">
            Финансы
          </button>
        </div>

        <!-- Под-вкладка: Список Заказов -->
        <div id="admin-sub-orders" class="p-4 flex-1 space-y-4">
          <!-- Фильтр по статусу -->
          <div class="flex gap-2 overflow-x-auto pb-1 custom-scroll">
            <button onclick="filterAdminOrders('All')" class="admin-status-filter-btn text-xs px-3 py-1.5 rounded-full bg-slate-900 text-white font-semibold shrink-0">Все</button>
            <button onclick="filterAdminOrders('Новый')" class="admin-status-filter-btn text-xs px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 font-semibold shrink-0">Новые</button>
            <button onclick="filterAdminOrders('Принял')" class="admin-status-filter-btn text-xs px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 font-semibold shrink-0">В работе</button>
            <button onclick="filterAdminOrders('Выполнено')" class="admin-status-filter-btn text-xs px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 font-semibold shrink-0">Выполнено</button>
            <button onclick="filterAdminOrders('Отмена')" class="admin-status-filter-btn text-xs px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 font-semibold shrink-0">Архив/Отмена</button>
          </div>

          <!-- Список карточек -->
          <div id="admin-orders-list" class="space-y-3">
            <!-- Сюда вставляются карточки JS -->
          </div>
        </div>

        <!-- Под-вкладка: Новый Заказ / Мойщик -->
        <div id="admin-sub-add" class="hidden p-4 space-y-4">
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex gap-2">
            <button onclick="toggleFormType('order')" id="formtype-order" class="flex-1 py-1.5 rounded-lg text-xs font-bold bg-white shadow text-slate-800">Новый Заказ</button>
            <button onclick="toggleFormType('worker')" id="formtype-worker" class="flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100">Новый Мойщик</button>
          </div>

          <!-- Форма Заказа -->
          <form id="form-new-order" onsubmit="handleCreateOrder(event)" class="space-y-3">
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">ФИО клиента</label>
              <input type="text" id="order-client" required class="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Иван Петров" />
            </div>
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Телефон</label>
              <input type="tel" id="order-phone" required class="w-full px-3 py-2 border rounded-xl text-sm" placeholder="+7 (900) 000-00-00" />
            </div>
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Адрес мойки</label>
              <input type="text" id="order-address" required class="w-full px-3 py-2 border rounded-xl text-sm" placeholder="ул. Пушкина, д.10, кв. 5" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Дата</label>
                <input type="date" id="order-date" required class="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Время</label>
                <input type="time" id="order-time" required class="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Описание (кол-во окон, этаж и т.д.)</label>
              <textarea id="order-desc" required class="w-full px-3 py-2 border rounded-xl text-sm h-16" placeholder="3-комнатная квартира, 5 стандартных окон, 1 балконная дверь. Наличие стремянки."></textarea>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Общая Стоимость (₽)</label>
                <input type="number" id="order-price" required class="w-full px-3 py-2 border rounded-xl text-sm" placeholder="5000" />
              </div>
              <div>
                <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Исполнитель (Мойщик)</label>
                <select id="order-assignee" required class="w-full px-3 py-2 border rounded-xl text-sm bg-white">
                  <!-- Заполняется динамически -->
                </select>
              </div>
            </div>
            <button type="submit" class="w-full bg-sky-500 text-slate-900 font-bold py-3 rounded-xl mt-4 hover:bg-sky-400 active:scale-95 transition-all text-sm">
              Создать и Назначить Заказ
            </button>
          </form>

          <!-- Форма Мойщика -->
          <form id="form-new-worker" onsubmit="handleCreateWorker(event)" class="hidden space-y-3">
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Имя Мойщика</label>
              <input type="text" id="worker-name" required class="w-full px-3 py-2 border rounded-xl text-sm" placeholder="Александр Николаев" />
            </div>
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Телефон для входа</label>
              <input type="tel" id="worker-phone" required class="w-full px-3 py-2 border rounded-xl text-sm" placeholder="+79991234567" />
            </div>
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Пароль для входа</label>
              <input type="text" id="worker-pass" required class="w-full px-3 py-2 border rounded-xl text-sm" placeholder="12345" />
            </div>
            <div>
              <label class="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Ставка в процентах % (сколько получает от заказа)</label>
              <input type="number" id="worker-rate" value="50" min="1" max="100" required class="w-full px-3 py-2 border rounded-xl text-sm" placeholder="50" />
            </div>
            <button type="submit" class="w-full bg-slate-900 text-white font-bold py-3 rounded-xl mt-4 hover:bg-slate-800 active:scale-95 transition-all text-sm">
              Создать Аккаунт Мойщика
            </button>
          </form>
        </div>

        <!-- Под-вкладка: Управление Мойщиками -->
        <div id="admin-sub-workers" class="hidden p-4 space-y-4">
          <h3 class="font-bold text-base text-slate-900">Зарегистрированные автомойщики</h3>
          <div id="admin-workers-list" class="space-y-3">
            <!-- Список мойщиков -->
          </div>
        </div>

        <!-- Под-вкладка: Финансовые отчеты -->
        <div id="admin-sub-finance" class="hidden p-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <span class="text-[10px] uppercase text-emerald-600 font-bold block">Всего Оборота</span>
              <span id="fin-turnover" class="text-xl font-extrabold text-emerald-900">0 ₽</span>
            </div>
            <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <span class="text-[10px] uppercase text-indigo-600 font-bold block">Прибыль Админа</span>
              <span id="fin-admin-profit" class="text-xl font-extrabold text-indigo-900">0 ₽</span>
            </div>
          </div>
          
          <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <span class="text-[10px] uppercase text-amber-600 font-bold block">Выплачено Мойщикам</span>
            <span id="fin-workers-pay" class="text-lg font-extrabold text-amber-900">0 ₽</span>
          </div>

          <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <h4 class="font-bold text-xs text-slate-700 uppercase tracking-wide">Статистика по заказам:</h4>
            <div class="flex justify-between text-sm">
              <span class="text-slate-500">Всего заказов:</span>
              <span id="fin-total-orders" class="font-bold">0</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-green-600 font-semibold">Успешно выполнено:</span>
              <span id="fin-done-orders" class="font-bold text-green-700">0</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-amber-600 font-semibold">В процессе/новые:</span>
              <span id="fin-active-orders" class="font-bold text-amber-700">0</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-red-500">Отменено:</span>
              <span id="fin-cancelled-orders" class="font-bold text-red-600">0</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. ЭКРАН МОЙЩИКА -->
      <div id="view-worker" class="hidden flex-1 flex flex-col">
        <!-- Статистика мойщика в шапке -->
        <div class="bg-indigo-900 text-white p-4">
          <div class="flex justify-between items-center mb-1">
            <span class="text-xs text-indigo-200 uppercase font-semibold">Мой Личный Баланс (заработано)</span>
            <span class="text-xs bg-indigo-800 text-sky-300 font-semibold px-2 py-0.5 rounded-full" id="worker-profile-rate">50% ставка</span>
          </div>
          <div id="worker-earnings" class="text-3xl font-extrabold tracking-tight">0 ₽</div>
          <p class="text-[10px] text-indigo-300 mt-1">Отображается сумма за все заказы в статусе "Выполнено"</p>
        </div>

        <div class="p-1 px-4 bg-slate-100 flex border-b border-slate-200">
          <button onclick="switchWorkerSubTab('active')" id="subtab-worker-active" class="flex-1 py-2 text-xs font-bold text-slate-900 bg-white shadow rounded-lg text-center">
            Активные заказы
          </button>
          <button onclick="switchWorkerSubTab('archive')" id="subtab-worker-archive" class="flex-1 py-2 text-xs font-bold text-slate-400 rounded-lg text-center">
            Архив выполненных
          </button>
        </div>

        <!-- Под-вкладки мойщика -->
        <div id="worker-active-orders-pane" class="p-4 flex-1 space-y-3">
          <div id="worker-orders-list" class="space-y-3">
            <!-- Карточки заказов мойщика -->
          </div>
        </div>
        
        <div id="worker-archived-orders-pane" class="hidden p-4 flex-1 space-y-3">
          <div id="worker-archive-list" class="space-y-3">
            <!-- Отправленные в архив -->
          </div>
        </div>
      </div>

      <!-- МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ЗАКАЗА / ДЕЙСТВИЯ МОЙЩИКА -->
      <div id="modal-order-details" class="fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto hidden flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-xl">
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-sky-600 uppercase" id="modal-order-id">ORD_0000</span>
            <button onclick="closeOrderModal()" class="p-1 text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-6 h-6"></i>
            </button>
          </div>

          <div class="space-y-2 border-b pb-4">
            <h3 class="text-xl font-bold" id="modal-client-name">Клиент</h3>
            <p class="text-xs text-slate-500 flex items-center gap-1.5">
              <i data-lucide="phone" class="w-3.5 h-3.5"></i>
              <a href="#" id="modal-client-phone" class="text-slate-800 underline"></a>
            </p>
            <p class="text-sm text-slate-700 flex items-start gap-1.5 mt-1">
              <i data-lucide="map-pin" class="w-4 h-4 text-sky-500 shrink-0 mt-0.5"></i>
              <span id="modal-address"></span>
            </p>
            <p class="text-sm text-slate-700 flex items-center gap-1.5">
              <i data-lucide="calendar" class="w-4 h-4 text-sky-500"></i>
              <span id="modal-datetime"></span>
            </p>
          </div>

          <div>
            <h4 class="text-xs uppercase font-bold text-slate-400 mb-1">Что нужно сделать:</h4>
            <div class="bg-slate-50 p-3 rounded-xl text-sm border text-slate-700" id="modal-desc">Описание задачи</div>
          </div>

          <!-- Изменение статуса и фото для Рабочего -->
          <div id="worker-actions-panel" class="space-y-3 border-t pt-4">
            <div>
              <h4 class="text-xs uppercase font-bold text-slate-500 mb-1.5">Статус Заказа:</h4>
              <div class="grid grid-cols-2 gap-2" id="status-buttons-container">
                <!-- Кнопки быстрого изменения статуса -->
              </div>
            </div>

            <!-- Добавление комментария и фото -->
            <div class="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <h5 class="font-bold text-xs text-slate-700">Отчет о проделанной работе</h5>
              
              <div>
                <label class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Комментарий к заказу</label>
                <textarea id="worker-comment-input" class="w-full px-3 py-2 border rounded-xl text-xs h-14 bg-white" placeholder="Напишите тут информацию для админа..."></textarea>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Фото ДО начала</label>
                  <div class="relative bg-white border border-dashed rounded-xl p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 min-h-[70px]">
                    <input type="file" id="photo-before-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" onchange="previewSelectedPhoto('before')" />
                    <div id="photo-before-placeholder" class="text-slate-400 text-center">
                      <i data-lucide="camera" class="w-5 h-5 mx-auto mb-1"></i>
                      <span class="text-[9px]">Загрузить ДО</span>
                    </div>
                    <img id="photo-before-img" class="hidden absolute inset-0 w-full h-full object-cover rounded-xl" />
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] text-slate-500 uppercase font-bold mb-1">Фото ПОСЛЕ («Выполнено»)</label>
                  <div class="relative bg-white border border-dashed rounded-xl p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 min-h-[70px]">
                    <input type="file" id="photo-after-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" onchange="previewSelectedPhoto('after')" />
                    <div id="photo-after-placeholder" class="text-slate-400 text-center">
                      <i data-lucide="camera" class="w-5 h-5 mx-auto mb-1"></i>
                      <span class="text-[9px]">Загрузить ПОСЛЕ</span>
                    </div>
                    <img id="photo-after-img" class="hidden absolute inset-0 w-full h-full object-cover rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            <button onclick="submitWorkerReport()" id="worker-report-submit-btn" class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-slate-800 shadow transition-all active:scale-95 flex items-center justify-center gap-1">
              Сохранить статус и отчет
            </button>
          </div>

          <!-- Админская панель просмотра деталей отчета -->
          <div id="admin-view-report-panel" class="hidden space-y-3 border-t pt-4">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-indigo-50 border p-2 rounded-xl text-center">
                <span class="text-slate-500 block text-[9px] uppercase">Оплата Исполнителю</span>
                <span id="admin-view-pay" class="font-bold text-indigo-900">0 ₽</span>
              </div>
              <div class="bg-emerald-50 border p-2 rounded-xl text-center">
                <span class="text-slate-500 block text-[9px] uppercase">Ваша Чистая Прибыль</span>
                <span id="admin-view-profit" class="font-bold text-emerald-900">0 ₽</span>
              </div>
            </div>

            <div class="bg-slate-50 p-2.5 rounded-xl border text-xs">
              <span class="font-bold block text-slate-500 text-[10px] uppercase mb-1">Исполнитель:</span>
              <span id="admin-view-worker-name" class="text-slate-800">Сергей Мойщик</span>
            </div>

            <div class="bg-slate-50 p-2.5 rounded-xl border text-xs" id="admin-view-comment-wrap">
              <span class="font-bold block text-slate-500 text-[10px] uppercase mb-1">Комментарий мойщика:</span>
              <span id="admin-view-comment" class="text-slate-800 leading-tight">Нет комментариев</span>
            </div>

            <!-- Ссылка на Фото для Админа -->
            <div class="grid grid-cols-2 gap-2" id="admin-view-photos-block">
              <div>
                <span class="text-[10px] font-bold text-slate-500 block mb-1 uppercase">Фото ДО:</span>
                <div class="border rounded-xl h-24 bg-slate-100 flex items-center justify-center overflow-hidden" id="admin-photo-before-container">
                  <span class="text-slate-400 text-[10px]">Нет фото</span>
                </div>
              </div>
              <div>
                <span class="text-[10px] font-bold text-slate-500 block mb-1 uppercase">Фото ПОСЛЕ:</span>
                <div class="border rounded-xl h-24 bg-slate-100 flex items-center justify-center overflow-hidden" id="admin-photo-after-container">
                  <span class="text-slate-400 text-[10px]">Нет фото</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button onclick="handleAdminCancelOrder()" id="admin-cancel-btn" class="py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all">
                Отменить заказ
              </button>
              <button onclick="closeOrderModal()" class="bg-slate-100 py-2.5 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    
    </div>

    <!-- СКРИПТ КЛИЕНТСКОГО ИНТЕРФЕЙСА CRM -->
    <script>
      // Хранилище текущих состояний
      let currentUser = null;
      let allOrders = [];
      let allWorkers = [];
      let activeAdminSubTab = 'orders';
      let activeWorkerSubTab = 'active';
      let currentFilterStatus = 'All';
      let formType = 'order'; // 'order' или 'worker'
      let selectedOrder = null;
      
      // Временные переменные для Base64 фоток
      let tempPhotoBefore = "";
      let tempPhotoAfter = "";

      // Инициализация при запуске
      window.onload = function() {
        initApp();
      };

      function initApp() {
        // Проверяем наличие залогиненной сессии из localStorage
        const savedSession = localStorage.getItem("crm_session");
        if (savedSession) {
          try {
            currentUser = JSON.parse(savedSession);
            showDashboard();
          } catch(e) {
            localStorage.removeItem("crm_session");
            document.getElementById("app-loading").style.display = "none";
          }
        } else {
          document.getElementById("app-loading").style.display = "none";
        }
        lucide.createIcons();
      }

      // Отправка Логина
      function submitLogin() {
        const phone = document.getElementById("login-phone").value.trim();
        const password = document.getElementById("login-password").value.trim();
        const errorDiv = document.getElementById("login-error");
        
        if (!phone || !password) {
          showError("Введите телефон и пароль");
          return;
        }

        document.getElementById("login-btn-submit").disabled = true;
        document.getElementById("login-btn-submit").innerText = "Авторизация...";

        // Запрос к Apps Script
        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler(function(response) {
              document.getElementById("login-btn-submit").disabled = false;
              document.getElementById("login-btn-submit").innerHTML = 'Войти в систему <i data-lucide="arrow-right" class="w-4 h-4"></i>';
              lucide.createIcons();
              
              if (response.success) {
                currentUser = response.user;
                localStorage.setItem("crm_session", JSON.stringify(currentUser));
                showDashboard();
              } else {
                showError(response.message);
              }
            })
            .withFailureHandler(function(err) {
              document.getElementById("login-btn-submit").disabled = false;
              document.getElementById("login-btn-submit").innerHTML = 'Войти в систему <i data-lucide="arrow-right" class="w-4 h-4"></i>';
              lucide.createIcons();
              showError("Ошибка подключения к серверу Apps Script. Проверьте ID таблицы.");
            })
            .loginUser(phone, password);
        } else {
          // Имитируем для локального тестирования
          setTimeout(function() {
            document.getElementById("login-btn-submit").disabled = false;
            document.getElementById("login-btn-submit").innerHTML = 'Войти в систему <i data-lucide="arrow-right" class="w-4 h-4"></i>';
            lucide.createIcons();
            
            // Тестовый вход без Apps Script
            const cleanInput = phone.replace(/\\D/g, "");
            if (cleanInput.includes("9998887766") && password === "admin") {
              currentUser = { id: "USR_ADMIN_1", name: "Администратор", phone: phone, role: "admin", rate: 100 };
              localStorage.setItem("crm_session", JSON.stringify(currentUser));
              showDashboard();
            } else if (cleanInput.includes("9991112233") && password === "12345") {
              currentUser = { id: "USR_WRK_1", name: "Иван Мойщик", phone: phone, role: "worker", rate: 50 };
              localStorage.setItem("crm_session", JSON.stringify(currentUser));
              showDashboard();
            } else {
              showError("Неверный номер или пароль. (Тестовые: Админ +79998887766 пароль admin / Мойщик +79991112233 пароль 12345)");
            }
          }, 800);
        }
      }

      function showError(msg) {
        const errorDiv = document.getElementById("login-error");
        document.getElementById("login-error-text").innerText = msg;
        errorDiv.classList.remove("hidden");
      }

      function handleLogout() {
        localStorage.removeItem("crm_session");
        currentUser = null;
        document.getElementById("view-admin").classList.add("hidden");
        document.getElementById("view-worker").classList.add("hidden");
        document.getElementById("logout-btn").classList.add("hidden");
        document.getElementById("view-login").classList.remove("hidden");
        document.getElementById("header-user-role").innerText = "Авторизуйтесь";
      }

      // Настройка Дашборда
      function showDashboard() {
        document.getElementById("login-error").classList.add("hidden");
        document.getElementById("view-login").classList.add("hidden");
        document.getElementById("logout-btn").classList.remove("hidden");
        
        const roleText = currentUser.role === "admin" ? "Администратор" : "Исполнитель: " + currentUser.name;
        document.getElementById("header-user-role").innerText = roleText;

        if (currentUser.role === "admin") {
          document.getElementById("view-admin").classList.remove("hidden");
          document.getElementById("view-worker").classList.add("hidden");
          loadAdminData();
        } else {
          document.getElementById("view-worker").classList.remove("hidden");
          document.getElementById("view-admin").classList.add("hidden");
          document.getElementById("worker-profile-rate").innerText = currentUser.rate + "% ставка";
          loadWorkerData();
        }
        document.getElementById("app-loading").style.display = "none";
      }

      // ЗАГРУЗКА ДАННЫХ ДЛЯ АДМИНА
      function loadAdminData() {
        if (typeof google !== 'undefined' && google.script && google.script.run) {
          // Загрузка списков с сервера
          google.script.run
            .withSuccessHandler(function(resW) {
              if (resW.success) {
                allWorkers = resW.workers;
                populateWorkersSelect();
                renderAdminWorkers();
              }
            }).getWorkersList();

          google.script.run
            .withSuccessHandler(function(resO) {
              if (resO.success) {
                allOrders = resO.orders;
                renderAdminOrders();
                calculateFinance();
              }
            }).getOrdersList(currentUser.id, "admin");
        } else {
          // Мок данные
          allWorkers = [
            { id: "USR_WRK_1", name: "Иван Мойщик", phone: "+79991112233", rate: 50, dateCreated: "2026-06-22" },
            { id: "USR_WRK_2", name: "Сергей Мойщик", phone: "+79994445566", rate: 45, dateCreated: "2026-06-22" }
          ];
          allOrders = [
            {
              id: "ORD_1001", clientName: "Алексей Смирнов", clientPhone: "+79001234567",
              address: "ул. Ленина, д. 15, кв. 42", date: "2026-06-23", time: "10:00",
              description: "Окна 3-комн. квартиры (4 окна, балконные блоки)", price: 5000,
              workerPay: 2500, adminProfit: 2500, workerId: "USR_WRK_1", workerName: "Иван Мойщик",
              status: "Новый", comment: "", photoBefore: "", photoAfter: "", dateCreated: "2026-06-22"
            },
            {
              id: "ORD_1002", clientName: "Мария Иванова", clientPhone: "+79119876543",
              address: "пр. Просвещения, д. 28, оф. 5", date: "2026-06-22", time: "14:00",
              description: "Витражные окна в офисе (высота 3м, 6 секций)", price: 12000,
              workerPay: 5400, adminProfit: 6600, workerId: "USR_WRK_2", workerName: "Сергей Мойщик",
              status: "Выполнено", comment: "Все отлично отмыли, клиент доволен!", 
              photoBefore: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=500", 
              photoAfter: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500", 
              dateCreated: "2026-06-21"
            }
          ];
          populateWorkersSelect();
          renderAdminOrders();
          renderAdminWorkers();
          calculateFinance();
        }
      }

      // ЗАГРУЗКА ДАННЫХ ДЛЯ РАБОЧЕГО
      function loadWorkerData() {
        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler(function(resO) {
              if (resO.success) {
                allOrders = resO.orders;
                renderWorkerOrders();
              }
            }).getOrdersList(currentUser.id, "worker");
        } else {
          // Мок данные
          allOrders = [
            {
              id: "ORD_1001", clientName: "Алексей Смирнов", clientPhone: "+79001234567",
              address: "ул. Ленина, д. 15, кв. 42", date: "2026-06-23", time: "10:00",
              description: "Окна 3-комн. квартиры (4 окна, балконные блоки)", price: 5000,
              workerPay: 2500, adminProfit: 2500, workerId: "USR_WRK_1", workerName: "Иван Мойщик",
              status: "Новый", comment: "", photoBefore: "", photoAfter: "", dateCreated: "2026-06-22"
            }
          ].filter(o => o.workerId === currentUser.id);
          renderWorkerOrders();
        }
      }

      // Динамическое заполение селектора
      function populateWorkersSelect() {
        const select = document.getElementById("order-assignee");
        select.innerHTML = '<option value="">-- Выберите исполнителя --</option>';
        allWorkers.forEach(w => {
          const opt = document.createElement("option");
          opt.value = w.id + "|" + w.name + "|" + w.rate;
          opt.innerText = w.name + " (" + w.rate + "%)";
          select.appendChild(opt);
        });
      }

      // Переключение под-вкладок администратора
      function switchAdminSubTab(tab) {
        activeAdminSubTab = tab;
        document.getElementById("admin-sub-orders").classList.add("hidden");
        document.getElementById("admin-sub-add").classList.add("hidden");
        document.getElementById("admin-sub-workers").classList.add("hidden");
        document.getElementById("admin-sub-finance").classList.add("hidden");

        const btnOrders = document.getElementById("subtab-admin-orders");
        const btnAdd = document.getElementById("subtab-admin-add");
        const btnWorkers = document.getElementById("subtab-admin-workers");
        const btnFinance = document.getElementById("subtab-admin-finance");

        [btnOrders, btnAdd, btnWorkers, btnFinance].forEach(btn => {
          btn.className = "flex-1 text-center py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800";
        });

        if (tab === 'orders') {
          document.getElementById("admin-sub-orders").classList.remove("hidden");
          btnOrders.className = "flex-1 text-center py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow";
          renderAdminOrders();
        } else if (tab === 'add') {
          document.getElementById("admin-sub-add").classList.remove("hidden");
          btnAdd.className = "flex-1 text-center py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow";
        } else if (tab === 'workers') {
          document.getElementById("admin-sub-workers").classList.remove("hidden");
          btnWorkers.className = "flex-1 text-center py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow";
          renderAdminWorkers();
        } else if (tab === 'finance') {
          document.getElementById("admin-sub-finance").classList.remove("hidden");
          btnFinance.className = "flex-1 text-center py-2 text-xs font-bold rounded-lg bg-white text-slate-900 shadow";
          calculateFinance();
        }
      }

      // Переключение типа формы (Заказ/Мойщик)
      function toggleFormType(type) {
        formType = type;
        const bOrder = document.getElementById("formtype-order");
        const bWorker = document.getElementById("formtype-worker");
        
        bOrder.className = "flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100";
        bWorker.className = "flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100";

        if (type === 'order') {
          bOrder.className = "flex-1 py-1.5 rounded-lg text-xs font-bold bg-white shadow text-slate-800";
          document.getElementById("form-new-order").classList.remove("hidden");
          document.getElementById("form-new-worker").classList.add("hidden");
        } else {
          bWorker.className = "flex-1 py-1.5 rounded-lg text-xs font-bold bg-white shadow text-slate-800";
          document.getElementById("form-new-order").classList.add("hidden");
          document.getElementById("form-new-worker").classList.remove("hidden");
        }
      }

      // Создание заказа
      function handleCreateOrder(e) {
        e.preventDefault();
        const clientVal = document.getElementById("order-client").value.trim();
        const phoneVal = document.getElementById("order-phone").value.trim();
        const addressVal = document.getElementById("order-address").value.trim();
        const dateVal = document.getElementById("order-date").value;
        const timeVal = document.getElementById("order-time").value;
        const descVal = document.getElementById("order-desc").value.trim();
        const priceVal = document.getElementById("order-price").value;
        const assigneeVal = document.getElementById("order-assignee").value;

        if (!assigneeVal) {
          alert("Пожалуйста, назначьте мойщика на этот заказ!");
          return;
        }

        const [wId, wName, wRateStr] = assigneeVal.split("|");
        const wRate = parseFloat(wRateStr);

        const orderData = {
          clientName: clientVal,
          clientPhone: phoneVal,
          address: addressVal,
          date: dateVal,
          time: timeVal,
          description: descVal,
          price: priceVal,
          workerId: wId,
          workerName: wName,
          workerRate: wRate
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = "Создаем в Google Sheets...";

        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler(function(res) {
              submitBtn.disabled = false;
              submitBtn.innerText = "Создать и Назначить Заказ";
              if (res.success) {
                alert("Заказ успешно создан и назначен!");
                document.getElementById("form-new-order").reset();
                switchAdminSubTab('orders');
                loadAdminData();
              } else {
                alert("Ошибка: " + res.message);
              }
            })
            .createNewOrder(orderData);
        } else {
          // Имитация
          setTimeout(function() {
            submitBtn.disabled = false;
            submitBtn.innerText = "Создать и Назначить Заказ";
            const mockId = "ORD_" + Math.floor(1000 + Math.random() * 9000);
            const wPay = Math.round(priceVal * (wRate / 100));
            const aProfit = priceVal - wPay;
            
            const newOrd = {
              id: mockId,
              clientName: clientVal,
              clientPhone: phoneVal,
              address: addressVal,
              date: dateVal,
              time: timeVal,
              description: descVal,
              price: parseFloat(priceVal),
              workerPay: wPay,
              adminProfit: aProfit,
              workerId: wId,
              workerName: wName,
              status: "Новый",
              comment: "",
              photoBefore: "",
              photoAfter: "",
              dateCreated: new Date().toISOString().substring(0, 10)
            };
            allOrders.unshift(newOrd);
            alert("Заказ успешно создан в симуляторе!");
            document.getElementById("form-new-order").reset();
            switchAdminSubTab('orders');
            renderAdminOrders();
            calculateFinance();
          }, 600);
        }
      }

      // Создание аккаунта мойщика
      function handleCreateWorker(e) {
        e.preventDefault();
        const nameVal = document.getElementById("worker-name").value.trim();
        const phoneVal = document.getElementById("worker-phone").value.trim();
        const passVal = document.getElementById("worker-pass").value.trim();
        const rateVal = document.getElementById("worker-rate").value;

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = "Регистрация...";

        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler(function(res) {
              submitBtn.disabled = false;
              submitBtn.innerText = "Создать Аккаунт Мойщика";
              if (res.success) {
                alert("Аккаунт мойщика успешно создан в Google Таблице!");
                document.getElementById("form-new-worker").reset();
                switchAdminSubTab('workers');
                loadAdminData();
              } else {
                alert("Ошибка: " + res.message);
              }
            })
            .createWorkerAccount(nameVal, phoneVal, passVal, rateVal);
        } else {
          setTimeout(function() {
            submitBtn.disabled = false;
            submitBtn.innerText = "Создать Аккаунт Мойщика";
            const mockId = "WRK_" + Math.floor(100000 + Math.random() * 9000);
            const newW = {
              id: mockId,
              name: nameVal,
              phone: phoneVal,
              rate: parseFloat(rateVal),
              dateCreated: new Date().toISOString().substring(0, 10)
            };
            allWorkers.push(newW);
            alert("Аккаунт мойщика успешно создан в симуляторе!");
            document.getElementById("form-new-worker").reset();
            switchAdminSubTab('workers');
            populateWorkersSelect();
            renderAdminWorkers();
          }, 500);
        }
      }

      // Отрисовка списка заказов Админа с фильтром
      function filterAdminOrders(status) {
        currentFilterStatus = status;
        const btns = document.querySelectorAll(".admin-status-filter-btn");
        btns.forEach(btn => {
          if (btn.innerText.includes(status === 'All' ? 'Все' : status === 'Новый' ? 'Новые' : status === 'Принял' ? 'В работе' : status === 'Выполнено' ? 'Выполнено' : 'Архив')) {
            btn.className = "admin-status-filter-btn text-xs px-3 py-1.5 rounded-full bg-slate-900 text-white font-semibold shrink-0";
          } else {
            btn.className = "admin-status-filter-btn text-xs px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 font-semibold shrink-0";
          }
        });
        renderAdminOrders();
      }

      function renderAdminOrders() {
        const listDiv = document.getElementById("admin-orders-list");
        listDiv.innerHTML = "";
        
        let filtered = allOrders;
        if (currentFilterStatus !== 'All') {
          if (currentFilterStatus === 'Принял') {
            // "В работе" включает Принял, Выехал, На месте
            filtered = allOrders.filter(o => ['Принял', 'Выехал', 'На месте'].includes(o.status));
          } else {
            filtered = allOrders.filter(o => o.status === currentFilterStatus);
          }
        }

        if (filtered.length === 0) {
          listDiv.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">Нет заказов в этой категории</div>';
          return;
        }

        filtered.forEach(o => {
          const card = document.createElement("div");
          card.className = "bg-white border rounded-2xl p-4 shadow-sm active:scale-98 transition-all cursor-pointer";
          card.onclick = function() { openOrderDetails(o); };
          
          let statusBadgeColor = "bg-slate-100 text-slate-700";
          if (o.status === 'Новый') statusBadgeColor = "bg-blue-100 text-blue-700";
          else if (o.status === 'Принял') statusBadgeColor = "bg-yellow-100 text-yellow-800";
          else if (['Выехал', 'На месте'].includes(o.status)) statusBadgeColor = "bg-orange-100 text-orange-800";
          else if (o.status === 'Выполнено') statusBadgeColor = "bg-green-100 text-green-800";
          else if (o.status === 'Отмена') statusBadgeColor = "bg-red-100 text-red-700";

          card.innerHTML = \`
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="text-[10px] font-bold text-slate-400">\${o.id}</span>
                <h4 class="font-extrabold text-sm text-slate-900">\${o.clientName}</h4>
              </div>
              <span class="text-[10px] px-2.5 py-1 rounded-full font-bold \${statusBadgeColor}">\${o.status}</span>
            </div>
            
            <div class="text-xs text-slate-500 space-y-1 mb-3">
              <p class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-sky-400 shrink-0"></i> \${o.address}</p>
              <p class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5 text-sky-400 shrink-0"></i> \${o.date} в \${o.time}</p>
            </div>

            <div class="border-t pt-2 flex justify-between items-center text-xs">
              <div>
                <span class="text-slate-400 text-[10px] block uppercase">Исполнитель</span>
                <span class="font-semibold text-slate-700">\${o.workerName}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-400 text-[10px] block uppercase">Сумма</span>
                <span class="font-bold text-slate-900 text-sm">\${o.price} ₽</span>
              </div>
            </div>
          \`;
          listDiv.appendChild(card);
        });
        lucide.createIcons();
      }

      function renderAdminWorkers() {
        const listDiv = document.getElementById("admin-workers-list");
        listDiv.innerHTML = "";

        if (allWorkers.length === 0) {
          listDiv.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">Нет зарегистрированных исполнителей</div>';
          return;
        }

        allWorkers.forEach(w => {
          const card = document.createElement("div");
          card.className = "bg-slate-50 border rounded-2xl p-4 flex justify-between items-center";
          card.innerHTML = \`
            <div>
              <h4 class="font-bold text-sm text-slate-900">\${w.name}</h4>
              <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><i data-lucide="phone" class="w-3 h-3"></i> \${w.phone}</p>
              <span class="text-[9px] text-slate-400 block mt-1">Зарегистрирован \${w.dateCreated}</span>
            </div>
            <div class="text-right">
              <span class="text-xs bg-slate-200 font-bold px-2.5 py-1 rounded-lg text-slate-700 inline-block">\${w.rate}% ставка</span>
            </div>
          \`;
          listDiv.appendChild(card);
        });
        lucide.createIcons();
      }

      function calculateFinance() {
        let turnover = 0;
        let workerPay = 0;
        let adminProfit = 0;
        let completedCount = 0;
        let activeCount = 0;
        let cancelledCount = 0;

        allOrders.forEach(o => {
          if (o.status === 'Выполнено') {
            turnover += parseFloat(o.price) || 0;
            workerPay += parseFloat(o.workerPay) || 0;
            adminProfit += parseFloat(o.adminProfit) || 0;
            completedCount++;
          } else if (o.status === 'Отмена') {
            cancelledCount++;
          } else {
            activeCount++;
          }
        });

        document.getElementById("fin-turnover").innerText = turnover + " ₽";
        document.getElementById("fin-admin-profit").innerText = adminProfit + " ₽";
        document.getElementById("fin-workers-pay").innerText = workerPay + " ₽";
        document.getElementById("fin-total-orders").innerText = allOrders.length;
        document.getElementById("fin-done-orders").innerText = completedCount;
        document.getElementById("fin-active-orders").innerText = activeCount;
        document.getElementById("fin-cancelled-orders").innerText = cancelledCount;
      }

      // МОЙЩИК: Переключение табов мойщика
      function switchWorkerSubTab(tab) {
        activeWorkerSubTab = tab;
        const bActive = document.getElementById("subtab-worker-active");
        const bArchive = document.getElementById("subtab-worker-archive");
        
        bActive.className = "flex-1 py-2 text-xs font-bold text-slate-400 rounded-lg text-center";
        bArchive.className = "flex-1 py-2 text-xs font-bold text-slate-400 rounded-lg text-center";

        if (tab === 'active') {
          bActive.className = "flex-1 py-2 text-xs font-bold text-slate-900 bg-white shadow rounded-lg text-center";
          document.getElementById("worker-active-orders-pane").classList.remove("hidden");
          document.getElementById("worker-archived-orders-pane").classList.add("hidden");
          renderWorkerOrders();
        } else {
          bArchive.className = "flex-1 py-2 text-xs font-bold text-slate-900 bg-white shadow rounded-lg text-center";
          document.getElementById("worker-active-orders-pane").classList.add("hidden");
          document.getElementById("worker-archived-orders-pane").classList.remove("hidden");
          renderWorkerOrders();
        }
      }

      // Отрисовка списка заказов мойщика
      function renderWorkerOrders() {
        const activeList = document.getElementById("worker-orders-list");
        const archiveList = document.getElementById("worker-archive-list");
        
        activeList.innerHTML = "";
        archiveList.innerHTML = "";

        const workerOrders = allOrders.filter(o => o.workerId === currentUser.id);

        let activeCount = 0;
        let archiveCount = 0;
        let balance = 0;

        workerOrders.forEach(o => {
          const card = document.createElement("div");
          card.className = "bg-white border rounded-2xl p-4 shadow-sm active:scale-98 transition-all cursor-pointer relative overflow-hidden";
          card.onclick = function() { openOrderDetails(o); };

          let statusBadgeColor = "bg-slate-100 text-slate-700";
          if (o.status === 'Новый') statusBadgeColor = "bg-blue-100 text-blue-700";
          else if (o.status === 'Принял') statusBadgeColor = "bg-yellow-100 text-yellow-800";
          else if (['Выехал', 'На месте'].includes(o.status)) statusBadgeColor = "bg-orange-100 text-orange-800";
          else if (o.status === 'Выполнено') statusBadgeColor = "bg-green-100 text-green-800";
          else if (o.status === 'Отмена') statusBadgeColor = "bg-red-100 text-red-700";

          card.innerHTML = \`
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="text-[9px] font-bold text-slate-400">\${o.id}</span>
                <h4 class="font-black text-sm text-slate-900">\${o.clientName}</h4>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded font-bold \${statusBadgeColor}">\${o.status}</span>
            </div>
            
            <p class="text-xs text-slate-600 flex items-start gap-1 pb-2"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5"></i> \${o.address}</p>
            <p class="text-xs text-slate-600 flex items-center gap-1 pb-2"><i data-lucide="calendar" class="w-3.5 h-3.5 text-sky-400"></i> \${o.date} в \${o.time}</p>

            <div class="border-t pt-2 mt-2 flex justify-between items-center text-xs">
              <span class="text-slate-400 text-[10px] uppercase">Ваш заработок:</span>
              <span class="font-extrabold text-indigo-700 text-sm">\${o.workerPay} ₽</span>
            </div>
          \`;

          if (o.status === 'Выполнено') {
            balance += parseFloat(o.workerPay) || 0;
            archiveList.appendChild(card);
            archiveCount++;
          } else {
            activeList.appendChild(card);
            activeCount++;
          }
        });

        document.getElementById("worker-earnings").innerText = balance + " ₽";

        if (activeCount === 0) {
          activeList.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">У вас нет активных заказов. Ожидайте назначения!</div>';
        }
        if (archiveCount === 0) {
          archiveList.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs flex flex-col items-center justify-center gap-2"><i data-lucide="archive" class="w-8 h-8 text-slate-300"></i> Выполненные заказы будут отображаться здесь</div>';
        }

        lucide.createIcons();
      }

      // ОТКРЫТИЕ МОДАЛКИ С ДЕТАЛЯМИ ЗАКАЗА
      function openOrderDetails(order) {
        selectedOrder = order;
        
        document.getElementById("modal-order-id").innerText = order.id;
        document.getElementById("modal-client-name").innerText = order.clientName;
        
        const phoneLink = document.getElementById("modal-client-phone");
        phoneLink.innerText = order.clientPhone;
        phoneLink.href = "tel:" + order.clientPhone.replace(/\\s/g, "");
        
        document.getElementById("modal-address").innerText = order.address;
        document.getElementById("modal-datetime").innerText = order.date + " в " + order.time;
        document.getElementById("modal-desc").innerText = order.description || "Без описания";

        const workerActions = document.getElementById("worker-actions-panel");
        const adminPanel = document.getElementById("admin-view-report-panel");

        if (currentUser.role === 'admin') {
          workerActions.classList.add("hidden");
          adminPanel.classList.remove("hidden");

          // Заполняем админские детали отчета
          document.getElementById("admin-view-pay").innerText = order.workerPay + " ₽";
          document.getElementById("admin-view-profit").innerText = order.adminProfit + " ₽";
          document.getElementById("admin-view-worker-name").innerText = order.workerName;
          
          const commentEl = document.getElementById("admin-view-comment");
          if (order.comment) {
            commentEl.innerText = order.comment;
            document.getElementById("admin-view-comment-wrap").classList.remove("hidden");
          } else {
            commentEl.innerText = "Исполнитель еще не оставил комментариев";
          }

          // Фотографи до и после
          const beforeContainer = document.getElementById("admin-photo-before-container");
          if (order.photoBefore) {
            beforeContainer.innerHTML = \`<img src="\${order.photoBefore}" class="w-full h-full object-cover cursor-pointer" onclick="window.open('\${order.photoBefore}')" />\`;
          } else {
            beforeContainer.innerHTML = '<span class="text-slate-400 text-[10px]">Нет фото ДО</span>';
          }

          const afterContainer = document.getElementById("admin-photo-after-container");
          if (order.photoAfter) {
            afterContainer.innerHTML = \`<img src="\${order.photoAfter}" class="w-full h-full object-cover cursor-pointer" onclick="window.open('\${order.photoAfter}')" />\`;
          } else {
            afterContainer.innerHTML = '<span class="text-slate-400 text-[10px]">Нет фото ПОСЛЕ</span>';
          }

          // Кнопка отмены видна если не Выполнено и не Отмена
          const cancelBtn = document.getElementById("admin-cancel-btn");
          if (['Выполнено', 'Отмена'].includes(order.status)) {
            cancelBtn.classList.add("hidden");
          } else {
            cancelBtn.classList.remove("hidden");
          }

        } else {
          // Панель для рабочего
          workerActions.classList.remove("hidden");
          adminPanel.classList.add("hidden");

          // Сбрасываем инпуты
          document.getElementById("worker-comment-input").value = order.comment || "";
          tempPhotoBefore = order.photoBefore || "";
          tempPhotoAfter = order.photoAfter || "";

          // Показываем превью фоток если они есть в бд
          setupWorkerPhotoPreview('before', tempPhotoBefore);
          setupWorkerPhotoPreview('after', tempPhotoAfter);

          // Генерируем кнопки статусов
          generateStatusButtons(order.status);
        }

        document.getElementById("modal-order-details").classList.remove("hidden");
        lucide.createIcons();
      }

      function closeOrderModal() {
        document.getElementById("modal-order-details").classList.add("hidden");
        selectedOrder = null;
      }

      // Генерация адаптивных кнопок выбора статуса
      function generateStatusButtons(currentStatus) {
        const statuses = ['Новый', 'Принял', 'Выехал', 'На месте', 'Выполнено', 'Отмена'];
        const container = document.getElementById("status-buttons-container");
        container.innerHTML = "";

        statuses.forEach(s => {
          // Мойщик может переводить в любой статус кроме Отмены (отмену делает только админ)
          if (s === 'Отмена' && currentStatus !== 'Отмена') return;

          const btn = document.createElement("button");
          btn.type = "button";
          btn.innerText = s;
          
          if (s === currentStatus) {
            btn.className = "py-2 px-3 text-xs font-bold rounded-xl border-2 border-slate-900 bg-slate-900 text-white shadow";
          } else {
            btn.className = "py-2 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
          }

          btn.onclick = function() {
            // Визуально переключаем активную кнопку статуса
            const allBtns = container.querySelectorAll("button");
            allBtns.forEach(b => b.className = "py-2 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50");
            btn.className = "py-2 px-3 text-xs font-bold rounded-xl border-2 border-sky-500 bg-sky-500 text-slate-900 font-extrabold shadow";
            
            // Запоминаем выбранный новый статус в обьекте
            selectedOrder.newStatus = s;
          };

          container.appendChild(btn);
        });
      }

      // Предпросмотр выбранного фото на мобильном
      function previewSelectedPhoto(type) {
        const inputId = type === 'before' ? 'photo-before-input' : 'photo-after-input';
        const file = document.getElementById(inputId).files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
          const base64 = e.target.result;
          if (type === 'before') {
            tempPhotoBefore = base64;
          } else {
            tempPhotoAfter = base64;
          }
          setupWorkerPhotoPreview(type, base64);
        };
        reader.readAsDataURL(file);
      }

      function setupWorkerPhotoPreview(type, base64Data) {
        const placeholder = document.getElementById(type === 'before' ? 'photo-before-placeholder' : 'photo-after-placeholder');
        const img = document.getElementById(type === 'before' ? 'photo-before-img' : 'photo-after-img');
        
        if (base64Data) {
          placeholder.classList.add("hidden");
          img.src = base64Data;
          img.classList.remove("hidden");
        } else {
          placeholder.classList.remove("hidden");
          img.src = "";
          img.classList.add("hidden");
        }
      }

      // Отправка отчета мойщика на сервер Apps Script
      function submitWorkerReport() {
        const newStatus = selectedOrder.newStatus || selectedOrder.status;
        const comment = document.getElementById("worker-comment-input").value.trim();
        
        const submitBtn = document.getElementById("worker-report-submit-btn");
        submitBtn.disabled = true;
        submitBtn.innerText = "Сохраняем отчет в Sheets...";

        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler(function(res) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Сохранить статус и отчет';
              if (res.success) {
                alert("Отчет и новый статус успешно сохранены!");
                closeOrderModal();
                loadWorkerData();
              } else {
                alert("Ошибка сохранения: " + res.message);
              }
            })
            .updateOrderProgress(selectedOrder.id, newStatus, comment, tempPhotoBefore, tempPhotoAfter);
        } else {
          // Имитация локально
          setTimeout(function() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Сохранить статус и отчет';
            
            // Находим и обновляем в локальном массиве
            const idx = allOrders.findIndex(o => o.id === selectedOrder.id);
            if (idx !== -1) {
              allOrders[idx].status = newStatus;
              allOrders[idx].comment = comment;
              if (tempPhotoBefore) allOrders[idx].photoBefore = tempPhotoBefore;
              if (tempPhotoAfter) allOrders[idx].photoAfter = tempPhotoAfter;
            }
            alert("Статус и отчет успешно обновлены в симуляторе!");
            closeOrderModal();
            renderWorkerOrders();
          }, 600);
        }
      }

      // Администратор: отмена заказа
      function handleAdminCancelOrder() {
        if (!confirm("Вы действительно хотите перевести данный заказ в статус 'Отмена'?")) return;
        
        const cancelBtn = document.getElementById("admin-cancel-btn");
        cancelBtn.disabled = true;
        cancelBtn.innerText = "Отменяем...";

        if (typeof google !== 'undefined' && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler(function(res) {
              cancelBtn.disabled = false;
              cancelBtn.innerText = "Отменить заказ";
              if (res.success) {
                alert("Заказ успешно отменен!");
                closeOrderModal();
                loadAdminData();
              } else {
                alert("Ошибка: " + res.message);
              }
            })
            .markOrderCanceled(selectedOrder.id);
        } else {
          // Симуляция
          setTimeout(function() {
            cancelBtn.disabled = false;
            cancelBtn.innerText = "Отменить заказ";
            const idx = allOrders.findIndex(o => o.id === selectedOrder.id);
            if (idx !== -1) {
              allOrders[idx].status = "Отмена";
            }
            alert("Заказ переведен в статус 'Отмена' в симуляторе!");
            closeOrderModal();
            renderAdminOrders();
            calculateFinance();
          }, 400);
        }
      }
    </script>
  </body>
</html>
`;
