import { useState } from 'react';
import api, { SLOT_OPTIONS, todayISO } from '../services/api';

function validate({ readingDate, timeSlot, value }) {
  if (!value && value !== 0) return 'Please enter a glucose value.';
  const num = Number(value);
  if (!Number.isInteger(num) || num < 40 || num > 600)
    return 'Value must be between 40 and 600 mg/dl.';
  if (!readingDate) return 'Invalid date format. Use YYYY-MM-DD.';
  if (readingDate > todayISO()) return 'Date cannot be in the future.';
  if (!timeSlot) return 'Invalid time slot.';
  return null;
}

export default function ReadingForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    readingDate: initial?.readingDate || todayISO(),
    timeSlot: initial?.timeSlot || 'MORNING',
    value: initial?.value ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const clientError = validate(form);
    if (clientError) {
      setError(clientError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (initial?.id) {
        await api.put(`/readings/${initial.id}`, { ...form, value: Number(form.value) });
      } else {
        await api.post('/readings', { ...form, value: Number(form.value) });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reading.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-sm text-slate-600">Date</span>
          <input
            type="date"
            max={todayISO()}
            value={form.readingDate}
            onChange={(e) => setForm({ ...form, readingDate: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Time slot</span>
          <select
            value={form.timeSlot}
            onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {SLOT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">Glucose (mg/dl)</span>
          <input
            type="number"
            step="1"
            min="40"
            max="600"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="e.g. 120"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm"
        >
          {saving ? 'Saving…' : initial?.id ? 'Update reading' : 'Add reading'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="bg-slate-100 hover:bg-slate-200 rounded-lg px-4 py-2 text-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
