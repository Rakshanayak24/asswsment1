const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const CITY_ID = import.meta.env.VITE_CITY_ID || '118';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error('Could not reach Fastor. Check your connection and try again.');
  }
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) {
    throw new Error(body?.message || body?.error || `Request failed (${response.status})`);
  }
  return body;
}

function formBody(fields) {
  const body = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => body.set(key, value));
  return body;
}

export function requestOtp(phone, dialCode) {
  return request('/v1/pwa/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({ phone, dial_code: dialCode })
  });
}

export async function verifyOtp(phone, otp, dialCode) {
  const result = await request('/v1/pwa/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({ phone, otp, dial_code: dialCode })
  });
  const token = result?.data?.token || result?.token;
  if (!token) throw new Error('Login succeeded, but the server did not return an access token.');
  return token;
}

export function getRestaurants(token) {
  return request(`/v1/m/restaurant?city_id=${encodeURIComponent(CITY_ID)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function restaurantsFrom(response) {
  const candidates = [
    response?.data, response?.data?.data, response?.restaurants, response?.data?.restaurants,
    response?.data?.restaurant_list, response?.data?.restaurantList, response?.data?.list
  ];
  return candidates.find(Array.isArray) || [];
}
