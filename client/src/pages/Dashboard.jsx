import { useEffect, useState } from 'react';
import MeetingForm from '../components/MeetingForm';
import MeetingList from '../components/MeetingList';
import api from '../services/api';

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    api.get('/meetings').then(r => setMeetings(r.data)).catch(console.error);
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">Meeting Scheduler</h1>
      <MeetingForm onCreated={m => setMeetings(prev => [...prev, m])} />
      <h2 className="text-lg font-semibold text-gray-700">Scheduled Meetings</h2>
      <MeetingList
        meetings={meetings}
        onDelete={id => setMeetings(prev => prev.filter(m => m._id !== id))}
      />
    </div>
  );
}
