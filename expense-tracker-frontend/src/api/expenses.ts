import api from './client';

export interface Expense {
  id: number;
  title: string;
  amount: string; // decimal trả về dạng string từ Postgres
  category: string;
  date: string; // YYYY-MM-DD
  note: string | null;
  paymentMethod: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResponse {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  paymentMethod?: string;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  total: number;
}

export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'housing',
  'entertainment',
  'health',
  'education',
  'shopping',
  'other',
] as const;

export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer'] as const;

export const expenseApi = {
  list: (params?: {
    category?: string;
    month?: string;
    page?: number;
    limit?: number;
  }) => api.get<ExpenseListResponse>('/expenses', { params }).then((r) => r.data),

  get: (id: number) => api.get<Expense>(`/expenses/${id}`).then((r) => r.data),

  create: (data: ExpenseInput) =>
    api.post<Expense>('/expenses', data).then((r) => r.data),

  update: (id: number, data: Partial<ExpenseInput>) =>
    api.patch<Expense>(`/expenses/${id}`, data).then((r) => r.data),

  remove: (id: number) => api.delete(`/expenses/${id}`),

  summary: (year: number) =>
    api.get<MonthlySummary[]>('/expenses/summary', {
      params: { year },
    }).then((r) => r.data),
};
