import random
import time

def calibrar_ruido(audio_bytes_o_array):
    """
    Simula la calibración de ruido de fondo.
    En la implementación real de `senal.py` esto devolverá un perfil espectral real.
    Por ahora devolvemos un diccionario mock.
    """
    print("Mock: Calibrando ruido...")
    # Simular tiempo de procesamiento si es necesario
    return {"tipo": "ruido_mina", "magnitud_promedio": random.uniform(0.1, 0.5)}

def clasificar_ventana(audio_array, perfil_ruido=None):
    """
    Simula la inferencia sobre una ventana de audio.
    Retorna un diccionario según el contrato definido en AGENTS.md.
    """
    # Generar una probabilidad aleatoria pero ligeramente sesgada para probar
    p = random.uniform(0.2, 1.0)
    
    if p >= 0.75:
        estado = "NORMAL"
        alerta = None
    elif 0.45 <= p < 0.75:
        estado = "ADVERTENCIA"
        alerta = None
    else:
        estado = "FALLA"
        alerta = "Posible cavitación/desgaste (MOCK)"

    health_score = int(p * 100)

    # Simular un poco de latencia para parecerse a la realidad
    # time.sleep(0.05)

    return {
        "estado": estado,
        "health_score": health_score,
        "confianza": p,
        "alerta": alerta
    }
