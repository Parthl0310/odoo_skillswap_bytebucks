import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, ArrowRightLeft, ShieldAlert, Check, LogOut, Compass, User as UserIcon, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getPhotoUrl = (photoPath?: string | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const isBrowse = location.pathname === '/browse' || location.pathname === '/';
  const isProfile = location.pathname === '/profile';
  const isSwaps = location.pathname.startsWith('/swaps') || location.pathname.startsWith('/request');
  const isAdmin = location.pathname === '/admin';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex justify-between items-center">
          
          {/* Brand Logo */}
          <Link to="/browse" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                SkillSwap
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Network
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Link
              to="/browse"
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isBrowse
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse</span>
            </Link>

            <Link
              to="/swaps"
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isSwaps
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Swaps</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                isProfile
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>

            {user.isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isAdmin
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs font-semibold'
                    : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                <span>Admin</span>
              </Link>
            )}

            <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(prev => !prev)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Menu */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl z-50 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-sm text-slate-900">Notifications</h4>
                      {unreadNotificationsCount > 0 && (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 text-xs px-2 py-0.5 rounded-full font-medium">
                          {unreadNotificationsCount} unread
                        </span>
                      )}
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 font-medium"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 15).map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) markNotificationAsRead(n.id);
                            if (n.type.includes('swap')) {
                              navigate('/swaps');
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                            n.isRead
                              ? 'bg-slate-50/70 border-slate-100 text-slate-600 hover:bg-slate-100'
                              : 'bg-indigo-50/40 border-indigo-100 shadow-xs hover:bg-indigo-50/70'
                          }`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <div className="mt-0.5 flex-shrink-0">
                              {n.type === 'swap_request' ? (
                                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                              ) : n.type === 'admin_message' ? (
                                <ShieldAlert className="w-4 h-4 text-amber-600" />
                              ) : (
                                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900 truncate">{n.title}</span>
                                <span className="text-[10px] text-slate-400 ml-1 flex-shrink-0">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-slate-600 text-xs mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-200 border border-white hover:ring-indigo-400 transition-all block">
              {getPhotoUrl(user.photo) ? (
                <img src={getPhotoUrl(user.photo)!} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl text-xs font-medium transition-colors"
              title="Sign out of SkillSwap"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;