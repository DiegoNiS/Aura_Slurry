import numpy as np
import librosa
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
SAMPLE_RATE = 16000
N_MFCC = 20

# Load model globally if it exists, to avoid reloading on every window
clf = None
if os.path.exists(MODEL_PATH):
    clf = joblib.load(MODEL_PATH)

def calibrate_noise(audio_bytes):
    """
    Calculates the mean magnitude spectrum of the provided background noise audio.
    audio_bytes should be raw PCM Int16 bytes at 16kHz mono.
    """
    # Convert bytes to numpy array (Int16) and normalize to float32 [-1.0, 1.0]
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    
    # Calculate Short-Time Fourier Transform (STFT)
    stft = librosa.stft(audio_array)
    magnitude, _ = librosa.magphase(stft)
    
    # Average across time (axis=1) to get the noise profile
    noise_profile = np.mean(magnitude, axis=1, keepdims=True)
    return noise_profile

def spectral_subtraction(audio_array, noise_profile):
    """
    Subtracts the noise profile from the audio's magnitude spectrum.
    """
    stft = librosa.stft(audio_array)
    magnitude, phase = librosa.magphase(stft)
    
    # Subtract noise and clip negative values to 0
    clean_magnitude = np.maximum(magnitude - noise_profile, 0.0)
    
    # Reconstruct the audio signal
    clean_stft = clean_magnitude * phase
    clean_audio = librosa.istft(clean_stft)
    return clean_audio

def classify_window(audio_bytes, noise_profile=None):
    """
    Processes a window of audio, applies spectral subtraction (if noise profile is present),
    extracts MFCCs, and runs inference.
    """
    # Fallback if model is not trained yet
    if clf is None:
        return {
            "status": "WARNING",
            "health_score": 50,
            "confidence": 0.0,
            "alert": "Model not loaded (mock fallback)"
        }
        
    audio_array = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    
    # Apply spectral subtraction if calibrated
    if noise_profile is not None:
        audio_array = spectral_subtraction(audio_array, noise_profile)
        
    # Extract MFCC
    mfcc = librosa.feature.mfcc(y=audio_array, sr=SAMPLE_RATE, n_mfcc=N_MFCC)
    mfcc_mean = np.mean(mfcc, axis=1)
    mfcc_std = np.std(mfcc, axis=1)
    features = np.concatenate((mfcc_mean, mfcc_std)).reshape(1, -1)
    
    # Predict probabilities (assuming binary: 0=normal, 1=abnormal)
    probas = clf.predict_proba(features)[0]
    p_normal = probas[0]
    
    # Decision logic mapping to 3 states
    if p_normal >= 0.75:
        status = "NORMAL"
        alert = None
    elif 0.45 <= p_normal < 0.75:
        status = "WARNING"
        alert = None
    else:
        status = "FAILURE"
        alert = "Possible cavitation/wear detected"

    health_score = int(p_normal * 100)

    return {
        "status": status,
        "health_score": health_score,
        "confidence": float(np.max(probas)),
        "alert": alert
    }
