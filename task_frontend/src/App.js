import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import { api, setAuthToken, clearAuthToken } from './utils/api';

// --- UI Elements ---

function Navbar({ isAuthenticated, onLogout }) {
  return (
    <nav className="navbar">
      <Link className="navbar-brand" to="/">TaskFlow</Link>
      <div className="navbar-links">
        {isAuthenticated ? (
          <button className="btn" onClick={onLogout}>Logout</button>
        ) : (
          <>
            <Link className="btn" to="/login">Login</Link>
            <Link className="btn" to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}

// --- Authentication ---

function Login({ onAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.access_token) {
        onAuth(response.access_token);
        navigate('/');
      } else {
        setErr('Invalid credentials.');
      }
    } catch (error) {
      setErr('Invalid credentials.');
    }
  };
  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoFocus required />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <button type="submit" className="btn btn-large">Login</button>
        {err && <div className="error">{err}</div>}
      </form>
      <div className="auth-switch">
        Don't have an account? <Link to="/register">Register</Link>
      </div>
    </div>
  );
}

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/auth/register', { username, password });
      setMsg('Registration successful. Please log in.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setErr(error?.detail || 'Registration failed.');
    }
  };
  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoFocus required />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <button type="submit" className="btn btn-large">Register</button>
        {err && <div className="error">{err}</div>}
        {msg && <div className="msg">{msg}</div>}
      </form>
      <div className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
}

// --- Dashboard & Tasks ---

function Dashboard({ token }) {
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <TaskList token={token} />
    </div>
  );
}

function TaskList({ token }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let params = [];
      if (filter) params.push(`filter=${encodeURIComponent(filter)}`);
      if (sortDir) params.push(`sort=${sortDir}`);
      const url = '/tasks' + (params.length > 0 ? '?' + params.join('&') : '');
      const res = await api.get(url, token);
      setTasks(res.tasks || res);
    } catch (error) {
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, [filter, sortDir]);

  const onDelete = async (id) => {
    await api.delete(`/tasks/${id}`, token);
    fetchTasks();
  };

  const onEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const onFormClose = () => {
    setEditingTask(null);
    setShowForm(false);
    fetchTasks();
  };

  return (
    <div className="tasklist-container">
      <div className="task-controls">
        <input
          type="text"
          placeholder="Filter tasks"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="task-filter"
        />
        <button className="btn" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>
          Sort: {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
        <button className="btn btn-accent" onClick={() => setShowForm(true)}>+ Add Task</button>
      </div>
      {showForm && (
        <TaskForm
          token={token}
          onClose={onFormClose}
          editTask={editingTask}
        />
      )}
      <div className="tasks-list">
        {loading ? (
          <div>Loading...</div>
        ) : (!tasks.length ? (
          <div>No tasks found.</div>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              {...task}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
            />
          ))
        ))}
      </div>
    </div>
  );
}

function TaskItem({ title, description, status, id, onEdit, onDelete }) {
  return (
    <div className={`task-item${status === 'completed' ? ' completed-task' : ''}`}>
      <div className="task-title">{title}</div>
      <div className="task-desc">{description}</div>
      <div className="task-status">
        <span className={`badge${status === 'completed' ? ' badge-success' : ' badge-pending'}`}>
          {status}
        </span>
      </div>
      <div className="task-actions">
        <button className="btn btn-small btn-edit" onClick={onEdit}>Edit</button>
        <button className="btn btn-small btn-delete" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

function TaskForm({ token, onClose, editTask }) {
  const isEdit = !!editTask;
  const [title, setTitle] = useState(isEdit ? editTask.title : '');
  const [description, setDescription] = useState(isEdit ? editTask.description : '');
  const [status, setStatus] = useState(isEdit ? editTask.status : 'pending');
  const [err, setErr] = useState('');

  const saveTask = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (isEdit) {
        await api.put(`/tasks/${editTask.id}`, { title, description, status }, token);
      } else {
        await api.post('/tasks', { title, description, status }, token);
      }
      onClose();
    } catch (error) {
      setErr(error?.detail || "Failed to save task.");
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{isEdit ? 'Edit Task' : 'Add Task'}</h3>
        <form className="task-form" onSubmit={saveTask}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required autoFocus />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={3} required />
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent">{isEdit ? "Update" : "Create"}</button>
          </div>
          {err && <div className="error">{err}</div>}
        </form>
      </div>
    </div>
  );
}

// --- Main App ---

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [token, setToken] = useState(() => localStorage.getItem('jwt_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem('jwt_token', token);
      setIsAuthenticated(true);
    } else {
      clearAuthToken();
      localStorage.removeItem('jwt_token');
      setIsAuthenticated(false);
    }
  }, [token]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const logout = () => setToken(null);

  // PUBLIC_INTERFACE
  function PrivateRoute({ children }) {
    return isAuthenticated ? children : <Navigate to="/login" />;
  }

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} onLogout={logout} />
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<Login onAuth={setToken} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard token={token} />
              </PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
