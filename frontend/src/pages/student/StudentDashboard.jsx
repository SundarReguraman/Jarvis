import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import api from '../../api/axios';
import TaskCard from '../../components/TaskCard';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'Urgent', 'Assignments', 'Projects', 'Lab Records', 'Tests'];

function SubmitModal({ assignment, onClose, onSubmitted }) {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/submissions/assignments/${assignment.id}/submit`, {
        submission_url: url || undefined,
        notes: notes || undefined,
      });
      toast.success('Submitted successfully!');
      onSubmitted();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md border border-gray-200">
        <h2 className="font-bold text-gray-800 mb-4">Submit: {assignment.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submission URL (optional)</label>
            <input value={url} onChange={e => setUrl(e.target.value)} type="url"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="https://drive.google.com/..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Any notes for your teacher..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button type="button" onClick={onClose} className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [submitTarget, setSubmitTarget] = useState(null);

  const load = async () => {
    try {
      const [aRes, tRes] = await Promise.all([api.get('/assignments'), api.get('/tests')]);
      setAssignments(aRes.data.assignments || []);
      setTests(tRes.data.tests || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const priorityScore = (item, isTest) => {
    const deadline = isTest ? new Date(item.date) : new Date(item.deadline);
    const days = differenceInDays(deadline, new Date());
    if (days < 0) return 9999;
    if (days === 0) return 10000;
    return (isTest ? 50 : (item.marks || 0)) / Math.max(1, days);
  };

  const allItems = [
    ...assignments.map(a => ({ ...a, _isTest: false })),
    ...tests.map(t => ({ ...t, _isTest: true })),
  ].sort((a, b) => priorityScore(b, b._isTest) - priorityScore(a, a._isTest));

  const filtered = allItems.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Urgent') {
      const d = item._isTest ? new Date(item.date) : new Date(item.deadline);
      return differenceInDays(d, new Date()) <= 5 && differenceInDays(d, new Date()) >= 0;
    }
    if (filter === 'Assignments') return !item._isTest && item.type === 'assignment';
    if (filter === 'Projects') return !item._isTest && item.type === 'project';
    if (filter === 'Lab Records') return !item._isTest && item.type === 'lab_record';
    if (filter === 'Tests') return item._isTest || item.type === 'test' || item.type === 'quiz';
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">My Tasks</h1>
        <span className="text-sm text-gray-500">{filtered.length} items</span>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${filter === f ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">No items found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <TaskCard key={`${item._isTest ? 't' : 'a'}-${item.id}`} item={item} isTest={item._isTest}
              onSubmit={() => setSubmitTarget(item)} />
          ))}
        </div>
      )}

      {submitTarget && (
        <SubmitModal assignment={submitTarget} onClose={() => setSubmitTarget(null)} onSubmitted={load} />
      )}
    </div>
  );
}
