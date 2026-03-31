import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '' });
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let user;
      if (tab === 'login') {
        user = await login(form.email, form.password);
      } else {
        user = await register(form.name, form.email, form.password, form.role, form.role === 'student' ? form.studentId : undefined);
      }
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="text-blue-500" size={28} />
          <span className="text-xl font-bold text-gray-800">CampusTrack</span>
        </div>

        <div className="flex border border-gray-200 rounded-lg mb-6 overflow-hidden">
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" value={form.name} onChange={handle} required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="John Doe" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="••••••••" />
          </div>
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select name="role" value={form.role} onChange={handle}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              {form.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input name="studentId" value={form.studentId} onChange={handle}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. CS2024001" />
                </div>
              )}
            </>
          )}
          <button type="submit" disabled={submitting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium text-sm transition-colors disabled:opacity-60">
            {submitting ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {tab === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => setTab(tab === 'login' ? 'register' : 'login')} className="text-blue-500 hover:underline">
            {tab === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
