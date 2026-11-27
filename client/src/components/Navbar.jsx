import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold">
            S
          </span>
          <span className="font-semibold text-lg text-slate-800">Sweety</span>
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-slate-600 hover:text-brand-600">
              Dashboard
            </Link>
            <Link to="/readings" className="text-sm text-slate-600 hover:text-brand-600">
              Readings
            </Link>
            <Link to="/reports" className="text-sm text-slate-600 hover:text-brand-600">
              Reports
            </Link>
            <span className="text-sm text-slate-500 hidden sm:inline">{user.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
