import { useCallback, useEffect, useState } from 'react';
import api, { SLOT_OPTIONS, slotLabel, rangeColor } from '../services/api';
import ReadingForm from '../components/ReadingForm';
import EmptyState from '../components/EmptyState';

export default function Readings() {
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [slotFilter, setSlotFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');

  const fetchPage = useCallback(
    async (p = 1, slot = slotFilter) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), limit: '20' });
        if (slot) params.set('timeSlot', slot);
        const { data } = await api.get(`/readings?${params.toString()}`);
        setReadings(data.data || []);
        setPagination(data.pagination || null);
        setPage(p);
      } finally {
        setLoading(false);
      }
    },
    [slotFilter]
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  function handleFilterChange(e) {
    const slot = e.target.value;
    setSlotFilter(slot);
    fetchPage(1, slot);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this reading?')) return;
    await api.delete(`/readings/${id}`);
    setNotice('Reading deleted.');
    fetchPage(page);
    setTimeout(() => setNotice(''), 2500);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">All readings</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Filter by slot
          <select
            value={slotFilter}
            onChange={handleFilterChange}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
          >
            <option value="">All slots</option>
            {SLOT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {notice && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{notice}</p>}
      {editing && (
        <ReadingForm
          initial={editing}
          onSaved={() => {
            setEditing(null);
            fetchPage(page);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
      {loading ? (
        <div className="bg-white rounded-2xl h-40 animate-pulse border border-slate-100" />
      ) : readings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y">
            {readings.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold rounded-full px-2.5 py-1 ${rangeColor(r.value)}`}>
                    {r.value}
                  </span>
                  <div>
                    <div className="text-sm font-medium">
                      {r.readingDate} · {r.timeSlotLabel || slotLabel(r.timeSlot)}
                    </div>
                    <div className="text-xs text-slate-500">mg/dl</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(r)}
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
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => fetchPage(page - 1)}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => fetchPage(page + 1)}
                className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
