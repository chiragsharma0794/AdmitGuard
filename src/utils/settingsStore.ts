export interface DataSyncSettings {
  mode: 'local' | 'sheets';
  appsScriptUrl: string;
  sharedSecret: string;
}

export interface AppSettings {
  dataSync: DataSyncSettings;
}

const SETTINGS_KEY = 'admitguard_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  dataSync: {
    mode: 'local',
    appsScriptUrl: '',
    sharedSecret: '',
  },
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export interface SyncResult {
  ok: boolean;
  row?: number;
  error?: string;
}

export async function syncToSheets(
  settings: DataSyncSettings,
  payload: object
): Promise<SyncResult> {
  if (settings.mode !== 'sheets' || !settings.appsScriptUrl) {
    return { ok: false, error: 'Sheets sync not configured' };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.sharedSecret) {
    headers['X-ADMITGUARD-SECRET'] = settings.sharedSecret;
  }

  const response = await fetch(settings.appsScriptUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  const data = await response.json();
  return data as SyncResult;
}

export async function testSheetsConnection(
  settings: DataSyncSettings
): Promise<SyncResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.sharedSecret) {
    headers['X-ADMITGUARD-SECRET'] = settings.sharedSecret;
  }
  const response = await fetch(settings.appsScriptUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'ping' }),
    redirect: 'follow',
  });
  const data = await response.json();
  return data as SyncResult;
}
