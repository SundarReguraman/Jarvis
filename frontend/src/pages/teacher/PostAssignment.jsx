import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function PostAssignment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: '', type: 'assignment', title: '', instructions: '',
    deadline: '', marks: '', submission_format: 'soft_copy_pdf',
    is_group: false, group_size: '', topic_allocation: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/assignments', {
        ...form,
        marks: parseInt(form.marks),
        group_size: form.is_group && form.group_size ? parseInt(form.group_size) : undefined,
      });
      toast.success('Assignment posted successfully!');
      navigate('/teacher/assignments');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to post assignment';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Post Assignment</h1>
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Subject</label>
            <input name="subject" value={form.subject} onChange={handle} required className={inputClass} placeholder="e.g. Data Structures" />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select name="type" value={form.type} onChange={handle} className={inputClass}>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
              <option value="lab_record">Lab Record</option>
              <option value="quiz">Quiz</option>
              <option value="test">Test</option>
              <option value="practical">Practical</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Title</label>
          <input name="title" value={form.title} onChange={handle} required className={inputClass} placeholder="Assignment title" />
        </div>

        <div>
          <label className={labelClass}>Instructions</label>
          <textarea name="instructions" value={form.instructions} onChange={handle} rows={3} className={inputClass} placeholder="Detailed instructions..." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Deadline</label>
            <input name="deadline" type="datetime-local" value={form.deadline} onChange={handle} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Marks</label>
            <input name="marks" type="number" min={0} value={form.marks} onChange={handle} required className={inputClass} placeholder="50" />
          </div>
          <div>
            <label className={labelClass}>Submission Format</label>
            <select name="submission_format" value={form.submission_format} onChange={handle} className={inputClass}>
              <option value="soft_copy_pdf">Soft Copy (PDF)</option>
              <option value="hard_copy_spiral">Hard Copy (Spiral)</option>
              <option value="hard_copy_hard_binding">Hard Copy (Hard Binding)</option>
              <option value="in_class">In Class</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="is_group" name="is_group" checked={form.is_group} onChange={handle} className="w-4 h-4 accent-blue-500" />
          <label htmlFor="is_group" className="text-sm font-medium text-gray-700">Group Assignment</label>
        </div>

        {form.is_group && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className={labelClass}>Group Size</label>
              <input name="group_size" type="number" min={2} value={form.group_size} onChange={handle} className={inputClass} placeholder="3" />
            </div>
            <div>
              <label className={labelClass}>Topic Allocation</label>
              <textarea name="topic_allocation" value={form.topic_allocation} onChange={handle} rows={2} className={inputClass} placeholder="How topics are allocated..." />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors disabled:opacity-60">
            {submitting ? 'Posting...' : 'Post Assignment'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-2 rounded text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
