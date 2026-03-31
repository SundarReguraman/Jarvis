import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutDashboard, ClipboardList, FlaskConical, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';

const navLinks = [
  { to: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teacher/assignments', icon: ClipboardList, label: 'Assignments' },
  { to: '/teacher/tests', icon: FlaskConical, label: 'Tests' },
];

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200">
          <BookOpen className="text-blue-500" size={22} />
          <span className="font-bold text-gray-800">CampusTrack</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`
              }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 px-3 py-2 w-full rounded-lg hover:bg-red-50 transition-colors">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-sm text-gray-700 font-medium">{user?.name}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
