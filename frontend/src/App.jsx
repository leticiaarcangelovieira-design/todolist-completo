import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useDebounce } from './hooks/useDebounce.js';
import TaskItem from './components/TaskItem.jsx';
import TaskModal from './components/TaskModal.jsx';
import { ChevronIcon, MoonIcon, PlusIcon, SearchIcon, SunIcon } from './components/Icons.jsx';

const STATUS_OPTIONS = [
  { value: 'all', label: 'ALL' },
  { value: 'pending', label: 'PENDING' },
  { value: 'completed', label: 'COMPLETED' },
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [totals, setTotals] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const debouncedSearch = useDebounce(search, 350);

  const [modal, setModal] = useState(null); // null | { task: null | Task }
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  // Busca (com debounce), filtro e recarregamentos após mutações
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    api
      .list({ search: debouncedSearch.trim(), status }, controller.signal)
      .then((data) => {
        setTasks(data.tasks);
        setTotals({ total: data.total, completed: data.completed });
        setError('');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError('Could not load tasks. Check that the server is running.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, status, refreshKey]);

  async function handleToggle(task) {
    try {
      await api.update(task.id, { completed: !task.completed });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.remove(task.id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit({ title, dueDate }) {
    if (modal.task) {
      await api.update(modal.task.id, { title, dueDate });
    } else {
      await api.create({ title, dueDate });
    }
    setModal(null);
    refresh();
  }

  const closeModal = useCallback(() => setModal(null), []);
  const isSearching = debouncedSearch.trim() !== '';

  return (
    <main className="card">
      <h1>TODO LIST</h1>

      <div className="toolbar">
        <label className="search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tasks"
          />
        </label>

        <div className="select">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronIcon />
        </div>

        <button
          type="button"
          className="square-btn"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>

      <p className="counters" aria-live="polite">
        <strong>{totals.total}</strong> {totals.total === 1 ? 'task' : 'tasks'} ·{' '}
        <strong>{totals.completed}</strong> completed
      </p>

      {error && <p className="banner" role="alert">{error}</p>}

      <section className="list-area">
        {tasks.length > 0 ? (
          <ul className="list">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={(t) => setModal({ task: t })}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        ) : (
          !loading && (
            <p className="empty">
              {isSearching ? 'No tasks match your search.' : 'You have no pending tasks.'}
            </p>
          )
        )}
      </section>

      <button type="button" className="fab" aria-label="Create task" onClick={() => setModal({ task: null })}>
        <PlusIcon />
      </button>

      {modal && <TaskModal task={modal.task} onClose={closeModal} onSubmit={handleSubmit} />}
    </main>
  );
}
