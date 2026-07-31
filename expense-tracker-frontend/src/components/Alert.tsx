import type { ReactNode } from 'react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  children: ReactNode;
}

// Component hiển thị thông báo — dùng chung cho mọi lỗi (xử lý lỗi tập trung ở UI)
export function Alert({ type, children }: AlertProps) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
