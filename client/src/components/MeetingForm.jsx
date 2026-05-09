import { useState } from 'react';
import TimeZoneSelector from './TimeZoneSelector';
import api from '../services/api';

const initial = { title: '', dateTime: '', fromTZ: 'America/New_York', toTZ: 'Asia/Kolkata' };

export default function MeetingForm({ onCreated }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/meetings', form);
      onCreated(data);
      setForm(initial);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow flex flex-col gap-4">
      <h2 className="text-lg font-semibold">New Meeting</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <input
        required
        placeholder="Meeting Title"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        required
        type="datetime-local"
        value={form.dateTime}
        onChange={e => setForm({ ...form, dateTime: e.target.value })}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <TimeZoneSelector label="From Time Zone" value={form.fromTZ} onChange={v => setForm({ ...form, fromTZ: v })} />
      <TimeZoneSelector label="To Time Zone"   value={form.toTZ}   onChange={v => setForm({ ...form, toTZ: v })} />
      <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition">
        Convert & Save
      </button>
    </form>
  );
}
