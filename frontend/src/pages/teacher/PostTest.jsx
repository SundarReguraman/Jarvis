import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function PostTest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: 'test', title: '', subject: '', date: '' });
  const [topics, setTopics] = useState([]);
  const [resources, setResources] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [resourceInput, setResourceInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const addTopic = () => {
    if (topicInput.trim()) { setTopics(t => [...t, topicInput.trim()]); setTopicInput(''); }
  };
  const removeTopic = (i) => setTopics(t => t.filter((_, idx) => idx !== i));
  const addResource = () => {
    if (resourceInput.trim()) { setResources(r => [...r, resourceInput.trim()]); setResourceInput(''); }
  };
  const removeResource = (i) => setResources(r => r.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tests', { ...form, syllabus_topics: topics, resources });
      toast.success('Test scheduled successfully!');
      navigate('/teacher/tests');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to schedule test';
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
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-gray-800">Schedule Test / Exam</h1>
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type</label>
            <select name="type" value={form.type} onChange={handle} className={inputClass}>
              <option value="test">Test</option>
              <option value="model_exam">Model Exam</option>
              <option value="lab_practical">Lab Practical</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Subject</label>
            <input name="subject" value={form.subject} onChange={handle} required className={inputClass} placeholder="e.g. Mathematics" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Title</label>
          <input name="title" value={form.title} onChange={handle} required className={inputClass} placeholder="e.g. Unit 2 Test" />
        </div>

        <div>
          <label className={labelClass}>Date</label>
          <input name="date" type="date" value={form.date} onChange={handle} required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Syllabus Topics</label>
          <div className="flex gap-2 mb-2">
            <input value={topicInput} onChange={e => setTopicInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
              className={`${inputClass} flex-1`} placeholder="Add topic and press Enter" />
            <button type="button" onClick={addTopic} className="bg-blue-500 text-white px-3 rounded hover:bg-blue-600">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((t, i) => (
              <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                {t}
                <button type="button" onClick={() => removeTopic(i)} className="hover:text-red-500"><X size={10} /></button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Resources</label>
          <div className="flex gap-2 mb-2">
            <input value={resourceInput} onChange={e => setResourceInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addResource())}
              className={`${inputClass} flex-1`} placeholder="Add resource link or name" />
            <button type="button" onClick={addResource} className="bg-green-500 text-white px-3 rounded hover:bg-green-600">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {resources.map((r, i) => (
              <span key={i} className="flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">
                {r}
                <button type="button" onClick={() => removeResource(i)} className="hover:text-red-500"><X size={10} /></button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium transition-colors disabled:opacity-60">
            {submitting ? 'Scheduling...' : 'Schedule Test'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-2 rounded text-sm font-medium">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
