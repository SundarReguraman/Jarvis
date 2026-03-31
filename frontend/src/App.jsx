import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import PostAssignment from './pages/teacher/PostAssignment';
import AssignmentsList from './pages/teacher/AssignmentsList';
import SubmissionTracker from './pages/teacher/SubmissionTracker';
import PostTest from './pages/teacher/PostTest';
import TestsList from './pages/teacher/TestsList';
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import CalendarView from './pages/student/CalendarView';
import StudyRoadmap from './pages/student/StudyRoadmap';
import NotificationsPage from './pages/student/NotificationsPage';

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace /> : <Navigate to="/login" replace />
      } />
      <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace /> : <LoginPage />} />

      <Route path="/teacher" element={<RequireAuth role="teacher"><TeacherLayout /></RequireAuth>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="assignments" element={<AssignmentsList />} />
        <Route path="assignments/new" element={<PostAssignment />} />
        <Route path="assignments/:id/submissions" element={<SubmissionTracker />} />
        <Route path="tests" element={<TestsList />} />
        <Route path="tests/new" element={<PostTest />} />
      </Route>

      <Route path="/student" element={<RequireAuth role="student"><StudentLayout /></RequireAuth>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="roadmap/:testId" element={<StudyRoadmap />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
