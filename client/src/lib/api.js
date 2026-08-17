export const API_BASE = '/api';

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('northline_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(options.headers || {}),
      ...(options.headers || {})
    },
    credentials: 'include',
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  getConfig: () => request('/config'),
  submitEstimate: (payload) => request('/estimate', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  login: (payload) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getAdminMe: () => request('/admin/me'),
  getLeads: () => request('/admin/leads'),
  saveConfig: (payload) => request('/admin/config', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
};
