const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/** Keep fetch details in one place so components can focus on the booking flow. */
async function request(endpoint, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options
    });
  } catch {
    throw new Error("Cannot connect to JSON Server. Start it with npm run api.");
  }

  // JSON Server returns an empty response for deletes, so don't parse one.
  if (response.status === 204) return null;
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status}).`);
  }
  return response.json();
}

export const getTransports = () => request("/transports");
export const getTransport = (id) => request(`/transports/${id}`);
export const getBookings = () => request("/bookings");
export const getBooking = (id) => request(`/bookings/${id}`);
export const getPassengers = () => request("/passengers");
export const getPassenger = (id) => request(`/passengers/${id}`);
export const getRoutes = () => request("/routes");
export const getRoute = (id) => request(`/routes/${id}`);

export const addTransport = (data) => request("/transports", {
  method: "POST", body: JSON.stringify(data)
});
export const updateTransport = (id, data) => request(`/transports/${id}`, {
  method: "PUT", body: JSON.stringify(data)
});
export const deleteTransport = (id) => request(`/transports/${id}`, { method: "DELETE" });

export const addPassenger = (data) => request("/passengers", {
  method: "POST", body: JSON.stringify(data)
});
export const updatePassenger = (id, data) => request(`/passengers/${id}`, {
  method: "PUT", body: JSON.stringify(data)
});
export const deletePassenger = (id) => request(`/passengers/${id}`, { method: "DELETE" });

export const addBooking = (data) => request("/bookings", {
  method: "POST", body: JSON.stringify(data)
});
export const updateBooking = (id, data) => request(`/bookings/${id}`, {
  method: "PUT", body: JSON.stringify(data)
});
export const deleteBooking = (id) => request(`/bookings/${id}`, { method: "DELETE" });
