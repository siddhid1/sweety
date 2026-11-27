import { useCallback, useEffect, useState } from 'react';
import api, { todayISO, rangeColor } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ReadingForm from '../components/ReadingForm';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/daily?date=${date}`);
      setReport(data.data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this reading?')) return;
    await api.delete(`/readings/${id}`);
    setNotice('Reading deleted.');
    fetchDaily();
    setTimeout(() => setNotice(''), 2500);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {user?.name?.split(' ')[0] || 'friend'}</h1>
          <p className="text-sm text-slate-500">Track today&apos;s glucose readings.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            max={todayISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(!showForm);
            }}
            className="bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-4 py-2 text-sm"
          >
            {showForm ? 'Close' : '+ Add reading'}
          </button>
        </div>
      </div>

      {notice && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{notice}</p>}

      {showForm && (
        <ReadingForm
          initial={editing}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            setNotice(editing ? 'Reading updated.' : 'Reading saved.');
            fetchDaily();
            setTimeout(() => setNotice(''), 2500);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Highest" value={report.highest} suffix="mg/dl" />
            <StatCard label="Lowest" value={report.lowest} suffix="mg/dl" />
            <StatCard label="Average" value={report.average} suffix="mg/dl" />
            <StatCard label="Readings" value={report.count} />
          </div>
          {report.count === 0 ? (
            <EmptyState message={report.message} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y">
              {report.readings.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold rounded-full px-2.5 py-1 ${rangeColor(r.value)}`}>
                      {r.value}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{r.timeSlotLabel}</div>
                      <div className="text-xs text-slate-500">{r.readingDate}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(r);
                        setShowForm(true);
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-3 py-1.5"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
