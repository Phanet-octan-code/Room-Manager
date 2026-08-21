// Room Management Module (Matching User Specification)
import { store } from './store.js';
import { showToast } from './toast.js';

export function renderRooms() {
  const tableBody = document.getElementById('rooms-table-body');
  const mobileCards = document.getElementById('rooms-mobile-cards');
  if (!tableBody && !mobileCards) return;

  const rooms = store.getRooms();
  const tenants = store.getTenants();
  const settings = store.getSettings();

  const filterStatus = document.getElementById('room-status-filter')?.value || 'all';
  const filterType = document.getElementById('room-type-filter')?.value || 'all';
  const searchQuery = document.getElementById('room-search')?.value?.toLowerCase() || '';

  const filteredRooms = rooms.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchType = filterType === 'all' || r.roomType === filterType;
    const matchSearch = r.roomNumber.toLowerCase().includes(searchQuery) ||
                        (r.description && r.description.toLowerCase().includes(searchQuery));
    return matchStatus && matchType && matchSearch;
  });

  if (filteredRooms.length === 0) {
    const emptyHtml = `
      <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-door-closed"></i>
        </div>
        <p class="text-sm font-semibold text-slate-600">មិនមានបន្ទប់ត្រូវបង្ហាញទេ</p>
        <p class="text-xs text-slate-400 mt-1">សូមសាកល្បងផ្លាស់ប្តូរការស្វែងរក ឬបន្ថែមបន្ទប់ថ្មី</p>
      </div>
    `;
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400">${emptyHtml}</td></tr>`;
    if (mobileCards) mobileCards.innerHTML = emptyHtml;
    return;
  }

  // Helper formatting for room items
  const formatRoomData = (room) => {
    const tenant = tenants.find(t => t.id === room.tenantId);
    const displayRoomNum = (room.roomNumber || '').replace(/^room[-_]?/i, '') || room.roomNumber;

    let statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let statusText = 'ទំនេរ';
    let statusIcon = 'fa-circle-check';

    if (room.status === 'occupied') {
      statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
      statusText = 'មានអ្នកជួល';
      statusIcon = 'fa-user-lock';
    } else if (room.status === 'maintenance') {
      statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
      statusText = 'កំពុងជួសជុល';
      statusIcon = 'fa-wrench';
    }

    let roomTypeLabel = 'បន្ទប់កង្ហារ';
    let roomTypeIcon = 'fa-fan text-blue-500';
    if (room.roomType === 'ac') {
      roomTypeLabel = 'បន្ទប់ម៉ាស៊ីនត្រជាក់';
      roomTypeIcon = 'fa-snowflake text-cyan-500';
    } else if (room.roomType === 'vip') {
      roomTypeLabel = 'បន្ទប់ VIP';
      roomTypeIcon = 'fa-crown text-amber-500';
    } else if (room.roomType === 'studio') {
      roomTypeLabel = 'បន្ទប់ Studio';
      roomTypeIcon = 'fa-couch text-indigo-500';
    }

    const priceKhr = Math.round(room.price * (settings.exchangeRate || 4000));

    return {
      tenant,
      displayRoomNum,
      statusClass,
      statusText,
      statusIcon,
      roomTypeLabel,
      roomTypeIcon,
      priceKhr
    };
  };

  // 1. Render Desktop Table View
  if (tableBody) {
    tableBody.innerHTML = filteredRooms.map((room, idx) => {
      const { tenant, displayRoomNum, statusClass, statusText, statusIcon, roomTypeLabel, roomTypeIcon, priceKhr } = formatRoomData(room);

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition text-sm">
          <td class="py-3.5 px-3.5 text-slate-500 font-mono text-xs text-center whitespace-nowrap">${idx + 1}</td>
          
          <!-- Room & Floor -->
          <td class="py-3.5 px-3 whitespace-nowrap">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                <i class="fa-solid fa-door-closed"></i>
              </div>
              <div>
                <div class="font-bold text-slate-900 text-sm">បន្ទប់ ${displayRoomNum}</div>
                <div class="text-[11px] text-slate-500">ជាន់ទី ${room.floor || 1}</div>
              </div>
            </div>
          </td>

          <!-- Type -->
          <td class="py-3.5 px-3 whitespace-nowrap">
            <span class="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-medium inline-flex items-center gap-1.5">
              <i class="fa-solid ${roomTypeIcon} text-[11px]"></i>
              <span>${roomTypeLabel}</span>
            </span>
          </td>

          <!-- Rent Price -->
          <td class="py-3.5 px-3 font-mono whitespace-nowrap">
            <div class="font-bold text-slate-900 text-sm">$${room.price}</div>
            <div class="text-[11px] text-slate-400 font-normal">≈ ${priceKhr.toLocaleString()} ៛</div>
          </td>

          <!-- Deposit -->
          <td class="py-3.5 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
            $${room.deposit || 0}
          </td>

          <!-- Tenant -->
          <td class="py-3.5 px-3 whitespace-nowrap">
            ${tenant ? `
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                  ${tenant.name.charAt(0)}
                </div>
                <span class="font-semibold text-slate-800 text-xs">${tenant.name}</span>
              </div>
            ` : `
              <span class="text-xs text-slate-400 italic">គ្មានអ្នកជួល</span>
            `}
          </td>

          <!-- Status -->
          <td class="py-3.5 px-3 whitespace-nowrap">
            <span class="px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${statusClass}">
              <i class="fa-solid ${statusIcon} text-[10px]"></i>
              <span>${statusText}</span>
            </span>
          </td>

          <!-- Note -->
          <td class="py-3.5 px-3 text-slate-500 text-xs max-w-[150px] truncate" title="${room.description || '-'}">
            ${room.description || '-'}
          </td>

          <!-- Actions -->
          <td class="py-3.5 px-3 text-right space-x-1.5 space-x-reverse whitespace-nowrap">
            ${room.status === 'occupied' ? `
              <button onclick="window.quickCreateInvoice('${room.id}')" class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition" title="ចេញវិក្កយបត្រ">
                <i class="fa-solid fa-file-invoice-dollar"></i> <span>ចេញប័ណ្ណ</span>
              </button>
            ` : `
              <button onclick="window.assignTenantToRoom('${room.id}')" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition" title="ដាក់អ្នកជួល">
                <i class="fa-solid fa-user-plus"></i> <span>ដាក់អ្នកជួល</span>
              </button>
            `}
            <button onclick="window.editRoom('${room.id}')" class="text-blue-600 hover:text-blue-800 p-1.5 font-medium rounded-lg hover:bg-blue-50 transition" title="កែប្រែ">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="window.deleteRoom('${room.id}')" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition" title="លុប">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile Cards View (Phones)
  if (mobileCards) {
    mobileCards.innerHTML = filteredRooms.map(room => {
      const { tenant, displayRoomNum, statusClass, statusText, statusIcon, roomTypeLabel, roomTypeIcon, priceKhr } = formatRoomData(room);

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                <i class="fa-solid fa-door-closed"></i>
              </div>
              <div>
                <div class="font-bold text-blue-950 font-mono text-base leading-none">បន្ទប់ ${displayRoomNum}</div>
                <div class="text-xs text-slate-400 font-mono mt-0.5">ជាន់ទី ${room.floor || 1} • ${roomTypeLabel}</div>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 whitespace-nowrap ${statusClass}">
              <i class="fa-solid ${statusIcon} text-[10px]"></i>
              <span>${statusText}</span>
            </span>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-xs text-slate-500">ថ្លៃឈ្នួល/ខែ:</span>
              <div class="text-base font-bold text-slate-900 font-mono">$${room.price} <span class="text-xs text-slate-400 font-normal">(≈ ${priceKhr.toLocaleString()} ៛)</span></div>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-500">ប្រាក់កក់:</span>
              <div class="text-xs font-mono font-semibold text-slate-700">$${room.deposit || 0}</div>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-600">
            <span class="text-slate-400">អ្នកជួលបច្ចុប្បន្ន:</span>
            <span class="font-semibold text-slate-800">${tenant ? tenant.name : '<span class="text-slate-400 font-normal italic">គ្មានអ្នកជួល</span>'}</span>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-100">
            <button onclick="window.editRoom('${room.id}')" class="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1 p-1">
              <i class="fa-solid fa-pen-to-square"></i> <span>កែប្រែ</span>
            </button>
            <div class="flex items-center gap-2">
              ${room.status === 'occupied' ? `
                <button onclick="window.quickCreateInvoice('${room.id}')" class="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs">
                  <i class="fa-solid fa-file-invoice-dollar"></i> <span>ចេញវិក្កយបត្រ</span>
                </button>
              ` : `
                <button onclick="window.assignTenantToRoom('${room.id}')" class="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs">
                  <i class="fa-solid fa-user-plus"></i> <span>ដាក់អ្នកជួល</span>
                </button>
              `}
              <button onclick="window.deleteRoom('${room.id}')" class="text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition" title="លុបបន្ទប់">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Modal Form handling
export function openRoomModal(roomId = null) {
  const modal = document.getElementById('room-modal');
  const form = document.getElementById('room-form');
  const title = document.getElementById('room-modal-title');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('room-id').value = '';

  if (roomId) {
    title.innerHTML = '<i class="fa-solid fa-pen-to-square text-blue-600"></i> <span>កែប្រែព័ត៌មានបន្ទប់</span>';
    const room = store.getRoomById(roomId);
    if (room) {
      document.getElementById('room-id').value = room.id;
      document.getElementById('room-number').value = room.roomNumber;
      document.getElementById('room-floor').value = room.floor || 1;
      document.getElementById('room-type').value = room.roomType || 'fan';
      document.getElementById('room-price').value = room.price;
      document.getElementById('room-deposit').value = room.deposit || 0;
      document.getElementById('room-status').value = room.status;
      document.getElementById('room-description').value = room.description || '';
    }
  } else {
    title.innerHTML = '<i class="fa-solid fa-door-open text-blue-600"></i> <span>បន្ថែមបន្ទប់ថ្មី</span>';
    document.getElementById('room-floor').value = 1;
    document.getElementById('room-type').value = 'fan';
    document.getElementById('room-price').value = 100;
    document.getElementById('room-deposit').value = 100;
    document.getElementById('room-status').value = 'available';
  }

  modal.classList.remove('hidden');
}

export function closeRoomModal() {
  const modal = document.getElementById('room-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleRoomFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('room-id').value;
  const roomData = {
    roomNumber: document.getElementById('room-number').value.trim(),
    floor: parseInt(document.getElementById('room-floor').value) || 1,
    roomType: document.getElementById('room-type').value,
    price: parseFloat(document.getElementById('room-price').value) || 0,
    deposit: parseFloat(document.getElementById('room-deposit').value) || 0,
    status: document.getElementById('room-status').value,
    description: document.getElementById('room-description').value.trim()
  };

  if (!roomData.roomNumber) {
    showToast('សូមបញ្ចូលលេខបន្ទប់ (Room Number)!', 'warning');
    return;
  }

  if (id) {
    store.updateRoom(id, roomData);
    showToast('បានកែប្រែព័ត៌មានបន្ទប់ជោគជ័យ!', 'success');
  } else {
    store.addRoom(roomData);
    showToast('បានបន្ថែមបន្ទប់ថ្មីជោគជ័យ!', 'success');
  }

  closeRoomModal();
  renderRooms();
  window.updateDashboardStats();
}
