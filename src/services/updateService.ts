/**
 * NEXA Church — Remote Update Service
 * Sistema de verificación de versiones y actualizaciones remotas.
 * Opera de forma 100% silenciosa y no interfiere con el funcionamiento offline.
 */

export interface RemoteVersionInfo {
  version: string;
  releaseDate: string;
  minRequiredVersion?: string;
  downloadUrl: string;
  changelog: string[];
  critical: boolean;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  remoteInfo: RemoteVersionInfo | null;
  error?: string;
}

export const CURRENT_APP_VERSION = '2.0.2';

// Endpoint alojado en Netlify para consulta sin latencia ni costo
const REMOTE_VERSION_URL = 'https://nexa-church.netlify.app/updates/version.json';

/**
 * Compara dos cadenas semver (ej: '2.1.0' vs '2.0.0')
 * Retorna true si remote > current
 */
export function isVersionHigher(remote: string, current: string): boolean {
  const rParts = remote.split('.').map((p) => parseInt(p, 10) || 0);
  const cParts = current.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

/**
 * Consulta el manifiesto de versión remoto con timeout de seguridad (5 segundos).
 * Si no hay conexión o falla, retorna silenciosamente sin interrumpir el software.
 */
export async function checkForAppUpdates(): Promise<UpdateCheckResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${REMOTE_VERSION_URL}?t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        remoteInfo: null,
        error: `Servidor respondió con código ${response.status}`,
      };
    }

    const data: RemoteVersionInfo = await response.json();
    const hasUpdate = isVersionHigher(data.version, CURRENT_APP_VERSION);

    return {
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: data.version,
      remoteInfo: data,
    };
  } catch (err: any) {
    // Si no hay red, estamos desconectados o el servidor no responde
    return {
      hasUpdate: false,
      currentVersion: CURRENT_APP_VERSION,
      latestVersion: CURRENT_APP_VERSION,
      remoteInfo: null,
      error: err?.message || 'Sin conexión al servidor de actualizaciones',
    };
  }
}
