// Settings, Supabase Configuration, and Data Backup/Restore
import { store } from './store.js';
import { showToast, showConfirm } from './toast.js';
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
      ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> <i class="fa-solid fa-database text-[10px]"></i> <span>ភ្ជាប់ Cloud ជោគជ័យ</span></span>`
      : `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5 shadow-xs"><span class="w-2 h-2 rounded-full bg-amber-500"></span> <i class="fa-solid fa-hard-drive text-[10px]"></i> <span>ដំណើរការ Local</span></span>`;
  }
  if (navBadge) {
    navBadge.innerHTML = connected
      ? `<span class="w-2 h-2 rounded-full bg-emerald-500" title="ភ្ជាប់ Cloud ជោគជ័យ"></span>`
      : `<span class="w-2 h-2 rounded-full bg-amber-500" title="ដំណើរការ Local"></span>`;
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
  a.download = `rental_backup_supabase_${dateStr}.json`;
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
    i.roomRentUsd || i.roomPriceUsd || 0,
    i.elecUsage || i.electricUsage || 0,
    i.elecTotalKhr || i.electricTotal || 0,
    i.waterUsage || 0,
    i.waterTotalKhr || i.waterTotal || 0,
    i.trashFeeKhr || i.trashFee || 0,
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
    store.resetToDefault();
    showToast('បាន Reset ទិន្នន័យជោគជ័យ!', 'success');
    setTimeout(() => location.reload(), 1200);
  }
}
