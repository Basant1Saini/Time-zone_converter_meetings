# Time Zone Converter for Meetings — MERN Stack

A full-stack web app to convert and schedule meetings across time zones using MongoDB, Express, React, and Node.js.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React.js, Axios, Tailwind CSS     |
| Backend   | Node.js, Express.js               |
| Database  | MongoDB, Mongoose                 |
| Auth      | JWT, bcrypt                       |
| Time Zone | `moment-timezone`                 |

---

## Project Structure

```
timezone-converter/
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── MeetingForm.jsx
│       │   ├── TimeZoneSelector.jsx
│       │   ├── MeetingList.jsx
│       │   └── ConvertedTime.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Dashboard.jsx
│       │   └── Login.jsx
│       ├── services/
│       │   └── api.js
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── meetingController.js
│   │   └── authController.js
│   ├── models/
│   │   ├── Meeting.js
│   │   └── User.js
│   ├── routes/
│   │   ├── meetingRoutes.js
│   │   └── authRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── package.json
│   └── index.js
│
├── .env
└── .gitignore
```

---

## Phase 1 — Backend Setup

### 1.1 Initialize Project
```bash
mkdir timezone-converter && cd timezone-converter
mkdir server && cd server
npm init -y
npm install express mongoose dotenv cors moment-timezone jsonwebtoken bcryptjs
npm install --save-dev nodemon
```

### 1.2 MongoDB Connection — `server/config/db.js`
```js
const mongoose = require('mongoose');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};

module.exports = connectDB;
```

### 1.3 User Model — `server/models/User.js`
```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

### 1.4 Meeting Model — `server/models/Meeting.js`
```js
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  dateTime:      { type: Date, required: true },
  fromTZ:        { type: String, required: true },
  toTZ:          { type: String, required: true },
  convertedTime: { type: String },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
```

### 1.5 Auth Controller — `server/controllers/authController.js`
```js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

### 1.6 Meeting Controller — `server/controllers/meetingController.js`
```js
const Meeting = require('../models/Meeting');
const moment = require('moment-timezone');

exports.createMeeting = async (req, res) => {
  try {
    const { title, dateTime, fromTZ, toTZ } = req.body;
    const convertedTime = moment.tz(dateTime, fromTZ).tz(toTZ).format('YYYY-MM-DD HH:mm z');
    const meeting = await Meeting.create({ title, dateTime, fromTZ, toTZ, convertedTime, createdBy: req.user.id });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ createdBy: req.user.id }).sort({ dateTime: 1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { title, dateTime, fromTZ, toTZ } = req.body;
    const convertedTime = moment.tz(dateTime, fromTZ).tz(toTZ).format('YYYY-MM-DD HH:mm z');
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { title, dateTime, fromTZ, toTZ, convertedTime },
      { new: true }
    );
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

### 1.7 Auth Middleware — `server/middleware/authMiddleware.js`
```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

### 1.8 Routes

```js
// server/routes/authRoutes.js
const router = require('express').Router();
const { register, login } = require('../controllers/authController');
router.post('/register', register);
router.post('/login', login);
module.exports = router;

// server/routes/meetingRoutes.js
const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { createMeeting, getMeetings, updateMeeting, deleteMeeting } = require('../controllers/meetingController');
router.use(auth);
router.get('/', getMeetings);
router.post('/', createMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);
module.exports = router;
```

### 1.9 Entry Point — `server/index.js`
```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));

app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));
```

---

## Phase 2 — Frontend Setup

### 2.1 Initialize React App
```bash
cd ..
npm create vite@latest client -- --template react
cd client
npm install axios moment-timezone react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2.2 API Service — `client/src/services/api.js`
```js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### 2.3 TimeZoneSelector Component — `client/src/components/TimeZoneSelector.jsx`
```jsx
import moment from 'moment-timezone';

export default function TimeZoneSelector({ label, value, onChange }) {
  const zones = moment.tz.names();
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {zones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
      </select>
    </div>
  );
}
```

### 2.4 MeetingForm Component — `client/src/components/MeetingForm.jsx`
```jsx
import { useState } from 'react';
import TimeZoneSelector from './TimeZoneSelector';
import api from '../services/api';

const initial = { title: '', dateTime: '', fromTZ: 'America/New_York', toTZ: 'Asia/Kolkata' };

export default function MeetingForm({ onCreated }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
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
      <input required placeholder="Meeting Title" value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        className="border rounded px-3 py-2 text-sm" />
      <input required type="datetime-local" value={form.dateTime}
        onChange={e => setForm({ ...form, dateTime: e.target.value })}
        className="border rounded px-3 py-2 text-sm" />
      <TimeZoneSelector label="From Time Zone" value={form.fromTZ} onChange={v => setForm({ ...form, fromTZ: v })} />
      <TimeZoneSelector label="To Time Zone"   value={form.toTZ}   onChange={v => setForm({ ...form, toTZ: v })} />
      <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition">
        Convert & Save
      </button>
    </form>
  );
}
```

### 2.5 MeetingList Component — `client/src/components/MeetingList.jsx`
```jsx
import api from '../services/api';

export default function MeetingList({ meetings, onDelete }) {
  const handleDelete = async id => {
    await api.delete(`/meetings/${id}`);
    onDelete(id);
  };

  if (!meetings.length) return <p className="text-gray-500 text-sm">No meetings scheduled yet.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {meetings.map(m => (
        <li key={m._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="font-semibold">{m.title}</p>
            <p className="text-sm text-gray-500">{m.convertedTime} <span className="text-blue-500">({m.toTZ})</span></p>
          </div>
          <button onClick={() => handleDelete(m._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### 2.6 Pages

```jsx
// client/src/pages/Home.jsx
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

// client/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-xl font-bold">Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input required type="email" placeholder="Email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded px-3 py-2 text-sm" />
        <input required type="password" placeholder="Password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })} className="border rounded px-3 py-2 text-sm" />
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition">Login</button>
      </form>
    </div>
  );
}

// client/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import MeetingForm from '../components/MeetingForm';
import MeetingList from '../components/MeetingList';
import api from '../services/api';
export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  useEffect(() => { api.get('/meetings').then(r => setMeetings(r.data)).catch(console.error); }, []);
  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">Meeting Scheduler</h1>
      <MeetingForm onCreated={m => setMeetings(prev => [...prev, m])} />
      <h2 className="text-lg font-semibold text-gray-700">Scheduled Meetings</h2>
      <MeetingList meetings={meetings} onDelete={id => setMeetings(prev => prev.filter(m => m._id !== id))} />
    </div>
  );
}
```

---

## Phase 3 — Environment Variables — `.env`

```env
MONGO_URI=mongodb://localhost:27017/timezone-converter
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## Phase 4 — API Endpoints

| Method | Endpoint             | Description       | Auth |
|--------|----------------------|-------------------|------|
| POST   | `/api/auth/register` | Register user     | No   |
| POST   | `/api/auth/login`    | Login & get token | No   |
| GET    | `/api/meetings`      | Get all meetings  | Yes  |
| POST   | `/api/meetings`      | Create meeting    | Yes  |
| PUT    | `/api/meetings/:id`  | Update meeting    | Yes  |
| DELETE | `/api/meetings/:id`  | Delete meeting    | Yes  |

---

## Phase 5 — Run the App

```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Start backend (from server/)
npm run dev

# Start frontend (from client/)
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend:  `http://localhost:5000`

---

## License

MIT
