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
| Time Zone | `moment-timezone` / `date-fns-tz` |

---

## Project Structure

```
timezone-converter/
├── client/                   # React frontend
│   ├── public/
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
│       └── main.jsx
│
├── server/                   # Express backend
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
│   └── index.js
│
├── .env
└── package.json
```

---

## Phase 1 — Backend Setup

### 1.1 Initialize Project
```bash
mkdir timezone-converter && cd timezone-converter
mkdir server && cd server
npm init -y
npm install express mongoose dotenv cors moment-timezone jsonwebtoken bcryptjs
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
  title:       { type: String, required: true },
  dateTime:    { type: Date, required: true },
  fromTZ:      { type: String, required: true },
  toTZ:        { type: String, required: true },
  convertedTime: { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
```

### 1.5 Auth Controller — `server/controllers/authController.js`
```js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });
  res.status(201).json({ message: 'User registered' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
};
```

### 1.6 Meeting Controller — `server/controllers/meetingController.js`
```js
const Meeting = require('../models/Meeting');
const moment = require('moment-timezone');

exports.createMeeting = async (req, res) => {
  const { title, dateTime, fromTZ, toTZ } = req.body;
  const convertedTime = moment.tz(dateTime, fromTZ).tz(toTZ).format('YYYY-MM-DD HH:mm z');
  const meeting = await Meeting.create({ title, dateTime, fromTZ, toTZ, convertedTime, createdBy: req.user.id });
  res.status(201).json(meeting);
};

exports.getMeetings = async (req, res) => {
  const meetings = await Meeting.find({ createdBy: req.user.id }).sort({ dateTime: 1 });
  res.json(meetings);
};

exports.deleteMeeting = async (req, res) => {
  await Meeting.findByIdAndDelete(req.params.id);
  res.json({ message: 'Meeting deleted' });
};
```

### 1.7 Auth Middleware — `server/middleware/authMiddleware.js`
```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  req.user = jwt.verify(token, process.env.JWT_SECRET);
  next();
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
const { createMeeting, getMeetings, deleteMeeting } = require('../controllers/meetingController');
router.use(auth);
router.post('/', createMeeting);
router.get('/', getMeetings);
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

app.listen(process.env.PORT || 5000, () => console.log('Server running on port 5000'));
```

---

## Phase 2 — Frontend Setup

### 2.1 Initialize React App
```bash
cd ..
npm create vite@latest client -- --template react
cd client
npm install axios moment-timezone react-router-dom
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
    <div>
      <label>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}>
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

export default function MeetingForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', dateTime: '', fromTZ: 'US/Eastern', toTZ: 'Asia/Kolkata' });

  const handleSubmit = async e => {
    e.preventDefault();
    const { data } = await api.post('/meetings', form);
    onCreated(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Meeting Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <input type="datetime-local" value={form.dateTime} onChange={e => setForm({ ...form, dateTime: e.target.value })} />
      <TimeZoneSelector label="From" value={form.fromTZ} onChange={v => setForm({ ...form, fromTZ: v })} />
      <TimeZoneSelector label="To"   value={form.toTZ}   onChange={v => setForm({ ...form, toTZ: v })} />
      <button type="submit">Convert & Save</button>
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

  return (
    <ul>
      {meetings.map(m => (
        <li key={m._id}>
          <strong>{m.title}</strong> — {m.convertedTime} ({m.toTZ})
          <button onClick={() => handleDelete(m._id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### 2.6 Dashboard Page — `client/src/pages/Dashboard.jsx`
```jsx
import { useEffect, useState } from 'react';
import MeetingForm from '../components/MeetingForm';
import MeetingList from '../components/MeetingList';
import api from '../services/api';

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    api.get('/meetings').then(r => setMeetings(r.data));
  }, []);

  return (
    <div>
      <h1>Schedule a Meeting</h1>
      <MeetingForm onCreated={m => setMeetings([...meetings, m])} />
      <MeetingList meetings={meetings} onDelete={id => setMeetings(meetings.filter(m => m._id !== id))} />
    </div>
  );
}
```

---

## Phase 3 — Environment Variables

```env
# .env
MONGO_URI=mongodb://localhost:27017/timezone-converter
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## Phase 4 — API Endpoints

| Method | Endpoint              | Description           | Auth |
|--------|-----------------------|-----------------------|------|
| POST   | `/api/auth/register`  | Register user         | No   |
| POST   | `/api/auth/login`     | Login & get token     | No   |
| GET    | `/api/meetings`       | Get all meetings      | Yes  |
| POST   | `/api/meetings`       | Create meeting        | Yes  |
| DELETE | `/api/meetings/:id`   | Delete meeting        | Yes  |

---

## Phase 5 — Run the App

```bash
# Start backend
cd server && node index.js

# Start frontend
cd client && npm run dev
```

- Frontend: `http://localhost:5173`
- Backend:  `http://localhost:5000`

---

## License

MIT
