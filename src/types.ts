export type UserRole = 'admin' | 'worker';

export interface Worker {
  id: string;
  name: string;
  phone: string;
  password?: string; // Opt for security or matching
  role: UserRole;
  rate: number; // Commission percentage (e.g., 50)
  dateCreated: string;
}

export type OrderStatus = 'Новый' | 'Принял' | 'Выехал' | 'На месте' | 'Выполнено' | 'Отмена';

export interface Order {
  id: string;
  clientName: string;
  clientPhone: string;
  address: string;
  datetime: string;
  windows: number;
  price: number;
  status: OrderStatus;
  workerId: string; // "unassigned" if none
  workerName: string; // "Не назначен" if none
  comment: string;
  photoBefore?: string;
  photoAfter?: string;
  dateCreated: string;
}

export interface Session {
  isLoggedIn: boolean;
  userId: string;
  userName: string;
  userPhone: string;
  userRole: UserRole;
  userRate: number;
}
