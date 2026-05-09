import api from '../services/api';

export default function MeetingList({ meetings, onDelete }) {
  const handleDelete = async id => {
    await api.delete(`/meetings/${id}`);
    onDelete(id);
  };

  if (!meetings.length)
    return <p className="text-gray-500 text-sm">No meetings scheduled yet.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {meetings.map(m => (
        <li key={m._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="font-semibold">{m.title}</p>
            <p className="text-sm text-gray-500">{m.convertedTime} <span className="text-blue-500">({m.toTZ})</span></p>
          </div>
          <button
            onClick={() => handleDelete(m._id)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
