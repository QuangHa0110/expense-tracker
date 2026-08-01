import type { ReactNode } from 'react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  children: ReactNode;
}

// Component hiển thị thông báo — dùng chung cho mọi lỗi (xử lý lỗi tập trung ở UI)
export function Alert({ type, children }: AlertProps) {
  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
