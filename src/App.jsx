
import { useEffect, useState } from "react";
import {
  getTransports, getBookings, addBooking, addPassenger,
  updateTransport, deleteTransport, deleteBooking, addTransport
} from "./services/api";
import "./App.css";

// A fresh service starts with every seat available; booking updates this count through the API.
const emptyTransport = {
  name: "", type: "Bus", source: "", destination: "",
  date: "", departure: "", price: 0, totalSeats: 40,
  availableSeats: 40, routeId: "1"
};

export default function App() {
  const [transports, setTransports] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("All");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyTransport);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState("search");

  // Load both collections together so the summary cards and lists stay in sync.
  async function loadData() {
    try {
      const [t, b] = await Promise.all([
        getTransports(), getBookings()
      ]);
      setTransports(t);
      setBookings(b);
    } catch {
      setMessage("Cannot connect to JSON Server. Start the server on port 3000.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Search stays local because the dataset is small; the source records still come from JSON Server.
  const results = transports.filter(t =>
    t.source.toLowerCase().includes(source.toLowerCase()) &&
    t.destination.toLowerCase().includes(destination.toLowerCase()) &&
    (!date || t.date === date) &&
    (type === "All" || t.type === type)
  );

  // Validate before writing so an empty passenger form never creates partial records.
  async function bookTicket(t) {
    if (!name.trim() || !phone.trim()) {
      setMessage("Enter passenger name and phone number.");
      return;
    }

    if (t.availableSeats < 1) {
      setMessage("Booking Full! No seats available.");
      return;
    }

    try {
      const passenger = await addPassenger({
        name: name.trim(), phone: phone.trim()
      });

      await addBooking({
        passengerId: String(passenger.id),
        passengerName: name.trim(),
        phone: phone.trim(),
        transportId: String(t.id),
        transportName: t.name,
        source: t.source,
        destination: t.destination,
        date: t.date,
        seatPrice: Number(t.price),
        status: "Confirmed",
        bookedAt: new Date().toISOString()
      });

      await updateTransport(t.id, {
        ...t, availableSeats: Number(t.availableSeats) - 1
      });

      setName("");
      setPhone("");
      setSelected(null);
      setMessage("Ticket booked successfully!");
      await loadData();
    } catch {
      setMessage("Booking failed. Please check the server.");
    }
  }

  // Cancelling releases the seat again before the updated list is fetched.
  async function cancelBooking(b) {
    if (!window.confirm("Are you sure you want to cancel this ticket?")) return;

    try {
      const t = transports.find(x => String(x.id) === String(b.transportId));

      if (t) {
        await updateTransport(t.id, {
          ...t,
          availableSeats: Math.min(
            Number(t.totalSeats),
            Number(t.availableSeats) + 1
          )
        });
      }

      await deleteBooking(b.id);
      setMessage("Booking cancelled.");
      await loadData();
    } catch {
      setMessage("Could not cancel the booking.");
    }
  }

  // The same form handles both create and edit, keeping the transport fields consistent.
  async function saveTransport(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.source.trim() ||
        !form.destination.trim() || !form.date ||
        Number(form.price) < 0 || Number(form.totalSeats) < 1) {
      setMessage("Enter valid transport details.");
      return;
    }

    const data = {
      ...form,
      name: form.name.trim(),
      source: form.source.trim(),
      destination: form.destination.trim(),
      price: Number(form.price),
      totalSeats: Number(form.totalSeats),
      availableSeats: Number(form.availableSeats)
    };

    try {
      if (editingId) {
        const old = transports.find(t => String(t.id) === String(editingId));
        data.availableSeats = Math.min(
          data.totalSeats,
          Math.max(0, Number(old.totalSeats) -
            Number(old.availableSeats) + data.totalSeats -
            Number(old.totalSeats))
        );
        await updateTransport(editingId, data);
      } else {
        data.availableSeats = data.totalSeats;
        await addTransport(data);
      }

      setForm(emptyTransport);
      setEditingId(null);
      setMessage("Transport saved successfully!");
      await loadData();
    } catch {
      setMessage("Could not save transport.");
    }
  }

  async function removeTransport(t) {
    if (bookings.some(b => String(b.transportId) === String(t.id))) {
      setMessage("Cancel its bookings before deleting this transport.");
      return;
    }
    if (!window.confirm("Delete this transport?")) return;

    try {
      await deleteTransport(t.id);
      setMessage("Transport deleted.");
      await loadData();
    } catch {
      setMessage("Could not delete transport.");
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>TravelGo</h1>
          <p>Your journey, your way.</p>
        </div>
        <span className="tag">BUS & TRAIN RESERVATION</span>
      </header>

      <nav className="nav">
        {[
          ["search", "Search Tickets"],
          ["bookings", "My Bookings"],
          ["manage", "Manage Transport"]
        ].map(([id, label]) => (
          <button key={id}
            className={page === id ? "active" : ""}
            onClick={() => setPage(id)}>
            {label}
          </button>
        ))}
      </nav>

      <section className="stats">
        <div className="stat">
          <span>Total Services</span>
          <strong>{transports.length}</strong>
        </div>
        <div className="stat">
          <span>Active Bookings</span>
          <strong>{bookings.length}</strong>
        </div>
        <div className="stat">
          <span>Available Seats</span>
          <strong>{transports.reduce(
            (sum, t) => sum + Number(t.availableSeats), 0
          )}</strong>
        </div>
      </section>

      {message && (
        <div className="message">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      {page === "search" && (
        <>
          <section className="hero">
            <p className="eyebrow">TRAVEL MADE SIMPLE</p>
            <h2>Where will you go next?</h2>
            <p>Find your bus or train and book your seat in minutes.</p>
          </section>

          <section className="panel">
            <h3>Find your journey</h3>
            <div className="filters">
              <label>From
                <input placeholder="Source city" value={source}
                  onChange={e => setSource(e.target.value)} />
              </label>
              <label>To
                <input placeholder="Destination city" value={destination}
                  onChange={e => setDestination(e.target.value)} />
              </label>
              <label>Travel date
                <input type="date" value={date}
                  onChange={e => setDate(e.target.value)} />
              </label>
              <label>Transport
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option>All</option>
                  <option>Bus</option>
                  <option>Train</option>
                </select>
              </label>
              <button className="primary"
                onClick={() => setMessage(`${results.length} services found.`)}>
                Search
              </button>
            </div>
          </section>

          <h3 className="section-title">Available services ({results.length})</h3>

          {results.length === 0 && (
            <div className="empty">No services found. Try different search details.</div>
          )}

          <div className="services">
            {results.map(t => (
              <article className="service" key={t.id}>
                <div className="service-top">
                  <span className="transport-icon">
                    {t.type === "Bus" ? "🚌" : "🚆"}
                  </span>
                  <span className="type">{t.type}</span>
                </div>
                <h3>{t.name}</h3>
                <div className="journey">
                  <div><strong>{t.source}</strong><small>FROM</small></div>
                  <span className="arrow">→</span>
                  <div><strong>{t.destination}</strong><small>TO</small></div>
                </div>
                <div className="details">
                  <span>📅 {t.date}</span>
                  <span>🕒 {t.departure}</span>
                </div>
                <div className="service-bottom">
                  <div>
                    <strong className="price">₹{t.price}</strong>
                    <small>{t.availableSeats} seats left</small>
                  </div>
                  <button className="primary"
                    disabled={Number(t.availableSeats) <= 0}
                    onClick={() => {
                      setSelected(t);
                      setMessage("");
                    }}>
                    {Number(t.availableSeats) <= 0 ? "Booking Full" : "Book Now"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          {selected && (
            <section className="panel booking-form">
              <h3>Book your ticket</h3>
              <p>{selected.name}: {selected.source} → {selected.destination}</p>
              <p>Price: ₹{selected.price} · One passenger, one seat</p>
              <label>Passenger name
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Enter full name" />
              </label>
              <label>Phone number
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Enter phone number" />
              </label>
              <div className="actions">
                <button className="primary"
                  onClick={() => bookTicket(selected)}>Confirm Booking</button>
                <button className="secondary"
                  onClick={() => setSelected(null)}>Close</button>
              </div>
            </section>
          )}
        </>
      )}

      {page === "bookings" && (
        <section className="panel">
          <h2>My Bookings</h2>
          {bookings.length === 0 && <p>No bookings yet.</p>}
          {bookings.map(b => (
            <div className="booking-row" key={b.id}>
              <div>
                <strong>{b.passengerName}</strong>
                <p>{b.transportName} · {b.source} → {b.destination}</p>
                <p>{b.date} · ₹{b.seatPrice}</p>
                <span className="confirmed">{b.status}</span>
              </div>
              <button className="danger"
                onClick={() => cancelBooking(b)}>Cancel</button>
            </div>
          ))}
        </section>
      )}

      {page === "manage" && (
        <section className="panel">
          <h2>Manage Transport</h2>
          <p>Add, edit or delete bus and train services.</p>

          <form className="manage-form" onSubmit={saveTransport}>
            <label>Service name
              <input required value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} />
            </label>
            <label>Type
              <select value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}>
                <option>Bus</option><option>Train</option>
              </select>
            </label>
            <label>Source
              <input required value={form.source}
                onChange={e => setForm({...form, source: e.target.value})} />
            </label>
            <label>Destination
              <input required value={form.destination}
                onChange={e => setForm({...form, destination: e.target.value})} />
            </label>
            <label>Date
              <input required type="date" value={form.date}
                onChange={e => setForm({...form, date: e.target.value})} />
            </label>
            <label>Departure
              <input required type="time" value={form.departure}
                onChange={e => setForm({...form, departure: e.target.value})} />
            </label>
            <label>Price (₹)
              <input required type="number" min="0" value={form.price}
                onChange={e => setForm({...form, price: e.target.value})} />
            </label>
            <label>Total seats
              <input required type="number" min="1" value={form.totalSeats}
                onChange={e => setForm({...form, totalSeats: e.target.value})} />
            </label>
            <button className="primary" type="submit">
              {editingId ? "Update Service" : "Add Service"}
            </button>
            {editingId && <button type="button" className="secondary"
              onClick={() => {setEditingId(null); setForm(emptyTransport);}}>
              Stop Editing
            </button>}
          </form>

          {transports.map(t => (
            <div className="booking-row" key={t.id}>
              <div>
                <strong>{t.name} ({t.type})</strong>
                <p>{t.source} → {t.destination} · {t.date}</p>
                <p>₹{t.price} · {t.availableSeats}/{t.totalSeats} seats</p>
              </div>
              <div className="actions">
                <button className="secondary" onClick={() => {
                  setEditingId(t.id);
                  setForm({...t});
                  window.scrollTo({top: 0, behavior: "smooth"});
                }}>Edit</button>
                <button className="danger" onClick={() => removeTransport(t)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <footer>TravelGo · React + JSON Server · Demo reservation system</footer>
    </div>
  );
}


