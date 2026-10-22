import { CheckIcon, PencilIcon, TrashIcon } from './Icons.jsx';

export function todayISO() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD no fuso local
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const completed = Boolean(task.completed);
  const due = task.due_date ? task.due_date.slice(0, 10) : null;
  const overdue = !completed && due && due < todayISO();

  return (
    <li className="task">
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-label={completed ? 'Mark as pending' : 'Mark as completed'}
        className={`check ${completed ? 'is-checked' : ''}`}
        onClick={() => onToggle(task)}
      >
        {completed && <CheckIcon />}
      </button>

      <div className="task-body">
        <span
          className={`task-title ${completed ? 'is-done' : ''} ${overdue ? 'is-overdue' : ''}`}
        >
          {task.title}
        </span>
        {(due || overdue) && (
          <span className="task-meta">
            {due && <span>{formatDate(due)}</span>}
            {overdue && <span className="badge">Em atraso</span>}
          </span>
        )}
      </div>

      <div className="task-actions">
        <button type="button" className="icon-btn" aria-label="Edit task" onClick={() => onEdit(task)}>
          <PencilIcon />
        </button>
        <button
          type="button"
          className="icon-btn danger"
          aria-label="Delete task"
          onClick={() => onDelete(task)}
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
