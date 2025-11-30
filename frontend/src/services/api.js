import axios from "axios";

const ROOT = process.env.REACT_APP_API_URL || "http://localhost:5000";
const BASE = `${ROOT}/api`;

export const runQuery = (sql, params = {}, page = 1, page_size = 100) =>
  axios
    .post(`${BASE}/query`, { sql, params, page, page_size })
    .then(r => r.data);

export const getHistory = () =>
  axios.get(`${BASE}/history`).then(r => r.data);

export const addBookmark = (name, sql, params = {}) =>
  axios.post(`${BASE}/bookmarks`, { name, sql, params }).then(r => r.data);

export const listBookmarks = () =>
  axios.get(`${BASE}/bookmarks`).then(r => r.data);

export const getSchema = () =>
  axios.get(`${BASE}/schema`).then(r => r.data);

// Optional (only if you add the one-shot tab)
export const toSQL = (query) =>
  axios.post(`${BASE}/nl2sql`, { query }).then(r => r.data);
