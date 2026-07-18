# Contexto Global del Proyecto: Aura-Slurry

**Aura-Slurry** es un sistema de mantenimiento predictivo acústico de bajo costo para bombas de pulpa en minería, desarrollado para la Hackatón IA — FLIT 2026. 

**Objetivo principal:** Convertir un micrófono de bajo costo en un sensor de salud mecánica. Captura el sonido del equipo, aísla su firma acústica del ruido de la planta mediante sustracción espectral y clasifica su estado en tiempo real.

## Arquitectura y Stack Tecnológico
El proyecto está dividido en tres módulos principales, correspondientes a los 3 integrantes del equipo:

1. **Modelo / Señal (Python):** 
   - **Stack:** Python 3.10+, `librosa`, `numpy`, `scikit-learn` (Random Forest), `joblib`.
   - **Responsabilidad:** Funciones puras para procesar audio, extraer features (MFCC) y predecir.
2. **Backend (Python):**
   - **Stack:** `FastAPI`, `uvicorn`, `websockets`, `python-multipart`.
   - **Responsabilidad:** Orquestar el modelo y exponer endpoints REST y un WebSocket para emitir el estado en tiempo real.
3. **Frontend (Web):**
   - **Stack:** `React` (Vite), `Material UI` (Tema oscuro SCADA), `Recharts`.
   - **Responsabilidad:** Dashboard en tiempo real que consume el WebSocket (semáforo, gauge, gráfico).

## Reglas Críticas para Agentes

1. **Respetar los Contratos de Interfaz:** Existe un contrato estricto definido entre los módulos. **NO modifiques los contratos (nombres de variables, estructura de JSONs, endpoints) sin consultar explícitamente al usuario**.
   - *Contrato Python (Modelo -> Backend):* `clasificar_ventana` retorna `{ "estado": str, "health_score": int, "confianza": float, "alerta": str | None }`
   - *Contrato Red (Backend -> Frontend):* El WebSocket envía `{ "timestamp": str, "estado": str, "health_score": int, "confianza": float, "alerta": str | None, "calibrado": bool }`

2. **Trabajo en Paralelo (Desacoplamiento):**
   - Si trabajas en el Backend y el Modelo no está listo, utiliza un **mock** (`clasificar_ventana` que devuelva datos falsos con la misma estructura).
   - Si trabajas en el Frontend y el Backend no está listo, utiliza un **mock de WebSocket** que emita los eventos según el contrato.

3. **Restricciones del MVP:**
   - Todo debe correr en CPU estándar. No usar dependencias que requieran GPU obligatoria.
   - El modelo entrenará usando el dataset MIMII (japonés, subconjunto `pump`).
   - Siempre debe existir soporte para uso de archivos WAV pregrabados como blindaje para la demo en vivo.

4. **Estructura del Proyecto:**
   - `modelo/` -> Scripts de entrenamiento y `senal.py` (inferencia pura).
   - `backend/` -> `main.py` y orquestación WebSocket/REST.
   - `frontend/` -> Cliente React.
   - `demo_assets/` -> Archivos WAV de respaldo para la presentación.

5. **Progreso y Tareas:**
   - Siempre ten en cuenta las tareas planificadas en `specs/03_Tareas_Aura-Slurry.md`. Si se te pide avanzar con el proyecto, asegúrate de preguntar en qué tarea/módulo enfocarte o leer el estado actual.

6. **Commits y Control de Versiones:**
   - Se deben generar **commits automáticos y ordenados** (ej. Conventional Commits) al finalizar cada incremento lógico y seguro del que estemos seguros, para mantener un registro claro del progreso en la hackatón.
