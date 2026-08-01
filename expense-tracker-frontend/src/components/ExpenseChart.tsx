import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlySummary } from '../api/expenses';

const MONTH_NAMES = [
  'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
  'T7', 'T8', 'T9', 'T10', 'T11', 'T12',
];

/**
 * Biểu đồ cột thu/chi theo tháng (tính năng mở rộng).
 * Dữ liệu từ GET /api/expenses/summary?year=YYYY → { month, income, expense }
 */
export function ExpenseChart({ data, year }: { data: MonthlySummary[]; year: number }) {
  // Map dữ liệu từ backend (chỉ có tháng có giao dịch) -> đủ 12 tháng
  const chartData = MONTH_NAMES.map((label, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`;
    const found = data.find((d) => d.month === month);
    return {
      name: label,
      income: found ? found.income : 0,
      expense: found ? found.expense : 0,
    };
  });

  const fmt = (n: number) =>
    Number(n).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-4">
        Thu - Chi năm {year} theo tháng
      </h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}tr` : `${v / 1000}k`
              }
              width={55}
            />
            <Tooltip formatter={(value) => fmt(Number(value))} />
            <Legend />
            <Bar dataKey="income" name="Thu" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
            <Bar dataKey="expense" name="Chi" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
