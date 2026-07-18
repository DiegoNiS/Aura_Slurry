# Aura-Slurry — Documento 1: Especificación de Requerimientos (SRS)

**Metodología:** Spec-Driven Development (SDD)
**Fase:** 1 de 3 — *Especificar QUÉ se construye (no el cómo).*
**Proyecto:** Sistema de mantenimiento predictivo acústico de bajo costo para bombas de pulpa en minería.
**Equipo:** 3 integrantes.
**Evento:** Hackatón IA — FLIT 2026 (Arequipa).

---

## 1. Propósito y alcance

### 1.1 Propósito
Aura-Slurry convierte un micrófono de bajo costo en un sensor de salud mecánica para bombas de pulpa, ventiladores y motores en plantas concentradoras. Captura el sonido del equipo, aísla su firma acústica del ruido de la planta y clasifica su estado en tiempo real, mostrándolo en un dashboard tipo SCADA.

### 1.2 Alcance del MVP (lo que SÍ se construye en la hackatón)
- Pipeline de audio: captura **en vivo desde micrófono** (modo primario) → calibración de ruido (sustracción espectral) → extracción de features (MFCCs) → clasificación en tiempo real.
- Modelo entrenado sobre el subconjunto **pump** del dataset MIMII.
- Backend que sirve inferencia en streaming vía WebSockets.
- Dashboard web en tiempo real con semáforo de estado, health score y gráfico histórico.
- Módulo de "Calibrar Ruido de Mina" demostrable en vivo.

### 1.3 Fuera de alcance (roadmap, NO se construye)
- Edge computing real en microcontrolador (Raspberry Pi / Jetson / Nicla).
- Fusión de sensores (audio + vibración + temperatura).
- Aprendizaje continuo auto-adaptativo.
- Gemelo digital / realidad aumentada.
- Registro verificable (blockchain / OEFA).
- Persistencia en base de datos y autenticación de usuarios.

> Estas se presentan explícitamente como **visión de producto** en el pitch, no como funcionalidad entregada.

---

## 2. Restricciones y decisiones de diseño clave

| ID | Restricción / Decisión | Justificación |
|----|------------------------|---------------|
| C-1 | El dataset base es **MIMII (Hitachi, Japón)**, subconjunto `pump`, canal 1, 16 kHz. | Es el estándar abierto, descargable y usable en el día. **Corregir en el pitch: es japonés, no italiano.** |
| C-2 | MIMII trae etiquetas **binarias** (`normal` / `abnormal`), no tres clases. | El estado intermedio "Advertencia" **se deriva del umbral de probabilidad del clasificador**, no de una etiqueta real. Esto se documenta como decisión honesta de producto. |
| C-3 | Clasificador **Random Forest** sobre features MFCC. | Liviano, entrena en segundos sin GPU, defendible y explicable. Cumple el requisito de correr en CPU estándar. |
| C-4 | Procesamiento en **estación local / servidor** durante la demo, no edge estricto. | Honestidad técnica declarada en la propuesta. El edge es roadmap. |
| C-5 | El **modo primario es el micrófono en vivo** transmitiendo en streaming; el **audio pregrabado es el modo de respaldo** y debe funcionar siempre. | El producto se define como monitoreo en tiempo real; el respaldo blinda la demo ante fallas de hardware o conectividad el día del evento. |
| C-6 | El repositorio debe estar en **GitHub antes del cutoff**. | Requisito de entrega de la hackatón. |

---

## 3. Actores del sistema

- **Operador de planta (usuario primario):** monitorea el dashboard, dispara la calibración de ruido, reacciona a alertas.
- **Jurado (usuario de la demo):** observa el cambio de estado en vivo y el momento "wow" de la auto-calibración.
- **Fuente de audio:** micrófono instalado en la bomba transmitiendo en vivo (primario) / archivo WAV pregrabado (respaldo).

---

## 4. Requisitos funcionales (RF)

Cada RF está etiquetado con el módulo responsable: **[M]** Modelo/Señal, **[B]** Backend, **[F]** Frontend.

### Ingesta y calibración
- **RF-01 [B/F]:** El **modo primario** de operación es la captura **en vivo**: un micrófono instalado en la bomba transmite la señal de audio de forma continua al sistema, que la clasifica en tiempo real sin intervención del usuario. Como **modo secundario** (respaldo de demo y pruebas), el sistema debe aceptar también archivos WAV pregrabados.
- **RF-01b [B]:** El backend debe recibir el audio en vivo como un **stream continuo de chunks** (no como archivo), bufferizarlo y ventanearlo para la inferencia sin cortes perceptibles.
- **RF-02 [M/B]:** El sistema debe permitir grabar un perfil de "ruido de fondo de planta" de N segundos y almacenarlo en memoria para la sesión.
- **RF-03 [M]:** Antes de clasificar, el sistema debe aplicar **sustracción espectral** del perfil de ruido calibrado sobre el audio entrante.
- **RF-04 [F]:** El dashboard debe exponer un botón **"Calibrar Ruido de Mina"** que dispare RF-02.

### Procesamiento y clasificación
- **RF-05 [M]:** El sistema debe segmentar el audio en ventanas de longitud fija (p. ej. 1–2 s) para inferencia continua.
- **RF-06 [M]:** El sistema debe extraer **MFCCs** (y estadísticos agregados: media/desviación) por ventana usando `librosa`.
- **RF-07 [M]:** El clasificador debe devolver, por ventana: (a) clase predicha y (b) **probabilidad/confianza**.
- **RF-08 [M/B]:** El sistema debe mapear la salida del modelo a **tres estados de UI**:
  - `NORMAL` → predicción "normal" con alta confianza.
  - `ADVERTENCIA` → confianza en zona de umbral (banda gris configurable).
  - `FALLA` → predicción "abnormal" con alta confianza.
- **RF-09 [M/B]:** El sistema debe calcular un **health score** (0–100) derivado de la probabilidad de normalidad, suavizado en el tiempo (media móvil) para evitar parpadeo.

### Comunicación en tiempo real
- **RF-10 [B]:** El backend debe exponer un endpoint **WebSocket** que emita continuamente `{ timestamp, estado, health_score, confianza, alerta }`.
- **RF-11 [B]:** El backend debe exponer un endpoint REST para subir el audio pregrabado y para enviar/limpiar el perfil de ruido.
- **RF-12 [B]:** Cuando el estado sea `FALLA`, el mensaje debe incluir una **alerta** con tipo de anomalía (etiqueta genérica: "posible cavitación/desgaste").

### Visualización
- **RF-13 [F]:** El dashboard debe mostrar un **semáforo** (verde/amarillo/rojo) sincronizado con el estado.
- **RF-14 [F]:** El dashboard debe mostrar un **gauge de health score**.
- **RF-15 [F]:** El dashboard debe mostrar un **gráfico temporal** del health score (últimas N ventanas).
- **RF-16 [F]:** El dashboard debe mostrar un **panel de alertas** con el evento de falla y su timestamp.
- **RF-17 [F]:** El dashboard debe reflejar visualmente el estado "calibrando" mientras se captura el perfil de ruido.

### Recomendaciones con IA Generativa
- **RF-18 [B]:** El backend debe utilizar un LLM (ej. Gemini 2.5 Flash) vía API para generar recomendaciones operativas cortas en lenguaje natural basadas en el estado de salud de la bomba.
- **RF-19 [B]:** La IA debe dispararse asíncronamente (sin bloquear el audio) ante un cambio de estado, o de forma preventiva cada 30 minutos.
- **RF-20 [F]:** El dashboard debe mostrar permanentemente la recomendación de la IA en pantalla.
- **RF-21 [B/F]:** Cuando un equipo supere un **umbral de alertas sostenidas** (N ventanas de FALLA en una ventana de observación), el sistema debe generar con IA un **reporte de incidente dirigido a la minera** (resumen ejecutivo, datos, acción recomendada), mostrarlo en la interfaz y, si hay correo configurado, enviarlo a la minera y al equipo. *(Valor del servicio como intermediario — feedback de mentoría 2026-07-18.)*

---

## 5. Requisitos no funcionales (RNF)

- **RNF-01 (Rendimiento):** La latencia de captura → clasificación → actualización de UI debe ser suficientemente baja para percibirse "en vivo" (objetivo: < 2 s por ventana).
- **RNF-02 (Portabilidad):** Todo el núcleo corre en CPU estándar, sin GPU. Python 3.10+.
- **RNF-03 (Robustez de demo):** El sistema debe funcionar sin internet y sin micrófono, usando WAV de respaldo.
- **RNF-04 (Explicabilidad):** El equipo debe poder justificar la predicción (features MFCC + matriz de confusión + confianza).
- **RNF-05 (Reproducibilidad):** Modelo serializado (`joblib`) versionado en el repo, con script de entrenamiento reproducible.
- **RNF-06 (Estética):** UI con tema oscuro industrial (SCADA), legible a distancia para la proyección del pitch.
- **RNF-07 (Mantenibilidad):** Interfaces claras entre los tres módulos (contratos de datos definidos en el Documento 2).

---

## 6. Criterios de aceptación del MVP (Definition of Done)

El proyecto se considera "entregable" cuando:

1. Con el **micrófono en vivo** captando audio **normal** (o el WAV de respaldo), el dashboard permanece en **verde** con health score alto. *(cubre RF-01,06,07,08,09,13,14)*
2. Al captar audio de **falla mezclado con ruido de mina** (en vivo o WAV de respaldo), el dashboard cambia a **rojo** con alerta. *(cubre RF-03,08,12,16)*
3. Al pulsar **"Calibrar Ruido de Mina"**, el sistema captura el perfil y mejora/estabiliza la clasificación en vivo. *(cubre RF-02,03,04,17)*
4. El backend emite estado por WebSocket de forma continua y el frontend lo consume sin recargar. *(cubre RF-10,15)*
5. El repositorio está en **GitHub** con README, modelo serializado y script de entrenamiento. *(cubre RNF-05, C-6)*

---

## 7. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| El dataset MIMII no representa ruido minero real | Q&A técnico del jurado | Módulo de calibración de ruido en vivo (convierte debilidad en demo) — RF-02/03. |
| Fallo de micrófono/conectividad en la demo | Se cae el "producto funcional" (40% del puntaje) | WAV de respaldo pregrabado — RNF-03, C-5. |
| "Advertencia" no es una etiqueta real de MIMII | Credibilidad | Documentado como umbral de confianza — C-2, RF-08. |
| Integración tardía entre módulos | Se pierde tiempo al final | Contratos de datos congelados temprano (Documento 2) + mocks. |
| Procesamiento de audio en vivo lento | Latencia visible | Ventaneo corto + features livianos + Random Forest — RNF-01. |
