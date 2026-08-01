import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate phía client — hiển thị lỗi ngay khi submit
  function validate() {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = 'Email không được để trống';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Email không hợp lệ';
    if (!password) e.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      // Lỗi từ server (401...) — hiển thị message từ backend
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setServerError(
        Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Đăng nhập thất bại'),
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
      hasError
        ? 'border-red-300 bg-red-50/50 focus:ring-red-200'
        : 'border-slate-200 bg-white/70 focus:border-indigo-400 focus:ring-indigo-200'
    }`;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Blob nền — nổi lơ lửng tạo chiều sâu */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-300/40 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-pink-300/40 blur-3xl animate-float" />
      <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-amber-200/40 blur-2xl animate-float-slow" />

      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-xl shadow-indigo-200/40 p-8 animate-fade-in-up">
        {/* Logo + tiêu đề */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-300/50">
            💰
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">
              Đăng nhập
            </h1>
            <p className="text-xs text-slate-500">Quản lý chi tiêu cá nhân của bạn</p>
          </div>
        </div>

        {serverError && (
          <div className="mb-4">
            <Alert type="error">{serverError}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(!!errors.email)}
              placeholder="ban@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass(!!errors.password)}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-indigo-300/40"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-5 text-center">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
