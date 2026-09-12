// Settings, Firebase Cloud Firestore & Supabase Configuration, and Data Backup/Restore
import { store } from './store.js';
import { showToast, showConfirm } from './toast.js';
import { 
  getSavedFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  initializeFirebase, 
  testFirebaseConnection, 
  isFirebaseConnected, 
  hasFirebaseRulesWarning, 
  getFirebaseLastError 
} from './firebase-config.js';
import { 
  getSavedSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  initializeSupabase, 
  isSupabaseConnected 
} from './supabase-config.js';

export async function loadSettingsForm() {
  const settings = store.getSettings();
  
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  };

  setVal('setting-landlord-name', settings.landlordName);
  setVal('setting-landlord-phone', settings.landlordPhone);
  setVal('setting-landlord-address', settings.landlordAddress);
  
  setVal('setting-elec-rate', settings.electricityRate || 1000);
  setVal('setting-water-rate', settings.waterRate || 2200);
  setVal('setting-trash-fee', settings.trashFee || 4000);
  setVal('setting-wifi-fee', settings.wifiFee || 0);
  setVal('setting-exchange-rate', settings.exchangeRate || 4000);
  
  setVal('setting-khqr-acc', settings.abaKhqrAccount || '008 270 003');
  setVal('setting-khqr-acc-khr', settings.abaKhqrAccountKhr || '008 270 004');
  setVal('setting-khqr-name', settings.abaAccountName || 'PHANET THAI');
  setVal('setting-invoice-note', settings.invoiceNote);

  // Firebase Database Form
  const fbConfig = getSavedFirebaseConfig();
  setVal('firebase-project-id', fbConfig.projectId || 'room-payment');
  setVal('firebase-api-key', fbConfig.apiKey || 'AIzaSyDMLsB2drG1t9y0U2UO9MD52kiWhMRQH5s');
  setVal('firebase-auth-domain', fbConfig.authDomain || 'room-payment.firebaseapp.com');
  setVal('firebase-storage-bucket', fbConfig.storageBucket || 'room-payment.firebasestorage.app');
  setVal('firebase-sender-id', fbConfig.messagingSenderId || '276598215933');
  setVal('firebase-app-id', fbConfig.appId || '1:276598215933:web:d81e7b5c2c690d5089da94');
  setVal('firebase-measurement-id', fbConfig.measurementId || 'G-BNQFL0CT5B');

  const fbStatus = await testFirebaseConnection();
  updateFirebaseBadge(fbStatus.connected, fbStatus.rulesWarning);

  // Supabase Database Form
  const supaConfig = getSavedSupabaseConfig();
  setVal('supa-host', supaConfig.host || 'aws-0-ap-southeast-1.pooler.supabase.com');
  setVal('supa-port', supaConfig.port || 5432);
  setVal('supa-database', supaConfig.database || 'postgres');
  setVal('supa-user', supaConfig.user || 'postgres.rsaxtgzmyzinvyuimthi');
  setVal('supa-password', supaConfig.password || '0QT8YTYv3DbDlbRl');
  setVal('supa-url', supaConfig.supabaseUrl || 'https://rsaxtgzmyzinvyuimthi.supabase.co');

  const status = await initializeSupabase();
  updateSupabaseBadge(status.connected);
}

export function handleSaveGeneralSettings(e) {
  e.preventDefault();
  const currentSettings = store.getSettings();

  const newSettings = {
    ...currentSettings,
    landlordName: document.getElementById('setting-landlord-name')?.value.trim() || 'PHANET THAI',
    landlordPhone: document.getElementById('setting-landlord-phone')?.value.trim() || '',
    landlordAddress: document.getElementById('setting-landlord-address')?.value.trim() || '',
    electricityRate: parseFloat(document.getElementById('setting-elec-rate')?.value) || 1000,
    waterRate: parseFloat(document.getElementById('setting-water-rate')?.value) || 2200,
    trashFee: parseFloat(document.getElementById('setting-trash-fee')?.value) || 0,
    wifiFee: parseFloat(document.getElementById('setting-wifi-fee')?.value) || 0,
    exchangeRate: parseFloat(document.getElementById('setting-exchange-rate')?.value) || 4000,
    abaKhqrAccount: document.getElementById('setting-khqr-acc')?.value.trim() || '008 270 003',
    abaKhqrAccountKhr: document.getElementById('setting-khqr-acc-khr')?.value.trim() || '008 270 004',
    abaAccountName: document.getElementById('setting-khqr-name')?.value.trim() || 'PHANET THAI',
    qrImageUrl: 'img/aba_qr.png',
    invoiceNote: document.getElementById('setting-invoice-note')?.value.trim() || ''
  };

  store.saveSettings(newSettings);
  showToast('បានរក្សាទុកការកំណត់ទូទៅដោយជោគជ័យ!', 'success');
  if (window.updateDashboardStats) window.updateDashboardStats();
}

// ==================== FIREBASE HANDLERS ====================

export async function handleSaveFirebaseConfig(e) {
  if (e) e.preventDefault();

  const config = {
    projectId: document.getElementById('firebase-project-id')?.value.trim() || 'room-payment',
    apiKey: document.getElementById('firebase-api-key')?.value.trim() || 'AIzaSyDMLsB2drG1t9y0U2UO9MD52kiWhMRQH5s',
    authDomain: document.getElementById('firebase-auth-domain')?.value.trim() || 'room-payment.firebaseapp.com',
    storageBucket: document.getElementById('firebase-storage-bucket')?.value.trim() || 'room-payment.firebasestorage.app',
    messagingSenderId: document.getElementById('firebase-sender-id')?.value.trim() || '276598215933',
    appId: document.getElementById('firebase-app-id')?.value.trim() || '1:276598215933:web:d81e7b5c2c690d5089da94',
    measurementId: document.getElementById('firebase-measurement-id')?.value.trim() || 'G-BNQFL0CT5B'
  };

  const badge = document.getElementById('firebase-sync-status-msg');
  if (badge) badge.innerText = 'កំពុងភ្ជាប់ទៅកាន់ Firebase Firestore...';

  const res = await saveFirebaseConfig(config);
  updateFirebaseBadge(res.connected, res.rulesWarning);

  if (res.connected) {
    if (badge) badge.innerText = '✓ បានភ្ជាប់ Firebase Cloud Firestore ជោគជ័យ!';
    showToast('បានភ្ជាប់ទៅកាន់ Firebase Cloud Firestore ជោគជ័យ!', 'success');
  } else if (res.rulesWarning) {
    if (badge) badge.innerText = '⚠ Firebase បានភ្ជាប់ ប៉ុន្តែ Firestore Security Rules កំពុង Lock (សូម Publish Rules)';
    showToast('Firebase បានភ្ជាប់រួចរាល់ ប៉ុន្តែសូមបើក Firestore Security Rules ក្នុង Firebase Console', 'warning', 7000);
  } else {
    if (badge) badge.innerText = '⚠ មិនអាចភ្ជាប់ Firebase៖ ' + (res.error || 'សូមពិនិត្យមើល API Key');
    showToast('មិនអាចភ្ជាប់ Firebase បានទេ៖ ' + (res.error || 'សូមពិនិត្យមើល API Key'), 'error', 6000);
  }
}

export async function handleTestFirebaseConnection() {
  const badge = document.getElementById('firebase-sync-status-msg');
  if (badge) badge.innerText = 'កំពុងធ្វើតេស្តការភ្ជាប់ Firebase Cloud Firestore...';

  const res = await testFirebaseConnection();
  updateFirebaseBadge(res.connected, res.rulesWarning);

  if (res.connected) {
    if (badge) badge.innerText = '✓ ការធ្វើតេស្តជោគជ័យ! Read/Write ដំណើរការបានល្អ។';
    showToast('តេស្ត Firebase Firestore ជោគជ័យ! អាចផ្ទុកទិន្នន័យបានពេញលេញ។', 'success');
  } else if (res.rulesWarning) {
    if (badge) badge.innerText = '⚠ ជាប់ Security Rules: សូមចូល Firebase Console → Firestore → Rules រួចដាក់ allow read, write: if true;';
    showToast('Firebase បានស្គាល់ Database ហើយ ប៉ុន្តែជាប់ Permission (Security Rules)!', 'warning', 8000);
  } else {
    if (badge) badge.innerText = '⚠ បរាជ័យ៖ ' + (res.error || 'សូមពិនិត្យមើល Internet ឬ API Key');
    showToast('បរាជ័យក្នុងការតេស្ត៖ ' + (res.error || 'Unknown error'), 'error', 6000);
  }
}

export async function handleSyncFirebase() {
  const badge = document.getElementById('firebase-sync-status-msg');
  if (badge) badge.innerText = 'កំពុង Sync ទិន្នន័យទាំងអស់ទៅ Firebase Firestore...';

  const test = await testFirebaseConnection();
  if (test.rulesWarning) {
    showToast('មិនអាច Sync បានទេដោយសារ Firestore Rules កំពុង Lock! សូមបើក Rules ក្នុង Firebase Console ជាមុនសិន។', 'warning', 8000);
    if (badge) badge.innerText = '⚠ Security Rules កំពុង Lock';
    return;
  }

  const result = await store.pushAllToFirebase();
  if (result && result.success) {
    updateFirebaseBadge(true, false);
    if (badge) badge.innerText = '✓ បាន Sync ទិន្នន័យទាំងអស់ទៅ Firebase Firestore ជោគជ័យ!';
    showToast('បាន Sync បន្ទប់, អ្នកជួល, កុងទ័រ, វិក្កយបត្រ ទៅកាន់ Firebase រួចរាល់!', 'success');
    setTimeout(() => { if (badge) badge.innerText = ''; }, 5000);
  } else {
    const errMsg = result ? result.error : 'Unknown error';
    showToast('បរាជ័យក្នុងការ Sync ទៅ Firebase៖ ' + errMsg, 'error', 7000);
    if (badge) badge.innerText = '⚠ បរាជ័យ៖ ' + errMsg;
  }
}

export async function handlePullFirebase() {
  const ok = await showConfirm('តើអ្នកចង់ទាញយកទិន្នន័យចុងក្រោយពី Firebase Cloud Firestore មកជំនួសទិន្នន័យក្នុងម៉ាស៊ីននេះមែនទេ?', {
    title: 'Pull ទិន្នន័យពី Firebase',
    okText: 'ទាញយក',
    cancelText: 'បោះបង់'
  });
  if (ok) {
    const badge = document.getElementById('firebase-sync-status-msg');
    if (badge) badge.innerText = 'កំពុងទាញយកទិន្នន័យពី Firebase...';

    const hasData = await store.loadFromFirebase();
    if (hasData) {
      showToast('បានទាញយកទិន្នន័យពី Firebase Cloud Firestore ជោគជ័យ!', 'success');
      setTimeout(() => location.reload(), 1000);
    } else {
      showToast('មិនមានទិន្នន័យក្នុង Firebase ឬជាប់ Permission Rules។', 'info', 5000);
      if (badge) badge.innerText = 'ℹ មិនទាន់មានទិន្នន័យក្នុង Firebase ទេ';
    }
  }
}

export async function handleClearFirebase() {
  const ok = await showConfirm('តើអ្នកចង់កំណត់ Firebase Config ទៅជាតម្លៃដើមវិញមែនទេ?', {
    title: 'កំណត់ឡើងវិញ Firebase Config',
    okText: 'កំណត់ឡើងវិញ',
    cancelText: 'បោះបង់'
  });
  if (ok) {
    clearFirebaseConfig();
    loadSettingsForm();
    showToast('បានកំណត់ Firebase Config មកតម្លៃដើមវិញ។', 'info');
  }
}

export function updateFirebaseBadge(connected, rulesWarning = false) {
  const badge = document.getElementById('firebase-status-badge');
  const tag = document.getElementById('firebase-connected-tag');

  if (badge) {
    if (connected) {
      badge.innerHTML = `<span class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs cursor-pointer hover:bg-amber-500/30 transition" onclick="switchTab('settings')" title="Firebase Cloud Firestore ដំណើរការជោគជ័យ"><span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> <i class="fa-solid fa-fire text-[11px] text-amber-400"></i> <span class="hidden sm:inline">Firebase</span></span>`;
    } else if (rulesWarning) {
      badge.innerHTML = `<span class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/40 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs cursor-pointer hover:bg-rose-500/30 transition" onclick="switchTab('settings')" title="Firebase Rules Lock (ចុចដើម្បីមើលវិធីដោះស្រាយ)"><span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span> <i class="fa-solid fa-triangle-exclamation text-[11px] text-rose-400"></i> <span class="hidden sm:inline">Rules Lock</span></span>`;
    } else {
      badge.innerHTML = `<span class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/15 text-white/80 border border-white/20 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs cursor-pointer hover:bg-white/25 transition" onclick="switchTab('settings')" title="Firebase Standby"><span class="w-2 h-2 rounded-full bg-slate-300"></span> <i class="fa-solid fa-fire text-[11px] text-white/60"></i> <span class="hidden sm:inline">Firebase</span></span>`;
    }
  }

  if (tag) {
    if (connected) {
      tag.innerHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Connected</span>`;
    } else if (rulesWarning) {
      tag.innerHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Rules Lock</span>`;
    } else {
      tag.innerHTML = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-slate-400"></span> Standby</span>`;
    }
  }
}

export function copyFirestoreRules() {
  const rules = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
  navigator.clipboard.writeText(rules).then(() => {
    showToast('បានចម្លង Firestore Security Rules ជោគជ័យ! សូមយកទៅ Paste ក្នុង Firebase Console។', 'success');
  }).catch(() => {
    const el = document.getElementById('firestore-rules-code');
    if (el) {
      showToast('សូមជ្រើសរើស និង Copy កូដខាងលើ', 'info');
    }
  });
}

// ==================== SUPABASE HANDLERS ====================

export async function handleSaveSupabaseConfig(e) {
  if (e) e.preventDefault();
  
  const host = document.getElementById('supa-host')?.value.trim() || 'aws-0-ap-southeast-1.pooler.supabase.com';
  const port = parseInt(document.getElementById('supa-port')?.value, 10) || 5432;
  const database = document.getElementById('supa-database')?.value.trim() || 'postgres';
  const user = document.getElementById('supa-user')?.value.trim() || 'postgres.rsaxtgzmyzinvyuimthi';
  const password = document.getElementById('supa-password')?.value || '';
  const supabaseUrl = document.getElementById('supa-url')?.value.trim() || 'https://rsaxtgzmyzinvyuimthi.supabase.co';

  const badge = document.getElementById('supabase-sync-status-msg');
  if (badge) badge.innerText = 'កំពុងភ្ជាប់ទៅកាន់ Supabase Database...';

  const result = await saveSupabaseConfig({
    host,
    port,
    database,
    user,
    password,
    supabaseUrl
  });

  if (result.success) {
    updateSupabaseBadge(true);
    if (badge) badge.innerText = '✓ បានភ្ជាប់ទៅកាន់ Supabase PostgreSQL ជោគជ័យ!';
    showToast('បានភ្ជាប់ទៅកាន់ Supabase Cloud Database (PostgreSQL) ជោគជ័យ!', 'success');
  } else {
    updateSupabaseBadge(false);
    if (badge) badge.innerText = '⚠ មិនទាន់ភ្ជាប់៖ ' + (result.error || 'សូមពិនិត្យមើល Password');
    showToast('មិនអាចភ្ជាប់ទៅកាន់ Supabase បានទេ៖ ' + (result.error || 'សូមពិនិត្យមើល Password'), 'error', 6000);
  }
}

export async function handleSyncSupabase() {
  const badge = document.getElementById('supabase-sync-status-msg');
  if (badge) badge.innerText = 'កំពុង Sync ទិន្នន័យជាមួយ Supabase PostgreSQL...';

  const status = await initializeSupabase();
  if (!status.connected) {
    showToast('សូមបញ្ចូល Database Password និងចុច Save Configuration សិន!', 'warning');
    if (badge) badge.innerText = '⚠ សូមភ្ជាប់ Supabase សិន';
    return;
  }

  const result = await store.pushAllToSupabase();
  if (result && result.success) {
    updateSupabaseBadge(true);
    if (badge) badge.innerText = '✓ បាន Sync ទិន្នន័យទៅ Supabase រួចរាល់!';
    showToast('បាន Sync ទិន្នន័យទាំងអស់ទៅកាន់ Supabase ជោគជ័យ!', 'success');
    setTimeout(() => { if (badge) badge.innerText = ''; }, 4000);
  } else {
    showToast('បរាជ័យក្នុងការ Sync ទិន្នន័យ៖ ' + (result ? result.error : 'Unknown error'), 'error', 6000);
    if (badge) badge.innerText = '⚠ បរាជ័យក្នុងការ Sync';
  }
}

export async function handlePullSupabase() {
  const ok = await showConfirm('តើអ្នកចង់ទាញយកទិន្នន័យចុងក្រោយពី Supabase Database មកជំនួសក្នុងម៉ាស៊ីនមែនទេ?', {
    title: 'Pull ទិន្នន័យពី Supabase',
    okText: 'ទាញយក',
    cancelText: 'បោះបង់'
  });
  if (ok) {
    const success = await store.loadFromSupabase();
    if (success) {
      showToast('បានទាញយកទិន្នន័យពី Supabase Database ជោគជ័យ!', 'success');
      setTimeout(() => location.reload(), 1200);
    } else {
      showToast('មិនអាចទាញយកទិន្នន័យពី Supabase បានទេ (សូមពិនិត្យមើលការភ្ជាប់)', 'error', 6000);
    }
  }
}

export async function handleClearSupabase() {
  const ok = await showConfirm('តើអ្នកពិតជាចង់ផ្តាច់ Supabase និងប្តូរមកប្រើ Local Storage វិញមែនទេ?', {
    title: 'ផ្តាច់ Supabase',
    danger: true,
    okText: 'ផ្តាច់',
    cancelText: 'បោះបង់'
  });
  if (ok) {
    clearSupabaseConfig();
    updateSupabaseBadge(false);
    showToast('បានផ្តាច់ចេញពី Supabase រួចរាល់។ កំពុងដំណើរការ Local Mode។', 'info');
  }
}

export function updateSupabaseBadge(connected) {
  const badge = document.getElementById('supabase-status-badge');
  const navBadge = document.getElementById('nav-supabase-status');
  if (badge) {
    badge.innerHTML = connected
      ? `<span class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs cursor-pointer hover:bg-emerald-500/30 transition" onclick="switchTab('settings')" title="Supabase PostgreSQL Connected"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> <i class="fa-solid fa-database text-[10px]"></i> <span class="hidden sm:inline">Supabase</span></span>`
      : `<span class="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/15 text-white/80 border border-white/20 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs cursor-pointer hover:bg-white/25 transition" onclick="switchTab('settings')" title="Supabase Standby"><span class="w-2 h-2 rounded-full bg-slate-300"></span> <i class="fa-solid fa-database text-[10px]"></i> <span class="hidden sm:inline">Supabase</span></span>`;
  }
  if (navBadge) {
    navBadge.innerHTML = connected
      ? `<span class="w-2 h-2 rounded-full bg-emerald-400" title="ភ្ជាប់ Supabase ជោគជ័យ"></span>`
      : `<span class="w-2 h-2 rounded-full bg-slate-400" title="Supabase Standby"></span>`;
  }
}

// Backup & Download
export function downloadJsonBackup() {
  const jsonStr = store.exportBackup();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `rental_backup_data_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('បានទាញយកឯកសារ Backup ជោគជ័យ', 'success');
}

export function handleImportBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const res = store.importBackup(evt.target.result);
    if (res.success) {
      showToast('បានបញ្ចូលទិន្នន័យពី Backup ជោគជ័យ!', 'success');
      setTimeout(() => location.reload(), 1200);
    } else {
      showToast('បរាជ័យក្នុងការ Import៖ ' + res.error, 'error', 6000);
    }
  };
  reader.readAsText(file);
}

export function exportInvoicesCsv() {
  const invoices = store.getInvoices();
  if (invoices.length === 0) {
    showToast('មិនទាន់មានវិក្កយបត្រត្រូវទាញយកទេ', 'warning');
    return;
  }

  const headers = ['Invoice No', 'Room', 'Tenant', 'Month', 'Room Rent (USD)', 'Electric (kWh)', 'Electric (KHR)', 'Water (m3)', 'Water (KHR)', 'Trash (KHR)', 'Total (KHR)', 'Total (USD)', 'Status'];
  const rows = invoices.map(i => [
    i.invoiceNumber,
    i.roomNumber,
    `"${i.tenantName || ''}"`,
    i.month,
    i.roomCostUsd || 0,
    i.elecUsage || 0,
    i.elecCostKhr || 0,
    i.waterUsage || 0,
    i.waterCostKhr || 0,
    i.trashFeeKhr || 0,
    i.totalKhr || 0,
    (i.totalUsd || 0).toFixed(2),
    i.status
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const a = document.createElement('a');
  a.setAttribute('href', encodedUri);
  a.setAttribute('download', `rental_invoices_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('បាន Export វិក្កយបត្រជា CSV ជោគជ័យ', 'success');
}

export async function handleResetData() {
  const ok = await showConfirm('តើអ្នកពិតជាចង់ Reset ទិន្នន័យទៅទិន្នន័យគំរូដើម (Sample Data) វិញមែនទេ?', {
    title: 'Reset ទិន្នន័យទាំងអស់',
    danger: true,
    okText: 'Reset',
    cancelText: 'បោះបង់'
  });
  if (ok) {
    localStorage.clear();
    showToast('បាន Reset ទិន្នន័យជោគជ័យ!', 'success');
    setTimeout(() => location.reload(), 1200);
  }
}
