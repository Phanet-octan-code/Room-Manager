// Utilities (Water & Electricity) Recording Module
import { store } from './store.js';
import { showToast } from './toast.js';

export function toggleUtilityFormulas() {
  const container = document.getElementById('utility-formula-cards');
  const text = document.getElementById('toggle-formula-text');
  const icon = document.getElementById('toggle-formula-icon');
  if (!container) return;

  const isHidden = container.classList.contains('hidden');
  if (isHidden) {
    container.classList.remove('hidden');
    if (text) text.innerText = 'លាក់រូបមន្តគណនា';
    if (icon) icon.className = 'fa-solid fa-chevron-up text-slate-500';
  } else {
    container.classList.add('hidden');
    if (text) text.innerText = 'បង្ហាញរូបមន្តគណនា';
    if (icon) icon.className = 'fa-solid fa-chevron-down text-slate-500';
  }
}
window.toggleUtilityFormulas = toggleUtilityFormulas;

export function renderUtilities() {
  const tableBody = document.getElementById('utilities-table-body');
  const mobileCards = document.getElementById('utilities-mobile-cards');
  const monthInput = document.getElementById('utility-month-select');
  if (!tableBody && !mobileCards) return;

  const currentMonth = monthInput?.value || new Date().toISOString().substring(0, 7);
  if (monthInput) monthInput.value = currentMonth;

  const rooms = store.getRooms();
  const tenants = store.getTenants();
  const readings = store.getReadings();
  const settings = store.getSettings();

  // Display rates
  const elecRateEl = document.getElementById('current-electric-rate');
  const waterRateEl = document.getElementById('current-water-rate');
  if (elecRateEl) elecRateEl.innerText = `${settings.electricityRate.toLocaleString()} ៛/kWh`;
  if (waterRateEl) waterRateEl.innerText = `${settings.waterRate.toLocaleString()} ៛/m³`;

  if (rooms.length === 0) {
    const emptyHtml = `
      <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-gauge-high"></i>
        </div>
        <p class="text-sm font-semibold text-slate-600">មិនទាន់មានបន្ទប់នៅឡើយទេ</p>
        <p class="text-xs text-slate-400 mt-1">សូមបន្ថែមបន្ទប់ក្នុងមីនុយ "បន្ទប់ជួល" ជាមុនសិន</p>
      </div>
    `;
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="10" class="py-8 text-center text-slate-400">${emptyHtml}</td></tr>`;
    }
    if (mobileCards) {
      mobileCards.innerHTML = emptyHtml;
    }
    return;
  }

  // 1. Render Desktop Table Body
  if (tableBody) {
    tableBody.innerHTML = rooms.map(room => {
      const tenant = tenants.find(t => t.id === room.tenantId);
      const reading = readings.find(r => r.month === currentMonth && r.roomId === room.id) || {};
      
      const oldElec = reading.oldElectric !== undefined ? reading.oldElectric : 0;
      const newElec = reading.newElectric !== undefined ? reading.newElectric : oldElec;
      const oldWat = reading.oldWater !== undefined ? reading.oldWater : 0;
      const newWat = reading.newWater !== undefined ? reading.newWater : oldWat;

      const elecUsage = Math.max(0, newElec - oldElec);
      const elecCost = elecUsage * settings.electricityRate;

      const watUsage = Math.max(0, newWat - oldWat);
      const watCost = watUsage * settings.waterRate;

      const cleanRoomNum = (room.roomNumber || '').replace(/^room[-_]?/i, '') || room.roomNumber;
      const rowTotal = elecCost + watCost;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition text-xs sm:text-sm" data-room-id="${room.id}">
          
          <!-- Room -->
          <td class="py-3.5 px-3 font-bold text-slate-900 text-center bg-slate-50 whitespace-nowrap">
            បន្ទប់ ${cleanRoomNum}
          </td>

          <!-- Tenant -->
          <td class="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
            ${tenant ? `<span class="font-semibold text-slate-800">${tenant.name}</span>` : '<span class="text-slate-400 text-xs italic">បន្ទប់ទំនេរ</span>'}
          </td>
          
          <!-- ⚡ ELECTRICITY SECTION -->
          <td class="py-2 px-2 bg-blue-50/20 text-center whitespace-nowrap">
            <input type="number" step="any" 
                   class="w-20 px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-xs text-center elec-old focus:ring-2 focus:ring-blue-500 bg-white" 
                   value="${oldElec}" oninput="window.calcUtilityRow('${room.id}', 'table')">
          </td>
          <td class="py-2 px-2 bg-blue-50/20 text-center whitespace-nowrap">
            <input type="number" step="any" 
                   class="w-20 px-2 py-1.5 border border-blue-300 bg-blue-50/80 rounded-lg font-mono text-xs text-center font-bold text-blue-900 elec-new focus:ring-2 focus:ring-blue-500" 
                   value="${newElec}" oninput="window.calcUtilityRow('${room.id}', 'table')">
          </td>
          <td class="py-3.5 px-3 font-mono text-xs text-center bg-blue-50/30 text-slate-800 whitespace-nowrap">
            <div class="font-bold text-blue-900"><span class="elec-usage text-sm">${elecUsage}</span> kWh</div>
            <div class="text-[11px] text-slate-500 elec-cost font-semibold">${elecCost.toLocaleString()} ៛</div>
          </td>

          <!-- 💧 WATER SECTION -->
          <td class="py-2 px-2 bg-cyan-50/20 text-center whitespace-nowrap">
            <input type="number" step="any" 
                   class="w-20 px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-xs text-center water-old focus:ring-2 focus:ring-cyan-500 bg-white" 
                   value="${oldWat}" oninput="window.calcUtilityRow('${room.id}', 'table')">
          </td>
          <td class="py-2 px-2 bg-cyan-50/20 text-center whitespace-nowrap">
            <input type="number" step="any" 
                   class="w-20 px-2 py-1.5 border border-cyan-300 bg-cyan-50/80 rounded-lg font-mono text-xs text-center font-bold text-cyan-900 water-new focus:ring-2 focus:ring-cyan-500" 
                   value="${newWat}" oninput="window.calcUtilityRow('${room.id}', 'table')">
          </td>
          <td class="py-3.5 px-3 font-mono text-xs text-center bg-cyan-50/30 text-slate-800 whitespace-nowrap">
            <div class="font-bold text-cyan-900"><span class="water-usage text-sm">${watUsage}</span> m³</div>
            <div class="text-[11px] text-slate-500 water-cost font-semibold">${watCost.toLocaleString()} ៛</div>
          </td>

          <!-- Subtotal (Elec + Water) -->
          <td class="py-3.5 px-3 text-right font-mono font-bold text-slate-900 row-subtotal whitespace-nowrap">
            ${rowTotal.toLocaleString()} ៛
          </td>

          <!-- Action -->
          <td class="py-3.5 px-3 text-center whitespace-nowrap">
            <button onclick="window.generateInvoiceFromRow('${room.id}')" 
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 mx-auto transition shadow-xs"
                    ${!tenant ? 'disabled style="opacity:0.4; cursor:not-allowed;" title="បន្ទប់ទំនេរ"' : ''}>
              <i class="fa-solid fa-file-invoice-dollar"></i> <span>ចេញប័ណ្ណ</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile Cards View (Phones)
  if (mobileCards) {
    mobileCards.innerHTML = rooms.map(room => {
      const tenant = tenants.find(t => t.id === room.tenantId);
      const reading = readings.find(r => r.month === currentMonth && r.roomId === room.id) || {};
      const cleanRoomNum = (room.roomNumber || '').replace(/^room[-_]?/i, '') || room.roomNumber;
      
      const oldElec = reading.oldElectric !== undefined ? reading.oldElectric : 0;
      const newElec = reading.newElectric !== undefined ? reading.newElectric : oldElec;
      const oldWat = reading.oldWater !== undefined ? reading.oldWater : 0;
      const newWat = reading.newWater !== undefined ? reading.newWater : oldWat;

      const elecUsage = Math.max(0, newElec - oldElec);
      const elecCost = elecUsage * settings.electricityRate;

      const watUsage = Math.max(0, newWat - oldWat);
      const watCost = watUsage * settings.waterRate;

      const rowTotal = elecCost + watCost;

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5" data-mobile-room-id="${room.id}">
          
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-xl font-bold text-sm border border-blue-200">
                បន្ទប់ ${cleanRoomNum}
              </span>
              <span class="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <i class="fa-solid fa-user text-[10px] text-slate-400"></i> ${tenant ? tenant.name : '<span class="text-slate-400 font-normal italic">បន្ទប់ទំនេរ</span>'}
              </span>
            </div>
            <span class="text-xs font-mono font-extrabold text-slate-800 row-subtotal-mobile">
              ${rowTotal.toLocaleString()} ៛
            </span>
          </div>

          <!-- Electricity Section (Blue) -->
          <div class="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-blue-900 flex items-center gap-1.5">
                <i class="fa-solid fa-bolt text-amber-500"></i> ថ្លៃភ្លើង
              </span>
              <span class="font-mono font-bold text-blue-900 text-xs">
                <span class="elec-usage-mobile">${elecUsage}</span> kWh = <span class="elec-cost-mobile">${elecCost.toLocaleString()}</span> ៛
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] text-slate-500 block mb-0.5">អំណានចាស់</label>
                <input type="number" step="any" 
                       class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs text-center elec-old-mobile bg-white" 
                       value="${oldElec}" oninput="window.calcUtilityRow('${room.id}', 'mobile')">
              </div>
              <div>
                <label class="text-[10px] text-slate-500 block mb-0.5">អំណានថ្មី</label>
                <input type="number" step="any" 
                       class="w-full px-2.5 py-1.5 border border-blue-300 bg-white rounded-lg font-mono text-xs text-center font-bold text-blue-900 elec-new-mobile focus:ring-2 focus:ring-blue-500" 
                       value="${newElec}" oninput="window.calcUtilityRow('${room.id}', 'mobile')">
              </div>
            </div>
          </div>

          <!-- Water Section (Cyan) -->
          <div class="bg-cyan-50/60 p-3 rounded-xl border border-cyan-100 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-cyan-900 flex items-center gap-1.5">
                <i class="fa-solid fa-droplet text-cyan-600"></i> ថ្លៃទឹក
              </span>
              <span class="font-mono font-bold text-cyan-900 text-xs">
                <span class="water-usage-mobile">${watUsage}</span> m³ = <span class="water-cost-mobile">${watCost.toLocaleString()}</span> ៛
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] text-slate-500 block mb-0.5">អំណានចាស់</label>
                <input type="number" step="any" 
                       class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs text-center water-old-mobile bg-white" 
                       value="${oldWat}" oninput="window.calcUtilityRow('${room.id}', 'mobile')">
              </div>
              <div>
                <label class="text-[10px] text-slate-500 block mb-0.5">អំណានថ្មី</label>
                <input type="number" step="any" 
                       class="w-full px-2.5 py-1.5 border border-cyan-300 bg-white rounded-lg font-mono text-xs text-center font-bold text-cyan-900 water-new-mobile focus:ring-2 focus:ring-cyan-500" 
                       value="${newWat}" oninput="window.calcUtilityRow('${room.id}', 'mobile')">
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="flex justify-end pt-1">
            <button onclick="window.generateInvoiceFromRow('${room.id}')" 
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs active:scale-98"
                    ${!tenant ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
              <i class="fa-solid fa-file-invoice-dollar"></i> <span>ចេញវិក្កយបត្រ</span>
            </button>
          </div>

        </div>
      `;
    }).join('');
  }
}

// Calculate individual row dynamics live (synchronizes desktop and mobile)
export function calculateRow(roomId, source = 'table') {
  const settings = store.getSettings();
  const tableRow = document.querySelector(`tr[data-room-id="${roomId}"]`);
  const mobileCard = document.querySelector(`div[data-mobile-room-id="${roomId}"]`);

  let oldElec = 0, newElec = 0, oldWat = 0, newWat = 0;

  if (source === 'mobile' && mobileCard) {
    oldElec = parseFloat(mobileCard.querySelector('.elec-old-mobile')?.value) || 0;
    newElec = parseFloat(mobileCard.querySelector('.elec-new-mobile')?.value) || 0;
    oldWat = parseFloat(mobileCard.querySelector('.water-old-mobile')?.value) || 0;
    newWat = parseFloat(mobileCard.querySelector('.water-new-mobile')?.value) || 0;

    // Sync to table if exists
    if (tableRow) {
      const elOld = tableRow.querySelector('.elec-old'); if (elOld) elOld.value = oldElec;
      const elNew = tableRow.querySelector('.elec-new'); if (elNew) elNew.value = newElec;
      const wtOld = tableRow.querySelector('.water-old'); if (wtOld) wtOld.value = oldWat;
      const wtNew = tableRow.querySelector('.water-new'); if (wtNew) wtNew.value = newWat;
    }
  } else if (tableRow) {
    oldElec = parseFloat(tableRow.querySelector('.elec-old')?.value) || 0;
    newElec = parseFloat(tableRow.querySelector('.elec-new')?.value) || 0;
    oldWat = parseFloat(tableRow.querySelector('.water-old')?.value) || 0;
    newWat = parseFloat(tableRow.querySelector('.water-new')?.value) || 0;

    // Sync to mobile card if exists
    if (mobileCard) {
      const elOld = mobileCard.querySelector('.elec-old-mobile'); if (elOld) elOld.value = oldElec;
      const elNew = mobileCard.querySelector('.elec-new-mobile'); if (elNew) elNew.value = newElec;
      const wtOld = mobileCard.querySelector('.water-old-mobile'); if (wtOld) wtOld.value = oldWat;
      const wtNew = mobileCard.querySelector('.water-new-mobile'); if (wtNew) wtNew.value = newWat;
    }
  }

  const elecUsage = Math.max(0, newElec - oldElec);
  const elecCost = elecUsage * settings.electricityRate;

  const watUsage = Math.max(0, newWat - oldWat);
  const watCost = watUsage * settings.waterRate;

  const subtotal = elecCost + watCost;

  // Update Table Row UI
  if (tableRow) {
    const elU = tableRow.querySelector('.elec-usage'); if (elU) elU.innerText = elecUsage;
    const elC = tableRow.querySelector('.elec-cost'); if (elC) elC.innerText = `${elecCost.toLocaleString()} ៛`;
    const wtU = tableRow.querySelector('.water-usage'); if (wtU) wtU.innerText = watUsage;
    const wtC = tableRow.querySelector('.water-cost'); if (wtC) wtC.innerText = `${watCost.toLocaleString()} ៛`;
    const sub = tableRow.querySelector('.row-subtotal'); if (sub) sub.innerText = `${subtotal.toLocaleString()} ៛`;
  }

  // Update Mobile Card UI
  if (mobileCard) {
    const elUM = mobileCard.querySelector('.elec-usage-mobile'); if (elUM) elUM.innerText = elecUsage;
    const elCM = mobileCard.querySelector('.elec-cost-mobile'); if (elCM) elCM.innerText = elecCost.toLocaleString();
    const wtUM = mobileCard.querySelector('.water-usage-mobile'); if (wtUM) wtUM.innerText = watUsage;
    const wtCM = mobileCard.querySelector('.water-cost-mobile'); if (wtCM) wtCM.innerText = watCost.toLocaleString();
    const subM = mobileCard.querySelector('.row-subtotal-mobile'); if (subM) subM.innerText = `${subtotal.toLocaleString()} ៛`;
  }
}
window.calcUtilityRow = calculateRow;

// Quick generate invoice from utility row button
window.generateInvoiceFromRow = (roomId) => {
  if (window.switchTab) window.switchTab('invoices');
  if (window.openCreateInvoiceModal) window.openCreateInvoiceModal(roomId);
};

// Bulk Save all entered utility readings
export function saveAllUtilities() {
  const monthInput = document.getElementById('utility-month-select');
  const month = monthInput ? monthInput.value : new Date().toISOString().substring(0, 7);

  const tableRows = document.querySelectorAll('tr[data-room-id]');
  const mobileCards = document.querySelectorAll('div[data-mobile-room-id]');

  const rooms = store.getRooms();

  rooms.forEach(room => {
    let oldElectric = 0, newElectric = 0, oldWater = 0, newWater = 0;

    const row = document.querySelector(`tr[data-room-id="${room.id}"]`);
    const card = document.querySelector(`div[data-mobile-room-id="${room.id}"]`);

    if (card && window.innerWidth < 768) {
      oldElectric = parseFloat(card.querySelector('.elec-old-mobile')?.value) || 0;
      newElectric = parseFloat(card.querySelector('.elec-new-mobile')?.value) || 0;
      oldWater = parseFloat(card.querySelector('.water-old-mobile')?.value) || 0;
      newWater = parseFloat(card.querySelector('.water-new-mobile')?.value) || 0;
    } else if (row) {
      oldElectric = parseFloat(row.querySelector('.elec-old')?.value) || 0;
      newElectric = parseFloat(row.querySelector('.elec-new')?.value) || 0;
      oldWater = parseFloat(row.querySelector('.water-old')?.value) || 0;
      newWater = parseFloat(row.querySelector('.water-new')?.value) || 0;
    }

    store.saveReading(month, room.id, {
      oldElectric,
      newElectric,
      oldWater,
      newWater,
      updatedAt: new Date().toISOString()
    });
  });

  showToast('បានរក្សាទុកលេខកុងទ័រទឹក-ភ្លើងដោយជោគជ័យ!', 'success');
}
