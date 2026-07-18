# 🎙️⛏️ Aura-Slurry

**Mantenimiento predictivo acústico de bajo costo para bombas de pulpa en minería.**

> Un micrófono de ~$50 escucha la bomba 24/7. La IA aísla su firma acústica del
> ruido de planta, diagnostica su salud cada segundo, sugiere acciones al
> supervisor y envía reportes de incidente a la minera — antes de que la falla
> detenga la producción.

Proyecto del equipo Aura-Slurry para la **Hackatón IA — FLIT 2026 (Arequipa)**.

---

## ¿Qué hace?

| Capacidad | Descripción |
|---|---|
| 🎤 **Monitoreo en vivo** | El micrófono (celular/nodo) transmite audio por WebSocket; el sistema clasifica cada segundo. **1 micrófono = 1 bomba.** |
| 🧠 **Diagnóstico con IA** | Random Forest sobre features MFCC: `NORMAL` 🟢 / `WARNING` 🟡 / `FAILURE` 🔴 + health score 0–100. |
| 🔇 **Calibración de ruido** | Sustracción espectral del ruido de planta (capturado por micrófono o subiendo un WAV): el diferenciador que elimina falsas alarmas en ambiente minero. |
| 🤖 **AURI, asistente del supervisor** | Gemini redacta sugerencias operativas en lenguaje natural (nunca órdenes — la decisión es de los procedimientos del sitio). |
| 📄 **Reportes a la minera** | Al superar un umbral de alertas sostenidas, la IA genera un reporte gerencial (resumen ejecutivo + datos + acción) visible en el dashboard y **enviado por correo**. |
| 📊 **Dashboard SCADA** | Vista de flota → sala de control por bomba: semáforo, gauge, tendencia, forma de onda, espectro y espectrograma — **todo calculado del audio real**. |
| 📁 **Modo respaldo** | Reproducción de WAVs a ritmo real (1 s = 1 s) con barra de progreso — demo blindada sin hardware. |

## Resultados del modelo

Entrenado con **1,149 grabaciones reales** (dataset [MIMII](https://zenodo.org/record/3384388) de Hitachi, bomba `id_00`, fallas físicas reales) + aumento de datos de ruido y canal acústico. Features normalizados por RMS (el volumen del micrófono no afecta el diagnóstico).

- **96.6% de recall a nivel de evento** (28/29 fallas detectadas) con **0% de falsas alarmas** en el test set.
- Accuracy por ventana: 96.8% (split por archivo, sin fuga train/test).
- Inferencia: ~50 ms por ventana, CPU estándar, modelo de 4.9 MB — sin GPU.
- Robustez verificada: no genera falsas alarmas con **otra bomba real sonando al lado** (ni a 4× volumen).

Detalle en `modelo/metrics.txt` y `modelo/matriz_confusion.png`.

## Arquitectura

```
   📱 Micrófono (celular/nodo)          📁 WAV de respaldo
        │ WS /ws/audio (PCM 16 kHz)          │ POST /api/audio
        ▼                                    ▼
┌──────────────────────── BACKEND (FastAPI) ────────────────────────┐
│  ventaneo 1 s → sustracción espectral → MFCC-20 → Random Forest   │
│  umbral de alertas → reporte Gemini → correo SMTP                 │
│  features de señal reales (waveform/espectro/f₀) por ventana      │
└───────────────┬───────────────────────────────────────────────────┘
                │ WS /ws/status (estado + señal + AURI + reportes)
                ▼
┌──────────────────────── FRONTEND (React) ─────────────────────────┐
│  Flota de bombas → Sala de control: semáforo · gauge · tendencia  │
│  firma acústica · AURI (viñeta) · panel de reportes · calibración │
└───────────────────────────────────────────────────────────────────┘
```

Contrato de red (inglés) documentado en **`backend/README.md`** (fuente de verdad).

## Estructura del repositorio

```
├── modelo/          # señal + IA: senal.py (núcleo), signal_processing.py
│                    # (adaptador), entrenar.py, modelo.joblib, metrics.txt
├── backend/         # FastAPI: WebSockets, REST, AURI (Gemini), reportes SMTP
├── frontend/        # React 19 + Vite + MUI: dashboard SCADA (dist/ lo sirve el backend)
├── demo_assets/     # WAVs de demo + casos/ (suite de 10 casos validados)
├── specs/           # documentos SDD (requerimientos, diseño, tareas)
├── docs/            # comparativa vs análisis de vibraciones (base teórica)
├── MANUAL_DEMO.md   # 📖 levantar el sistema y probar con celular como micrófono
└── INTEGRACION.md   # playbook de integración y pruebas E2E
```

## Inicio rápido

```bash
# 1. Dependencias
pip install -r requirements.txt
cd frontend && npm install && npm run build && cd ..

# 2. Configuración (backend/.env — ver backend/.env.example)
#    GEMINI_API_KEY=...          → recomendaciones y reportes IA (opcional)
#    SMTP_USER/PASS/REPORT_...   → correo de reportes (opcional)

# 3. Levantar TODO (el backend sirve también el dashboard)
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Dashboard: `http://localhost:8000` · Celular como micrófono: ver **`MANUAL_DEMO.md`**
(misma red, IP de la laptop, y un flag de Chrome para permitir el micrófono en HTTP).

### Probar sin hardware

Subir archivos de `demo_assets/casos/` desde el dashboard:
`08_normal_con_ruido_mina.wav` (falsas alarmas) → calibrar con `07_ruido_mina.wav`
→ subir `08` otra vez (🟢 verde). Guion completo en el encabezado de cada script.

### Reentrenar el modelo

```bash
cd modelo
python entrenar.py --data <ruta>/pump --ruido ../demo_assets/ruido_mina.wav
```

## Equipo y roles

| Módulo | Responsabilidad |
|---|---|
| **Modelo / Señal** | Pipeline de audio, entrenamiento, contratos puros (`senal.py`) |
| **Backend / Integración** | FastAPI, WebSockets, IA generativa, reportes, deploy |
| **Frontend / Pitch** | Dashboard SCADA, UX, narrativa de negocio |

## Roadmap (visión de producto, no entregado)

- Nodo edge por bomba (ESP32/Raspberry + micrófono MEMS ~$10) y flota multi-bomba real.
- Validación cruzada con más unidades (`id_02`–`id_06` del dataset) y ruido de mina grabado en sitio.
- AURI con RAG sobre manuales del fabricante e historial de mantenimiento del cliente.
- Micrófono de contacto (piezo) para ambientes extremos; fusión con análisis de vibraciones
  (ver `docs/COMPARATIVA_VIBRACIONES.md`: somos el triaje barato del método caro).
- Persistencia, autenticación, multi-tenant, CI/CD.

## Atribución

- Dataset: **MIMII** — Purohit et al., Hitachi Ltd. (2019), [Zenodo](https://zenodo.org/record/3384388), licencia CC BY-SA 4.0. Todas las bombas y fallas del sistema son grabaciones reales de este dataset.
- IA generativa: Google Gemini (`gemini-flash-latest`).
