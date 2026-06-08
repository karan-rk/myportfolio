export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8002").replace(/\/$/, "");

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));


async function request(path, options = {}, retries = 0) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    if (retries > 0) {
      await wait(1200);
      return request(path, options, retries - 1);
    }
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
  get: (path) => request(path, {}, 1),
  post: (path, body) => request(path, { method: "POST", body, headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" } }, 1),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
};

export function audioUrl(filename) {
  return `${API_BASE_URL}/audio/${encodeURIComponent(filename)}`;
}
