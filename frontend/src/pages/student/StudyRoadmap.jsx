import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function StudyRoadmap() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [days, setDays] = useState([]);
  const [twoDayCheck, setTwoDayCheck] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [unsureTopics, setUnsureTopics] = useState([]);
  const [showUnsurePrompt, setShowUnsurePrompt] = useState(false);

  const loadRoadmap = async () => {
    try {
      const { data } = await api.get(`/roadmap/tests/${testId}/roadmap`);
      setRoadmap(data.roadmap);
      setDays(data.roadmap.days || []);
      setTwoDayCheck(data.two_day_confidence_check);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load roadmap');
    }
  };

  const loadTest = async () => {
    try {
      const { data } = await api.get(`/tests/${testId}`);
      setTest(data.test);
    } catch {}
  };

  useEffect(() => {
    Promise.all([loadTest(), loadRoadmap()]).finally(() => setLoading(false));
  }, [testId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post(`/roadmap/tests/${testId}/generate`);
      setRoadmap(data.roadmap);
      setDays(data.days || []);
      setTwoDayCheck(data.two_day_confidence_check);
      toast.success('Roadmap generated!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to generate roadmap';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const toggleTopic = async (dayNumber, topic, allTopics, completedTopics) => {
    const isCompleted = completedTopics.includes(topic);
    const newCompleted = isCompleted
      ? completedTopics.filter(t => t !== topic)
      : [...completedTopics, topic];

    try {
      const { data } = await api.put(`/roadmap/tests/${testId}/roadmap/progress`, {
        day_number: dayNumber,
        completed_topics: newCompleted,
        unsure_topics: [],
      });
      setDays(data.days || days.map(d => d.day_number === dayNumber ? { ...d, completed_topics: newCompleted } : d));
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const submitUnsure = async (dayNumber) => {
    try {
      const { data } = await api.put(`/roadmap/tests/${testId}/roadmap/progress`, {
        day_number: dayNumber,
        completed_topics: days.find(d => d.day_number === dayNumber)?.completed_topics || [],
        unsure_topics: unsureTopics,
      });
      setDays(data.days || days);
      setShowUnsurePrompt(false);
      setUnsureTopics([]);
      toast.success('Plan adjusted based on your unsure topics!');
    } catch {
      toast.error('Failed to adjust plan');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const getStatus = (day) => {
    if (day.is_completed) return 'completed';
    if (day.date === today) return 'current';
    if (day.date < today) return 'past';
    return 'upcoming';
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading...</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-gray-800">Study Roadmap</h1>
      </div>

      {test && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-gray-800">{test.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{test.subject} · {test.type?.replace('_', ' ')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Test Date</p>
              <p className="text-sm font-semibold text-amber-600">{format(new Date(test.date), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      )}

      {twoDayCheck && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">🎯 Exam in 2 days! Are you ready?</p>
              <p className="text-xs text-yellow-700 mt-1">Which topics are you unsure about?</p>
              {!showUnsurePrompt ? (
                <button onClick={() => setShowUnsurePrompt(true)} className="mt-2 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition-colors">
                  Adjust my plan
                </button>
              ) : (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {test?.syllabus_topics?.map(topic => (
                      <button key={topic} onClick={() => setUnsureTopics(u => u.includes(topic) ? u.filter(t => t !== topic) : [...u, topic])}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${unsureTopics.includes(topic) ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-600 border-gray-200 hover:border-yellow-300'}`}>
                        {topic}
                      </button>
                    ))}
                  </div>
                  {days.length > 0 && (
                    <button onClick={() => submitUnsure(days[days.length - 1]?.day_number || 1)}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors">
                      Confirm & Adjust Plan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!roadmap ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">No roadmap generated yet. Create a personalized study plan!</p>
          {test?.syllabus_topics?.length > 0 && (
            <div className="mb-4 text-left max-w-xs mx-auto">
              <p className="text-xs font-medium text-gray-600 mb-2">Topics to cover:</p>
              <ul className="space-y-1">
                {test.syllabus_topics.map(t => <li key={t} className="text-xs text-gray-500 flex items-center gap-1.5"><Circle size={8} />{t}</li>)}
              </ul>
            </div>
          )}
          <button onClick={generate} disabled={generating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium disabled:opacity-60 flex items-center gap-2 mx-auto transition-colors">
            {generating ? <><RefreshCw size={14} className="animate-spin" /> Generating...</> : 'Generate Roadmap'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{days.length} day study plan</p>
            <button onClick={generate} disabled={generating}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded transition-colors">
              <RefreshCw size={12} className={generating ? 'animate-spin' : ''} /> Regenerate
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {days.map(day => {
                const status = getStatus(day);
                const completed = day.completed_topics || [];
                const statusColors = {
                  completed: 'bg-green-500 border-green-500',
                  current: 'bg-blue-500 border-blue-500',
                  past: 'bg-gray-300 border-gray-300',
                  upcoming: 'bg-white border-gray-300',
                };
                const cardColors = {
                  completed: 'border-green-200 bg-green-50',
                  current: 'border-blue-200 bg-blue-50',
                  past: 'border-gray-200',
                  upcoming: 'border-gray-200',
                };

                return (
                  <div key={day.day_number} className="relative flex gap-4 pl-12">
                    <div className={`absolute left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${statusColors[status]}`}>
                      {status === 'completed' && <CheckCircle size={12} className="text-white" />}
                      {status === 'current' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>

                    <div className={`flex-1 bg-white border rounded-lg p-4 ${cardColors[status]}`}>
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div>
                          <span className="text-xs font-semibold text-gray-600">Day {day.day_number}</span>
                          <span className="text-xs text-gray-400 ml-2">{format(new Date(day.date.includes('T') ? day.date : day.date + 'T00:00:00'), 'EEE, MMM d')}</span>
                          {status === 'current' && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">TODAY</span>}
                        </div>
                        {day.is_revision_day && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Revision Day</span>
                        )}
                      </div>

                      <p className="text-sm font-medium text-gray-800 mb-2">{day.goal}</p>

                      {day.topics?.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Topics:</p>
                          <div className="space-y-1">
                            {day.topics.map(topic => {
                              const isDone = completed.includes(topic);
                              return (
                                <div key={topic} onClick={() => toggleTopic(day.day_number, topic, day.topics, completed)}
                                  className="flex items-center gap-2 cursor-pointer group">
                                  {isDone
                                    ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                    : <Circle size={14} className="text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
                                  }
                                  <span className={`text-xs ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>{topic}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {day.resources?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Resources:</p>
                          <div className="flex flex-wrap gap-1">
                            {day.resources.map((r, i) => (
                              r.startsWith('http') ? (
                                <a key={i} href={r} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">{r}</a>
                              ) : (
                                <span key={i} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{r}</span>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
