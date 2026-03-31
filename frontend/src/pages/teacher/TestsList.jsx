import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';

const TYPE_BADGE = {
  test: 'bg-amber-100 text-amber-700',
  model_exam: 'bg-red-100 text-red-700',
  lab_practical: 'bg-green-100 text-green-700',
};

export default function TestsList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tests').then(r => setTests(r.data.tests || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Tests & Exams</h1>
        <Link to="/teacher/tests/new" className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded text-sm transition-colors">
          <Plus size={14} /> Schedule Test
        </Link>
      </div>

      {loading ? <div className="text-gray-500 text-sm">Loading...</div> : tests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">No tests scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 border-l-4 border-l-amber-500">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[t.type] || 'bg-gray-100 text-gray-600'}`}>
                      {t.type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">{t.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{t.subject}</p>
                  {t.syllabus_topics?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{t.syllabus_topics.length} topic(s) in syllabus</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-600 justify-end">
                    <Calendar size={14} />
                    <span>{format(new Date(t.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
