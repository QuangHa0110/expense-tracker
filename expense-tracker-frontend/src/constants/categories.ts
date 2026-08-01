import type { TransactionType } from '../api/expenses';

// Nhãn tiếng Việt cho category (hiển thị)
export const CATEGORY_LABELS: Record<string, string> = {
  // Chi
  food: 'Ăn uống',
  transport: 'Di chuyển',
  housing: 'Nhà ở',
  entertainment: 'Giải trí',
  health: 'Sức khỏe',
  education: 'Học tập',
  shopping: 'Mua sắm',
  other: 'Khác',
  // Thu
  salary: 'Lương',
  bonus: 'Thưởng',
  interest: 'Lãi tiết kiệm',
  investment: 'Đầu tư',
  gift: 'Quà tặng',
  other_income: 'Thu khác',
};

export const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  bank_transfer: 'Chuyển khoản',
};

export const PAYMENT_ICONS: Record<string, string> = {
  cash: '💵',
  card: '💳',
  bank_transfer: '🏦',
};

// Icon + màu riêng cho từng danh mục (chip + biểu đồ)
export const CATEGORY_STYLES: Record<
  string,
  { icon: string; chip: string; bar: string }
> = {
  // Chi
  food: { icon: '🍜', chip: 'bg-orange-100 text-orange-700', bar: '#f97316' },
  transport: { icon: '🚌', chip: 'bg-sky-100 text-sky-700', bar: '#0ea5e9' },
  housing: { icon: '🏠', chip: 'bg-teal-100 text-teal-700', bar: '#14b8a6' },
  entertainment: { icon: '🎬', chip: 'bg-purple-100 text-purple-700', bar: '#a855f7' },
  health: { icon: '💊', chip: 'bg-rose-100 text-rose-700', bar: '#f43f5e' },
  education: { icon: '📚', chip: 'bg-blue-100 text-blue-700', bar: '#3b82f6' },
  shopping: { icon: '🛍️', chip: 'bg-pink-100 text-pink-700', bar: '#ec4899' },
  other: { icon: '📦', chip: 'bg-slate-100 text-slate-600', bar: '#94a3b8' },
  // Thu
  salary: { icon: '💼', chip: 'bg-emerald-100 text-emerald-700', bar: '#10b981' },
  bonus: { icon: '🎁', chip: 'bg-amber-100 text-amber-700', bar: '#f59e0b' },
  interest: { icon: '🏦', chip: 'bg-cyan-100 text-cyan-700', bar: '#06b6d4' },
  investment: { icon: '📈', chip: 'bg-lime-100 text-lime-700', bar: '#84cc16' },
  gift: { icon: '💝', chip: 'bg-fuchsia-100 text-fuchsia-700', bar: '#d946ef' },
  other_income: { icon: '🪙', chip: 'bg-slate-100 text-slate-600', bar: '#94a3b8' },
};

// Icon danh mục (fallback 📌 nếu chưa có trong map)
export const catIcon = (cat: string) => CATEGORY_STYLES[cat]?.icon ?? '📌';

// Chip class cho danh mục (fallback slate nếu chưa có trong map)
export const catChip = (cat: string) =>
  CATEGORY_STYLES[cat]?.chip ?? 'bg-slate-100 text-slate-600';

// Nhãn loại giao dịch
export const typeLabel = (type: TransactionType) => (type === 'income' ? 'Thu' : 'Chi');
