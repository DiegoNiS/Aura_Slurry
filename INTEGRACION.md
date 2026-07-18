# Aura-Slurry — Guía de integración y pruebas

Sistema integrado y verificado end-to-end el 2026-07-18. Esta guía es el playbook
para las pruebas del equipo: laptop = servidor + dashboard, celular = micrófono.

---

## 1. Arrancar el sistema (laptop)

**Terminal 1 — Backend** (escuchando en toda la red para que el celular llegue):

```powershell
cd D:\HackatonFLIT\backend
$env:MOCK_WHEN_IDLE = "0"   # sin datos falsos cuando no fluye audio (demo real)
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

> `MOCK_WHEN_IDLE=1` (o no definirla) reactiva el generador mock para desarrollo del frontend.
> Para las recomendaciones IA (Gemini): crear `backend/.env` con `GEMINI_API_KEY=...`. Sin key,
> el sistema funciona igual (solo omite la recomendación).

**Terminal 2 — Frontend:**

```powershell
cd D:\HackatonFLIT\frontend
npm run dev
```

- Dashboard en la laptop: `http://localhost:5173`
- La IP del backend que usa el frontend está en `frontend/.env.local`
  (`VITE_WS_BASE_URL` / `VITE_API_BASE_URL`). **Si cambia la red Wi-Fi, actualizar
  la IP** (`ipconfig` → IPv4) y reiniciar `npm run dev`.

> ⚠️ Windows Firewall: la primera vez, aceptar el permiso de red para Python y Node
> (marcar "redes privadas"). Sin eso el celular no llega al backend.

---

## 2. Prueba A — Audio largo simulando tiempo real (respaldo/demo guionizada)

`demo_assets/demo_largo.wav` (3 min) simula la vida de la bomba. Subirlo desde el
dashboard (botón Cargar Audio → `POST /api/audio`): el backend lo reproduce a ritmo
real (1 ventana = 1 segundo) y emite estados en vivo.

**Guion del archivo:**

| Tiempo | Contenido | Qué debe verse |
|---|---|---|
| 0:00–1:00 | Bomba normal | 🟢 NORMAL, health ~95–100 |
| 1:00–1:30 | Bomba SANA + ruido de planta | 🔴 falsas alarmas → **pulsar "Calibrar" con `ruido_mina.wav`** → vuelve a 🟢 |
| 1:30–2:30 | Falla real | 🔴 FAILURE, alertas en el panel |
| 2:30–3:00 | Normal otra vez | 🟢 recuperación |

Regenerarlo (si cambia el ruido o el guion): `python demo_assets/generar_demo_largo.py --data dataset/pump`

---

## 3. Prueba B — Celular como micrófono (modo primario)

1. Conectar el celular a la **misma red Wi-Fi** que la laptop.
2. En el celular, abrir `http://192.168.70.23:5173` (la IP de `frontend/.env.local`).
3. **Permiso de micrófono:** Chrome bloquea `getUserMedia` en HTTP no-localhost.
   Solución (una sola vez, en el Chrome del celular):
   - Ir a `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
   - Escribir `http://192.168.70.23:5173` en el campo, poner **Enabled**, relanzar Chrome.
4. Pulsar **Monitoreo en Vivo** en el celular → transmite chunks PCM Int16 16 kHz a `/ws/audio`.
5. El dashboard (laptop y/o celular) muestra el estado en tiempo real por `/ws/status`.

**Para simular la bomba:** reproducir `demo_assets/normal.wav` o `falla.wav` en un
parlante/otra PC cerca del celular. Con `ruido_mina.wav` de fondo se demuestra la
calibración en vivo.

> Solo puede haber **una fuente de audio a la vez** (mic O archivo). Si `/ws/audio`
> rechaza con código 1008, detener el streaming del archivo primero.

---

## 4. Qué se verificó en la integración (E2E automatizado)

1. `GET /api/health` → ok.
2. `POST /api/audio` con WAV de falla → broadcast `FAILURE` + alerta por `/ws/status`
   (payload completo del contrato inglés).
3. `POST /api/calibrate` con WAV de ruido → perfil activo, `calibrated: true`.
4. Mic simulado por `/ws/audio` (chunks Int16 de 250 ms, bomba sana + ruido, calibrado)
   → `NORMAL` con health 90–94. **La sustracción espectral funciona a través de todo el stack.**
5. `DELETE /api/calibrate` → descalibrado.

Correcciones aplicadas durante la integración:
- `modelo/signal_processing.py` reescrito como adaptador sobre `senal.py`: antes buscaba
  un `model.joblib` inexistente (siempre caía al mock) y extraía MFCCs con parámetros
  distintos a los del entrenamiento (n_fft 2048 vs 1024).
- `POST /api/audio` y `/api/calibrate`: ahora decodifican el WAV (header RIFF, float/int,
  resampleo) antes de ventanear — antes troceaban los bytes crudos del archivo como PCM.
- Reinicio de la media móvil del health score al cambiar de fuente de audio.
- Ventanas de 1 s del backend validadas contra el modelo (entrenado a 2 s): separación
  intacta (normal ~99 / falla ~3).
