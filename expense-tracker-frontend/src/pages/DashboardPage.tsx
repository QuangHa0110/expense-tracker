import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  expenseApi,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from '../api/expenses';
import type { Expense } from '../api/expenses';
import { Alert } from '../components/Alert';
import { ExpenseChart } from '../components/ExpenseChart';

// Nhãn tiếng Việt cho category (hiển thị)
export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  transport: 'Di chuyển',
  housing: 'Nhà ở',
  entertainment: 'Giải trí',
  health: 'Sức khỏe',
  education: 'Học tập',
  shopping: 'Mua sắm',
  other: 'Khác',
};

export const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  bank_transfer: 'Chuyển khoản',
};

interface FormState {
  title: string;
  amount: string;
  category: string;
  date: string;
  note: string;
  paymentMethod: string;
}

const emptyForm: FormState = {
  title: '',
  amount: '',
  category: 'food',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  paymentMethod: 'cash',
};

export function DashboardPage() {
  const { user, logout } = useAuth();

  // Danh sách + filter
  const [items, setItems] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
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
  const [notice, setNotice] = useState('');

  const [summary, setSummary] = useState<{ month: string; total: number }[]>([]);

  // Tải danh sách khi filter thay đổi
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    expenseApi
      .list({
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
        if (!cancelled) setError('Không tải được danh sách chi tiêu');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryFilter, monthFilter]);

  // Tải tổng chi tiêu theo tháng trong năm hiện tại (cho thẻ tổng quan)
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

  const monthTotal = summary.find((s) => s.month === monthFilter)?.total ?? 0;
  const yearTotal = summary.reduce((acc, s) => acc + s.total, 0);
  const currentMonthLabel = monthFilter
    ? new Date(monthFilter + '-01').toLocaleDateString('vi-VN', {
        month: 'long',
        year: 'numeric',
      })
    : '';

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
    setNotice('');
    if (!validateForm()) return;

    const payload = {
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
        setNotice('Đã cập nhật khoản chi');
      } else {
        await expenseApi.create(payload);
        setNotice('Đã thêm khoản chi mới');
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      // Tải lại danh sách
      const res = await expenseApi.list({
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
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      note: expense.note ?? '',
      paymentMethod: expense.paymentMethod,
    });
    setFormErrors({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Bạn chắc chắn muốn xóa khoản chi này?')) return;
    try {
      await expenseApi.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setNotice('Đã xóa khoản chi');
      // Cập nhật lại tổng chi sau khi xóa
      const year = Number(monthFilter.slice(0, 4));
      expenseApi.summary(year).then(setSummary).catch(() => {});
    } catch {
      setError('Xóa thất bại');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(false);
  }

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      hasError
        ? 'border-red-400 focus:ring-red-200'
        : 'border-gray-300 focus:ring-blue-200'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h1 className="font-bold text-gray-800">Expense Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Xin chào, <strong>{user?.name}</strong>
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {notice && (
          <div className="flex justify-between items-start">
            <Alert type="success">{notice}</Alert>
            <button
              onClick={() => setNotice('')}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        )}
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

        {/* Thẻ tổng quan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-500">Tổng chi {currentMonthLabel}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{fmt(monthTotal)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-500">
              Tổng chi năm {monthFilter?.slice(0, 4)}
            </p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{fmt(yearTotal)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-500">Số khoản chi (đang lọc)</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
          </div>
        </div>

        {/* Biểu đồ tổng chi theo tháng (tính năng mở rộng) */}
        <ExpenseChart
          data={summary}
          year={Number(monthFilter?.slice(0, 4) || new Date().getFullYear())}
        />

        {/* Nút thêm + bộ lọc */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <button
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setFormErrors({});
              setShowForm((v) => !v);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition self-start"
          >
            {showForm ? 'Đóng form' : '+ Thêm khoản chi'}
          </button>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Tất cả danh mục</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Form thêm/sửa */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white rounded-2xl shadow-sm p-6 space-y-4"
          >
            <h2 className="font-semibold text-gray-800">
              {editingId ? 'Sửa khoản chi' : 'Thêm khoản chi mới'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass(!!formErrors.title)}
                  placeholder="vd: Ăn trưa"
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phương thức thanh toán
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="vd: Ăn cùng đồng nghiệp"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
              >
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2 text-sm"
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>
        )}

        {/* Danh sách */}
        {loading ? (
          <p className="text-center text-gray-500 py-10">Đang tải...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">
              Chưa có khoản chi nào{categoryFilter ? ' thuộc danh mục này' : ''}.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Desktop: bảng */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-left">
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
                    <tr key={exp.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{exp.title}</div>
                        {exp.note && (
                          <div className="text-xs text-gray-400">{exp.note}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                          {CATEGORY_LABELS[exp.category] ?? exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{exp.date}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {PAYMENT_LABELS[exp.paymentMethod] ?? exp.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {fmt(exp.amount)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => startEdit(exp)}
                          className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
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
            <div className="md:hidden divide-y divide-gray-100">
              {items.map((exp) => (
                <div key={exp.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{exp.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exp.date}
                        {exp.note ? ` · ${exp.note}` : ''}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800">{fmt(exp.amount)}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                      {CATEGORY_LABELS[exp.category] ?? exp.category}
                    </span>
                    <div className="text-sm">
                      <button
                        onClick={() => startEdit(exp)}
                        className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
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
      </main>
    </div>
  );
}
