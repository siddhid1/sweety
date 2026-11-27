import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Log in to track your glucose readings.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm text-slate-600">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">Password</span>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 pr-16"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-brand-600"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4">
          No account?{' '}
          <Link to="/register" className="text-brand-600 hover:underline">
            Register
          </Link>
        </p>
        <p className="text-xs text-slate-400 mt-2">Demo: demo@example.com / Demo@12345</p>
      </div>
    </div>
  );
}
