import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-slate-500 mt-1">Start tracking your glucose in seconds.</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm text-slate-600">Full name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Demo User"
            />
          </label>
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
            <span className="text-sm text-slate-600">Password (min 8 chars, letter + number)</span>
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
          <label className="block">
            <span className="text-sm text-slate-600">Confirm password</span>
            <input
              type={show ? 'text' : 'password'}
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4">
          Have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
