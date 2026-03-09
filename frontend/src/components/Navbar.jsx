import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

export default function Navbar({ title }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const data = res.data;
      setNotifications(data.notifications || data || []);
      const unread = (data.notifications || data || []).filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent fail
    }
  };

  if (!user) return null;

  return (
    <nav className="h-[60px] bg-white border-b-[1.5px] border-border shadow-sh0 px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Page title & Breadcrumb */}
      <div>
        <div className="text-[12px] font-medium text-text-muted mb-0.5">SmartDesk / Dashboard</div>
        <h1 className="font-heading font-bold text-[16.5px] text-text leading-none">{title}</h1>
      </div>

      {/* Right: Notifications + user */}
      <div className="flex items-center gap-6">
        {/* Search placeholder as geometric box */}
        <div className="hidden md:flex items-center bg-surface2 border-[1.5px] border-border rounded-btn px-3 py-1.5 w-64 group hover:border-blue-mid transition-all">
          <div className="w-3.5 h-3.5 border-2 border-text-muted rounded-full mr-2" />
          <span className="text-[13px] text-text-muted">Search tickets...</span>
        </div>

        {/* Notification bell */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setNotifOpen((prev) => !prev)}
            className="w-10 h-10 rounded-btn bg-surface2 border-[1.5px] border-border flex items-center justify-center relative transition-all hover:border-blue-mid hover:bg-blue-soft group"
          >
            {/* Geometric Bell shape */}
            <div className="relative">
              <div className="w-4 h-4 border-2 border-text-secondary rounded-t-full rounded-b-sm group-hover:border-blue" />
              <div className="w-1.5 h-1 bg-text-secondary mx-auto mt-0.5 rounded-full group-hover:bg-blue" />
            </div>
            
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? '!' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute top-[calc(100%+12px)] right-0 w-[320px] bg-white rounded-card shadow-sh3 border border-border z-[100] overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 flex justify-between items-center border-bottom border-border bg-surface2">
                <span className="font-heading font-bold text-[14px] text-text">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-bold text-blue uppercase tracking-wider hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 px-5 text-center">
                    <div className="w-10 h-10 bg-surface2 rounded-full mx-auto mb-3 flex items-center justify-center">
                       <div className="w-4 h-4 border-2 border-text-disabled rounded-full" />
                    </div>
                    <p className="text-[13px] text-text-muted font-medium">No new notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n, i) => (
                    <div
                      key={n.id || i}
                      className={`px-5 py-4 border-b border-border transition-colors cursor-default ${n.is_read ? 'bg-white' : 'bg-blue-soft/30'}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-text-disabled' : 'bg-blue pulse'}`} />
                        <div>
                          <p className="text-[13px] text-text-secondary font-medium leading-[1.5]">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-text-muted mt-2 font-semibold uppercase tracking-tight">
                            {formatTime(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <div className="text-[13.5px] font-bold text-text leading-tight">{user.name}</div>
            <div className="text-[11px] font-extrabold text-blue uppercase tracking-wider mt-0.5">{user.role}</div>
          </div>
          <div className="w-9 h-9 rounded-avatar bg-gradient-to-br from-blue to-indigo flex items-center justify-center text-white font-extrabold text-[13px] shadow-sm">
            {getInitials(user.name)}
          </div>
        </div>
      </div>
    </nav>
  );
}
