/**
 * Aura-Slurry — REST API Client
 *
 * Aligned with the backend REST endpoints (English contract):
 *   POST   /api/audio      → Upload WAV (fallback mode)
 *   POST   /api/calibrate  → Upload noise profile WAV
 *   DELETE /api/calibrate  → Clear calibration
 *   GET    /api/health     → Health check
 */
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Upload a WAV file for fallback analysis.
 * @param {File|Blob} file - WAV audio file
 * @returns {Promise<Object>}
 */
export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(API_ENDPOINTS.audio, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Send noise calibration audio to backend.
 * @param {Blob} audioBlob - WAV blob of ambient noise recording
 * @returns {Promise<{calibrado: boolean, segundos: number}>}
 */
export async function calibrateNoise(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'ruido_calibracion.wav');

  const response = await fetch(API_ENDPOINTS.calibrate, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Calibration failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Clear the current noise calibration profile.
 * @returns {Promise<{calibrado: boolean}>}
 */
export async function clearCalibration() {
  const response = await fetch(API_ENDPOINTS.calibrate, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Clear calibration failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch incident reports generated for the mining company.
 * @returns {Promise<{reports: Array}>}
 */
export async function getReports() {
  const response = await fetch(API_ENDPOINTS.reports, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Reports fetch failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Backend health check.
 * @returns {Promise<{status: string}>}
 */
export async function healthCheck() {
  const response = await fetch(API_ENDPOINTS.health, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  return response.json();
}
