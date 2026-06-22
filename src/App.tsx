import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { 
  Sparkles, 
  Users, 
  PlusCircle, 
  Trash2, 
  CheckCircle, 
  Archive, 
  TrendingUp, 
  Smartphone, 
  Database, 
  Code, 
  Copy, 
  Check, 
  Eye, 
  LogOut, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Percent, 
  Camera, 
  UserCheck, 
  ChevronRight, 
  Lock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  RefreshCw,
  Plus,
  HelpCircle
} from 'lucide-react';
import { CODE_GS_CONTENT, INDEX_HTML_CONTENT, GOOGLE_SHEETS_LAYOUT } from './gas_source';

// Types
import { Order, OrderStatus, Worker, UserRole } from './types';

// Default mock values used initially
const DEFAULT_WORKERS: Worker[] = [
  { id: "USR_WRK_1", name: "Иван Мойщик", phone: "+79991112233", role: "worker", rate: 50, dateCreated: "2026-06-22" },
  { id: "USR_WRK_2", name: "Сергей Мойщик", phone: "+79994445566", role: "worker", rate: 45, dateCreated: "2026-06-22" }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD_1001",
    clientName: "Алексей Смирнов",
    clientPhone: "+79001234567",
    address: "ул. Ленина, д. 15, кв. 42",
    datetime: "2026-06-23T10:00:00",
    windows: 5,
    price: 5000,
    status: "Новый",
    workerId: "USR_WRK_1",
    workerName: "Иван Мойщик",
    comment: "",
    dateCreated: "2026-06-22",
  },
  {
    id: "ORD_1002",
    clientName: "Мария Иванова",
    clientPhone: "+79119876543",
    address: "пр. Просвещения, д. 28, оф. 5",
    datetime: "2026-06-22T14:00:00",
    windows: 12,
    price: 12000,
    status: "Выполнено",
    workerId: "USR_WRK_2",
    workerName: "Сергей Мойщик",
    comment: "Все отлично отмыли, использовали специальное средство от разводов. Клиент доволен!",
    dateCreated: "2026-06-21",
    // placeholder mockup before/after images
    photoBefore: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=400",
    photoAfter: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ORD_1003",
    clientName: "Дмитрий Петров",
    clientPhone: "+79503332211",
    address: "пос. Солнечное, ул. Дачная, д. 4",
    datetime: "2026-06-24T12:00:00",
    windows: 8,
    price: 9000,
    status: "Новый",
    workerId: "USR_WRK_2",
    workerName: "Сергей Мойщик",
    comment: "",
    dateCreated: "2026-06-22"
  }
];

export default function App() {
  // Navigation
  const [activeMainTab, setActiveMainTab] = useState<'simulation' | 'export' | 'guide'>('simulation');
  const [activeSimView, setActiveSimView] = useState<'admin' | 'worker'>('admin');
  const [activeWorkerSubTab, setActiveWorkerSubTab] = useState<'active' | 'archive'>('active');
  
  // Simulation Data (saved to localStorage for high-fidelity persistence)
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('sim_workers');
    return saved ? JSON.parse(saved) : DEFAULT_WORKERS;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('sim_orders');
    return saved ? JSON.parse(saved) : DEFAULT_ORDERS;
  });

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem('sim_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('sim_orders', JSON.stringify(orders));
  }, [orders]);

  // Auth Simulation
  const [adminPhone, setAdminPhone] = useState('+79998887766');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('USR_WRK_1');
  const [isLoggedAsAdmin, setIsLoggedAsAdmin] = useState(true);
  const [isLoggedAsWorker, setIsLoggedAsWorker] = useState(false);

  // Filters
  const [orderFilterStatus, setOrderFilterStatus] = useState<'All' | OrderStatus | 'Active'>('All');

  // Input States: Worker account creation
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('12345');
  const [newWorkerRate, setNewWorkerRate] = useState(50);

  // Input States: Order creation
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newOrderAddress, setNewOrderAddress] = useState('');
  const [newOrderDatetime, setNewOrderDatetime] = useState('');
  const [newOrderWindows, setNewOrderWindows] = useState(4);
  const [newOrderPrice, setNewOrderPrice] = useState(4500);
  const [assigneeId, setAssigneeId] = useState('');

  // Selected Order Modal in Simulation
  const [selectedSimOrder, setSelectedSimOrder] = useState<Order | null>(null);
  const [workerCommentInput, setWorkerCommentInput] = useState('');
  const [workerTempPhotoBefore, setWorkerTempPhotoBefore] = useState<string>('');
  const [workerTempPhotoAfter, setWorkerTempPhotoAfter] = useState<string>('');

  // Copy Feedback state
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Image Helper: convert file to Base64 mock representation
  const handlePhotoUploadLocal = (e: ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          if (type === 'before') {
            setWorkerTempPhotoBefore(event.target.result as string);
          } else {
            setWorkerTempPhotoAfter(event.target.result as string);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset simulation to factory state
  const resetSimulationData = () => {
    if (window.confirm("Вы уверены, что хотите сбросить все заказы и мойщиков до стандартных настроек?")) {
      setWorkers(DEFAULT_WORKERS);
      setOrders(DEFAULT_ORDERS);
      setSelectedSimOrder(null);
      alert("Данные симуляции сброшены!");
    }
  };

  // copy to clipboard helper
  const handleCopyToClipboard = (text: string, flagSetter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    flagSetter(true);
    setTimeout(() => flagSetter(false), 2000);
  };

  // Worker Action inside simulation: Update Status, Comment, Photo
  const handleWorkerReportSubmitSim = () => {
    if (!selectedSimOrder) return;
    
    const updatedOrders = orders.map(ord => {
      if (ord.id === selectedSimOrder.id) {
        // Calculate worker commission and admin profit based on worker's actual percentage rate
        const worker = workers.find(w => w.id === ord.workerId);
        const rate = worker ? worker.rate : 50;
        const wPay = Math.round(ord.price * (rate / 100));
        const aProfit = ord.price - wPay;

        return {
          ...ord,
          status: selectedSimOrder.status, // already temporarily mutated
          comment: workerCommentInput,
          photoBefore: workerTempPhotoBefore || ord.photoBefore,
          photoAfter: workerTempPhotoAfter || ord.photoAfter,
          workerPay: wPay,
          adminProfit: aProfit
        };
      }
      return ord;
    });

    setOrders(updatedOrders);
    setSelectedSimOrder(null);
    alert("Данные сохранены! Статус обновлён в симуляторе.");
  };

  // Admin Action: Add Worker
  const handleAddWorkerSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newWorkerName || !newWorkerPhone) {
      alert("Пожалуйста, заполните Имя и Номер Телефона!");
      return;
    }

    // Phone duplicate check
    if (workers.some(w => w.phone.replace(/\D/g, '') === newWorkerPhone.replace(/\D/g, ''))) {
      alert("Пользователь с таким номером телефона уже существует!");
      return;
    }

    const newW: Worker = {
      id: "WRK_" + Math.floor(100000 + Math.random() * 900000),
      name: newWorkerName,
      phone: newWorkerPhone,
      role: "worker",
      rate: Number(newWorkerRate),
      dateCreated: new Date().toISOString().substring(0, 10)
    };

    setWorkers([...workers, newW]);
    setNewWorkerName('');
    setNewWorkerPhone('');
    alert(`Аккаунт мойщика "${newWorkerName}" успешно зарегистрирован!`);
  };

  // Admin Action: Create Order
  const handleCreateOrderSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone || !newOrderAddress || !newOrderDatetime) {
      alert("Пожалуйста, заполните необходимые поля заказа!");
      return;
    }

    const workerParam = assigneeId || (workers[0] ? `${workers[0].id}|${workers[0].name}|${workers[0].rate}` : '');
    if (!workerParam) {
      alert("Нет доступных мойщиков. Создайте сначала аккаунт мойщика!");
      return;
    }

    const [wId, wName, wRateStr] = workerParam.split('|');
    const wRate = Number(wRateStr);
    
    const calculatedWorkerPay = Math.round(Number(newOrderPrice) * (wRate / 100));
    const calculatedAdminProfit = Number(newOrderPrice) - calculatedWorkerPay;

    const newOrd: Order = {
      id: "ORD_" + Math.floor(1000 + Math.random() * 9000),
      clientName: newClientName,
      clientPhone: newClientPhone,
      address: newOrderAddress,
      datetime: newOrderDatetime,
      windows: Number(newOrderWindows),
      price: Number(newOrderPrice),
      status: "Новый",
      workerId: wId,
      workerName: wName,
      comment: "",
      photoBefore: "",
      photoAfter: "",
      dateCreated: new Date().toISOString().substring(0, 10),
    };

    setOrders([newOrd, ...orders]);
    setNewClientName('');
    setNewClientPhone('');
    setNewOrderAddress('');
    alert(`Заказ ${newOrd.id} успешно создан и назначен на "${wName}"!`);
  };

  // Admin Cancel Order
  const handleAdminCancelOrderSim = (id: string) => {
    if (window.confirm(`Вы действительно хотите перевести заказ ${id} в статус 'Отмена'?`)) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'Отмена' as const } : o));
      setSelectedSimOrder(null);
    }
  };

  // Financial Stats calculation
  const totalTurnover = orders
    .filter(o => o.status === 'Выполнено')
    .reduce((sum, o) => sum + o.price, 0);

  const totalWorkersPay = orders
    .filter(o => o.status === 'Выполнено')
    .reduce((sum, o) => {
      const worker = workers.find(w => w.id === o.workerId);
      const rate = worker ? worker.rate : 50;
      return sum + Math.round(o.price * (rate / 100));
    }, 0);

  const totalAdminProfit = totalTurnover - totalWorkersPay;

  // Render Admin active/archived orders list logic
  const getFilteredOrders = () => {
    return orders.filter(o => {
      if (orderFilterStatus === 'All') return true;
      if (orderFilterStatus === 'Active') return ['Новый', 'Принял', 'Выехал', 'На месте'].includes(o.status);
      return o.status === orderFilterStatus;
    });
  };

  // Worker specific filtered lists
  const currentWorker = workers.find(w => w.id === selectedWorkerId) || workers[0];
  const workerActiveOrders = orders.filter(o => o.workerId === currentWorker?.id && o.status !== 'Выполнено' && o.status !== 'Отмена');
  const workerArchivedOrders = orders.filter(o => o.workerId === currentWorker?.id && (o.status === 'Выполнено' || o.status === 'Отмена'));
  const workerEarnings = orders
    .filter(o => o.workerId === currentWorker?.id && o.status === 'Выполнено')
    .reduce((sum, o) => {
      const rate = currentWorker ? currentWorker.rate : 50;
      return sum + Math.round(o.price * (rate / 100));
    }, 0);

  return (
    <div id="crm-desktop-wrapper" class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* GLOBAL BANNER HEADER */}
      <section class="bg-indigo-900 border-b border-indigo-800 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="bg-sky-400 text-slate-950 font-bold px-2 py-0.5 rounded text-xs">CRM ГОТОВА</span>
            <div class="text-xs text-indigo-200">Google Sheets + Google Apps Script Web App Generator</div>
          </div>
          <h1 class="text-2xl font-black tracking-tight text-white mt-1">CRM Мойка Окон — Управление и Экспорт</h1>
        </div>
        <div class="flex gap-2">
          <button 
            onClick={() => setActiveMainTab('simulation')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeMainTab === 'simulation' ? 'bg-sky-400 text-slate-950 font-black shadow-lg scale-105' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
          >
            <Smartphone className="w-4 h-4" /> Игры-Симулятор (Интерфейс)
          </button>
          <button 
            onClick={() => setActiveMainTab('export')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeMainTab === 'export' ? 'bg-sky-400 text-slate-950 font-black shadow-lg scale-105' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
          >
            <Code className="w-4 h-4" /> Код для Google Web App
          </button>
          <button 
            onClick={() => setActiveMainTab('guide')}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeMainTab === 'guide' ? 'bg-sky-400 text-slate-950 font-black shadow-lg scale-105' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
          >
            <HelpCircle className="w-4 h-4" /> Инструкция по запуску
          </button>
        </div>
      </section>

      {/* CORE WEB INTERFACE */}
      <main class="flex-1 w-full flex flex-col">
        
        {/* TAB 1: CRM INTERACTIVE PLAYGROUND / SIMULATION */}
        {activeMainTab === 'simulation' && (
          <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
            
            {/* COLUMN LEFT: CONTROLS & SELECTION */}
            <div class="lg:col-span-4 space-y-6 flex flex-col justify-between">
              
              <div class="space-y-6">
                {/* Intro Card */}
                <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
                  <div class="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl"></div>
                  <div class="flex items-center gap-2 mb-2 text-sky-400">
                    <Sparkles className="w-5 h-5" />
                    <span class="text-xs uppercase font-extrabold tracking-wider">Интерактивный Симулятор</span>
                  </div>
                  <h3 class="text-base font-bold text-white mb-1">Протестируйте логику CRM до деплоя</h3>
                  <p class="text-xs text-slate-400 leading-relaxed">
                    Данный интерфейс полностью симулирует поведение работников и администратора. 
                    Опробуйте статус-трекинг, расчеты финансов и загрузку отчетов мойщиков. Все изменения синхронизируются в локальное хранилище.
                  </p>
                </div>

                {/* Simulated Persona Switcher */}
                <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h4 class="text-xs font-bold uppercase text-slate-400 tracking-wider">Выберите роль для тестирования:</h4>
                  
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { setActiveSimView('admin'); setIsLoggedAsAdmin(true); setIsLoggedAsWorker(false); }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${activeSimView === 'admin' ? 'bg-sky-400/10 border-sky-400 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <UserCheck className="w-6 h-6 mb-1" />
                      <span class="text-xs font-bold">1. Панель Админа</span>
                    </button>
                    
                    <button 
                      onClick={() => { setActiveSimView('worker'); setIsLoggedAsWorker(true); setIsLoggedAsAdmin(false); }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${activeSimView === 'worker' ? 'bg-indigo-400/10 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      <Smartphone className="w-6 h-6 mb-1" />
                      <span class="text-xs font-bold">2. Вид Мойщика</span>
                    </button>
                  </div>

                  {/* Worker choice wrapper */}
                  {activeSimView === 'worker' && (
                    <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mt-2">
                      <label class="block text-[10px] uppercase text-slate-500 font-bold">Выберите исполнителя:</label>
                      <select 
                        value={selectedWorkerId}
                        onChange={(e) => setSelectedWorkerId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      >
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>{w.name} ({w.rate}%)</option>
                        ))}
                      </select>
                      <p class="text-[9px] text-slate-500 leading-normal">
                        Мойщик заходит со своего смартфона и видит только свои заказы, меняет статус, прикрепляет фото "До/После".
                      </p>
                    </div>
                  )}

                  {activeSimView === 'admin' && (
                    <div class="bg-indigo-950/20 p-3 rounded-xl border border-indigo-900/30 text-xs text-indigo-200">
                      <strong>Права администратора активны:</strong> Вы можете создавать заказы, регистрировать мойщиков, смотреть финансовые отчеты и архив.
                    </div>
                  )}
                </div>

                {/* Reset Simulator Button */}
                <button 
                  onClick={resetSimulationData}
                  className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-white py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Сбросить данные симулятора
                </button>
              </div>

              {/* Developer notice */}
              <div class="bg-slate-950 p-4 rounded-xl border border-slate-900 text-[10px] text-slate-500 space-y-1">
                <p>⚡ <strong>Технологический стек Apps Script:</strong></p>
                <p>• Google Sheets — хранит Users и Orders</p>
                <p>• Google Apps Script — принимает AJAX запросы от формы</p>
                <p>• Google Drive — принимает фотографии ДО/ПОСЛЕ прямо со смартфона мойщика в папку "CRM_Window_Cleaning_Photos" и отдает ссылку</p>
              </div>

            </div>

            {/* COLUMN RIGHT: THE INTERACTIVE SIMULATING CORE DEPLOYED PREVIEW FRAME */}
            <div class="lg:col-span-8 flex flex-col">
              
              <div class="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col flex-1">
                
                {/* TOP HEADER PREVIEW CONTROL */}
                <div class="bg-slate-900 px-6 py-3 border-b border-slate-800 flex justify-between items-center text-xs">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="font-extrabold text-slate-300 tracking-wide uppercase">СИМУЛЯТОР: {activeSimView === 'admin' ? "ГЛАВНАЯ АДМИНА (Десктоп)" : "МОБИЛЬНЫЙ ТЕЛЕФОН МОЙЩИКА"}</span>
                  </div>
                  <span class="text-slate-500">Устройство: {activeSimView === 'admin' ? "Computer" : "iPhone SE / Android - Mobile Frame"}</span>
                </div>

                {/* THE MOCK ENVIRONMENT SCREEN */}
                <div class="bg-slate-950 p-4 md:p-6 flex justify-center items-center flex-1 overflow-y-auto">
                  
                  {/* PHONE PREVIEW FRAME IF WORKER, OR NICE CHASSIS IF ADMIN */}
                  <div class={`w-full bg-slate-100 text-slate-900 flex flex-col shadow-2xl relative ${activeSimView === 'worker' ? 'max-w-sm rounded-[40px] border-[12px] border-slate-800 h-[720px] overflow-hidden' : 'max-w-4xl rounded-2xl min-h-[560px] h-full'}`}>
                    
                    {/* Phone Camera notch inside worker frame */}
                    {activeSimView === 'worker' && (
                      <div class="absolute top-0 inset-x-0 h-4 bg-slate-800 rounded-b-xl z-50 flex items-center justify-center">
                        <div class="w-16 h-3 bg-black rounded-b-md"></div>
                      </div>
                    )}

                    {/* PHONE HEADER INDICATOR */}
                    {activeSimView === 'worker' && <div class="h-6 bg-slate-800"></div>}

                    {/* APPBAR SIMULATED */}
                    <div class="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                      <div class="flex items-center gap-2">
                        <div class="bg-sky-500 text-slate-900 p-1.5 rounded-lg flex items-center justify-center">
                          <Sparkles class="w-4 h-4" />
                        </div>
                        <div>
                          <h2 class="font-bold text-xs tracking-wide uppercase leading-none">CRM Чистые Окна</h2>
                          <span class="text-[9px] text-slate-400">
                            {activeSimView === 'admin' ? 'Администратор системы' : `Исполнитель: ${currentWorker?.name || "Мойщик"}`}
                          </span>
                        </div>
                      </div>
                      <div class="text-xs font-semibold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-900/40">
                        {activeSimView === 'admin' ? 'Режим: Admin' : 'Режим: Worker'}
                      </div>
                    </div>

                    {/* REAL-TIME WORKER BOARD DISPLAY */}
                    {activeSimView === 'worker' ? (
                      <div class="flex-1 flex flex-col overflow-y-auto bg-slate-50 relative">
                        
                        {/* Worker Balance Widget */}
                        <div class="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-4 shadow-md">
                          <div class="flex justify-between items-center mb-1">
                            <span class="text-[10px] text-indigo-300 uppercase font-extrabold tracking-wider">Мой личный заработок:</span>
                            <span class="text-[9px] bg-sky-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">{currentWorker?.rate || 50}% ставка</span>
                          </div>
                          <div class="text-2xl font-black">{workerEarnings.toLocaleString('ru-RU')} ₽</div>
                          <p class="text-[9px] text-indigo-300 mt-1">
                            Сумма за завершенные заказы в архиве.
                          </p>
                        </div>

                        {/* Top tabs */}
                        <div class="bg-white border-b flex p-1 sticky top-0 z-10 shadow-xs">
                          <button 
                            onClick={() => setActiveWorkerSubTab('active')}
                            className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition-all ${activeWorkerSubTab === 'active' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-700'}`}
                          >
                            Активные ({workerActiveOrders.length})
                          </button>
                          <button 
                            onClick={() => setActiveWorkerSubTab('archive')}
                            className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition-all ${activeWorkerSubTab === 'archive' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-700'}`}
                          >
                            Мой Архив ({workerArchivedOrders.length})
                          </button>
                        </div>

                        {/* Content Scroll area */}
                        <div class="p-3 space-y-3 flex-1 overflow-y-auto">
                          
                          {/* ACTIVE ORDERS */}
                          {activeWorkerSubTab === 'active' && (
                            <div class="space-y-3">
                              {workerActiveOrders.length === 0 ? (
                                <div class="text-center py-12 text-slate-400">
                                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                  <p class="text-xs font-semibold">У вас пока нет активных заказов.</p>
                                  <p class="text-[10px] text-slate-400">Ожидайте назначения от администратора.</p>
                                </div>
                              ) : (
                                workerActiveOrders.map(o => (
                                  <div 
                                    key={o.id}
                                    onClick={() => {
                                      setSelectedSimOrder(o);
                                      setWorkerCommentInput(o.comment || '');
                                      setWorkerTempPhotoBefore(o.photoBefore || '');
                                      setWorkerTempPhotoAfter(o.photoAfter || '');
                                    }}
                                    className="bg-white border hover:border-sky-300 hover:shadow transition-all rounded-xl p-3.5 shadow-xs cursor-pointer relative"
                                  >
                                    <div class="flex justify-between items-start mb-2">
                                      <span class="text-[9px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-extrabold">{o.id}</span>
                                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                                        o.status === 'Новый' ? 'bg-blue-100 text-blue-700' :
                                        o.status === 'Принял' ? 'bg-yellow-105 text-yellow-800' :
                                        o.status === 'Выехал' || o.status === 'На месте' ? 'bg-orange-100 text-orange-800' :
                                        o.status === 'Выполнено' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                                      }`}>{o.status}</span>
                                    </div>

                                    <h4 class="font-extrabold text-xs text-slate-900 mb-1">{o.clientName}</h4>
                                    
                                    <div class="text-[11px] text-slate-600 space-y-1 mb-2.5">
                                      <div class="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {o.address}</div>
                                      <div class="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400 shrink-0" /> {o.datetime.split('T')[0]} ({o.datetime.split('T')[1]?.substring(0, 5)})</div>
                                    </div>

                                    <div class="border-t pt-2 flex justify-between items-center text-xs">
                                      <span class="text-slate-400 text-[9px] uppercase font-bold">Оплата чистыми:</span>
                                      <span class="font-extrabold text-indigo-700">{o.workerPay ? o.workerPay : Math.round(o.price * ((currentWorker?.rate || 50) / 100))} ₽</span>
                                    </div>
                                    
                                    <div class="absolute right-3 top-10 text-slate-400 blink">
                                      <ChevronRight className="w-4 h-4" />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* ARCHIVED ORDERS */}
                          {activeWorkerSubTab === 'archive' && (
                            <div class="space-y-3">
                              {workerArchivedOrders.length === 0 ? (
                                <div class="text-center py-12 text-slate-400">
                                  <Archive className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                  <p class="text-xs font-semibold">Ваш архив пуст.</p>
                                  <p class="text-[10px]">Здесь будут ваши выполненные заказы.</p>
                                </div>
                              ) : (
                                workerArchivedOrders.map(o => (
                                  <div 
                                    key={o.id}
                                    onClick={() => {
                                      setSelectedSimOrder(o);
                                      setWorkerCommentInput(o.comment || '');
                                      setWorkerTempPhotoBefore(o.photoBefore || '');
                                      setWorkerTempPhotoAfter(o.photoAfter || '');
                                    }}
                                    className="bg-white border rounded-xl p-3 opacity-80 cursor-pointer"
                                  >
                                    <div class="flex justify-between items-start mb-1">
                                      <span class="text-[9px] font-mono font-bold text-slate-500">{o.id}</span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${o.status === 'Выполнено' ? 'bg-green-150 text-green-800' : 'bg-red-100 text-red-700'}`}>{o.status}</span>
                                    </div>
                                    <h4 class="font-bold text-xs text-slate-850">{o.clientName}</h4>
                                    <p class="text-[10px] text-slate-500">{o.address}</p>
                                    <div class="border-t pt-1.5 mt-2 flex justify-between items-center text-[11px]">
                                      <span class="text-slate-400 text-[9px]">Заработали:</span>
                                      <span class="font-bold text-emerald-700">{o.workerPay} ₽</span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                        </div>

                      </div>
                    ) : (
                      
                      /* REAL-TIME ADMIN BOARD DISPLAY (DESKTOP GRID) */
                      <div class="flex-1 flex flex-col bg-slate-50">
                        
                        {/* KPI STATS CARDS */}
                        <div class="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-100 border-b">
                          
                          <div class="bg-white p-3 rounded-xl border border-slate-200">
                            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Оборот Выполнено</span>
                            <span class="text-lg font-black text-slate-900">{totalTurnover.toLocaleString('ru-RU')} ₽</span>
                          </div>

                          <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                            <span class="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest block">Прибыль админа</span>
                            <span class="text-lg font-black text-emerald-900">{totalAdminProfit.toLocaleString('ru-RU')} ₽</span>
                          </div>

                          <div class="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                            <span class="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest block font-bold">Выплаты Мойщикам</span>
                            <span class="text-lg font-black text-indigo-900">{totalWorkersPay.toLocaleString('ru-RU')} ₽</span>
                          </div>

                          <div class="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-center">
                            <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">База Заказов</span>
                            <span class="text-xs font-semibold text-slate-700">Всего: {orders.length} | Выполнено: {orders.filter(o=>o.status==='Выполнено').length}</span>
                          </div>

                        </div>

                        {/* WORK AREA GRID: CREATE VS VIEW */}
                        <div class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
                          
                          {/* COLUMN LEFT: VIEW & FILTER ORDERS */}
                          <div class="md:col-span-7 flex flex-col space-y-3">
                            <div class="flex justify-between items-center bg-white p-2 rounded-xl border">
                              <span class="text-xs font-bold text-slate-700">Фильтр:</span>
                              <div class="flex gap-1">
                                {(['All', 'Active', 'Выполнено', 'Отмена'] as const).map(f => (
                                  <button
                                    key={f}
                                    onClick={() => setOrderFilterStatus(f)}
                                    className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${orderFilterStatus === f ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800 bg-slate-100'}`}
                                  >
                                    {f === 'All' ? 'Все' : f === 'Active' ? 'В работе' : f}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div class="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                              {getFilteredOrders().length === 0 ? (
                                <div class="text-center py-8 bg-white border rounded-xl text-xs text-slate-400">Нет подходящих заказов.</div>
                              ) : (
                                getFilteredOrders().map(o => (
                                  <div 
                                    key={o.id}
                                    onClick={() => {
                                      setSelectedSimOrder(o);
                                      setWorkerCommentInput(o.comment || '');
                                      setWorkerTempPhotoBefore(o.photoBefore || '');
                                      setWorkerTempPhotoAfter(o.photoAfter || '');
                                    }}
                                    className="bg-white border rounded-xl p-3 shadow-xs hover:border-indigo-400 transition-all cursor-pointer flex justify-between items-center"
                                  >
                                    <div class="space-y-1">
                                      <div class="flex items-center gap-1.5">
                                        <span class="text-[9px] font-mono bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.2 rounded">{o.id}</span>
                                        <h5 class="font-extrabold text-xs text-slate-900">{o.clientName}</h5>
                                        <span class={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                          o.status === 'Новый' ? 'bg-blue-100 text-blue-700' :
                                          o.status === 'Принял' ? 'bg-yellow-105 text-yellow-800' :
                                          o.status === 'Выполнено' ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-600'
                                        }`}>{o.status}</span>
                                      </div>
                                      <p class="text-[10px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {o.address}</p>
                                      <div class="text-[9px] text-slate-400">Создан: {o.dateCreated} | Мойщик: <strong>{o.workerName}</strong></div>
                                    </div>
                                    <div class="text-right">
                                      <span class="text-xs font-black text-slate-900 block">{o.price.toLocaleString('ru-RU')} ₽</span>
                                      <span class="text-[9px] text-indigo-600 font-semibold">Мойщику: {o.workerPay || Math.round(o.price * 0.5)} ₽</span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* COLUMN RIGHT: ACTIONS (CREATE ORDER & CREATE WORKER) */}
                          <div class="md:col-span-5 space-y-4">
                            
                            {/* CREATE ORDER PANEL */}
                            <div class="bg-white p-3.5 rounded-xl border border-slate-200">
                              <h4 class="text-xs font-extrabold text-slate-800 uppercase mb-2 flex items-center gap-1.5"><PlusCircle className="w-4 h-4 text-sky-500" /> Создать Заказ</h4>
                              <form onSubmit={handleCreateOrderSubmit} class="space-y-2 text-xs">
                                <div>
                                  <input 
                                    type="text" 
                                    placeholder="ФИО Клиента" 
                                    value={newClientName} 
                                    onChange={(e)=>setNewClientName(e.target.value)} 
                                    required 
                                    class="w-full p-2 border rounded-lg bg-slate-50 focus:outline-none focus:bg-white"
                                  />
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                  <input 
                                    type="tel" 
                                    placeholder="Телефон клиента" 
                                    value={newClientPhone} 
                                    onChange={(e)=>setNewClientPhone(e.target.value)} 
                                    required 
                                    class="w-full p-2 border rounded-lg bg-slate-50 focus:outline-none focus:bg-white"
                                  />
                                  <input 
                                    type="datetime-local" 
                                    value={newOrderDatetime} 
                                    onChange={(e)=>setNewOrderDatetime(e.target.value)} 
                                    required 
                                    class="w-full p-2 border rounded-lg bg-slate-50 focus:outline-none focus:bg-white text-[10px]"
                                  />
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Адрес (ул, дом, кв)" 
                                  value={newOrderAddress} 
                                  onChange={(e)=>setNewOrderAddress(e.target.value)} 
                                  required 
                                  class="w-full p-2 border rounded-lg bg-slate-50 focus:outline-none"
                                />
                                <div class="grid grid-cols-2 gap-2">
                                  <input 
                                    type="number" 
                                    placeholder="Общая Сумма в ₽" 
                                    onChange={(e)=>setNewOrderPrice(Number(e.target.value))} 
                                    required 
                                    class="w-full p-2 border rounded-lg bg-slate-50 focus:outline-none"
                                  />
                                  <select 
                                    value={assigneeId} 
                                    onChange={(e)=>setAssigneeId(e.target.value)}
                                    required
                                    class="w-full p-2 border rounded-lg bg-white"
                                  >
                                    <option value="">Назначить мойщика</option>
                                    {workers.map(w => (
                                      <option key={w.id} value={`${w.id}|${w.name}|${w.rate}`}>{w.name} ({w.rate}%)</option>
                                    ))}
                                  </select>
                                </div>
                                <button type="submit" class="w-full bg-slate-900 text-white font-bold py-2 rounded-lg hover:bg-slate-800 transition-all text-[11px]">
                                  Создать и Назначить
                                </button>
                              </form>
                            </div>

                            {/* CREATE WORKER ACCOUNT PANEL */}
                            <div class="bg-white p-3.5 rounded-xl border border-slate-200">
                              <h4 class="text-xs font-extrabold text-slate-800 uppercase mb-2 flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" /> Создать Аккаунт Мойщика</h4>
                              <form onSubmit={handleAddWorkerSubmit} class="space-y-2 text-xs">
                                <div class="grid grid-cols-2 gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Имя Мойщика" 
                                    value={newWorkerName} 
                                    onChange={(e)=>setNewWorkerName(e.target.value)} 
                                    required 
                                    class="w-full p-2 border rounded-lg bg-slate-50 text-xs"
                                  />
                                  <input 
                                    type="tel" 
                                    placeholder="+79991112233" 
                                    value={newWorkerPhone} 
                                    onChange={(e)=>setNewWorkerPhone(e.target.value)} 
                                    required 
                                    class="w-full p-2 border rounded-lg bg-slate-50 text-xs"
                                  />
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Пароль для входа" 
                                    value={newWorkerPassword} 
                                    onChange={(e)=>setNewWorkerPassword(e.target.value)} 
                                    required 
                                    class="w-full p-2 border rounded-lg bg-slate-50 text-xs"
                                  />
                                  <div class="flex items-center gap-1 bg-slate-100 p-1.5 rounded-lg border">
                                    <span class="text-[9px] text-slate-500 font-bold">Ставка:</span>
                                    <input 
                                      type="number" 
                                      min="10" 
                                      max="90" 
                                      value={newWorkerRate} 
                                      onChange={(e)=>setNewWorkerRate(Number(e.target.value))} 
                                      required 
                                      class="w-8 font-bold bg-transparent text-center text-xs focus:outline-none"
                                    />
                                    <span class="text-[10px] text-slate-500">%</span>
                                  </div>
                                </div>
                                <button type="submit" class="w-full bg-slate-900 text-white font-bold py-2 rounded-lg hover:bg-slate-800 transition-all text-[11px]">
                                  + Зарегистрировать
                                </button>
                              </form>
                            </div>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: CODE EXPORTER - COPY CODE BLOCKS */}
        {activeMainTab === 'export' && (
          <div class="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
            
            <div class="bg-indigo-900/10 border border-indigo-800 p-5 rounded-2xl">
              <div class="flex gap-2 items-center text-sky-400 font-extrabold text-sm mb-1 uppercase tracking-wide">
                <Database className="w-5 h-5" /> 1. Структура Вашей Google Таблицы
              </div>
              <p class="text-xs text-slate-300 leading-relaxed mb-4">
                Перед тем, как запускать Apps Script, вам нужно создать Google Таблицу по следующему образцу. 
                Вам понадобятся ровно два листа с точными именами: <code>Users</code> и <code>Orders</code>.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {GOOGLE_SHEETS_LAYOUT.sheets.map(sh => (
                  <div key={sh.name} class="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="font-extrabold text-white text-sm bg-slate-800 px-2.5 py-1 rounded-lg">Лист: "{sh.name}"</span>
                      <span class="text-[10px] text-slate-500 tracking-wider font-mono">{sh.columns.length} колонок</span>
                    </div>
                    <p class="text-[11px] text-indigo-200">{sh.description}</p>
                    <div class="bg-slate-900 p-2.5 rounded-lg overflow-x-auto text-[10px] font-mono border text-sky-300 leading-normal">
                      <strong>КОЛОНКИ:</strong><br/>
                      {sh.columns.join(' | ')}
                    </div>
                    <div class="text-[9px] text-slate-400">
                      <strong>Пример первой строки Администратора (Лист "Users"):</strong><br/>
                      +79998887766 и пароль "admin" для первого входа.
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TWO LARGE CODE FILES */}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CODE.GS PORTION */}
              <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
                <div class="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                  <div class="flex items-center gap-1.5 text-xs text-white">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <strong>Code.gs</strong> (Backend)
                  </div>
                  <button 
                    onClick={() => handleCopyToClipboard(CODE_GS_CONTENT, setCopiedScript)}
                    className="bg-indigo-600 hover:bg-slate-850 text-white font-bold p-1.5 rounded-lg text-[10px] uppercase flex items-center gap-1 transition-all"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
                    {copiedScript ? "Скопировано!" : "Копировать"}
                  </button>
                </div>
                <div class="p-3 bg-slate-950 flex-1 overflow-auto">
                  <pre class="text-[10px] leading-relaxed font-mono text-slate-300 select-all whitespace-pre">
                    {CODE_GS_CONTENT}
                  </pre>
                </div>
              </div>

              {/* INDEX.HTML PORTION */}
              <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
                <div class="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                  <div class="flex items-center gap-1.5 text-xs text-white">
                    <Code className="w-4 h-4 text-indigo-400" />
                    <strong>Index.html</strong> (Frontend UI)
                  </div>
                  <button 
                    onClick={() => handleCopyToClipboard(INDEX_HTML_CONTENT, setCopiedHtml)}
                    className="bg-indigo-600 hover:bg-slate-850 text-white font-bold p-1.5 rounded-lg text-[10px] uppercase flex items-center gap-1 transition-all"
                  >
                    {copiedHtml ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
                    {copiedHtml ? "Скопировано!" : "Копировать"}
                  </button>
                </div>
                <div class="p-3 bg-slate-950 flex-1 overflow-auto">
                  <pre class="text-[10px] leading-relaxed font-mono text-slate-300 select-all whitespace-pre">
                    {INDEX_HTML_CONTENT}
                  </pre>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: STEP-BY-STEP Russian Instructions */}
        {activeMainTab === 'guide' && (
          <div class="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
            
            <div class="text-center mb-6">
              <h3 class="text-2xl font-black text-white">Инструкция по развертыванию CRM на Google Таблицах</h3>
              <p class="text-slate-400 text-sm mt-1">Весь проект будет работать абсолютно бесплатно на бесплатной инфраструктуре Google!</p>
            </div>

            <div class="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 text-sm text-slate-300 leading-normal">
              
              <div class="space-y-3">
                <h4 class="text-white font-extrabold text-base flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span class="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</span>
                  Шаг 1. Создаем Базу Данных в Google Sheets
                </h4>
                <p>
                  Откройте ваш Google Диск и создайте пустую <strong>Google Таблицу</strong>. Внизу страницы переименуйте листы и создайте необходимые колонки ровно по схеме на вкладке "Код":
                </p>
                <p class="bg-slate-950 p-3 rounded-lg text-xs leading-normal">
                  - <strong>Лист "Users"</strong> с первой строкой колонок: <code class="text-sky-300">ID | Имя | Телефон | Пароль | Роль | Ставка % | Дата Создания</code><br/>
                  - <strong>Лист "Orders"</strong> с первой строкой колонок: <code class="text-sky-300">ID | Имя Клиента | Телефон Клиента | Адрес | Дата | Время | Описание | Общая Цена | Сумма Мойщику | Прибыль Админа | ID Мойщика | Имя Мойщика | Статус | Фото До | Фото После | Комментарий | Дата Создания</code>
                </p>
                <div class="p-3 bg-indigo-550/10 rounded-xl border border-indigo-900/40 text-xs text-indigo-200">
                  ⚠️ <strong>ВАЖНО:</strong> Сразу же на листе <strong>Users</strong> во второй строчке добавьте первый аккаунт администратора вручную:<br/>
                  ID: <code class="font-bold underline text-white">USR_ADMIN_1</code> | Имя: <code class="font-bold underline text-white">Администратор</code> | Телефон: <code class="font-bold underline text-white">+79998887766</code> | Пароль: <code class="font-bold underline text-white">admin</code> | Роль: <code class="font-bold underline text-white">admin</code> | Ставка: <code class="font-bold underline text-white">100</code> | Дата: <code class="font-bold underline text-white">2026-06-22</code>.
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="text-white font-extrabold text-base flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span class="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</span>
                  Шаг 2. Размещаем код в Google Apps Script
                </h4>
                <p>
                  В вашей открытой Google Таблице перейдите в глобальное меню сверху: <strong>"Расширения" — "Apps Script" (Extensions - Apps Script)</strong>.
                </p>
                <p>
                  В открывшемся редакторе удалите весь стандартный код в файле <code class="text-sky-300">Код.gs</code> (Code.gs) и вставьте скопированный код <code class="text-sky-300">Code.gs</code> из вкладки <strong>"Код для Google Web App"</strong> на нашем сайте.
                </p>
                <p class="bg-slate-950 p-3 rounded-lg text-xs">
                  Найдите сверху файла строчку <code>const SPREADSHEET_ID = "ВСТАВЬТЕ_СЮДА_ID_ВАШЕЙ_ТАБЛИЦЫ";</code>. Сюда нужно вставить ID вашей Google Таблицы. Если ссылка вашей таблицы: <code>https://docs.google.com/spreadsheets/d/abc123xyz/edit</code>, то ID это <code>abc123xyz</code>.
                </p>
                <p>
                  Нажмите на плюс <strong>"+"</strong> рядом с надписью Файлы слева, выберите <strong>"HTML"</strong> и создайте файл с названием <strong>Index</strong> (Apps Script автоматически прикрепит расширение, получится <code>Index.html</code>). Скопируйте туда весь код из нашей вкладки <strong>Index.html</strong>. Нажмите иконку Сейва (дискету) сверху для сохранения всех файлов проекта.
                </p>
              </div>

              <div class="space-y-3">
                <h4 class="text-white font-extrabold text-base flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span class="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</span>
                  Шаг 3. Публикация в виде Web App (Мобильной Ссылки)
                </h4>
                <p>
                  Теперь делаем приложение доступным по внешней ссылке со смартфонов мойщиков и админа.
                </p>
                <p class="bg-slate-950 p-3.5 rounded-xl text-xs space-y-1.5 text-slate-200">
                  1. В редакторе Apps Script справа сверху нажмите синюю кнопку <strong>"Начать развертывание" (Deploy)</strong> -&gt; <strong>"Новое развертывание" (New Deployment)</strong>.<br/>
                  2. Нажмите на шестеренку выбора типа слева от заголовка и выберите <strong>"Веб-приложение" (Web App)</strong>.<br/>
                  3. В поле "Конфигурация веб-приложения" укажите:<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• Описание: <code>CRM Window Cleaners v1.0</code><br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• Запуск от имени (Execute as): <strong>Я (ваша почта Google)</strong><br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;• Кто имеет доступ (Who has access): <strong>Все (Anyone)</strong> (это позволит мойщикам логиниться со своих телефонов).<br/>
                  4. Нажмите синюю кнопку <strong>"Развернуть" (Deploy)</strong>.<br/>
                  5. Google попросит вас <strong>Предоставить доступы (Authorize access)</strong> таблице и Drive для записи файлов. Подтвердите доступы под своим гугл-аккаунтом. (Рекомендуется нажать "Дополнительные" (Advanced) -&gt; Перейти к проекту (Go to Safe/Unsafe)).
                </p>
                <p>
                  После окончания развертывания скопируйте предоставленную ссылку в поле <strong>"Веб-приложение" (Web app URL)</strong>. Она оканчивается на <code>/exec</code>. Это и есть ссылка на вашу CRM!
                </p>
              </div>

              <div class="space-y-3">
                <h4 class="text-white font-extrabold text-base flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span class="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</span>
                  Шаг 4. Как давать ссылку мойщикам и создавать им аккаунты
                </h4>
                <p>
                  <strong>Создание новых аккаунтов мойщиков:</strong>
                </p>
                <ul class="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Зайдите по полученной ссылке в CRM под данными первого админа (<code class="text-white">+79998887766</code> и пароль <code class="text-white">admin</code>).</li>
                  <li>Перейдите во вкладку <strong>"+ Создать"</strong>, переключитесь на <strong>"Новый Мойщик"</strong>.</li>
                  <li>Заполните его ФИО, номер телефона и пароль для входа (например, <code class="text-white">12345</code>), укажите ставку (например, 50%).</li>
                  <li>Нажмите <strong>"Создать аккаунт мойщика"</strong> — данные мгновенно сохранятся в базе ваших Google Таблиц на листе "Users"!</li>
                </ul>
                <p class="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/35 text-xs text-emerald-200">
                  📱 <strong>Как дать ссылку мойщикам:</strong> Просто отправьте им полученную веб-ссылку <code>/exec</code> в Telegram или WhatsApp. Они открывают ее на своем телефоне в браузере, авторизуются под своим телефоном/паролем и сразу видят назначенные на них заказы!
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* DETAILED ACTIVE MOCK ORDER FULL DETAILS MODAL IN SIMULATOR */}
      {selectedSimOrder && (
        <div class="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-800 flex flex-col max-h-[90vh]">
            
            {/* Header info */}
            <div class="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <div>
                <span class="text-[10px] font-bold text-slate-400">Детали по заказу:</span>
                <h4 class="text-sm font-extrabold">{selectedSimOrder.id}</h4>
              </div>
              <button 
                onClick={() => setSelectedSimOrder(null)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                id="close-sim-modal"
              >
                ✕
              </button>
            </div>

            {/* Scrollable details */}
            <div class="p-6 overflow-y-auto space-y-4">
              
              <div class="border-b pb-3 space-y-1">
                <span class="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wide">Заказчик & Адрес</span>
                <h3 class="text-lg font-black">{selectedSimOrder.clientName}</h3>
                <p class="text-xs text-slate-500 font-semibold">{selectedSimOrder.clientPhone}</p>
                <div class="flex items-center gap-1.5 text-xs text-slate-700 mt-2 bg-slate-100 p-2.5 rounded-lg">
                  <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{selectedSimOrder.address}</span>
                </div>
              </div>

              {/* Order fields: Date & Price */}
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span class="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Дата & Время:</span>
                  <div class="font-extrabold text-slate-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-sky-500" /> {selectedSimOrder.datetime.split('T')[0]} ({selectedSimOrder.datetime.split('T')[1]?.substring(0, 5)})</div>
                </div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span class="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Стоимость Окон:</span>
                  <div class="font-extrabold text-slate-950 text-sm">{selectedSimOrder.price.toLocaleString('ru-RU')} ₽</div>
                </div>
              </div>

              {/* Status workflow view */}
              <div class="space-y-1.5">
                <span class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Текущий статус заказа:</span>
                <div class="grid grid-cols-3 gap-1.5 text-center text-xs">
                  {['Новый', 'Принял', 'Выехал', 'На месте', 'Выполнено', 'Отмена'].map(st => {
                    const isCurrent = selectedSimOrder.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => {
                          // Allow simulator status changing
                          setSelectedSimOrder({ ...selectedSimOrder, status: st as any });
                        }}
                        className={`p-2 font-bold rounded-xl border transition-all ${isCurrent ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        id={`status-btn-${st}`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comments */}
              <div class="space-y-1">
                <span class="text-[10px] text-slate-400 font-extrabold uppercase mb-1 block">Комментарий Исполнителя:</span>
                <textarea
                  value={workerCommentInput}
                  onChange={(e) => setWorkerCommentInput(e.target.value)}
                  placeholder="Оставьте информацию для администратора..."
                  className="w-full text-xs p-3 border rounded-xl bg-slate-50 focus:outline-none focus:bg-white text-slate-800"
                  id="worker-comment-box"
                />
              </div>

              {/* PHOTO UPLOADS MOCK */}
              <div class="space-y-2">
                <span class="text-[10px] text-slate-400 font-extrabold uppercase mb-1 block">Фотоотчёт (ДО и ПОСЛЕ):</span>
                
                <div class="grid grid-cols-2 gap-3 text-xs">
                  
                  {/* Photo Before */}
                  <div class="space-y-1.5">
                    <span class="text-[10px] text-slate-500 font-bold block">Фото ДО:</span>
                    <div class="relative bg-slate-100 border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 min-h-[110px] overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handlePhotoUploadLocal(e, 'before')}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      {workerTempPhotoBefore ? (
                        <img src={workerTempPhotoBefore} class="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div class="text-slate-400 text-center">
                          <Camera className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                          <span class="text-[9px] font-bold">Выбрать фото ДО</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photo After */}
                  <div class="space-y-1.5">
                    <span class="text-[10px] text-slate-500 font-bold block">Фото ПОСЛЕ:</span>
                    <div class="relative bg-slate-100 border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 min-h-[110px] overflow-hidden">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handlePhotoUploadLocal(e, 'after')}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      {workerTempPhotoAfter ? (
                        <img src={workerTempPhotoAfter} class="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div class="text-slate-400 text-center">
                          <Camera className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                          <span class="text-[9px] font-bold">Выбрать фото ПОСЛЕ</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div class="bg-slate-100 p-4 border-t flex justify-between gap-3 shrink-0">
              {isLoggedAsAdmin ? (
                <>
                  <button 
                    onClick={() => handleAdminCancelOrderSim(selectedSimOrder.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-650 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-200"
                    id="admin-cancel-btn-inside"
                  >
                    Отменить Заказ
                  </button>
                  <button 
                    onClick={() => {
                      // Apply changes from admin modal (e.g. state comments/photos)
                      const updated = orders.map(o => o.id === selectedSimOrder.id ? { 
                        ...o, 
                        status: selectedSimOrder.status, 
                        comment: workerCommentInput, 
                        photoBefore: workerTempPhotoBefore, 
                        photoAfter: workerTempPhotoAfter 
                      } : o);
                      setOrders(updated);
                      setSelectedSimOrder(null);
                      alert("Изменения заказа сохранены!");
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex-1"
                    id="admin-save-change-btn"
                  >
                    Сохранить изменения
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleWorkerReportSubmitSim}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-xs font-extrabold transition-all flex-1"
                  id="worker-report-submit-sim-btn"
                >
                  Отправить отчет по статусу "{selectedSimOrder.status}"
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* FOOTER COYPRIGHT */}
      <footer class="bg-slate-950 px-6 py-4 border-t border-slate-900 border-dashed text-center text-xs text-slate-500 mt-auto flex flex-col md:flex-row justify-between items-center gap-3">
        <p>© 2026 Мобильная CRM для Мойки Окон с экспортом кода в Google Apps Script.</p>
        <p class="text-slate-400">Сгенерировано в AI Studio • Абсолютно бесплатно и без серверов!</p>
      </footer>

    </div>
  );
}
