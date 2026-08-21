// Supabase PostgreSQL Configuration & Synchronization Client
// Project: rsaxtgzmyzinvyuimthi (aws-0-ap-southeast-1.pooler.supabase.com)

export const DEFAULT_SUPABASE_CONFIG = {
  host: "aws-0-ap-southeast-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.rsaxtgzmyzinvyuimthi",
  password: "0QT8YTYv3DbDlbRl",
  supabaseUrl: "https://rsaxtgzmyzinvyuimthi.supabase.co"
};

let isConnected = false;
let currentDbInfo = null;

// Initialize & Check Supabase Connection Status
export async function initializeSupabase() {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) {
      isConnected = false;
      return { success: false, error: 'Server status check failed' };
    }
    const data = await res.json();
    isConnected = Boolean(data.connected);
    currentDbInfo = data;
    
    if (isConnected) {
      console.log('✓ Supabase PostgreSQL connected successfully at', data.host);
    } else {
      console.log('ℹ Supabase PostgreSQL status: standby / password pending');
    }

    return { 
      success: isConnected, 
      connected: isConnected, 
      data, 
      error: data.error 
    };
  } catch (error) {
    console.warn('Supabase status check warning:', error.message);
    isConnected = false;
    return { success: false, error: error.message };
  }
}

export function isSupabaseConnected() {
  return isConnected;
}

export function getDbInfo() {
  return currentDbInfo;
}

export function getSavedSupabaseConfig() {
  try {
    const saved = localStorage.getItem('rental_supabase_config');
    if (saved) return { ...DEFAULT_SUPABASE_CONFIG, ...JSON.parse(saved) };
  } catch (e) {}
  return DEFAULT_SUPABASE_CONFIG;
}

export async function saveSupabaseConfig(config) {
  try {
    localStorage.setItem('rental_supabase_config', JSON.stringify(config));
    
    // Send to backend to update .env and reconnect PostgreSQL pool
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const result = await response.json();
    if (result.success) {
      isConnected = true;
      return { success: true, message: result.message };
    } else {
      isConnected = false;
      return { success: false, error: result.error };
    }
  } catch (error) {
    isConnected = false;
    return { success: false, error: error.message };
  }
}

export function clearSupabaseConfig() {
  localStorage.removeItem('rental_supabase_config');
  isConnected = false;
}
