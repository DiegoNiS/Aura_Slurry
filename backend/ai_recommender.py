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
        You are a highly experienced Reliability Engineer monitoring a slurry pump in a mining plant.
        The current pump telemetry is as follows:
        - Status: {status}
        - Health Score: {health_score}/100
        - Recent Alert/Anomaly: {alert if alert else 'None'}
        
        Provide a very short, direct, and actionable recommendation (max 2 sentences) for the operator.
        Do not use markdown, just plain text. Output the recommendation in Spanish.
        """
        
        response = client.models.generate_content(
            # alias estable: siempre apunta al modelo flash vigente
            # (gemini-2.5-flash dejó de estar disponible para cuentas nuevas)
            model="gemini-flash-latest",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
            )
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return "System note: Error generating recommendation."

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
