// Reports & Analytics Module
import { store } from './store.js';

export function renderReports() {
  const monthInput = document.getElementById('report-month-select');
  if (!monthInput) return;

  const currentMonth = monthInput.value || new Date().toISOString().substring(0, 7);
  monthInput.value = currentMonth;

  const invoices = store.getInvoices();
  const rooms = store.getRooms();
  const settings = store.getSettings();
  const exchangeRate = settings.exchangeRate || 4100;

  const monthlyInvoices = invoices.filter(i => i.month === currentMonth);

  let totalRoomRentKhr = 0;
  let totalElecKhr = 0;
  let totalWaterKhr = 0;
  let totalTrashKhr = 0;
  let totalCollectedKhr = 0;
  let totalPendingKhr = 0;
  let totalElecUsage = 0;
  let totalWaterUsage = 0;

  monthlyInvoices.forEach(i => {
    totalRoomRentKhr += (i.roomPriceKhr || 0);
    totalElecKhr += (i.electricTotal || 0);
    totalWaterKhr += (i.waterTotal || 0);
    totalTrashKhr += (i.trashFee || 0);
    totalElecUsage += (i.electricUsage || 0);
    totalWaterUsage += (i.waterUsage || 0);

    if (i.status === 'paid') {
      totalCollectedKhr += (i.totalKhr || 0);
    } else {
      totalPendingKhr += (i.totalKhr || 0);
    }
  });

  const grandTotalKhr = totalCollectedKhr + totalPendingKhr;
  const grandTotalUsd = grandTotalKhr / exchangeRate;
  const collectedUsd = totalCollectedKhr / exchangeRate;
  const pendingUsd = totalPendingKhr / exchangeRate;

  // DOM update
  document.getElementById('rep-total-income-khr').innerText = `${grandTotalKhr.toLocaleString()} ៛`;
  document.getElementById('rep-total-income-usd').innerText = `$${grandTotalUsd.toFixed(2)}`;

  document.getElementById('rep-collected-khr').innerText = `${totalCollectedKhr.toLocaleString()} ៛`;
  document.getElementById('rep-collected-usd').innerText = `$${collectedUsd.toFixed(2)}`;

  document.getElementById('rep-pending-khr').innerText = `${totalPendingKhr.toLocaleString()} ៛`;
  document.getElementById('rep-pending-usd').innerText = `$${pendingUsd.toFixed(2)}`;

  document.getElementById('rep-elec-usage').innerText = `${totalElecUsage.toLocaleString()} kWh`;
  document.getElementById('rep-elec-cost').innerText = `${totalElecKhr.toLocaleString()} ៛`;

  document.getElementById('rep-water-usage').innerText = `${totalWaterUsage.toLocaleString()} m³`;
  document.getElementById('rep-water-cost').innerText = `${totalWaterKhr.toLocaleString()} ៛`;

  document.getElementById('rep-trash-cost').innerText = `${totalTrashKhr.toLocaleString()} ៛`;
  document.getElementById('rep-room-rent-cost').innerText = `${totalRoomRentKhr.toLocaleString()} ៛`;

  // Occupancy rate calculation
  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const occupancyPercent = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;
  document.getElementById('rep-occupancy-rate').innerText = `${occupancyPercent}%`;
  document.getElementById('rep-occupancy-detail').innerText = `${occupiedCount} / ${totalRooms} បន្ទប់`;
  document.getElementById('rep-occupancy-bar').style.width = `${occupancyPercent}%`;
}

export function printReport() {
  window.print();
}
