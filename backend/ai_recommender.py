import os
import asyncio
from google import genai
from google.genai import types

def generate_recommendation(status: str, health_score: int, alert: str) -> str:
    """
    Synchronous wrapper to call Gemini API. To be run in a threadpool if async is needed.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "TU_API_KEY_AQUI":
        return "System note: GEMINI_API_KEY is missing or invalid. Recommendation unavailable."
        
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        Eres AURI, el asistente de monitoreo acústico de Aura-Slurry. Te diriges
        al SUPERVISOR en la sala de supervisión de una planta concentradora.
        Telemetría actual de la bomba de pulpa:
        - Estado: {status}
        - Health score: {health_score}/100
        - Alerta/anomalía reciente: {alert if alert else 'Ninguna'}

        Redacta una SUGERENCIA breve (máximo 2 frases) para el supervisor.
        Reglas estrictas:
        - NUNCA des órdenes directas ni imperativas ("detenga", "pare"). La IA
          sugiere; la decisión es del supervisor según los procedimientos del sitio.
        - Usa condicional o formulaciones como "se sugiere evaluar…",
          "convendría verificar…", "considere programar una inspección…".
        - Prioriza verificar/inspeccionar/monitorear sobre detener el equipo.
        - Texto plano, sin markdown, en español.
        """
        
        response = client.models.generate_content(
            # ⚠️ NO volver a gemini-2.5-flash: da 404 para cuentas nuevas.
            # Este alias apunta siempre al flash vigente.
            model="gemini-flash-latest",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
            )
        )
        return response.text.strip()
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"System note: Error generating recommendation. {str(e)}"

async def get_pump_recommendation_async(status: str, health_score: int, alert: str) -> str:
    """
    Asynchronous wrapper to prevent blocking the main audio loop.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None, 
        generate_recommendation, 
        status, 
        health_score, 
        alert
    )
