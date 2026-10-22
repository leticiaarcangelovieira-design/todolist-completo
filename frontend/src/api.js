const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3333';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

export const api = {
  list: ({ search, status }, signal) => {
    const qs = new URLSearchParams({ search, status });
    return request(`/api/tasks?${qs}`, { signal });
  },
  create: ({ title, dueDate }) =>
    request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, dueDate: dueDate || null }),
    }),
  update: (id, changes) =>
    request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),
  remove: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
};
