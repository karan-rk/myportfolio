export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8002").replace(/\/$/, "");


async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    const error = new Error(`Speech API is unavailable at ${API_BASE_URL}. Start the backend and try again.`);
    error.response = { data: { detail: error.message } };
    throw error;
  }
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    const error = new Error(data.detail || "Request failed");
    error.response = { data };
    throw error;
  }
  return { data };
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body, headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" } }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
};

export function audioUrl(filename) {
  return `${API_BASE_URL}/audio/${encodeURIComponent(filename)}`;
}
