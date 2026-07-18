# Demo Assets — WAVs de respaldo (los 3 integrantes)

Blindaje de la demo (RNF-03, C-5): el sistema debe funcionar sin internet y sin micrófono.

## Archivos a reunir (T0.4)

- `normal.wav` — bomba operando normal (de MIMII `pump` o grabación propia).
- `falla.wav` — bomba con anomalía (leakage / clogging / contaminación de MIMII).
- `falla_con_ruido.wav` — falla mezclada con ruido de planta (para la prueba A/B de calibración).
- `ruido_mina.wav` — ruido de fondo de planta concentradora (p. ej. audio de YouTube), para calibrar.

Formato: WAV mono, 16 kHz (convertir con `ffmpeg -i in.wav -ac 1 -ar 16000 out.wav`).

> Los WAV no se versionan si pesan mucho; en ese caso, documentar aquí el enlace de descarga.
