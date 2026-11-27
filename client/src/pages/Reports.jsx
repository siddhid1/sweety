import { useCallback, useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api, { todayISO } from '../services/api';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

const TABS = [
  { key: 'daily', label: 'Daily', endpoint: 'daily' },
  { key: 'mtd', label: 'Month-to-date', endpoint: 'month-to-date' },
  { key: 'monthly', label: 'Previous month', endpoint: 'monthly' },
];

export default function Reports() {
  const [tab, setTab] = useState(TABS[0]);
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/${tab.endpoint}?date=${date}`);
      setReport(data.data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [tab, date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const chartData = (report?.readings || []).map((r) => ({
    name: `${r.readingDate.slice(5)} ${r.timeSlotLabel}`,
    value: r.value,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <input
          type="date"
          max={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t)}
            className={`text-sm rounded-lg px-4 py-2 ${
              tab.key === t.key ? 'bg-brand-500 text-white' : 'bg-white border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl h-40 animate-pulse border border-slate-100" />
      ) : report ? (
        <>
          <p className="text-sm text-slate-500">
            Range: {report.dateRange?.start} → {report.dateRange?.end}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Highest" value={report.highest} suffix="mg/dl" />
            <StatCard label="Lowest" value={report.lowest} suffix="mg/dl" />
            <StatCard label="Average" value={report.average} suffix="mg/dl" />
            <StatCard label="Readings" value={report.count} />
          </div>
          {report.count === 0 ? (
            <EmptyState message={report.message} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h2 className="text-sm font-medium mb-2">Glucose trend</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis domain={[40, 600]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {tab.key === 'daily' && (
                <ul className="mt-4 divide-y text-sm">
                  {report.readings.map((r) => (
                    <li key={r.id} className="py-2 flex justify-between">
                      <span>{r.timeSlotLabel}</span>
                      <span className="font-semibold">{r.value} mg/dl</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
