import random

def calibrate_noise(audio_bytes_or_array):
    """
    Simulates background noise calibration.
    In the real implementation (signal_processing.py), this will return a real spectral profile.
    For now, we return a mock dictionary.
    """
    print("Mock: Calibrating noise...")
    # Simulate processing time if necessary
    return {"type": "mine_noise", "average_magnitude": random.uniform(0.1, 0.5)}

def classify_window(audio_array, noise_profile=None):
    """
    Simulates inference on an audio window.
    Returns a dictionary according to the contract defined in AGENTS.md.
    """
    # Generate a random but slightly biased probability for testing
    p = random.uniform(0.2, 1.0)
    
    if p >= 0.75:
        status = "NORMAL"
        alert = None
    elif 0.45 <= p < 0.75:
        status = "WARNING"
        alert = None
    else:
        status = "FAILURE"
        alert = "Possible cavitation/wear (MOCK)"

    health_score = int(p * 100)

    return {
        "status": status,
        "health_score": health_score,
        "confidence": p,
        "alert": alert
    }
