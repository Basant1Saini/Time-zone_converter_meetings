import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <h1 className="text-3xl font-bold text-gray-800">Time Zone Converter for Meetings</h1>
      <p className="text-gray-500">Schedule meetings across any time zone with ease.</p>
      <div className="flex gap-4">
        <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Login</Link>
        <Link to="/dashboard" className="border border-blue-600 text-blue-600 px-6 py-2 rounded hover:bg-blue-50 transition">Dashboard</Link>
      </div>
    </div>
  );
}
