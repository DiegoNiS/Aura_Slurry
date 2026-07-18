# Project Global Context: Aura-Slurry

**Aura-Slurry** is a low-cost acoustic predictive maintenance system for slurry pumps in mining, developed for the IA Hackathon — FLIT 2026. 

**Main Objective:** Convert a low-cost microphone into a mechanical health sensor. It captures live equipment sound, isolates its acoustic signature from plant noise using spectral subtraction, and classifies its status in real-time.

## Architecture and Tech Stack
The project is divided into three main modules, corresponding to the 3 team members:

1. **Model / Signal (Python):** 
   - **Stack:** Python 3.10+, `librosa`, `numpy`, `scikit-learn` (Random Forest), `joblib`.
   - **Responsibility:** Pure functions to process audio, extract features (MFCC), and predict.
2. **Backend (Python):**
   - **Stack:** `FastAPI`, `uvicorn`, `websockets`, `python-multipart`.
   - **Responsibility:** Orchestrate the model and expose REST endpoints and WebSockets (one for live audio ingestion and another to emit real-time status).
3. **Frontend (Web):**
   - **Stack:** `React` (Vite), `Material UI` (Dark SCADA theme), `Recharts`.
   - **Responsibility:** Real-time dashboard that consumes the status and captures microphone audio, sending it via WebSocket to the backend.

## Critical Rules for Agents

1. **Respect Interface Contracts:** There is a strict contract defined between modules. **DO NOT modify the contracts (variable names, JSON structure, endpoints) without explicitly consulting the user**.
   - *Python Contract (Model -> Backend):* `classify_window` returns `{ "status": str, "health_score": int, "confidence": float, "alert": str | None }`
   - *Output Network Contract (Backend -> Frontend):* The WebSocket `/ws/status` sends `{ "timestamp": str, "status": str, "health_score": int, "confidence": float, "alert": str | None, "calibrated": bool }`
   - *Input Network Contract (Frontend -> Backend):* The WebSocket `/ws/audio` receives binary PCM Int16 chunks, mono, 16 kHz.

2. **Parallel Work (Decoupling):**
   - If working on the Backend and the Model is not ready, use a **mock** (`classify_window` that returns fake data with the same structure).
   - If working on the Frontend and the Backend is not ready, use a **WebSocket mock** that emits events according to the contract.

3. **MVP Restrictions:**
   - Everything must run on standard CPU. Do not use dependencies that require a GPU.
   - The model will train using the MIMII dataset (Japanese, `pump` subset).
   - The **primary mode** is live audio streaming via microphone. 
   - There must always be support for using pre-recorded WAV files as a **fallback mode**, which must always work.

4. **Project Structure:**
   - `modelo/` -> Training scripts and `signal_processing.py` (pure inference).
   - `backend/` -> `main.py` and WebSocket/REST orchestration.
   - `frontend/` -> React client.
   - `demo_assets/` -> Fallback WAV files for presentation.

5. **Progress and Tasks:**
   - Always keep in mind the tasks planned in `specs/03_Tareas_Aura-Slurry.md`. If asked to advance with the project, make sure to ask which task/module to focus on or read the current status.

6. **Commits and Version Control:**
   - **Automatic and orderly commits** (e.g., Conventional Commits) must be generated at the end of each logical and safe increment that we are sure of, to maintain a clear record of progress in the hackathon.
