import moment from 'moment-timezone';

export default function TimeZoneSelector({ label, value, onChange }) {
  const zones = moment.tz.names();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {zones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
      </select>
    </div>
  );
}
