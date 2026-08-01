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
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg shadow-lg px-4 py-3 text-sm animate-slide-in ${styles[type]}`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white text-lg leading-none"
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}
