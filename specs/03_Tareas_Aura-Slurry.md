# Aura-Slurry — Documento 3: Plan de Tareas (SDD)

**Fase:** 3 de 3 — *Descomponer en tareas ejecutables y repartirlas.*
Sin estimaciones de tiempo (por pedido). Las tareas están agrupadas por integrante y ordenadas por dependencia. Cada tarea referencia el requisito (RF/RNF) que satisface.

**Convención de estados:** ☐ pendiente · ◐ en progreso · ☑ hecho.

---

## Tarea 0 — Setup compartido (los 3, primero que nada)

- ☐ **T0.1** Crear repo en GitHub, estructura de carpetas del Doc 2 §7, `README.md` base, `requirements.txt`. *(C-6, RNF-05)*
- ☐ **T0.2** Congelar los **contratos de interfaz** del Doc 2 §4 (contrato Python + WebSocket + REST) en el README. *(RNF-07)*
- ☐ **T0.3** Descargar el subconjunto `pump` de MIMII (empezar con 1 `id`, SNR 6 dB). *(C-1)*
- ☐ **T0.4** Reunir y guardar en `/demo_assets/` los 3 WAV de respaldo: normal, falla, ruido de mina. *(RNF-03, C-5)*

---

## 👤 Integrante 1 — Modelo / Señal
*Foco: algoritmia de audio. Entrega el "cerebro" como funciones puras.*

### Bloque A — Modelo base (desbloquea a todos)
- ☐ **T1.1** Script de carga: leer WAV de MIMII, tomar canal 1, resamplear a 16 kHz. *(RF-05, C-1)*
- ☐ **T1.2** Extracción de features: MFCCs con `librosa` (`n_mfcc=20`), agregar media + std → vector fijo. *(RF-06)*
- ☐ **T1.3** Entrenar `RandomForestClassifier` sobre normal vs abnormal; split train/val/test. *(C-3)*
- ☐ **T1.4** Evaluar: accuracy + **matriz de confusión** (material para el pitch y RNF-04). *(RNF-04)*
- ☐ **T1.5** Serializar el modelo a `modelo.joblib`. *(RNF-05)*
- ☐ **T1.6** Publicar **cuanto antes** un `senal.py` con la firma del contrato 4.1 aunque sea con lógica mínima, para que Backend no espere. *(RNF-07)*

### Bloque B — Función de inferencia (el contrato real)
- ☐ **T1.7** Implementar `clasificar_ventana(audio, perfil_ruido=None)` que devuelva **exactamente** el dict del contrato 4.1. *(RF-07)*
- ☐ **T1.8** Implementar el **mapeo a 3 estados** por umbral de probabilidad (NORMAL/ADVERTENCIA/FALLA). *(RF-08, C-2)*
- ☐ **T1.9** Implementar `health_score` = prob_normal × 100 con **media móvil** para evitar parpadeo. *(RF-09)*
- ☐ **T1.10** Poblar el campo `alerta` con etiqueta genérica cuando el estado sea FALLA. *(RF-12)*

### Bloque C — Sustracción espectral (el diferenciador del pitch)
- ☐ **T1.11** Implementar `calibrar_ruido(audio)`: promediar espectro STFT del ruido → `perfil_ruido`. *(RF-02)*
- ☐ **T1.12** Aplicar **sustracción espectral** del perfil antes de extraer MFCC en la inferencia en vivo. *(RF-03)*
- ☐ **T1.13** Garantizar que si `perfil_ruido=None`, el pipeline funciona igual (sin romperse). *(robustez de demo)*
- ☐ **T1.14** Prueba A/B: clasificar el WAV de falla+ruido **con y sin** calibración, para demostrar la mejora en vivo. *(criterio de aceptación 3)*

---

## 👤 Integrante 2 — Backend / Integración
*Foco: servicio en tiempo real. Orquesta el modelo y lo expone por red.*

### Bloque A — Esqueleto del servicio
- ☐ **T2.1** Levantar FastAPI + `uvicorn`; endpoint `GET /api/health`. *(RF-11)*
- ☐ **T2.2** Definir un **mock de `clasificar_ventana`** que devuelva el contrato 4.1, para no esperar al Integrante 1. *(desacople)*
- ☐ **T2.3** Implementar el **WebSocket** `/ws/estado` con un `ws_manager` que emita mensajes en streaming. *(RF-10)*
- ☐ **T2.4** Hacer que el WS emita primero datos **falsos** (random) para que Frontend arranque ya. *(integración temprana)*

### Bloque B — Pipeline real
- ☐ **T2.5** `POST /api/audio`: recibir WAV pregrabado (multipart), buffer, y **ventanear** para inferencia continua. *(RF-01, RF-05)*
- ☐ **T2.6** Reemplazar el mock por la `clasificar_ventana` real del Integrante 1 e ir emitiendo el estado por WS. *(RF-07, RF-08, RF-09)*
- ☐ **T2.7** Loop de streaming: por cada ventana → clasificar → emitir mensaje del contrato 4.2 por WebSocket. *(RF-10)*
- ☐ **T2.8** Incluir en cada mensaje el flag `calibrado` y la `alerta`. *(RF-12)*

### Bloque C — Calibración vía API
- ☐ **T2.9** `POST /api/calibrar`: recibir WAV de ruido → llamar `calibrar_ruido` → guardar `perfil_ruido` en estado de sesión. *(RF-02)*
- ☐ **T2.10** `DELETE /api/calibrar`: limpiar el perfil. *(RF-02)*
- ☐ **T2.11** Pasar el `perfil_ruido` activo a cada llamada de `clasificar_ventana`. *(RF-03)*
- ☐ **T2.12** Soportar **entrada de micrófono en vivo** vía navegador si da tiempo; si no, WAV pregrabado es suficiente (C-5). *(RF-01)*
- ☐ **T2.13** Habilitar **CORS** para el frontend. *(integración)*

---

## 👤 Integrante 3 — Frontend / Narrativa del pitch
*Foco: producto visible y credibilidad de dominio.*

### Bloque A — Andamiaje del dashboard
- ☐ **T3.1** Inicializar React (Vite) + Material UI, tema **oscuro industrial (SCADA)**. *(RNF-06)*
- ☐ **T3.2** Cliente **WebSocket** que se conecta a `/ws/estado` y consume el contrato 4.2. *(RF-10)*
- ☐ **T3.3** Arrancar contra el WS **mock** del Integrante 2 (datos random) — no esperar al backend real. *(integración temprana)*

### Bloque B — Componentes de visualización
- ☐ **T3.4** Componente **Semáforo** (verde/ámbar/rojo) sincronizado con `estado`. *(RF-13)*
- ☐ **T3.5** Componente **Gauge de health score**. *(RF-14)*
- ☐ **T3.6** **Gráfico temporal** del health score con Recharts (buffer de últimas N ventanas). *(RF-15)*
- ☐ **T3.7** **Panel de alertas** que registra evento + timestamp cuando llega `estado=FALLA`. *(RF-16)*
- ☐ **T3.8** Estado visual **"CALIBRANDO"** (azul + spinner). *(RF-17)*

### Bloque C — Controles y demo
- ☐ **T3.9** Botón **"Calibrar Ruido de Mina"** → `POST /api/calibrar` con el WAV de ruido. *(RF-04, RF-02)*
- ☐ **T3.10** Botón **"Cargar Audio"** → `POST /api/audio` con WAV normal o de falla. *(RF-01)*
- ☐ **T3.11** Indicador global **CALIBRADO / NO CALIBRADO** leyendo el flag del WS. *(RF-17)*

### Bloque D — Narrativa (rol de dominio de José)
- ☐ **T3.12** Redactar el **caso de negocio**: costo de downtime de bomba de pulpa vs. equipos "ciegos" sin monitoreo. *(pitch)*
- ☐ **T3.13** Escribir el **guion del pitch** siguiendo la ruta: gancho → demo → diferenciador (calibración en vivo) → cierre ($50 vs $5,000+). *(pitch)*
- ☐ **T3.14** Preparar la lámina de **roadmap** (edge, fusión de sensores, impacto social/OEFA) como *visión*, no como entregado. *(escalabilidad, 20% del puntaje)*
- ☐ **T3.15** Aportar credibilidad de campo (experiencia real en Southern Peru) en el guion. *(RNF-04)*

---

## 🔗 Integración final (los 3 juntos)

- ☐ **TI.1** Reemplazar todos los mocks por implementación real y verificar el flujo end-to-end. *(integración)*
- ☐ **TI.2** Correr el **escenario de demo guionizado**: normal (verde) → falla (rojo) → calibrar → estabilización. *(criterios de aceptación 1–4)*
- ☐ **TI.3** Verificar los **5 criterios de aceptación** del Doc 1 §6 uno por uno.
- ☐ **TI.4** Ensayar el pitch cronometrado con la demo en vivo. *(pitch)*
- ☐ **TI.5** **Commit y push final a GitHub** antes del cutoff, con README, `modelo.joblib` y `demo_assets/`. *(C-6, RNF-05)*

---

## Mapa rápido de dependencias (quién desbloquea a quién)

| Para que avance… | …necesita primero |
|------------------|-------------------|
| Integrante 2 (pipeline real T2.6) | `senal.py` con contrato de Integrante 1 (T1.6/T1.7) |
| Integrante 3 (componentes T3.4+) | contrato WebSocket + mock de Integrante 2 (T2.3/T2.4) |
| Todos (integración TI.1) | contratos congelados en T0.2 |

**La jugada clave:** T0.2 (congelar contratos) + los mocks tempranos (T2.2, T2.4, T3.3, T1.6) permiten que los 3 trabajen **en paralelo desde el minuto uno** sin bloquearse. Esa es la diferencia entre terminar y no terminar.
