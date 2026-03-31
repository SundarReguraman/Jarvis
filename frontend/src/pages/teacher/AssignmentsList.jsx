import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';

const TYPE_BADGE = {
  assignment: 'bg-blue-100 text-blue-700',
  project: 'bg-purple-100 text-purple-700',
  lab_record: 'bg-green-100 text-green-700',
  test: 'bg-amber-100 text-amber-700',
  quiz: 'bg-amber-100 text-amber-700',
  practical: 'bg-green-100 text-green-700',
};
const TYPE_BORDER = {
  assignment: 'border-l-blue-500',
  project: 'border-l-purple-500',
  lab_record: 'border-l-green-500',
  test: 'border-l-amber-500',
  quiz: 'border-l-amber-500',
  practical: 'border-l-green-500',
};

export default function AssignmentsList() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assignments').then(r => setAssignments(r.data.assignments || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Assignments</h1>
        <Link to="/teacher/assignments/new" className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors">
          <Plus size={14} /> New Assignment
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">No assignments yet. Create your first one!</p>
          <Link to="/teacher/assignments/new" className="mt-3 inline-block text-blue-500 text-sm hover:underline">Create Assignment</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={a.id} className={`bg-white border border-gray-200 border-l-4 ${TYPE_BORDER[a.type] || 'border-l-gray-300'} rounded-lg p-4`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[a.type] || 'bg-gray-100 text-gray-600'}`}>
                      {a.type?.replace('_', ' ').toUpperCase()}
                    </span>
                    {a.is_group && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1"><Users size={10} /> Group</span>}
                  </div>
                  <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{a.subject}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700">{a.marks} marks</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 justify-end">
                    <Calendar size={11} />
                    <span>{format(new Date(a.deadline), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                  <Link to={`/teacher/assignments/${a.id}/submissions`}
                    className="mt-2 inline-block text-xs bg-gray-800 hover:bg-gray-900 text-white px-3 py-1 rounded transition-colors">
                    View Submissions
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
