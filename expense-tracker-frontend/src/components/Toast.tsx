import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number; // ms, mặc định 3 giây
  onClose: () => void;
}

// Toast popup góc phải, tự ẩn sau duration — thông báo ngắn gọn (thêm/sửa/xóa thành công)
export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    error: 'bg-gradient-to-r from-rose-500 to-red-500',
    info: 'bg-gradient-to-r from-indigo-500 to-blue-500',
  };

  const icons = {
    success: '✅',
    error: '⛔',
    info: 'ℹ️',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl shadow-xl shadow-slate-300/50 px-4 py-3 text-sm text-white animate-slide-in ${styles[type]}`}
    >
      <span>{icons[type]}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white text-lg leading-none ml-1"
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}
