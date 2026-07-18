# Base teórica: Aura-Slurry (acústico) vs análisis de vibraciones

## Contexto: qué se usa hoy en minería peruana

El **análisis de vibraciones** es el estándar de mantenimiento predictivo en
minería peruana: acelerómetros + espectros FFT + normas ISO 10816/20816 para
detectar desbalance, desalineación y fallas de rodamientos. Hay industria
local dedicada (DMR SAC, Sedisa, entre otras) y cobertura de prensa minera
(Rumbo Minero) sobre monitoreo de vibraciones en molinos.

Dos modalidades en la práctica:
- **Continuo online**: solo equipos críticos (molinos, chancadoras).
- **Rutas periódicas**: analista con colector portátil visita cada bomba
  mensual o trimestralmente. La mayoría de bombas medianas está aquí — o en
  **nada** ("equipos ciegos"). Ese es nuestro mercado.

## Comparativa operativa

| Dimensión | Vibraciones (actual) | Aura-Slurry (acústico + IA) |
|---|---|---|
| Principio físico | Acelerómetro EN CONTACTO mide movimiento estructural | Micrófono SIN CONTACTO capta la onda de presión de los mismos fenómenos |
| Costo por punto | Sensor $100–500; inalámbrico continuo $300–1,500 + gateway + software; analizador portátil $10–30k | ~$50 (micrófono + nodo); CPU estándar |
| Instalación | Montaje mecánico en punto específico, cableado, a veces parada | Se cuelga cerca del equipo; cero intervención |
| Frecuencia de diagnóstico | Continuo solo en críticos; resto rutas mensuales → fallas entre visitas no se ven | Continuo en todos (1 diagnóstico/segundo) |
| Especialista | Analista certificado ISO 18436 Cat II/III interpreta espectros | El modelo clasifica; supervisor recibe semáforo + sugerencia + reporte |
| Detecta mejor | Rodamientos (envolvente), desbalance, desalineación — localiza el componente | Cavitación (fenómeno acústico por excelencia), fugas, obstrucción, cambios de firma global |
| Debilidad | Costo y logística → la mayoría de bombas sin nada | Ruido ambiente → mitigado con calibración por sustracción espectral (diferenciador) |
| Normativa | ISO de severidad establecidas | Emergente; base seria: MIMII/DCASE existen para diagnóstico por sonido |

## Posicionamiento para el pitch (la respuesta al jurado)

> "El análisis de vibraciones es excelente y no competimos con él en los
> equipos críticos que ya lo tienen. Una concentradora tiene decenas de
> bombas que se revisan una vez al mes o nunca, porque instrumentarlas con
> vibración cuesta cientos de dólares por punto más el analista. Aura-Slurry
> pone una oreja de $50 escuchando cada una 24/7; cuando una suena mal, el
> sistema alerta y ENTONCES va el analista de vibraciones a confirmar y
> localizar. Somos el filtro barato que hace rentable al método caro."

Base teórica en una frase: **sonido y vibración son el mismo fenómeno
mecánico propagándose por medios distintos** (aire vs estructura). La
cavitación, el desgaste y las fugas dejan firma en ambos; la leemos por el
camino que no requiere tocar la máquina.

## Fuentes

- DMR SAC — monitoreo de condición para minería en Perú:
  https://www.dmrperu.com/monitoreo-de-condicion-para-industria-minera-ctc-mantenimiento-predictivo-peru/
- Sedisa — análisis vibracional en todo el Perú:
  https://sedisaservicios.com/servicios/servicio-analisis-vibracional/
- Rumbo Minero — monitoreo de vibraciones en molinos:
  https://www.rumbominero.com/peru/noticias/actualidad-empresarial/monitoreo-de-vibraciones/
- Tecnomin — control de vibraciones en equipos rotativos de planta minera:
  https://tecnominproductos.com/noticia/control-de-vibraciones-en-equipos-rotativos-de-planta-minera-monitoreo-predictivo-y-confiabilidad-operacional-Fjgy1
- SKF — sensores de vibración industriales:
  https://www.skf.com/mx/products/condition-monitoring-systems/sensors/vibration-sensors
- Erbessd — sensores inalámbricos de monitoreo de condición:
  https://www.erbessd-instruments.com/en/wireless-vibration-sensors/
