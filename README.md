# ServiceSphere (Production Grade)

A professional web application that connects users with nearby skilled workers (plumber, electrician, carpenter, etc.).

This final version features a robust **Java Spring Boot** backend, an upgraded **Next.js** frontend with premium UX, and highly optimized, graph-based job allocation algorithms. 

## Final Tech Stack
- **Frontend**: JavaScript (React + Next.js), Tailwind CSS, shadcn/ui.
- **Backend**: Java 17, Spring Boot, Spring Data JPA, Gradle.
- **Database**: PostgreSQL (containerized).
- **Algorithms**: Implementations for Haversine distances, Dijkstra route pathfinding on adjacency lists, Ranking logic (Min-Max normalization), and Greedy EDF Scheduling with fairness constraints.

## Architecture & Features
- **Product-grade UX**: Search and compare workers, view detailed algorithmic breakdowns (Why was this worker chosen?), manage job lifecycles.
- **Worker Dashboard**: Workers can view their queues, manage availability, and accept/decline/complete jobs.
- **Admin Analytics**: View fairness metrics, algorithm runtime, and Dijkstra stats.
- **Clean Architecture**: Strong isolation of concerns across `controller`, `service`, `repository`, `model`, `dto`, and `algorithms` packages.

## Quick Start (Docker Compose)
The entire application runs seamlessly via Docker Compose, eliminating the need for local Java or Postgres installations.

1. **Start the Stack**
   ```bash
   docker compose up --build
   ```
   This builds the Spring Boot artifact via a multi-stage Dockerfile and hosts:
   - Backend on `http://localhost:8000`
   - Frontend on `http://localhost:3000`
   - Postgres DB on port `5432`

2. **Seed the Database**
   To populate the system with exactly 100 workers and 200 jobs, run:
   ```bash
   curl -X POST http://localhost:8000/api/seed
   ```
   Or use the **Seed Database** button inside the Admin Dashboard.

3. **Explore the Demo Flow**
   - **User App**: [http://localhost:3000](http://localhost:3000) (Search -> Request Job)
   - **Worker Dashboard**: [http://localhost:3000/worker/1](http://localhost:3000/worker/1) (Accept -> Complete Jobs)
   - **Admin Analytics**: [http://localhost:3000/admin](http://localhost:3000/admin) (Trigger Allocation -> View Metrics)

4. **Trigger Allocation**
   You can manually trigger the Greedy EDF Scheduling algorithm via the Admin UI, or manually hit:
   ```bash
   curl -X POST http://localhost:8000/api/jobs/allocate
   ```

## Design Notes
- No academic or team metadata is exposed anywhere in the codebase.
- The greedy EDF algorithm explicitly considers a "worker load count" to ensure fair distribution of jobs rather than overloading the highest-rated worker.
