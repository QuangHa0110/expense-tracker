import axios from 'axios';

// 1 instance axios dùng chung cho toàn app
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Request interceptor: tự gắn JWT token (nếu có) vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: XỬ LÝ LỖI TẬP TRUNG
// Mọi lỗi HTTP đều đi qua đây — component không cần try-catch từng chỗ
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token hết hạn / sai -> xóa token, đá về trang login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
