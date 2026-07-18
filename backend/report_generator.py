"""
report_generator.py — Reportes de incidente hacia la minera (feedback mentor).

Cuando la bomba supera un umbral de alertas sostenidas, se genera con Gemini
un reporte gerencial (no operativo): resumen ejecutivo + datos + acción.
Se muestra en el dashboard (panel Reportes) y, si hay SMTP configurado en
.env, se envía también por correo a la minera y al equipo.

Variables de entorno para el correo (opcionales — sin ellas el reporte
solo se muestra en la interfaz):
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=cuenta@gmail.com
    SMTP_PASS=app-password-de-16-letras
    REPORT_EMAIL_TO=supervisor@minera.com, equipo@aura.com
"""
from __future__ import annotations

import os
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText

from google import genai
from google.genai import types

MACHINE = {
    "name": "Bomba de Pulpa #1 (PUMP-01)",
    "model": "Warman AH 8/6",
    "location": "Planta Concentradora — Línea de Molienda A",
}


def _fallback_report(incident: dict) -> dict:
    """Reporte con plantilla fija si Gemini no está disponible (sin key/red)."""
    subject = (
        f"[Aura-Slurry] Incidente acústico en {MACHINE['name']}: "
        f"{incident['failure_count']} alertas en {incident['window_seconds']} s"
    )
    body = (
        f"REPORTE DE INCIDENTE — {incident['timestamp']}\n\n"
        f"Equipo: {MACHINE['name']} ({MACHINE['model']})\n"
        f"Ubicación: {MACHINE['location']}\n\n"
        f"El sistema de monitoreo acústico detectó {incident['failure_count']} "
        f"ventanas de FALLA en los últimos {incident['window_seconds']} segundos "
        f"(umbral: {incident['threshold']}). Health score actual: "
        f"{incident['health_score']}/100.\n\n"
        f"Alerta activa: {incident.get('alert') or 'Firma acústica anómala'}\n\n"
        f"Acción recomendada: inspección del equipo a la brevedad y monitoreo "
        f"continuo hasta descartar cavitación o desgaste de impulsor."
    )
    return {"subject": subject, "body": body}


def generate_incident_report(incident: dict) -> dict:
    """Genera {subject, body} con Gemini; degrada a plantilla si falla."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "TU_API_KEY_AQUI":
        return _fallback_report(incident)

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
Eres el ingeniero de confiabilidad de Aura-Slurry, un servicio de monitoreo
acústico predictivo. Redacta un REPORTE DE INCIDENTE formal y breve dirigido
a la gerencia de mantenimiento de la minera cliente.

Datos del incidente:
- Equipo: {MACHINE['name']} ({MACHINE['model']}), {MACHINE['location']}
- Fecha/hora (UTC): {incident['timestamp']}
- Ventanas de FALLA detectadas: {incident['failure_count']} en los últimos {incident['window_seconds']} segundos (umbral de reporte: {incident['threshold']})
- Health score actual: {incident['health_score']}/100
- Alerta del clasificador: {incident.get('alert') or 'firma acústica anómala'}

Formato EXACTO de salida (texto plano, sin markdown):
ASUNTO: <una línea, máximo 90 caracteres>
RESUMEN EJECUTIVO: <2 frases: qué pasó y qué implica para la operación>
DATOS: <2-3 líneas con las cifras clave>
ACCIÓN RECOMENDADA: <2 frases concretas y priorizadas>

En español, tono profesional, sin alarmismo, sin inventar datos que no te di.
"""
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.2),
        )
        texto = response.text.strip()
        subject = None
        for linea in texto.splitlines():
            if linea.upper().startswith("ASUNTO:"):
                subject = linea.split(":", 1)[1].strip()
                break
        if not subject:
            subject = _fallback_report(incident)["subject"]
        return {"subject": f"[Aura-Slurry] {subject}", "body": texto}
    except Exception as e:
        print(f"Error generando reporte con Gemini: {e}")
        return _fallback_report(incident)


def send_report_email(report: dict) -> bool:
    """Envía el reporte por SMTP si está configurado. True si se envió."""
    host = os.getenv("SMTP_HOST")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    destinos = [d.strip() for d in os.getenv("REPORT_EMAIL_TO", "").split(",") if d.strip()]
    if not (host and user and password and destinos):
        return False

    try:
        msg = MIMEText(report["body"], "plain", "utf-8")
        msg["Subject"] = report["subject"]
        msg["From"] = user
        msg["To"] = ", ".join(destinos)
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=20) as smtp:
            smtp.starttls()
            smtp.login(user, password)
            smtp.sendmail(user, destinos, msg.as_string())
        return True
    except Exception as e:
        print(f"Error enviando reporte por correo: {e}")
        return False


def build_incident(failure_count: int, window_seconds: int, threshold: int,
                   health_score: int, alert: str | None) -> dict:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "failure_count": failure_count,
        "window_seconds": window_seconds,
        "threshold": threshold,
        "health_score": health_score,
        "alert": alert,
    }
