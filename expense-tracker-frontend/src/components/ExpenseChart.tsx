import {
  Bar,
  BarChart,
  CartesianGrid,
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
 * Giao diện: card kính + cột gradient (emerald cho Thu, indigo→pink cho Chi).
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
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-white p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">
          📈 Thu - Chi năm {year} theo tháng
        </h2>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 inline-block" />
            Thu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-pink-500 inline-block" />
            Chi
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(v: number) =>
                v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}tr` : `${v / 1000}k`
              }
              width={55}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(99,102,241,0.06)' }}
              formatter={(value) => fmt(Number(value))}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px -10px rgba(99,102,241,0.3)',
                fontSize: 13,
              }}
            />
            <Bar
              dataKey="income"
              name="Thu"
              fill="url(#gradIncome)"
              radius={[6, 6, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="expense"
              name="Chi"
              fill="url(#gradExpense)"
              radius={[6, 6, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
