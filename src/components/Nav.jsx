import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../hooks/useChat';
import {
  Heart,
  MessageCircle,
  Play,
  List,
  Images,
  Settings,
  Menu,
  X,
} from 'lucide-react';

function Nav() {
  const { user } = useAuth();
  const { unreadCount } = useChat();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: 'Dashboard', icon: Heart },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/watch', label: 'Watch', icon: Play },
    { to: '/bucket', label: 'Bucket List', icon: List },
    { to: '/memories', label: 'Memories', icon: Images },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  if (!user) return null;

  return (
    <nav className="bg-white/80 backdrop-blur border-b border-rose-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src={`${import.meta.env.BASE_URL}Logo.png`}
            alt="Our Space"
            className="h-8 w-auto rounded-lg"
          />
        </Link>

        <button
          type="button"
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
            const isChat = l.to === '/chat';
            const showBadge = isChat && unreadCount > 0;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-rose-100 text-rose-700' : 'text-slate-600 hover:bg-rose-50'
                }`}
              >
                <Icon size={18} />
                {l.label}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {open && (
        <div className="sm:hidden border-t border-rose-100 px-4 pb-4 space-y-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.to;
            const isChat = l.to === '/chat';
            const showBadge = isChat && unreadCount > 0;
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
                {showBadge && (
                  <span className="ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default Nav;
