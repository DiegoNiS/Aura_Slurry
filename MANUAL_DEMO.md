# 📖 Manual — Levantar Aura-Slurry y probar con el celular

Escenario: **laptop** corre todo (backend + dashboard) y el **celular** actúa como
micrófono de la bomba, conectado por **cable USB compartiendo internet** (tethering).
Por ese mismo cable viaja la comunicación celular ↔ laptop, sin necesidad de Wi-Fi.

> IPs de este manual (enlace USB actual):
> **laptop = `10.112.123.164`** · celular/gateway = `10.112.123.209`
> Si desconectas y reconectas el cable u otra red, la IP puede cambiar → ver §7.1.

---

## 1. Preparación (una sola vez)

1. **Dependencias Python** (backend + modelo):
   ```powershell
   cd D:\HackatonFLIT
   pip install -r requirements.txt
   ```
2. **Compilar el dashboard** (queda embebido en el backend, puerto 8000):
   ```powershell
   cd D:\HackatonFLIT\frontend
   npm install
   npm run build
   ```
   > ⚠️ Rehacer `npm run build` cada vez que cambie `frontend/.env.local` (la IP)
   > o el código del frontend.
3. **(Opcional) IA de recomendaciones:** crear `backend/.env` con
   `GEMINI_API_KEY=tu_key`. Sin key el sistema funciona igual.

---

## 2. Levantar el sistema (cada vez)

**Una sola terminal** (el backend sirve también el dashboard):

```powershell
cd D:\HackatonFLIT\backend
$env:MOCK_WHEN_IDLE = "0"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

- `MOCK_WHEN_IDLE=0` → sin datos inventados cuando no fluye audio (modo demo real).
- `--host 0.0.0.0` → **imprescindible** para que el celular pueda conectarse.

**Verificar:** abrir en la laptop `http://localhost:8000` → debe cargar el dashboard,
y `http://localhost:8000/api/health` → `{"status":"ok"}`.

> 💻 *Solo para desarrollo del frontend* (hot reload): en otra terminal
> `cd frontend && npm run dev` y abrir `http://localhost:5173`. Para la demo con
> celular NO hace falta — usar siempre el puerto 8000.

---

## 3. Conectar el celular (una sola vez por celular)

1. Celular conectado por USB con **compartir internet activado** (ya lo tienes así).
2. En el **Chrome del celular**, abrir: `http://10.112.123.164:8000` → debe cargar
   el dashboard. Si no carga, ver §7.2 (firewall).
3. **Desbloquear el micrófono** (Chrome bloquea `getUserMedia` en HTTP no-localhost):
   - En el celular ir a: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
   - En el cuadro de texto escribir exactamente: `http://10.112.123.164:8000`
   - Cambiar a **Enabled** → pulsar **Relaunch**.
4. Volver a abrir `http://10.112.123.164:8000`.

---

## 4. Prueba 1 — Celular como micrófono en vivo (modo primario)

1. En el dashboard **del celular**, pulsar **Monitoreo en Vivo** y aceptar el
   permiso de micrófono.
2. El celular empieza a transmitir chunks PCM (16 kHz) por `/ws/audio`; la laptop
   clasifica cada segundo y **todos los dashboards conectados** (laptop y celular)
   se actualizan en vivo por `/ws/status`.
3. **Simular la bomba:** en un parlante (otra PC, TV, etc.) reproducir cerca del celular:
   - `demo_assets/normal.wav` → debe verse 🟢 NORMAL (health alto)
   - `demo_assets/falla.wav` → debe caer a 🔴 FAILURE con alerta
4. **Demostrar la calibración (momento wow):**
   - Reproducir `ruido_mina.wav` mezclado (o de fondo) → aparecen falsas alarmas
   - En el panel **Calibración de Ruido**, calibrar (usa `ruido_mina.wav` o graba
     N segundos del ambiente) → el estado se estabiliza en 🟢 con la bomba sana.

> Regla: **una sola fuente de audio a la vez** (micrófono O archivo). Si `/ws/audio`
> se rechaza (código 1008), hay un streaming de archivo activo — esperar a que
> termine o reiniciar el backend.

## 5. Prueba 2 — Audio largo simulando tiempo real (respaldo)

Sin celular, con `demo_assets/demo_largo.wav` (3 min, se reproduce a ritmo real,
1 ventana = 1 segundo). Subirlo con **Cargar Audio** en el dashboard:

| Minuto | Audio | Qué debe verse |
|---|---|---|
| 0:00–1:00 | Bomba normal | 🟢 NORMAL estable, health ~95–100 |
| 1:00–1:30 | Bomba SANA + ruido de planta | 🔴 **falsas alarmas** → calibrar aquí con `ruido_mina.wav` → vuelve 🟢 |
| 1:30–2:30 | Falla real | 🔴 FAILURE + alertas en el panel |
| 2:30–3:00 | Normal de nuevo | 🟢 recuperación |

## 6. Guion sugerido para la demo del pitch

1. Dashboard en 🟢 con el celular escuchando la "bomba" (normal.wav en parlante).
2. Cambiar al audio de falla → 🔴 alerta en segundos. *"Detección en tiempo real."*
3. Meter ruido de planta con bomba sana → falsas alarmas. *"Así suena una mina real."*
4. Pulsar Calibrar → vuelve a 🟢. *"Nuestro diferenciador: se adapta al ruido del sitio."*
5. Cerrar con salud/roadmap. Si algo falla → Prueba 2 (audio largo) como plan B.

---

## 7. Solución de problemas

**7.1 Cambió la IP (reconectaste el cable / otra red)**
```powershell
ipconfig        # buscar la IPv4 del adaptador del tethering (Ethernet 2)
```
Editar `frontend/.env.local` con la IP nueva (en `ws://` y `http://`), luego:
```powershell
cd D:\HackatonFLIT\frontend ; npm run build
```
Reiniciar el backend y actualizar el chrome://flags del celular con la IP nueva.

**7.2 El celular no carga la página**
- ¿Backend arrancado con `--host 0.0.0.0`?
- Probar desde el celular: `http://10.112.123.164:8000/api/health`.
- Firewall: la red USB está como "Pública" y **Python ya tiene permiso** en redes
  públicas (verificado). Si aun así bloquea, en PowerShell **como administrador**:
  ```powershell
  Set-NetConnectionProfile -InterfaceAlias "Ethernet 2" -NetworkCategory Private
  ```
- El puerto 5173 (Vite) SÍ está bloqueado para el celular (Node en red pública);
  por eso el celular usa siempre el **8000**.

**7.3 El micrófono no arranca en el celular**
- Revisar el flag de Chrome (§3.3) con la URL exacta y relanzar Chrome.
- Verificar permiso de micrófono del sitio (candado en la barra de dirección).

**7.4 El dashboard no se mueve**
- Con `MOCK_WHEN_IDLE=0` es normal que no haya datos hasta que fluya audio
  (micrófono o archivo). Con `=1` emite datos simulados cada segundo.

**7.5 `/ws/audio` se cierra al conectar (1008)**
- Ya hay otra fuente activa (archivo o otro celular). Una fuente a la vez.
