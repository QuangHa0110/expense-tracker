import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  expenseApi,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from '../api/expenses';
import type { Expense, TransactionType } from '../api/expenses';
import { Alert } from '../components/Alert';
import { ExpenseChart } from '../components/ExpenseChart';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import {
  CATEGORY_LABELS,
  PAYMENT_LABELS,
  PAYMENT_ICONS,
  catIcon,
  catChip,
  typeLabel,
} from '../constants/categories';

type TypeFilter = 'all' | TransactionType;

interface FormState {
  type: TransactionType;
  title: string;
  amount: string;
  category: string;
  date: string;
  note: string;
  paymentMethod: string;
}

const emptyForm: FormState = {
  type: 'expense',
  title: '',
  amount: '',
  category: 'food',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  paymentMethod: 'cash',
};

// Đếm số từ 0 lên value khi value đổi (hiệu ứng "số nhảy lên")
function useCountUp(value: number, duration = 600): number {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      prevRef.current = to;
    };
  }, [value, duration]);

  return display;
}

export function DashboardPage() {
  const { user, logout } = useAuth();

  // Danh sách + filter
  const [items, setItems] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7), // YYYY-MM mặc định = tháng hiện tại
  );

  // Form (dùng cho cả tạo mới và sửa)
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({});
  const [showForm, setShowForm] = useState(false);

  // Trạng thái
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Tab hiện tại: 'overview' (số liệu + biểu đồ) | 'transactions' (danh sách)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');

  const [summary, setSummary] = useState<
    { month: string; income: number; expense: number }[]
  >([]);

  // Danh sách category cho form, phụ thuộc loại giao dịch đang chọn
  const formCategories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Tải danh sách khi filter thay đổi
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    expenseApi
      .list({
        type: typeFilter === 'all' ? undefined : typeFilter,
        category: categoryFilter || undefined,
        month: monthFilter || undefined,
        limit: 100,
      })
      .then((res) => {
        if (!cancelled) {
          setItems(res.items);
          setTotal(res.total);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Không tải được danh sách giao dịch');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [typeFilter, categoryFilter, monthFilter]);

  // Tải tổng thu/chi theo tháng trong năm hiện tại (cho thẻ tổng quan)
  useEffect(() => {
    const year = Number(monthFilter?.slice(0, 4) || new Date().getFullYear());
    expenseApi
      .summary(year)
      .then(setSummary)
      .catch(() => setSummary([]));
  }, [monthFilter]);

  // Số tiền hiển thị
  const fmt = (n: number | string) =>
    Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  const currentMonthData = summary.find((s) => s.month === monthFilter);
  const monthIncome = currentMonthData?.income ?? 0;
  const monthExpense = currentMonthData?.expense ?? 0;
  const monthBalance = monthIncome - monthExpense;
  const currentMonthLabel = monthFilter
    ? new Date(monthFilter + '-01').toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Số hiển thị có hiệu ứng đếm lên
  const animIncome = useCountUp(monthIncome);
  const animExpense = useCountUp(monthExpense);
  const animBalance = useCountUp(monthBalance);

  // Tỷ lệ chi so với thu (hero progress ring) — tránh chia 0
  const spendRatio =
    monthIncome > 0 ? Math.min(1, monthExpense / monthIncome) : monthExpense > 0 ? 1 : 0;

  // ---- Validate form (phía client) ----
  function validateForm(): boolean {
    const e: Partial<FormState> = {};
    if (!form.title.trim()) e.title = 'Tiêu đề không được để trống';
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount)) e.amount = 'Số tiền không hợp lệ';
    else if (amount <= 0) e.amount = 'Số tiền phải lớn hơn 0';
    if (!form.date) e.date = 'Ngày không được để trống';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setToast('');
    if (!validateForm()) return;

    const payload = {
      type: form.type,
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      note: form.note.trim() || undefined,
      paymentMethod: form.paymentMethod,
    };

    try {
      if (editingId) {
        await expenseApi.update(editingId, payload);
        setToast('Đã cập nhật giao dịch');
      } else {
        await expenseApi.create(payload);
        setToast('Đã thêm giao dịch mới');
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      // Sau khi thêm/sửa, chuyển sang tab Giao dịch để thấy kết quả ngay
      setActiveTab('transactions');
      // Tải lại danh sách
      const res = await expenseApi.list({
        type: typeFilter === 'all' ? undefined : typeFilter,
        category: categoryFilter || undefined,
        month: monthFilter || undefined,
        limit: 100,
      });
      setItems(res.items);
      setTotal(res.total);
      const year = Number(monthFilter.slice(0, 4));
      expenseApi.summary(year).then(setSummary).catch(() => {});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Lưu thất bại'));
    }
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      type: expense.type,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      note: expense.note ?? '',
      paymentMethod: expense.paymentMethod,
    });
    setFormErrors({});
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Bạn chắc chắn muốn xóa giao dịch này?')) return;
    try {
      await expenseApi.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setToast('Đã xóa giao dịch');
      // Cập nhật lại tổng thu/chi sau khi xóa
      const year = Number(monthFilter.slice(0, 4));
      expenseApi.summary(year).then(setSummary).catch(() => {});
    } catch {
      setError('Xóa thất bại');
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(false);
  }

  // Khi đổi loại giao dịch trong form: reset category về category mặc định của loại đó
  function changeFormType(type: TransactionType) {
    setForm((prev) => ({
      ...prev,
      type,
      category: type === 'income' ? 'salary' : 'food',
    }));
  }

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
      hasError
        ? 'border-red-300 bg-red-50/50 focus:ring-red-200'
        : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-200'
    }`;

  const typeBadge = (type: TransactionType) =>
    type === 'income'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700';

  // Vòng tròn tỷ lệ chi tiêu (SVG ring) trong hero card
  const RING_R = 34;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl border-b border-white/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-lg shadow-md shadow-indigo-300/40">
              💰
            </span>
            <div className="leading-tight">
              <h1 className="font-bold text-slate-800">Expense Tracker</h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Quản lý thu chi cá nhân
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:inline">
              Xin chào, <strong>{user?.name}</strong>
            </span>
            <button
              onClick={logout}
              className="text-sm text-rose-500 hover:text-rose-600 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Tab điều hướng */}
      <div className="bg-white/60 backdrop-blur border-b border-white/80">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {(
            [
              { key: 'overview', label: '📊 Tổng quan' },
              { key: 'transactions', label: '📋 Giao dịch' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
        {error && (
          <div className="flex justify-between items-start">
            <Alert type="error">{error}</Alert>
            <button
              onClick={() => setError('')}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* ===== Tab Tổng quan: hero + số liệu + biểu đồ ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero card tối gradient — kiểu Spendee/Copilot */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-300/40 animate-fade-in-up">
              {/* Vệt sáng trang trí */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/30 blur-3xl" />
              <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-pink-500/20 blur-3xl" />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Số dư chính */}
                <div>
                  <p className="text-sm text-indigo-200/90">
                    Số dư {currentMonthLabel}
                  </p>
                  <p
                    key={Math.round(animBalance)}
                    className={`text-3xl sm:text-4xl font-extrabold mt-1.5 animate-number-bump ${
                      monthBalance < 0 ? 'text-rose-300' : 'text-white'
                    }`}
                  >
                    {fmt(animBalance)}
                  </p>
                  <div className="flex gap-5 mt-4">
                    <div>
                      <p className="text-[11px] text-emerald-300/90">Tổng thu</p>
                      <p className="text-sm font-semibold text-emerald-300">
                        +{fmt(animIncome)}
                      </p>
                    </div>
                    <div className="w-px bg-white/15" />
                    <div>
                      <p className="text-[11px] text-rose-300/90">Tổng chi</p>
                      <p className="text-sm font-semibold text-rose-300">
                        -{fmt(animExpense)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vòng tròn tỷ lệ chi/thu */}
                <div className="flex items-center gap-3">
                  <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                    <circle
                      cx="44"
                      cy="44"
                      r={RING_R}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="9"
                    />
                    <circle
                      cx="44"
                      cy="44"
                      r={RING_R}
                      fill="none"
                      stroke="url(#ringGrad)"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={RING_C}
                      strokeDashoffset={RING_C * (1 - spendRatio)}
                      className="transition-all duration-700"
                    />
                    <defs>
                      <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#f472b6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div>
                    <p className="text-2xl font-bold">{Math.round(spendRatio * 100)}%</p>
                    <p className="text-[11px] text-indigo-200/80">chi so với thu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thẻ số liệu nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white p-5 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
                    💰
                  </span>
                  <p className="text-sm text-slate-500">Thu {currentMonthLabel}</p>
                </div>
                <p className="text-xl font-bold text-emerald-600 mt-3">{fmt(monthIncome)}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white p-5 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-lg">
                    💸
                  </span>
                  <p className="text-sm text-slate-500">Chi {currentMonthLabel}</p>
                </div>
                <p className="text-xl font-bold text-slate-800 mt-3">{fmt(monthExpense)}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white p-5 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      monthBalance >= 0 ? 'bg-indigo-100' : 'bg-rose-100'
                    }`}
                  >
                    ⚖️
                  </span>
                  <p className="text-sm text-slate-500">Số dư {currentMonthLabel}</p>
                </div>
                <p
                  className={`text-xl font-bold mt-3 ${
                    monthBalance >= 0 ? 'text-slate-800' : 'text-rose-600'
                  }`}
                >
                  {fmt(monthBalance)}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white p-5 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg">
                    📝
                  </span>
                  <p className="text-sm text-slate-500">Số giao dịch (đang lọc)</p>
                </div>
                <p className="text-xl font-bold text-slate-800 mt-3">{total}</p>
              </div>
            </div>

            {/* Biểu đồ thu/chi theo tháng (tính năng mở rộng) */}
            <ExpenseChart
              data={summary}
              year={Number(monthFilter?.slice(0, 4) || new Date().getFullYear())}
            />

            {/* Chuyển nhanh sang tab danh sách */}
            <div className="flex justify-center">
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm bg-white/70 hover:bg-white px-4 py-2 rounded-xl border border-white shadow-sm transition"
              >
                Xem tất cả giao dịch →
              </button>
            </div>
          </div>
        )}

        {/* ===== Tab Giao dịch: bộ lọc + danh sách ===== */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {/* Nút thêm + bộ lọc */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <button
                onClick={openCreateForm}
                className="bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-indigo-300/40 self-start"
              >
                + Thêm giao dịch
              </button>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                {/* Tab loại giao dịch */}
                <div className="flex bg-white/80 border border-white rounded-xl p-1 text-sm shadow-sm">
                  {(['all', 'income', 'expense'] as TypeFilter[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        typeFilter === t
                          ? 'bg-gradient-to-r from-indigo-600 to-pink-500 text-white shadow'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {t === 'all' ? 'Tất cả' : t === 'income' ? 'Thu' : 'Chi'}
                    </button>
                  ))}
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-white bg-white/80 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Tất cả danh mục</option>
                  {typeFilter !== 'income' &&
                    EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {catIcon(c)} {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  {typeFilter !== 'expense' &&
                    INCOME_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {catIcon(c)} {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                </select>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="border border-white bg-white/80 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Danh sách */}
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white p-10 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-500">
                  Chưa có giao dịch nào{categoryFilter ? ' thuộc danh mục này' : ''}.
                </p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white overflow-hidden">
                {/* Desktop: bảng */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 text-left">
                        <th className="px-4 py-3 font-medium">Loại</th>
                        <th className="px-4 py-3 font-medium">Tiêu đề</th>
                        <th className="px-4 py-3 font-medium">Danh mục</th>
                        <th className="px-4 py-3 font-medium">Ngày</th>
                        <th className="px-4 py-3 font-medium">Phương thức</th>
                        <th className="px-4 py-3 font-medium text-right">Số tiền</th>
                        <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((exp) => (
                        <tr
                          key={exp.id}
                          className="border-t border-slate-100 hover:bg-indigo-50/40 transition"
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${typeBadge(exp.type)}`}
                            >
                              {typeLabel(exp.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{exp.title}</div>
                            {exp.note && (
                              <div className="text-xs text-slate-400">{exp.note}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${catChip(exp.category)}`}
                            >
                              {catIcon(exp.category)} {CATEGORY_LABELS[exp.category] ?? exp.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{exp.date}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {PAYMENT_ICONS[exp.paymentMethod] ?? ''}{' '}
                            {PAYMENT_LABELS[exp.paymentMethod] ?? exp.paymentMethod}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${
                              exp.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                            }`}
                          >
                            {exp.type === 'income' ? '+' : '-'}
                            {fmt(exp.amount)}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => startEdit(exp)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium mr-3 hover:underline"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="text-rose-500 hover:text-rose-700 font-medium hover:underline"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: thẻ */}
                <div className="md:hidden divide-y divide-slate-100">
                  {items.map((exp) => (
                    <div key={exp.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${catChip(exp.category)}`}
                          >
                            {catIcon(exp.category)}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800">{exp.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {exp.date}
                              {exp.note ? ` · ${exp.note}` : ''}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-semibold ${
                            exp.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                          }`}
                        >
                          {exp.type === 'income' ? '+' : '-'}
                          {fmt(exp.amount)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2 pl-11">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${typeBadge(exp.type)}`}
                          >
                            {typeLabel(exp.type)}
                          </span>
                          <span
                            className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${catChip(exp.category)}`}
                          >
                            {CATEGORY_LABELS[exp.category] ?? exp.category}
                          </span>
                        </div>
                        <div className="text-sm">
                          <button
                            onClick={() => startEdit(exp)}
                            className="text-indigo-600 hover:text-indigo-800 font-medium mr-3"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="text-rose-500 hover:text-rose-700 font-medium"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Popup thêm/sửa — hiển thị trên cả 2 tab */}
        <Modal
          open={showForm}
          onClose={cancelEdit}
          title={editingId ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Chọn loại thu/chi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Loại giao dịch *
              </label>
              <div className="flex bg-slate-100 rounded-xl p-1 text-sm w-fit">
                {(['income', 'expense'] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => changeFormType(t)}
                    className={`px-4 py-1.5 rounded-lg font-medium transition ${
                      form.type === t
                        ? t === 'income'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow'
                          : 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t === 'income' ? 'Thu' : 'Chi'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass(!!formErrors.title)}
                  placeholder={form.type === 'income' ? 'vd: Lương tháng 8' : 'vd: Ăn trưa'}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số tiền (VNĐ) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={inputClass(!!formErrors.amount)}
                  placeholder="vd: 50000"
                />
                {formErrors.amount && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Danh mục *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                >
                  {formCategories.map((c) => (
                    <option key={c} value={c}>
                      {catIcon(c)} {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ngày *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputClass(!!formErrors.date)}
                />
                {formErrors.date && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phương thức thanh toán
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_ICONS[m] ?? ''} {PAYMENT_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                  placeholder="vd: Ăn cùng đồng nghiệp"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className={`text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-lg ${
                  form.type === 'income'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200'
                    : 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 shadow-indigo-200'
                }`}
              >
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-slate-600 hover:text-slate-800 font-medium px-4 py-2 text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
