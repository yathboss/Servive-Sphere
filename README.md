# ServiceSphere

A platform that connects users with nearby skilled workers (plumber/electrician/carpenter/helper). 
Users search by service type and location, compare workers by price/rating/distance, request a job, and the system automatically selects the best worker and schedules jobs efficiently.

## Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend dev)
- Python 3.10+ (for local backend dev)

## Running the Application (End-to-End Demo)

The easiest way to run the entire stack (Database, Backend API, Frontend Next.js) is via Docker Compose.

1. **Start the services:**
   ```bash
   docker compose up --build
   ```
   This will start:
   - PostgreSQL on port 5432
   - FastAPI Backend on port 8000
   - Next.js Frontend on port 3000

2. **Seed the Database:**
   Once the backend is up, you must seed the database with the initial road graph, users, and workers. Run the following command (or hit the endpoint from the Swagger UI at `http://localhost:8000/docs`):
   ```bash
   curl -X POST http://localhost:8000/seed
   ```

3. **Access the Demo:**
   - **Frontend UI:** [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

4. **Testing Allocation:**
   You can place a job request from the frontend or backend, then trigger the allocation cron-like endpoint to assign the jobs based on priority and deadlines.
   ```bash
   curl -X POST http://localhost:8000/allocate
   ```

## Development

The backend uses FastAPI and SQLAlchemy. The core algorithms are found in `backend/algorithms/`.
The frontend is a Next.js 14 application using the App Router and Tailwind CSS.
