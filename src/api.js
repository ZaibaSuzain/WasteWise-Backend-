const BASE_URL = "http://localhost:5000/api";

// ── REVIEWS ──────────────────────────────
export const getReviews = async () => {
  const res = await fetch(`${BASE_URL}/reviews`);
  return res.json();
};

export const getTodayReviews = async () => {
  const res = await fetch(`${BASE_URL}/reviews/today`);
  return res.json();
};

export const getReviewsByRange = async (from) => {
  const res = await fetch(`${BASE_URL}/reviews/range?from=${from}`);
  return res.json();
};

export const createReview = async (data) => {
  const res = await fetch(`${BASE_URL}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── WASTE LOGS ────────────────────────────
export const getWasteLogs = async () => {
  const res = await fetch(`${BASE_URL}/waste-logs`);
  return res.json();
};

export const getTodayWasteLogs = async () => {
  const res = await fetch(`${BASE_URL}/waste-logs/today`);
  return res.json();
};

export const getWasteLogsByRange = async (from) => {
  const res = await fetch(`${BASE_URL}/waste-logs/range?from=${from}`);
  return res.json();
};

export const createWasteLog = async (data) => {
  const res = await fetch(`${BASE_URL}/waste-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── FLAGS ─────────────────────────────────
export const getFlags = async () => {
  const res = await fetch(`${BASE_URL}/flags`);
  return res.json();
};

export const getActiveFlags = async () => {
  const res = await fetch(`${BASE_URL}/flags/active`);
  return res.json();
};

export const getEscalatedFlags = async () => {
  const res = await fetch(`${BASE_URL}/flags/escalated`);
  const data = await res.json();
  // format to match what Warden page expects
  return data.map(f => ({
    id: f._id,
    days_ignored: f.days_flagged,
    flags: {
      dish_name: f.dish_name,
      days_flagged: f.days_flagged,
      last_action: f.last_action
    }
  }));
};

export const updateFlagStatus = async (id, status) => {
  const res = await fetch(`${BASE_URL}/flags/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
};

// ── STATS ─────────────────────────────────
export const getStats = async () => {
  const res = await fetch(`${BASE_URL}/stats`);
  return res.json();
};