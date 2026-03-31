import { useState, useEffect } from 'react';
import { Bell, BellOff, BookOpen, ClipboardList, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  new_assignment: ClipboardList,
  new_test: BookOpen,
  submission_received: ClipboardList,
  submission_reminder: Clock,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/notifications').then(r => setNotifications(r.data.notifications || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markOne = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && <p className="text-xs text-gray-500 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-blue-500 hover:text-blue-600 border border-blue-200 px-3 py-1.5 rounded transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <BellOff className="text-gray-300 mx-auto mb-2" size={32} />
          <p className="text-gray-500 text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            return (
              <div key={n.id} onClick={() => !n.is_read && markOne(n.id)}
                className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer transition-colors ${!n.is_read ? 'border-l-2 border-l-blue-500 hover:bg-blue-50' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${!n.is_read ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <Icon size={14} className={!n.is_read ? 'text-blue-500' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
