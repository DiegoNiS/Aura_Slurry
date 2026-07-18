import os
import glob
import numpy as np
import librosa
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix
import joblib

# Configuration
DATASET_PATH = "data/pump/id_00"  # Expected dataset path
MODEL_PATH = "model.joblib"
SAMPLE_RATE = 16000
N_MFCC = 20
WINDOW_SECONDS = 1
WINDOW_SIZE = SAMPLE_RATE * WINDOW_SECONDS

def extract_features(audio_path):
    """
    Extract MFCC features from an audio file.
    Takes the mean and standard deviation across time.
    """
    try:
        y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, mono=False)
        # MIMII has 8 channels, we use channel 1 (index 0)
        if y.ndim > 1:
            y = y[0, :]
            
        # Extract MFCC
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)
        mfcc_mean = np.mean(mfcc, axis=1)
        mfcc_std = np.std(mfcc, axis=1)
        return np.concatenate((mfcc_mean, mfcc_std))
    except Exception as e:
        print(f"Error processing {audio_path}: {e}")
        return None

def load_data():
    X = []
    y = []
    
    normal_dir = os.path.join(DATASET_PATH, "normal")
    abnormal_dir = os.path.join(DATASET_PATH, "abnormal")
    
    if not os.path.exists(normal_dir) or not os.path.exists(abnormal_dir):
        print(f"Dataset not found at {DATASET_PATH}.")
        print("Please download the MIMII 'pump' dataset and extract it so that 'normal' and 'abnormal' folders exist there.")
        return None, None
        
    print("Loading 'normal' audio files...")
    for file in glob.glob(os.path.join(normal_dir, "*.wav")):
        features = extract_features(file)
        if features is not None:
            X.append(features)
            y.append(0)  # 0 for normal
            
    print("Loading 'abnormal' audio files...")
    for file in glob.glob(os.path.join(abnormal_dir, "*.wav")):
        features = extract_features(file)
        if features is not None:
            X.append(features)
            y.append(1)  # 1 for abnormal
            
    return np.array(X), np.array(y)

def main():
    print("Starting ML Model Training Pipeline...")
    X, y = load_data()
    
    if X is None or len(X) == 0:
        print("No data available for training.")
        return
        
    print(f"Loaded {len(X)} samples.")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Train Random Forest
    print("Training Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"Accuracy: {acc:.4f}")
    print("Confusion Matrix:")
    print(cm)
    
    # Save model
    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()
