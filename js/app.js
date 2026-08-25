// Main Application Controller with Full Sidebar Navigation & Mobile Bottom Navigation
import { store } from './store.js';
import { showToast, showConfirm } from './toast.js';
import { initializeSupabase, isSupabaseConnected } from './supabase-config.js';
import { renderRooms, openRoomModal, closeRoomModal, handleRoomFormSubmit } from './rooms.js';
import {
  renderTenants,
  openTenantModal,
  closeTenantModal,
  handleTenantFormSubmit,
  viewTenantDetails,
  closeTenantViewModal,
  printTenantDetails,
  viewTenantPhoto,
  closePhotoViewer,
  handleTenantPhotoUpload,
  handleTenantIdCardPhotoUpload
} from './tenants.js';
import { renderUtilities, calculateRow, saveAllUtilities, toggleUtilityFormulas } from './utilities.js';
import {
  renderInvoices,
  openCreateInvoiceModal,
  closeCreateInvoiceModal,
  calculateInvoiceForm,
  handleRoomUsdChange,
  handleRoomKhrChange,
  recalcInvoiceGrandTotal,
  handleSaveInvoice,
  viewInvoiceModal,
  closeInvoiceViewModal,
  printInvoice,
  downloadInvoicePdf,
  formatKhmerFullDate,
  formatKhmerShortDate,
  updateKhmerPeriodPreview
} from './invoices.js';
import { renderPayments } from './payments.js';
import { renderReports, printReport } from './reports.js';
import {
  renderUsers,
  openUserModal,
  closeUserModal,
  handleUserFormSubmit,
  openChangePasswordModal,
  closeChangePasswordModal,
  handleChangePasswordSubmit,
  getUsers,
  saveUsers
} from './users.js';
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  loginUser,
  handleLogout,
  updateAuthUI,
  showLoginScreen,
  hideLoginScreen,
  checkAuthStatus,
  togglePasswordVisibility,
  handleLoginSubmit
} from './auth.js';
import {
  loadSettingsForm,
  handleSaveGeneralSettings,
  handleSaveSupabaseConfig,
  handleClearSupabase,
  downloadJsonBackup,
  handleImportBackup,
  exportInvoicesCsv,
  handleResetData,
  updateSupabaseBadge,
  handleSyncSupabase,
  handlePullSupabase
} from './settings.js';

// Expose handlers to window for inline HTML onclick/onchange
window.openRoomModal = openRoomModal;
window.closeRoomModal = closeRoomModal;
window.editRoom = (id) => openRoomModal(id);
window.deleteRoom = async (id) => {
  const ok = await showConfirm('តើអ្នកចង់លុបបន្ទប់នេះមែនទេ?', { title: 'លុបបន្ទប់', danger: true, okText: 'លុប' });
  if (ok) {
    store.deleteRoom(id);
    renderRooms();
    updateDashboardStats();
    showToast('បានលុបបន្ទប់រួចរាល់', 'success');
  }
};
window.assignTenantToRoom = (roomId) => openTenantModal(null, roomId);
window.quickCreateInvoice = (roomId) => {
  switchTab('invoices');
  openCreateInvoiceModal(roomId);
};

window.openTenantModal = openTenantModal;
window.closeTenantModal = closeTenantModal;
window.editTenant = (id) => openTenantModal(id);
window.viewTenantPhoto = viewTenantPhoto;
window.closePhotoViewer = closePhotoViewer;
window.viewTenantDetails = viewTenantDetails;
window.closeTenantViewModal = closeTenantViewModal;
window.printTenantDetails = printTenantDetails;
window.handleTenantPhotoUpload = handleTenantPhotoUpload;
window.handleTenantIdCardPhotoUpload = handleTenantIdCardPhotoUpload;
window.deleteTenant = async (id) => {
  const ok = await showConfirm('តើអ្នកចង់លុបព័ត៌មានអ្នកជួលនេះមែនទេ?', { title: 'លុបអ្នកជួល', danger: true, okText: 'លុប' });
  if (ok) {
    store.deleteTenant(id);
    renderTenants();
    renderRooms();
    updateDashboardStats();
    showToast('បានលុបព័ត៌មានអ្នកជួលរួចរាល់', 'success');
  }
};

window.calculateRow = calculateRow;
window.saveAllUtilities = saveAllUtilities;
window.toggleUtilityFormulas = toggleUtilityFormulas;

window.openCreateInvoiceModal = openCreateInvoiceModal;
window.closeCreateInvoiceModal = closeCreateInvoiceModal;
window.viewInvoiceModal = viewInvoiceModal;
window.closeInvoiceViewModal = closeInvoiceViewModal;
window.printInvoice = printInvoice;
window.downloadInvoicePdf = downloadInvoicePdf;
window.formatKhmerFullDate = formatKhmerFullDate;
window.formatKhmerShortDate = formatKhmerShortDate;
window.updateKhmerPeriodPreview = updateKhmerPeriodPreview;

window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;

export function handleGlobalSearch(query) {
  const q = (query || '').trim();
  const roomSearch = document.getElementById('room-search');
  const tenantSearch = document.getElementById('tenant-search');
  const invoiceSearch = document.getElementById('invoice-search');
  const paymentSearch = document.getElementById('payment-search');

  if (roomSearch) roomSearch.value = q;
  if (tenantSearch) tenantSearch.value = q;
  if (invoiceSearch) invoiceSearch.value = q;
  if (paymentSearch) paymentSearch.value = q;

  renderRooms();
  renderTenants();
  renderInvoices();
  renderPayments();
}
window.handleGlobalSearch = handleGlobalSearch;
window.markInvoicePaid = async (id) => {
  const ok = await showConfirm('តើអ្នកពិតជាបានទទួលប្រាក់រួចរាល់សម្រាប់វិក្កយបត្រនេះមែនទេ?', { title: 'បញ្ជាក់ការបង់ប្រាក់', okText: 'បានបង់រួច' });
  if (ok) {
    store.updateInvoicePayment(id, 'paid');
    renderInvoices();
    renderPayments();
    updateDashboardStats();
    showToast('វិក្កយបត្រត្រូវបានបញ្ជាក់ថាបង់រួច ✓', 'success');
  }
};
window.deleteInvoice = async (id) => {
  const ok = await showConfirm('តើអ្នកចង់លុបវិក្កយបត្រនេះមែនទេ?', { title: 'លុបវិក្កយបត្រ', danger: true, okText: 'លុប' });
  if (ok) {
    store.deleteInvoice(id);
    renderInvoices();
    renderPayments();
    updateDashboardStats();
    showToast('បានលុបវិក្កយបត្ររួចរាល់', 'success');
  }
};

window.printReport = printReport;
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.deleteUser = async (id) => {
  const ok = await showConfirm('តើអ្នកចង់លុបគណនីនេះមែនទេ?', { title: 'លុបគណនី', danger: true, okText: 'លុប' });
  if (ok) {
    let users = getUsers().filter(u => u.id !== id);
    saveUsers(users);
    renderUsers();
    showToast('បានលុបគណនីរួចរាល់', 'success');
  }
};

window.downloadJsonBackup = downloadJsonBackup;
window.exportInvoicesCsv = exportInvoicesCsv;
window.handleResetData = handleResetData;
window.handleSaveSupabaseConfig = handleSaveSupabaseConfig;
window.handleClearSupabase = handleClearSupabase;
window.handleSyncSupabase = handleSyncSupabase;
window.handlePullSupabase = handlePullSupabase;

// Mobile Sidebar Handler
export function toggleMobileSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  if (sb) sb.classList.toggle('-translate-x-full');
  if (bd) bd.classList.toggle('hidden');
}
window.toggleMobileSidebar = toggleMobileSidebar;

// Tab Navigation
export function switchTab(tabName) {
  const tabs = ['dashboard', 'rooms', 'tenants', 'invoices', 'payments', 'utilities', 'reports', 'users', 'settings'];

  // Auto-close sidebar on mobile after clicking
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  if (sb && window.innerWidth < 768) {
    sb.classList.add('-translate-x-full');
    if (bd) bd.classList.add('hidden');
  }

  // Update Section Visibilities & Sidebar active link styles
  tabs.forEach(t => {
    const section = document.getElementById(`section-${t}`);
    const navBtn = document.getElementById(`nav-${t}`);
    if (section) {
      if (t === tabName) {
        section.classList.remove('hidden');
        section.classList.remove('animate-fade-in');
        void section.offsetWidth; // Force CSS reflow to re-trigger smooth page animation
        section.classList.add('animate-fade-in');
      } else {
        section.classList.add('hidden');
        section.classList.remove('animate-fade-in');
      }
    }
    if (navBtn) {
      if (t === tabName) {
        navBtn.classList.add('active');
      } else {
        navBtn.classList.remove('active');
      }
    }
  });

  // Update Mobile Bottom Navigation active states
  const mobileNavMap = {
    'dashboard': 'nav-mobile-dashboard',
    'rooms': 'nav-mobile-rooms',
    'invoices': 'nav-mobile-invoices',
    'utilities': 'nav-mobile-utilities'
  };

  ['nav-mobile-dashboard', 'nav-mobile-rooms', 'nav-mobile-invoices', 'nav-mobile-utilities'].forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.remove('active');
  });

  const activeMobileBtnId = mobileNavMap[tabName];
  if (activeMobileBtnId) {
    const activeBtn = document.getElementById(activeMobileBtnId);
    if (activeBtn) activeBtn.classList.add('active');
  }

  // Render tab content on view
  if (tabName === 'dashboard') updateDashboardStats();
  if (tabName === 'rooms') renderRooms();
  if (tabName === 'tenants') renderTenants();
  if (tabName === 'invoices') renderInvoices();
  if (tabName === 'payments') renderPayments();
  if (tabName === 'utilities') renderUtilities();
  if (tabName === 'reports') renderReports();
  if (tabName === 'users') renderUsers();
  if (tabName === 'settings') loadSettingsForm();
}
window.switchTab = switchTab;

// Dashboard Summary Stats Calculator
export function updateDashboardStats() {
  const rooms = store.getRooms();
  const invoices = store.getInvoices();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
  const unpaidInvoicesCount = unpaidInvoices.length;

  const currentMonthInvoices = invoices.filter(i => i.month === currentMonth);
  const totalRevenueKhr = currentMonthInvoices.reduce((sum, inv) => sum + (inv.totalKhr || 0), 0);
  const totalRevenueUsd = currentMonthInvoices.reduce((sum, inv) => sum + (inv.totalUsd || 0), 0);

  const statTotal = document.getElementById('stat-total-rooms');
  const statOcc = document.getElementById('stat-occupied-rooms');
  const statAvail = document.getElementById('stat-available-rooms');
  const statUnpaidCount = document.getElementById('stat-unpaid-invoices-count');
  const statIncomeUsd = document.getElementById('stat-monthly-income-usd');
  const statIncomeKhr = document.getElementById('stat-monthly-income-khr');

  if (statTotal) statTotal.innerText = totalRooms;
  if (statOcc) statOcc.innerText = occupiedRooms;
  if (statAvail) statAvail.innerText = availableRooms;
  if (statUnpaidCount) statUnpaidCount.innerText = unpaidInvoicesCount;
  if (statIncomeUsd) statIncomeUsd.innerText = `$${totalRevenueUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  if (statIncomeKhr) statIncomeKhr.innerText = `≈ ${totalRevenueKhr.toLocaleString()} ៛`;

  // Quick list of recent unpaid invoices
  const recentUnpaidContainer = document.getElementById('dashboard-unpaid-list');
  if (recentUnpaidContainer) {
    const unpaidList = invoices.filter(i => i.status === 'unpaid').slice(0, 5);
    if (unpaidList.length === 0) {
      recentUnpaidContainer.innerHTML = `
        <div class="p-6 text-center text-slate-400 text-xs space-y-1">
          <i class="fa-solid fa-circle-check text-emerald-500 text-lg block mb-1"></i>
          <span>មិនមានវិក្កយបត្រជំពាក់ទេ 🎉</span>
        </div>
      `;
    } else {
      recentUnpaidContainer.innerHTML = unpaidList.map(inv => {
        const cleanRoomNum = (inv.roomNumber || '').replace(/^room[-_]?/i, '') || inv.roomNumber;
        return `
          <div class="flex items-center justify-between p-3 sm:p-3.5 hover:bg-slate-50 transition gap-2">
            <div class="min-w-0">
              <div class="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5">
                <span class="px-2 py-0.5 bg-slate-100 rounded-lg text-xs text-slate-800 font-bold">បន្ទប់ ${cleanRoomNum}</span>
                <span class="truncate text-slate-900">${inv.tenantName || 'គ្មានឈ្មោះ'}</span>
              </div>
              <div class="text-[11px] text-slate-400 font-mono mt-0.5">${inv.month} (${inv.invoiceNumber})</div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-bold text-rose-600 text-xs font-mono">${(inv.totalKhr || 0).toLocaleString()} ៛</div>
              <button onclick="window.viewInvoiceModal('${inv.id}')" class="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 ml-auto mt-0.5">
                <i class="fa-solid fa-receipt text-[10px]"></i> <span>មើលប័ណ្ណ</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}
window.updateDashboardStats = updateDashboardStats;

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Forms
  document.getElementById('room-form')?.addEventListener('submit', handleRoomFormSubmit);
  document.getElementById('tenant-form')?.addEventListener('submit', handleTenantFormSubmit);
  document.getElementById('user-form')?.addEventListener('submit', handleUserFormSubmit);
  document.getElementById('change-password-form')?.addEventListener('submit', handleChangePasswordSubmit);
  document.getElementById('create-invoice-form')?.addEventListener('submit', handleSaveInvoice);
  document.getElementById('general-settings-form')?.addEventListener('submit', handleSaveGeneralSettings);
  document.getElementById('supabase-settings-form')?.addEventListener('submit', handleSaveSupabaseConfig);
  document.getElementById('import-file-input')?.addEventListener('change', handleImportBackup);

  // Search & Filter listeners
  document.getElementById('room-status-filter')?.addEventListener('change', renderRooms);
  document.getElementById('room-type-filter')?.addEventListener('change', renderRooms);
  document.getElementById('room-search')?.addEventListener('input', renderRooms);

  document.getElementById('tenant-search')?.addEventListener('input', renderTenants);
  document.getElementById('tenant-status-filter')?.addEventListener('change', renderTenants);
  document.getElementById('tenant-gender-filter')?.addEventListener('change', renderTenants);
  document.getElementById('tenant-photo-input')?.addEventListener('change', handleTenantPhotoUpload);
  document.getElementById('tenant-camera-input')?.addEventListener('change', handleTenantPhotoUpload);
  document.getElementById('tenant-idcard-photo-input')?.addEventListener('change', handleTenantIdCardPhotoUpload);
  document.getElementById('tenant-idcard-camera-input')?.addEventListener('change', handleTenantIdCardPhotoUpload);
  document.getElementById('utility-month-select')?.addEventListener('change', renderUtilities);
  document.getElementById('report-month-select')?.addEventListener('change', renderReports);
  document.getElementById('invoice-month-filter')?.addEventListener('change', renderInvoices);
  document.getElementById('invoice-status-filter')?.addEventListener('change', renderInvoices);
  document.getElementById('invoice-search')?.addEventListener('input', renderInvoices);
  document.getElementById('payment-search')?.addEventListener('input', renderPayments);

  // Invoice creation dynamic calculations
  document.getElementById('inv-create-room')?.addEventListener('change', calculateInvoiceForm);
  document.getElementById('inv-create-month')?.addEventListener('change', calculateInvoiceForm);
  document.getElementById('inv-start-date')?.addEventListener('input', updateKhmerPeriodPreview);
  document.getElementById('inv-payment-date')?.addEventListener('input', updateKhmerPeriodPreview);
  document.getElementById('inv-room-usd')?.addEventListener('input', handleRoomUsdChange);
  document.getElementById('inv-room-khr')?.addEventListener('input', handleRoomKhrChange);

  ['inv-elec-old', 'inv-elec-new', 'inv-elec-rate', 'inv-water-old', 'inv-water-new', 'inv-water-rate', 'inv-trash-fee', 'inv-wifi-fee', 'inv-other-fee'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', recalcInvoiceGrandTotal);
  });

  // Login form handler
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLoginSubmit(e);
  });

  // Check Authentication Status immediately
  const isAuthenticated = checkAuthStatus();
  if (isAuthenticated) {
    switchTab('dashboard');
  }

  // Check Supabase connection and pull live cloud data on startup
  try {
    const supaResult = await initializeSupabase();
    updateSupabaseBadge(supaResult && supaResult.connected);
    if (supaResult && supaResult.connected) {
      await store.loadFromSupabase();
      console.log('✓ Auto-synced all live data from Supabase Cloud.');
      if (isAuthenticated) {
        updateDashboardStats();
        renderRooms();
        renderTenants();
      }
    }
  } catch (err) {
    console.warn('Supabase startup check notice:', err);
    updateSupabaseBadge(false);
  }
});
