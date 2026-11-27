export default function EmptyState({ message }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
      {message || 'No glucose readings found for this period. Start by adding your first reading.'}
    </div>
  );
}
