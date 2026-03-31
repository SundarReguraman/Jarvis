import { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

const TYPE_DOT = {
  assignment: 'bg-blue-500',
  project: 'bg-purple-500',
  lab_record: 'bg-green-500',
  test: 'bg-amber-500',
  quiz: 'bg-amber-500',
  practical: 'bg-green-500',
  model_exam: 'bg-red-500',
  lab_practical: 'bg-green-500',
};

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/assignments'), api.get('/tests')])
      .then(([aRes, tRes]) => {
        setAssignments(aRes.data.assignments || []);
        setTests(tRes.data.tests || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDayOfWeek = startOfMonth(currentMonth).getDay();

  const getItemsForDay = (day) => {
    const aItems = assignments.filter(a => isSameDay(new Date(a.deadline), day)).map(a => ({ ...a, _isTest: false }));
    const tItems = tests.filter(t => isSameDay(new Date(t.date), day)).map(t => ({ ...t, _isTest: true }));
    return [...aItems, ...tItems];
  };

  const selectedItems = selectedDay ? getItemsForDay(selectedDay) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 text-gray-500 hover:text-gray-700"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium text-gray-700 w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 text-gray-500 hover:text-gray-700"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap mb-4 text-xs">
        {[['assignment', 'Assignment', 'bg-blue-500'], ['project', 'Project', 'bg-purple-500'], ['lab_record', 'Lab Record', 'bg-green-500'], ['test', 'Test/Exam', 'bg-amber-500']].map(([, label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {loading ? <div className="text-gray-500 text-sm">Loading...</div> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-xs font-medium text-gray-500 text-center py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-16 border-r border-b border-gray-100 bg-gray-50" />
            ))}
            {days.map(day => {
              const items = getItemsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <div key={day.toISOString()} onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-16 border-r border-b border-gray-100 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-500 text-white' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {items.slice(0, 3).map((item, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${TYPE_DOT[item.type] || 'bg-gray-400'}`} title={item.title} />
                    ))}
                    {items.length > 3 && <span className="text-xs text-gray-400">+{items.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDay && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3 text-sm">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</h3>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing due on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded border-l-2 border-l-gray-300">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_DOT[item.type] || 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.subject} · {item._isTest ? 'Test/Exam' : item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
