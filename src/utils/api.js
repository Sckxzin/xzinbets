async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;
  if (!res.ok) throw new Error(body?.error || `Erro na requisição (${res.status})`);
  return body;
}

const get    = (path)        => request(path);
const post   = (path, data)  => request(path, { method: 'POST',   body: JSON.stringify(data) });
const put    = (path, data)  => request(path, { method: 'PUT',    body: JSON.stringify(data) });
const del    = (path)        => request(path, { method: 'DELETE' });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const signIn     = (email, password) => post('/auth/login', { email, password });
export const signOut    = () => post('/auth/logout');
export const getMe      = () => get('/auth/me');
export const changePassword = (currentPassword, newPassword) => put('/auth/password', { currentPassword, newPassword });

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings  = () => get('/settings');
export const saveSettings = (obj) => post('/settings', obj);

// ─── Tipsters ─────────────────────────────────────────────────────────────────
export const getTipsters      = () => get('/tipsters');
export const getTipsterStats  = () => get('/tipsters/stats');
export const createTipster    = (obj) => post('/tipsters', obj);
export const updateTipster    = (id, obj) => put(`/tipsters/${id}`, obj);
export const deleteTipster    = (id) => del(`/tipsters/${id}`);

// ─── Bets ─────────────────────────────────────────────────────────────────────
export function getBets(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, v); });
  const qs = params.toString();
  return get(`/bets${qs ? `?${qs}` : ''}`);
}
export const createBet = (obj)     => post('/bets', obj);
export const updateBet = (id, obj) => put(`/bets/${id}`, obj);
export const deleteBet = (id)      => del(`/bets/${id}`);
export const getStats  = ()        => get('/bets/stats');

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdminStats = () => get('/admin/stats');
export const createUser    = (obj) => post('/admin/users', obj);
export const resetUserPassword = (id, password) => put(`/admin/users/${id}/password`, { password });
