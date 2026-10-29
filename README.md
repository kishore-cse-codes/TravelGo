# TravelGo

TravelGo is a simple bus and train reservation portal built with React and JSON Server. Passengers can search services, book a seat, review bookings, and cancel a reservation. The Manage Transport page supports adding, editing, and deleting services.

## Run the project

Use Node.js 20 or newer. Install packages once:

```bash
npm install
```

Start the API in one terminal:

```bash
npm run api
```

Start the React app in a second terminal:

```bash
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`. Keep the API terminal running while you use the website. JSON Server serves `db.json` at `http://localhost:3000`.

## Fixing the JSON Server connection message

The app reads and writes through the API helpers in `src/services/api.js`. If the app says it cannot connect, check that the API terminal is open and shows port 3000. From the project folder, run `npm run api`; then reload the Vite page. `npm run api` starts JSON Server with the provided `db.json` file.

To reset demo data, stop JSON Server and restore the original `db.json` from Git. Do not store real personal data in this demo database.

## Main features

- Search by source, destination, date, and bus/train type.
- Display current fares and available seats from the API.
- Book a single seat and save passenger and booking records.
- Cancel a booking and return its seat to the service.
- Add, edit, and delete transport services.
- See summary counts for services, bookings, and available seats.

## API endpoints

| Resource | Available operations |
| --- | --- |
| `/routes` | GET all, GET by ID |
| `/transports` | GET all, GET by ID, POST, PUT, DELETE |
| `/passengers` | GET all, GET by ID, POST, PUT, DELETE |
| `/bookings` | GET all, GET by ID, POST, PUT, DELETE |

The primary CRUD workflow is transport management. The API module also includes helpers for creating bookings and passengers and cancelling bookings. The reservation flow is: React form, validation, POST passenger/booking, PUT available seats, then refresh the list from JSON Server.

## Project files

```text
src/App.jsx          Main React interface and reservation actions
src/services/api.js  JSON Server request helpers
src/App.css           TravelGo component styling
src/index.css         Global styling and accessible focus states
db.json               Starter routes, transport services, passengers and bookings
```

## Team

- Bondada Naga Pushpa Satwika
- Dake Sireesha
- Kandikatla Anusha
- Bommanaboina Madhu Kishore

## Repository and website

- GitHub repository: https://github.com/kishore-cse-codes/TravelGo
- Website: Deploy the frontend after the API is hosted. GitHub Pages only serves the static React files; the JSON Server API must remain accessible at the configured `VITE_API_URL` for bookings and service management to work online.

## Build and lint

```bash
npm run build
npm run lint
```