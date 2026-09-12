// Invoices & Billing Management Module (Matching User Specification)
import { store } from './store.js';
import { showToast } from './toast.js';

// Khmer Date & Period Formatting Helpers
export function formatKhmerFullDate(dateStr) {
  if (!dateStr) return 'មិនទាន់កំណត់';
  if (typeof dateStr === 'string' && dateStr.includes('ថ្ងៃទី')) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `ថ្ងៃទី ${day} ខែ ${month} ឆ្នាំ ${year}`;
}

export function formatKhmerShortDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month} ឆ្នាំ ${year}`;
}

export function formatKhmerPeriodDuration(startDateStr, paymentDateStr) {
  if (!startDateStr || !paymentDateStr) return 'រយៈពេល ១ ខែ';
  const start = new Date(startDateStr);
  const end = new Date(paymentDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'រយៈពេល ១ ខែ';

  const startDay = String(start.getDate()).padStart(2, '0');
  const startMonth = String(start.getMonth() + 1).padStart(2, '0');
  const startYear = start.getFullYear();

  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endYear = end.getFullYear();

  return `រយៈពេល ១ ខែ (ពី ថ្ងៃទី ${startDay} ខែ ${startMonth} ឆ្នាំ ${startYear} ដល់ ថ្ងៃទី ${endDay} ខែ ${endMonth} ឆ្នាំ ${endYear})`;
}

export function addOneMonthToDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10); // 1-12
  let day = parseInt(parts[2], 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  const daysInNextMonth = new Date(year, month, 0).getDate();
  const targetDay = Math.min(day, daysInNextMonth);

  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const dd = String(targetDay).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
window.addOneMonthToDate = addOneMonthToDate;

export function handleStartDateChange() {
  const startInput = document.getElementById('inv-start-date');
  const paymentInput = document.getElementById('inv-payment-date');
  if (startInput && startInput.value) {
    const nextMonth = addOneMonthToDate(startInput.value);
    if (paymentInput) {
      paymentInput.value = nextMonth;
    }
  }
  updateKhmerPeriodPreview();
}
window.handleStartDateChange = handleStartDateChange;

export function updateKhmerPeriodPreview() {
  const startInput = document.getElementById('inv-start-date');
  const paymentInput = document.getElementById('inv-payment-date');
  const previewEl = document.getElementById('inv-khmer-period-preview');
  const subEl = document.getElementById('inv-khmer-period-sub');

  if (!previewEl) return;
  const startVal = startInput?.value;
  let payVal = paymentInput?.value;

  if (startVal) {
    if (!payVal) {
      payVal = addOneMonthToDate(startVal);
      if (paymentInput) paymentInput.value = payVal;
    }
    previewEl.innerHTML = `<span class="font-bold">រយៈពេល ១ ខែ:</span> ពី ${formatKhmerFullDate(startVal)} ដល់ ${formatKhmerFullDate(payVal)}`;
    if (subEl) subEl.innerText = `${startVal} → ${payVal}`;
  } else {
    previewEl.innerText = 'រយៈពេល ១ ខែ';
    if (subEl) subEl.innerText = '';
  }
}
window.updateKhmerPeriodPreview = updateKhmerPeriodPreview;

export function renderInvoices() {
  const tableBody = document.getElementById('invoices-table-body');
  const mobileCards = document.getElementById('invoices-mobile-cards');
  const monthFilter = document.getElementById('invoice-month-filter');
  const statusFilter = document.getElementById('invoice-status-filter')?.value || 'all';
  const searchQuery = document.getElementById('invoice-search')?.value?.toLowerCase() || '';

  if (!tableBody && !mobileCards) return;

  const currentMonth = monthFilter ? monthFilter.value : '';
  const invoices = store.getInvoices();
  const tenants = store.getTenants();

  const filteredInvoices = invoices.filter(inv => {
    const matchMonth = !currentMonth || inv.month === currentMonth;
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery) ||
      inv.roomNumber.toLowerCase().includes(searchQuery) ||
      (inv.tenantName && inv.tenantName.toLowerCase().includes(searchQuery));
    return matchMonth && matchStatus && matchSearch;
  });

  // Empty state handling
  if (filteredInvoices.length === 0) {
    const emptyHtml = `
      <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-receipt"></i>
        </div>
        <p class="text-sm font-semibold text-slate-600">មិនមានវិក្កយបត្រត្រូវបង្ហាញទេ (No invoices found)</p>
        <p class="text-xs text-slate-400 mt-1">សូមសាកល្បងផ្លាស់ប្តូរការស្វែងរក ឬចុចចេញវិក្កយបត្រថ្មី</p>
      </div>
    `;
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400">មិនមានទិន្នន័យវិក្កយបត្រ</td></tr>`;
    }
    if (mobileCards) {
      mobileCards.innerHTML = emptyHtml;
    }
    return;
  }

  // 1. Render Table View (Desktops/Tablets)
  if (tableBody) {
    tableBody.innerHTML = filteredInvoices.map(inv => {
      const tenant = tenants.find(t => (inv.roomId && t.roomId === inv.roomId) || (inv.tenantName && t.name.trim().toLowerCase() === inv.tenantName.trim().toLowerCase()));

      let statusBadge = '';
      if (inv.status === 'paid') {
        statusBadge = `<span class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-[10px]"></i> បានបង់រួច</span>`;
      } else if (inv.status === 'partial') {
        statusBadge = `<span class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-half-stroke text-[10px]"></i> បង់ខ្លះ</span>`;
      } else {
        statusBadge = `<span class="whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-exclamation text-[10px]"></i> មិនទាន់បង់</span>`;
      }

      const loginDateStr = inv.startDate || (tenant ? tenant.startDate : null);
      const payDateStr = inv.paymentDate || inv.createdAt;

      return `
        <tr class="border-b border-slate-100 hover:bg-blue-50/30 transition text-sm">
          <td class="py-3.5 px-3 font-mono text-xs font-semibold text-blue-800 whitespace-nowrap">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-receipt text-blue-500"></i> ${inv.invoiceNumber}</span>
          </td>
          <td class="py-3.5 px-3 font-bold font-mono text-slate-800 whitespace-nowrap">
            <span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs border border-blue-100">បន្ទប់ ${inv.roomNumber}</span>
          </td>
          <td class="py-3.5 px-3 font-medium text-slate-700 whitespace-nowrap">
            ${tenant ? `
              <button onclick="window.viewTenantDetails('${tenant.id}')" class="text-blue-700 hover:text-blue-900 hover:underline font-semibold flex items-center gap-1.5 group" title="ចុចមើលព័ត៌មានលម្អិតអ្នកជួល">
                <i class="fa-solid fa-user text-[11px] text-blue-500 group-hover:text-blue-700"></i>
                <span>${inv.tenantName || tenant.name}</span>
              </button>
            ` : (inv.tenantName || '-')}
          </td>
          <td class="py-3.5 px-3 whitespace-nowrap">
            <div class="font-mono text-xs font-bold text-slate-800">${inv.month}</div>
            <div class="text-[10px] text-blue-600 font-sans font-medium flex items-center gap-1 mt-0.5" title="រយៈពេលគិតឈ្នួល">
              <i class="fa-solid fa-calendar-days text-[9px]"></i>
              <span>${loginDateStr && payDateStr ? `${new Date(loginDateStr).getDate()}/${new Date(loginDateStr).getMonth() + 1} - ${new Date(payDateStr).getDate()}/${new Date(payDateStr).getMonth() + 1} (១ ខែ)` : 'រយៈពេល ១ ខែ'}</span>
            </div>
          </td>
          <td class="py-3.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
            <div class="text-emerald-700 text-sm sm:text-base">$${(inv.totalUsd || 0).toFixed(2)}</div>
            <div class="text-[11px] text-slate-400 font-normal">≈ ${(inv.totalKhr || 0).toLocaleString()} ៛</div>
          </td>
          <td class="py-3.5 px-3 whitespace-nowrap">${statusBadge}</td>
          <td class="py-3.5 px-3 whitespace-nowrap">
            <select onchange="window.changeInvoiceStatus('${inv.id}', this.value)" class="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
              <option value="unpaid" ${inv.status === 'unpaid' ? 'selected' : ''}>● មិនទាន់បង់</option>
              <option value="paid" ${inv.status === 'paid' ? 'selected' : ''}>✓ បានបង់រួច</option>
              <option value="partial" ${inv.status === 'partial' ? 'selected' : ''}>◐ បង់មួយផ្នែក</option>
            </select>
          </td>
          <td class="py-3.5 px-3 text-right space-x-1.5 space-x-reverse whitespace-nowrap">
            <button onclick="window.viewInvoiceModal('${inv.id}')" class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition border border-blue-200" title="មើល & ព្រីន">
              <i class="fa-solid fa-print text-blue-600"></i> <span>មើល/ព្រីន</span>
            </button>
            <button onclick="window.deleteInvoice('${inv.id}')" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition" title="លុប">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile Cards View (Phones)
  if (mobileCards) {
    mobileCards.innerHTML = filteredInvoices.map(inv => {
      const tenant = tenants.find(t => (inv.roomId && t.roomId === inv.roomId) || (inv.tenantName && t.name.trim().toLowerCase() === inv.tenantName.trim().toLowerCase()));
      const loginDateStr = inv.startDate || (tenant ? tenant.startDate : null);
      const payDateStr = inv.paymentDate || inv.createdAt;

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          
          <!-- Top Row: Invoice Number + Room Badge -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                <i class="fa-solid fa-receipt"></i>
              </div>
              <div>
                <span class="font-mono font-bold text-xs text-blue-900 block leading-tight">${inv.invoiceNumber}</span>
                <span class="text-[10px] text-slate-400 font-mono">${inv.month}</span>
              </div>
            </div>
            
            <span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold font-mono border border-blue-200">
              បន្ទប់ ${inv.roomNumber}
            </span>
          </div>

          <!-- Tenant & Total Amount Info Box -->
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 block">អ្នកជួល:</span>
              ${tenant ? `
                <button onclick="window.viewTenantDetails('${tenant.id}')" class="font-semibold text-blue-700 hover:text-blue-900 text-xs flex items-center gap-1 mt-0.5">
                  <i class="fa-solid fa-user text-[10px] text-blue-500"></i> ${inv.tenantName || tenant.name}
                </button>
              ` : `
                <span class="font-semibold text-slate-800 text-xs flex items-center gap-1 mt-0.5">
                  <i class="fa-solid fa-user text-[10px] text-slate-400"></i> ${inv.tenantName || 'គ្មានឈ្មោះ'}
                </span>
              `}
              <div class="text-[10px] text-blue-600 font-sans font-medium mt-1">
                ${loginDateStr && payDateStr ? `📅 គិត ១ ខែ: ${new Date(loginDateStr).getDate()}/${new Date(loginDateStr).getMonth() + 1} → ${new Date(payDateStr).getDate()}/${new Date(payDateStr).getMonth() + 1}` : '📅 រយៈពេល ១ ខែ'}
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block">ទឹកប្រាក់សរុប:</span>
              <span class="text-base font-extrabold text-emerald-700 font-mono block leading-none">$${(inv.totalUsd || 0).toFixed(2)}</span>
              <span class="text-[10px] text-slate-500 font-mono">≈ ${(inv.totalKhr || 0).toLocaleString()} ៛</span>
            </div>
          </div>

          <!-- Status Selector & Action Buttons -->
          <div class="flex items-center justify-between pt-1 gap-2">
            <div class="flex-1">
              <select onchange="window.changeInvoiceStatus('${inv.id}', this.value)" class="w-full text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="unpaid" ${inv.status === 'unpaid' ? 'selected' : ''}>● មិនទាន់បង់ (Unpaid)</option>
                <option value="paid" ${inv.status === 'paid' ? 'selected' : ''}>✓ បានបង់រួច (Paid)</option>
                <option value="partial" ${inv.status === 'partial' ? 'selected' : ''}>◐ បង់ខ្លះ (Partial)</option>
              </select>
            </div>

            <button onclick="window.viewInvoiceModal('${inv.id}')" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition active:scale-98">
              <i class="fa-solid fa-print"></i> <span>មើល/ព្រីន</span>
            </button>
            <button onclick="window.deleteInvoice('${inv.id}')" class="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition" title="លុបវិក្កយបត្រ">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>

        </div>
      `;
    }).join('');
  }
}

// Change invoice payment status handler
window.changeInvoiceStatus = (id, newStatus) => {
  store.updateInvoicePayment(id, newStatus);
  renderInvoices();
  if (window.renderPayments) window.renderPayments();
  if (window.updateDashboardStats) window.updateDashboardStats();
  showToast(`បានប្តូរស្ថានភាពវិក្កយបត្រទៅជា៖ ${newStatus === 'paid' ? 'បានបង់រួច ✓' : newStatus === 'partial' ? 'បង់ខ្លះ ◐' : 'មិនទាន់បង់ ●'}`, 'info');
};

// Generate Invoice calculation modal
export function openCreateInvoiceModal(roomId = null) {
  const modal = document.getElementById('create-invoice-modal');
  const roomSelect = document.getElementById('inv-create-room');
  const monthInput = document.getElementById('inv-create-month');
  if (!modal || !roomSelect || !monthInput) return;

  const currentMonth = document.getElementById('utility-month-select')?.value || new Date().toISOString().substring(0, 7);
  monthInput.value = currentMonth;

  // Populate rooms
  const rooms = store.getRooms();
  let options = '<option value="">-- សូមជ្រើសរើសបន្ទប់ --</option>';
  rooms.forEach(r => {
    const cleanRoomNum = (r.roomNumber || '').replace(/^room[-_]?/i, '') || r.roomNumber;
    const tenant = store.getTenantForRoom(r.id);
    const tenantSuffix = tenant ? ` - ${tenant.name}` : ' (ទំនេរ)';
    options += `<option value="${r.id}" ${roomId === r.id ? 'selected' : ''}>បន្ទប់ ${cleanRoomNum}${tenantSuffix} (ថ្លៃឈ្នួល $${r.price}/ខែ)</option>`;
  });
  roomSelect.innerHTML = options;

  if (roomId) {
    roomSelect.value = roomId;
    calculateInvoiceForm();
  } else {
    // If only one room exists, auto-select it
    if (rooms.length === 1) {
      roomSelect.value = rooms[0].id;
      calculateInvoiceForm();
    } else {
      // Clear tenant fields until a room is chosen
      calculateInvoiceForm();
    }
  }

  modal.classList.remove('hidden');
}

export function closeCreateInvoiceModal() {
  const modal = document.getElementById('create-invoice-modal');
  if (modal) modal.classList.add('hidden');
}

export function calculateInvoiceForm() {
  const roomSelect = document.getElementById('inv-create-room');
  const monthInput = document.getElementById('inv-create-month');
  if (!roomSelect) return;

  const roomId = roomSelect.value;
  const month = monthInput?.value || new Date().toISOString().substring(0, 7);

  const tenantNameInput = document.getElementById('inv-tenant-name');
  const tenantPhoneInput = document.getElementById('inv-tenant-phone');
  const roomUsdInput = document.getElementById('inv-room-usd');
  const roomKhrInput = document.getElementById('inv-room-khr');
  const startDateInput = document.getElementById('inv-start-date');
  const paymentDateInput = document.getElementById('inv-payment-date');

  // If no room selected, clear fields
  if (!roomId) {
    if (tenantNameInput) {
      tenantNameInput.value = '';
      tenantNameInput.placeholder = 'សូមជ្រើសរើសបន្ទប់ជាមុនសិន';
    }
    const autoTag = document.getElementById('inv-tenant-auto-tag');
    if (autoTag) autoTag.classList.add('hidden');
    if (tenantPhoneInput) {
      tenantPhoneInput.value = '';
      tenantPhoneInput.placeholder = '';
    }
    if (roomUsdInput) roomUsdInput.value = '';
    if (roomKhrInput) roomKhrInput.value = '';
    recalcInvoiceGrandTotal();
    return;
  }

  const room = store.getRoomById(roomId);
  const tenant = store.getTenantForRoom(roomId);
  const settings = store.getSettings();
  const exchangeRate = settings.exchangeRate || 4000;

  // 1. Auto Catch Tenant Information
  const autoTag = document.getElementById('inv-tenant-auto-tag');
  if (autoTag) {
    if (tenant) {
      autoTag.classList.remove('hidden');
    } else {
      autoTag.classList.add('hidden');
    }
  }
  if (tenantNameInput) {
    tenantNameInput.value = tenant ? tenant.name : '';
    tenantNameInput.placeholder = tenant ? '' : 'មិនទាន់មានអ្នកជួល (អាចវាយបញ្ចូលដោយដៃ)';
  }
  if (tenantPhoneInput) {
    tenantPhoneInput.value = tenant ? tenant.phone : '';
    tenantPhoneInput.placeholder = tenant ? '' : 'លេខទូរស័ព្ទ...';
  }

  // 2. Dates: Day Login (Start Date) and Day Payment (+1 Month Auto Calculate)
  if (startDateInput) {
    startDateInput.value = tenant?.startDate || `${month}-01`;
  }
  if (paymentDateInput && startDateInput) {
    paymentDateInput.value = addOneMonthToDate(startDateInput.value);
  }
  updateKhmerPeriodPreview();

  // 3. Auto Catch Room Rent (USD & KHR)
  const roomPriceUsd = room ? (parseFloat(room.price) || 0) : 0;
  const roomPriceKhr = Math.round(roomPriceUsd * exchangeRate);
  if (roomUsdInput) roomUsdInput.value = roomPriceUsd || '';
  if (roomKhrInput) roomKhrInput.value = roomPriceKhr || '';

  // 4. Auto Catch Utilities (Electricity & Water)
  const reading = (typeof store.getReadingForRoomMonth === 'function' 
    ? store.getReadingForRoomMonth(roomId, month) 
    : (typeof store.getReading === 'function' ? store.getReading(month, roomId) : null)) || {};
  const prevReading = (typeof store.getPreviousReading === 'function'
    ? store.getPreviousReading(roomId, month)
    : null) || {};

  const oldElec = reading.oldElectric !== undefined 
    ? reading.oldElectric 
    : (prevReading.newElectric !== undefined ? prevReading.newElectric : 0);
  const newElec = reading.newElectric !== undefined 
    ? reading.newElectric 
    : oldElec;
  const elecRate = settings.electricityRate || 1000;
  const elecUsage = Math.max(0, newElec - oldElec);
  const elecTotal = elecUsage * elecRate;

  const elOld = document.getElementById('inv-elec-old');
  const elNew = document.getElementById('inv-elec-new');
  const elRate = document.getElementById('inv-elec-rate');
  const elUsage = document.getElementById('inv-elec-usage');
  const elTotal = document.getElementById('inv-elec-total');

  if (elOld) elOld.value = oldElec;
  if (elNew) elNew.value = newElec;
  if (elRate) elRate.value = elecRate;
  if (elUsage) elUsage.innerText = elecUsage;
  if (elTotal) elTotal.innerText = `${elecTotal.toLocaleString()} ៛`;

  const oldWat = reading.oldWater !== undefined 
    ? reading.oldWater 
    : (prevReading.newWater !== undefined ? prevReading.newWater : 0);
  const newWat = reading.newWater !== undefined 
    ? reading.newWater 
    : oldWat;
  const watRate = settings.waterRate || 2200;
  const watUsage = Math.max(0, newWat - oldWat);
  const watTotal = watUsage * watRate;

  const wtOld = document.getElementById('inv-water-old');
  const wtNew = document.getElementById('inv-water-new');
  const wtRate = document.getElementById('inv-water-rate');
  const wtUsage = document.getElementById('inv-water-usage');
  const wtTotal = document.getElementById('inv-water-total');

  if (wtOld) wtOld.value = oldWat;
  if (wtNew) wtNew.value = newWat;
  if (wtRate) wtRate.value = watRate;
  if (wtUsage) wtUsage.innerText = watUsage;
  if (wtTotal) wtTotal.innerText = `${watTotal.toLocaleString()} ៛`;

  // 5. Other Fees (Trash, Wifi, Other) from Settings
  const trashEl = document.getElementById('inv-trash-fee');
  const wifiEl = document.getElementById('inv-wifi-fee');
  const otherEl = document.getElementById('inv-other-fee');
  if (trashEl) trashEl.value = settings.trashFee || 0;
  if (wifiEl) wifiEl.value = settings.wifiFee || 0;
  if (otherEl && !otherEl.value) otherEl.value = 0;

  recalcInvoiceGrandTotal();
}
window.calculateInvoiceForm = calculateInvoiceForm;

export function handleRoomUsdChange() {
  const settings = store.getSettings();
  const roomUsd = parseFloat(document.getElementById('inv-room-usd')?.value) || 0;
  const roomKhr = Math.round(roomUsd * (settings.exchangeRate || 4100));
  const khrInput = document.getElementById('inv-room-khr');
  if (khrInput) khrInput.value = roomKhr;
  recalcInvoiceGrandTotal();
}
window.handleRoomUsdChange = handleRoomUsdChange;

export function handleRoomKhrChange() {
  const settings = store.getSettings();
  const roomKhr = parseFloat(document.getElementById('inv-room-khr')?.value) || 0;
  const roomUsd = parseFloat((roomKhr / (settings.exchangeRate || 4100)).toFixed(2));
  const usdInput = document.getElementById('inv-room-usd');
  if (usdInput) usdInput.value = roomUsd;
  recalcInvoiceGrandTotal();
}
window.handleRoomKhrChange = handleRoomKhrChange;

export function recalcInvoiceGrandTotal() {
  const settings = store.getSettings();
  const roomUsd = parseFloat(document.getElementById('inv-room-usd')?.value) || 0;
  const roomKhr = parseFloat(document.getElementById('inv-room-khr')?.value) || Math.round(roomUsd * (settings.exchangeRate || 4100));

  // Electricity: (New - Old) * Rate
  const oldElec = parseFloat(document.getElementById('inv-elec-old')?.value) || 0;
  const newElec = parseFloat(document.getElementById('inv-elec-new')?.value) || 0;
  const elecRate = parseFloat(document.getElementById('inv-elec-rate')?.value) || settings.electricityRate;
  const elecUsage = Math.max(0, newElec - oldElec);
  const elecTotal = elecUsage * elecRate;
  const elUsage = document.getElementById('inv-elec-usage');
  const elTotal = document.getElementById('inv-elec-total');
  if (elUsage) elUsage.innerText = elecUsage;
  if (elTotal) elTotal.innerText = `${elecTotal.toLocaleString()} ៛`;

  // Water: (New - Old) * Rate
  const oldWat = parseFloat(document.getElementById('inv-water-old')?.value) || 0;
  const newWat = parseFloat(document.getElementById('inv-water-new')?.value) || 0;
  const watRate = parseFloat(document.getElementById('inv-water-rate')?.value) || settings.waterRate;
  const watUsage = Math.max(0, newWat - oldWat);
  const watTotal = watUsage * watRate;
  const wtUsage = document.getElementById('inv-water-usage');
  const wtTotal = document.getElementById('inv-water-total');
  if (wtUsage) wtUsage.innerText = watUsage;
  if (wtTotal) wtTotal.innerText = `${watTotal.toLocaleString()} ៛`;

  const trashFee = parseFloat(document.getElementById('inv-trash-fee')?.value) || 0;
  const wifiFee = parseFloat(document.getElementById('inv-wifi-fee')?.value) || 0;
  const otherFee = parseFloat(document.getElementById('inv-other-fee')?.value) || 0;

  const utilitiesKhr = elecTotal + watTotal + trashFee + wifiFee + otherFee;
  const utilitiesUsd = utilitiesKhr / (settings.exchangeRate || 4100);

  const grandTotalUsd = roomUsd + utilitiesUsd;
  const grandTotalKhr = roomKhr + utilitiesKhr;

  const gUsd = document.getElementById('inv-grand-usd');
  const gKhr = document.getElementById('inv-grand-khr');
  if (gUsd) gUsd.innerText = `$${grandTotalUsd.toFixed(2)}`;
  if (gKhr) gKhr.innerText = `${grandTotalKhr.toLocaleString()} ៛`;
}
window.recalcInvoiceGrandTotal = recalcInvoiceGrandTotal;

export function handleSaveInvoice(e) {
  e.preventDefault();
  const roomId = document.getElementById('inv-create-room').value;
  const month = document.getElementById('inv-create-month').value;
  const room = store.getRoomById(roomId);
  const tenant = store.getTenantForRoom(roomId);
  const settings = store.getSettings();

  if (!roomId || !month) {
    showToast('សូមជ្រើសរើសបន្ទប់ និងខែ!', 'warning');
    return;
  }

  const cleanMonth = month.replace('-', '');
  const invoiceNumber = `INV-${cleanMonth}-${room ? room.roomNumber : '00'}`;

  const startDate = document.getElementById('inv-start-date')?.value || (tenant?.startDate || `${month}-01`);
  const paymentDate = document.getElementById('inv-payment-date')?.value || new Date().toISOString().split('T')[0];

  const oldElec = parseFloat(document.getElementById('inv-elec-old').value) || 0;
  const newElec = parseFloat(document.getElementById('inv-elec-new').value) || 0;
  const elecRate = parseFloat(document.getElementById('inv-elec-rate').value) || settings.electricityRate;
  const elecUsage = Math.max(0, newElec - oldElec);
  const elecTotal = elecUsage * elecRate;

  const oldWat = parseFloat(document.getElementById('inv-water-old').value) || 0;
  const newWat = parseFloat(document.getElementById('inv-water-new').value) || 0;
  const watRate = parseFloat(document.getElementById('inv-water-rate').value) || settings.waterRate;
  const watUsage = Math.max(0, newWat - oldWat);
  const watTotal = watUsage * watRate;

  const roomPriceUsd = parseFloat(document.getElementById('inv-room-usd').value) || 0;
  const roomPriceKhr = parseFloat(document.getElementById('inv-room-khr').value) || (roomPriceUsd * (settings.exchangeRate || 4000));
  const trashFee = parseFloat(document.getElementById('inv-trash-fee').value) || 0;
  const wifiFee = parseFloat(document.getElementById('inv-wifi-fee').value) || 0;
  const otherFee = parseFloat(document.getElementById('inv-other-fee').value) || 0;

  const utilitiesKhr = elecTotal + watTotal + trashFee + wifiFee + otherFee;
  const utilitiesUsd = utilitiesKhr / (settings.exchangeRate || 4000);
  const totalUsd = roomPriceUsd + utilitiesUsd;
  const totalKhr = roomPriceKhr + utilitiesKhr;

  const invoiceData = {
    id: `inv-${month}-${roomId}`,
    invoiceNumber,
    month,
    roomId,
    roomNumber: room ? room.roomNumber : '',
    tenantName: document.getElementById('inv-tenant-name').value,
    tenantPhone: document.getElementById('inv-tenant-phone').value,
    startDate,
    paymentDate,
    roomPriceUsd,
    roomPriceKhr,
    oldElectric: oldElec,
    newElectric: newElec,
    electricUsage: elecUsage,
    electricRate: elecRate,
    electricTotal: elecTotal,
    oldWater: oldWat,
    newWater: newWat,
    waterUsage: watUsage,
    waterRate: watRate,
    waterTotal: watTotal,
    trashFee,
    wifiFee,
    otherFee,
    totalKhr,
    totalUsd,
    status: 'unpaid',
    paidAmount: 0
  };

  store.addOrUpdateInvoice(invoiceData);
  store.saveReading(month, roomId, { oldElectric: oldElec, newElectric: newElec, oldWater: oldWat, newWater: newWat });

  closeCreateInvoiceModal();
  renderInvoices();
  window.updateDashboardStats();
  showToast('បានបង្កើតវិក្កយបត្រដោយជោគជ័យ!', 'success');
  window.viewInvoiceModal(invoiceData.id);
}

// Display Clean Invoice View matching User Receipt Specification
export function viewInvoiceModal(invoiceId) {
  const modal = document.getElementById('invoice-view-modal');
  const container = document.getElementById('invoice-render-content');
  if (!modal || !container) return;

  const inv = store.getInvoiceById(invoiceId);
  if (!inv) {
    showToast('រកមិនឃើញវិក្កយបត្រនេះទេ!', 'error');
    return;
  }

  const settings = store.getSettings();
  const room = inv.roomId ? store.getRoomById(inv.roomId) : null;
  const tenant = store.getTenants().find(t => (room && t.id === room.tenantId) || (inv.tenantName && t.name && t.name.trim().toLowerCase() === inv.tenantName.trim().toLowerCase()));

  const loginDate = inv.startDate || (tenant ? tenant.startDate : null) || `${inv.month}-01`;
  const paymentDate = inv.paymentDate || inv.createdAt || new Date().toISOString();
  const createdDate = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  container.innerHTML = `
    <div id="print-area" class="p-5 sm:p-8 bg-white max-w-md mx-auto rounded-2xl font-mono text-slate-800 border border-slate-200 shadow-sm">
      
      <!-- Top Title -->
      <div class="text-center pb-4 mb-4 border-b border-dashed border-slate-300">
        <h2 class="text-xl sm:text-2xl font-bold tracking-widest text-slate-900 font-sans">វិក្កយបត្រ</h2>
        <p class="text-xs text-slate-500 font-medium tracking-wider mt-0.5">បន្ទប់ជួល & គិតថ្លៃទឹកភ្លើង</p>
      </div>

      <!-- Header Info -->
      <div class="text-xs space-y-2 pb-4 mb-4 border-b border-dashed border-slate-300">
        <div class="flex justify-between items-center">
          <span class="text-slate-500 font-bold">បន្ទប់:</span>
          <span class="font-extrabold text-blue-900 text-base">បន្ទប់ ${inv.roomNumber}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">ឈ្មោះអ្នកជួល:</span>
          <span class="font-bold text-slate-900">${inv.tenantName || (tenant ? tenant.name : 'គ្មានឈ្មោះ')}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">លេខវិក្កយបត្រ:</span>
          <span class="text-slate-600 font-semibold font-mono">${inv.invoiceNumber}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-500">កាលបរិច្ឆេទចេញប័ណ្ណ:</span>
          <span class="text-slate-700 font-mono">${createdDate}</span>
        </div>

        <!-- 1 Month Period & Khmer Dates (Day Login & Day Payment) -->
        <div class="bg-blue-50/70 p-3 rounded-xl border border-blue-100/90 my-2.5 font-sans space-y-2">
          <div class="flex justify-between items-center text-slate-800">
            <span class="text-slate-500 font-medium flex items-center gap-1.5">
              <i class="fa-solid fa-calendar-plus text-blue-600"></i> ថ្ងៃចូលនៅ (Day Login):
            </span>
            <span class="font-bold text-blue-950 font-sans tracking-wide">${formatKhmerFullDate(loginDate)}</span>
          </div>
          <div class="flex justify-between items-center text-slate-800">
            <span class="text-slate-500 font-medium flex items-center gap-1.5">
              <i class="fa-solid fa-calendar-check text-emerald-600"></i> ថ្ងៃទូទាត់ (Day Payment):
            </span>
            <span class="font-bold text-emerald-800 font-sans tracking-wide">${formatKhmerFullDate(paymentDate)}</span>
          </div>
          <div class="pt-1.5 border-t border-blue-200/60 flex justify-between items-center text-xs">
            <span class="text-blue-800 font-semibold flex items-center gap-1">
              <i class="fa-solid fa-clock-rotate-left text-blue-600"></i> រយៈពេលគិតឈ្នួល:
            </span>
            <span class="px-2.5 py-0.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold font-sans">
              រយៈពេល ១ ខែ (1 Month)
            </span>
          </div>
        </div>
      </div>

      <!-- WATER SECTION -->
      <div class="pb-4 mb-4 border-b border-dashed border-slate-300">
        <div class="text-xs font-bold text-cyan-900 mb-2 flex items-center gap-1.5 tracking-wider">
          <i class="fa-solid fa-droplet text-cyan-600"></i> ថ្លៃទឹកប្រើប្រាស់
        </div>
        <div class="text-xs space-y-1.5">
          <div class="flex justify-between text-slate-600">
            <span>អំណានចាស់:</span>
            <span class="font-mono">${inv.oldWater}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>អំណានថ្មី:</span>
            <span class="font-mono">${inv.newWater}</span>
          </div>
          <div class="flex justify-between font-semibold text-slate-800">
            <span>បរិមាណប្រើប្រាស់:</span>
            <span class="font-mono">${inv.waterUsage} m³</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>តម្លៃក្នុង ១ m³:</span>
            <span class="font-mono">${inv.waterRate.toLocaleString()} ៛</span>
          </div>
          <div class="flex justify-between font-bold text-cyan-900 pt-1 border-t border-slate-100">
            <span>សរុបថ្លៃទឹក:</span>
            <span class="font-mono">${inv.waterTotal.toLocaleString()} ៛</span>
          </div>
        </div>
      </div>

      <!-- ELECTRICITY SECTION -->
      <div class="pb-4 mb-4 border-b border-dashed border-slate-300">
        <div class="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5 tracking-wider">
          <i class="fa-solid fa-bolt text-amber-500"></i> ថ្លៃភ្លើងប្រើប្រាស់
        </div>
        <div class="text-xs space-y-1.5">
          <div class="flex justify-between text-slate-600">
            <span>អំណានចាស់:</span>
            <span class="font-mono">${inv.oldElectric}</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>អំណានថ្មី:</span>
            <span class="font-mono">${inv.newElectric}</span>
          </div>
          <div class="flex justify-between font-semibold text-slate-800">
            <span>បរិមាណប្រើប្រាស់:</span>
            <span class="font-mono">${inv.electricUsage} kWh</span>
          </div>
          <div class="flex justify-between text-slate-600">
            <span>តម្លៃក្នុង ១ kWh:</span>
            <span class="font-mono">${inv.electricRate.toLocaleString()} ៛</span>
          </div>
          <div class="flex justify-between font-bold text-blue-900 pt-1 border-t border-slate-100">
            <span>សរុបថ្លៃភ្លើង:</span>
            <span class="font-mono">${inv.electricTotal.toLocaleString()} ៛</span>
          </div>
        </div>
      </div>

      <!-- HOUSE FEE (Room Rent) & Other fees -->
      <div class="pb-4 mb-4 border-b border-dashed border-slate-300 text-xs space-y-1.5">
        <div class="flex justify-between font-bold text-slate-900">
          <span>ថ្លៃបន្ទប់ជួល:</span>
          <span class="text-sm font-mono">$${inv.roomPriceUsd.toFixed(2)}</span>
        </div>
        ${inv.trashFee > 0 ? `
        <div class="flex justify-between text-slate-600">
          <span>ថ្លៃសំរាម:</span>
          <span class="font-mono">${inv.trashFee.toLocaleString()} ៛</span>
        </div>` : ''}
        ${inv.wifiFee > 0 ? `
        <div class="flex justify-between text-slate-600">
          <span>ថ្លៃសេវា WiFi:</span>
          <span class="font-mono">${inv.wifiFee.toLocaleString()} ៛</span>
        </div>` : ''}
      </div>

      <!-- GRAND TOTAL SECTION -->
      <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-4">
        <div class="flex justify-between items-baseline">
          <span class="text-sm font-extrabold text-slate-900">សរុបត្រូវទូទាត់:</span>
          <div class="text-right">
            <span class="text-2xl font-extrabold text-emerald-700 font-mono">$${inv.totalUsd.toFixed(2)}</span>
            <span class="text-xs text-slate-500 block font-mono">≈ ${inv.totalKhr.toLocaleString()} ៛</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
          <span class="text-slate-500">ស្ថានភាព:</span>
          <span class="font-bold ${inv.status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}">
            ${inv.status === 'paid' ? '✓ បានទូទាត់រួចរាល់' : '⏳ មិនទាន់ទូទាត់'}
          </span>
        </div>
      </div>

      <!-- KHQR Code scan to pay -->
      <div class="pt-2 text-center">
        <div class="text-xs text-slate-600 mb-2.5 flex items-center justify-center gap-1.5 font-semibold">
          <i class="fa-solid fa-qrcode text-red-600 text-sm"></i> <span>ស្កេនទូទាត់ប្រាក់តាម ABA KHQR</span>
        </div>
        <div class="inline-block bg-slate-900/5 p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <img src="${settings.qrImageUrl || 'img/aba_qr.png'}?v=2" alt="ABA KHQR" class="w-48 sm:w-52 mx-auto rounded-xl shadow border border-slate-100 object-contain hover:scale-102 transition-transform cursor-pointer" onclick="window.open(this.src, '_blank')">
        </div>
        <div class="mt-3 text-xs text-slate-700 font-semibold space-y-1">
          <div><span class="text-slate-500 font-normal">ឈ្មោះគណនី:</span> <span class="font-bold text-slate-900">${settings.abaAccountName || 'PHANET THAI'}</span></div>
          <div class="font-mono text-xs text-slate-600 flex justify-center items-center gap-3">
            <span>USD: <b class="text-blue-700">${settings.abaKhqrAccount || '008 270 003'}</b></span>
            <span>|</span>
            <span>KHR: <b class="text-emerald-700">${settings.abaKhqrAccountKhr || '008 270 004'}</b></span>
          </div>
        </div>
      </div>

      <!-- Footer note -->
      <div class="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-500 italic">
        ${settings.invoiceNote || 'សូមទូទាត់ប្រាក់ឱ្យបានទាន់ពេលវេលា។ សូមអរគុណ!'}
      </div>

    </div>
  `;

  modal.classList.remove('hidden');
}

export function closeInvoiceViewModal() {
  const modal = document.getElementById('invoice-view-modal');
  if (modal) modal.classList.add('hidden');
}

export function printInvoice() {
  window.print();
}

export function downloadInvoicePdf() {
  const element = document.getElementById('print-area');
  if (!element) return;

  if (window.html2pdf) {
    const opt = {
      margin: 8,
      filename: `invoice_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  } else {
    window.print();
  }
}
