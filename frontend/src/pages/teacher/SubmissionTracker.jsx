import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function SubmissionTracker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);

  const load = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get(`/submissions/assignments/${id}/submissions`),
      ]);
      setAssignment(aRes.data.assignment);
      setSubmissions(sRes.data.submissions || []);
      setProgress(sRes.data.progress);
    } catch {
      toast.error('Failed to load submission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const remindAll = async () => {
    setReminding(true);
    try {
      const { data } = await api.post(`/submissions/assignments/${id}/remind`);
      toast.success(data.message || 'Reminders sent!');
    } catch {
      toast.error('Failed to send reminders');
    } finally {
      setReminding(false);
    }
  };

  const remindOne = async () => {
    toast.info('Reminder sent to student');
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading...</div>;
  if (!assignment) return <div className="text-red-500 text-sm">Assignment not found.</div>;

  const pct = progress?.percentage || 0;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-gray-800">Submission Tracker</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h2 className="font-semibold text-gray-800">{assignment.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{assignment.subject} · {assignment.marks} marks · Due {format(new Date(assignment.deadline), 'MMM d, yyyy HH:mm')}</p>
      </div>

      {progress && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {progress.submitted_count} of {progress.total_students} students submitted
            </span>
            <span className="text-sm font-bold text-gray-800">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">Submitted ({submissions.length})</h3>
          </div>
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">No submissions yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {submissions.map(s => (
                <div key={s.id} className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.student_name}</p>
                      <p className="text-xs text-gray-500">{s.student_number || s.student_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{format(new Date(s.submitted_at), 'MMM d, HH:mm')}</p>
                      {s.submission_url && (
                        <a href={s.submission_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">View</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Pending ({progress?.pending_students?.length || 0})</h3>
            <button onClick={remindAll} disabled={reminding || !progress?.pending_students?.length}
              className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded disabled:opacity-60 transition-colors">
              <Bell size={12} /> Remind All
            </button>
          </div>
          {(!progress?.pending_students?.length) ? (
            <p className="text-sm text-green-600 p-4">🎉 All students have submitted!</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {progress.pending_students.map(s => (
                <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.student_number || s.email}</p>
                  </div>
                  <button onClick={() => remindOne(s.id)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 border border-amber-300 px-2 py-1 rounded transition-colors">
                    Remind
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
