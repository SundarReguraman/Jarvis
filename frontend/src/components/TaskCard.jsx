import { Link } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { Clock, BookOpen, FileText } from 'lucide-react';

const TYPE_COLORS = {
  assignment: 'border-blue-500',
  project: 'border-purple-500',
  lab_record: 'border-green-500',
  test: 'border-amber-500',
  quiz: 'border-amber-500',
  practical: 'border-green-500',
  model_exam: 'border-amber-500',
  lab_practical: 'border-green-500',
};

const TYPE_BG = {
  assignment: 'bg-blue-100 text-blue-700',
  project: 'bg-purple-100 text-purple-700',
  lab_record: 'bg-green-100 text-green-700',
  test: 'bg-amber-100 text-amber-700',
  quiz: 'bg-amber-100 text-amber-700',
  practical: 'bg-green-100 text-green-700',
  model_exam: 'bg-amber-100 text-amber-700',
  lab_practical: 'bg-green-100 text-green-700',
};

export default function TaskCard({ item, isTest = false, onSubmit }) {
  const deadline = isTest ? new Date(item.date) : new Date(item.deadline);
  const daysLeft = differenceInDays(deadline, new Date());
  const isDueSoon = daysLeft >= 0 && daysLeft <= 5;
  const isOverdue = daysLeft < 0;
  const typeKey = item.type || 'assignment';

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 border-l-4 ${TYPE_COLORS[typeKey] || 'border-gray-300'}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BG[typeKey] || 'bg-gray-100 text-gray-600'}`}>
              {typeKey.replace('_', ' ').toUpperCase()}
            </span>
            {isDueSoon && !isOverdue && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                DUE SOON
              </span>
            )}
            {isOverdue && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                OVERDUE
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-800 text-sm truncate">{item.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{item.subject}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {!isTest && item.marks !== undefined && (
            <p className="text-xs font-medium text-gray-700">{item.marks} marks</p>
          )}
          <div className={`flex items-center gap-1 text-xs mt-1 ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-orange-500' : 'text-gray-500'}`}>
            <Clock size={12} />
            <span>
              {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{format(deadline, 'MMM d, yyyy')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <FileText size={12} />
          <span>{item.teacher_name || 'Teacher'}</span>
        </div>
        <div className="flex gap-2">
          {!isTest && (
            item.is_submitted ? (
              <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded">✓ Submitted</span>
            ) : (
              <button onClick={() => onSubmit && onSubmit(item)}
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors">
                Submit
              </button>
            )
          )}
          {isTest && (
            <Link to={`/student/roadmap/${item.id}`}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded transition-colors flex items-center gap-1">
              <BookOpen size={12} />
              Study Roadmap
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
