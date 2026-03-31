import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, FlaskConical, Users, Clock, Plus } from 'lucide-react';
import api from '../../api/axios';

export default function TeacherDashboard() {
  const [stats, setStats] = useState({ assignments: 0, tests: 0, pending: 0, students: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [aRes, tRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/tests'),
        ]);
        const assignments = aRes.data.assignments || [];
        const tests = tRes.data.tests || [];
        const upcoming = tests.filter(t => new Date(t.date) >= new Date()).length;
        setStats({ assignments: assignments.length, tests: upcoming, pending: 0, students: 0 });
      } catch {}
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Assignments', value: stats.assignments, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Upcoming Tests', value: stats.tests, icon: FlaskConical, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Pending Reviews', value: stats.pending, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Students', value: stats.students, icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/teacher/assignments/new" className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors">
            <Plus size={14} /> Assignment
          </Link>
          <Link to="/teacher/tests/new" className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded text-sm transition-colors">
            <Plus size={14} /> Test
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                </div>
                <div className={`${bg} p-2.5 rounded-lg`}>
                  <Icon className={color} size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700 text-sm">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            <Link to="/teacher/assignments/new" className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 text-sm text-gray-600">
              <ClipboardList size={16} className="text-blue-500" /> Post new assignment
            </Link>
            <Link to="/teacher/tests/new" className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 text-sm text-gray-600">
              <FlaskConical size={16} className="text-amber-500" /> Schedule a test/exam
            </Link>
            <Link to="/teacher/assignments" className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 text-sm text-gray-600">
              <Clock size={16} className="text-purple-500" /> View submission progress
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
