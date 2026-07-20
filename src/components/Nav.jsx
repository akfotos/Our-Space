import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart,
  MessageCircle,
  Play,
  List,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

function Nav() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const links = [
    { to: '/', label: 'Dashboard', icon: Heart },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/watch', label: 'Watch', icon: Play },
    { to: '/bucket', label: 'Bucket List', icon: List },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  if (!user) return null;

  return (
    <nav className="bg-white/80 backdrop-blur border-b border-rose-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-rose-600 tracking-tight">
          Our Space
        </Link>

        <button
          className="sm:hidden p-2 rounded-md text-rose-600 hover:bg-rose-50"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-rose-100 text-rose-700' : 'text-slate-600 hover:bg-rose-50'
                }`}
              >
                <Icon size={18} />
                {l.label}
              </Link>
            );
          })}
          <span className="ml-2 text-sm text-slate-500 hidden md:inline">
            {user.displayName}
          </span>
          <button
            onClick={handleSignOut}
            className="ml-2 p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden border-t border-rose-100 px-4 pb-4 space-y-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-rose-100 text-rose-700' : 'text-slate-600 hover:bg-rose-50'
                }`}
              >
                <Icon size={18} />
                {l.label}
              </Link>
            );
          })}
          <div className="flex items-center justify-between pt-2 border-t border-rose-100">
            <span className="text-sm text-slate-500">{user.displayName}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-rose-50"
            >
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Nav;
