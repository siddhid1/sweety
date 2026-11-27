export default function StatCard({ label, value, suffix }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">
        {value ?? '—'}
        {suffix && value != null && <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
