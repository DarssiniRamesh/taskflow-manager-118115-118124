const API_BASE = "https://vscode-internal-035-beta.beta01.cloud.kavia.ai:3001";

let defaultHeaders = {};

export function setAuthToken(token) {
  defaultHeaders['Authorization'] = `Bearer ${token}`;
}

export function clearAuthToken() {
  delete defaultHeaders['Authorization'];
}

// PUBLIC_INTERFACE
export const api = {
  async get(url, token) {
    return request("GET", url, null, token);
  },
  async post(url, data, token) {
    return request("POST", url, data, token);
  },
  async put(url, data, token) {
    return request("PUT", url, data, token);
  },
  async delete(url, token) {
    return request("DELETE", url, null, token);
  }
};

async function request(method, url, data, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...defaultHeaders,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    ...(data ? { body: JSON.stringify(data) } : {})
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw json;
  return json;
}
