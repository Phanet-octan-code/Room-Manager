// Payments Tracking Module
import { store } from './store.js';

export function renderPayments() {
  const tableBody = document.getElementById('payments-table-body');
  const mobileCards = document.getElementById('payments-mobile-cards');
  if (!tableBody && !mobileCards) return;

  const invoices = store.getInvoices();
  const settings = store.getSettings();
  const paidInvoices = invoices.filter(i => i.status === 'paid' || i.status === 'partial');

  const searchQuery = document.getElementById('payment-search')?.value?.toLowerCase() || '';

  const filteredPayments = paidInvoices.filter(p => {
    const matchSearch = p.invoiceNumber.toLowerCase().includes(searchQuery) ||
                        p.roomNumber.toLowerCase().includes(searchQuery) ||
                        (p.tenantName && p.tenantName.toLowerCase().includes(searchQuery));
    return matchSearch;
  });

  // Summary stats
  let totalPaidKhr = 0;
  paidInvoices.forEach(p => totalPaidKhr += (p.paidAmount || p.totalKhr || 0));
  const totalPaidUsd = totalPaidKhr / (settings.exchangeRate || 4000);

  const totalPaidKhrEl = document.getElementById('payments-total-khr');
  const totalPaidUsdEl = document.getElementById('payments-total-usd');
  const totalPaidCountEl = document.getElementById('payments-total-count');

  if (totalPaidKhrEl) totalPaidKhrEl.innerText = `${totalPaidKhr.toLocaleString()} ៛`;
  if (totalPaidUsdEl) totalPaidUsdEl.innerText = `$${totalPaidUsd.toFixed(2)}`;
  if (totalPaidCountEl) totalPaidCountEl.innerText = paidInvoices.length;

  if (filteredPayments.length === 0) {
    const emptyHtml = `
      <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-money-bill-wave"></i>
        </div>
        <p class="text-sm font-semibold text-slate-600">មិនទាន់មានទិន្នន័យការបង់ប្រាក់នៅឡើយទេ</p>
        <p class="text-xs text-slate-400 mt-1">នៅពេលអ្នកប្តូរស្ថានភាពវិក្កយបត្រទៅជា "បានបង់រួច" ទិន្នន័យនឹងបង្ហាញនៅទីនេះ</p>
      </div>
    `;
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">${emptyHtml}</td></tr>`;
    }
    if (mobileCards) {
      mobileCards.innerHTML = emptyHtml;
    }
    return;
  }

  // 1. Render Desktop Table Body
  if (tableBody) {
    tableBody.innerHTML = filteredPayments.map((p, idx) => {
      const paidAmount = p.paidAmount || p.totalKhr || 0;
      const paidUsd = paidAmount / (settings.exchangeRate || 4000);
      const paidDate = p.paidDate ? new Date(p.paidDate).toLocaleDateString('km-KH') : 'ថ្ងៃនេះ';

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition text-sm">
          <td class="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">${idx + 1}</td>
          <td class="py-3.5 px-4 font-mono font-semibold text-blue-900 whitespace-nowrap">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-receipt text-blue-500"></i> ${p.invoiceNumber}</span>
          </td>
          <td class="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
            <span class="px-2.5 py-1 bg-slate-100 rounded-lg text-xs">បន្ទប់ ${p.roomNumber}</span>
          </td>
          <td class="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">${p.tenantName || '-'}</td>
          <td class="py-3.5 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">${paidDate}</td>
          <td class="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
            ${paidAmount.toLocaleString()} ៛ <span class="text-xs text-slate-400 font-normal">($${paidUsd.toFixed(2)})</span>
          </td>
          <td class="py-3.5 px-4 text-right whitespace-nowrap">
            <button onclick="window.viewInvoiceModal('${p.id}')" class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition">
              <i class="fa-solid fa-receipt"></i> <span>បង្កាន់ដៃ</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile Cards View (Phones)
  if (mobileCards) {
    mobileCards.innerHTML = filteredPayments.map(p => {
      const paidAmount = p.paidAmount || p.totalKhr || 0;
      const paidUsd = paidAmount / (settings.exchangeRate || 4000);
      const paidDate = p.paidDate ? new Date(p.paidDate).toLocaleDateString('km-KH') : 'ថ្ងៃនេះ';

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                <i class="fa-solid fa-check"></i>
              </div>
              <div>
                <span class="font-mono font-bold text-xs text-slate-800 block leading-tight">${p.invoiceNumber}</span>
                <span class="text-[10px] text-slate-400 font-mono">${paidDate}</span>
              </div>
            </div>
            
            <span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold font-mono border border-blue-200">
              បន្ទប់ ${p.roomNumber}
            </span>
          </div>

          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span class="text-[10px] text-slate-400 block">អ្នកជួល:</span>
              <span class="font-bold text-slate-800 flex items-center gap-1">
                <i class="fa-solid fa-user text-[10px] text-slate-400"></i> ${p.tenantName || 'គ្មានឈ្មោះ'}
              </span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block">ទឹកប្រាក់បានបង់:</span>
              <span class="text-base font-extrabold text-emerald-700 font-mono block leading-none">${paidAmount.toLocaleString()} ៛</span>
              <span class="text-[10px] text-slate-500 font-mono">≈ $${paidUsd.toFixed(2)}</span>
            </div>
          </div>

          <div class="flex justify-end pt-1">
            <button onclick="window.viewInvoiceModal('${p.id}')" class="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-blue-200 transition">
              <i class="fa-solid fa-receipt text-xs"></i> <span>មើលបង្កាន់ដៃទទួលប្រាក់</span>
            </button>
          </div>

        </div>
      `;
    }).join('');
  }
}
