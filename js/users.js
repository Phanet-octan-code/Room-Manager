// Users & Staff Management Module
import { store } from './store.js';
import { showToast } from './toast.js';

const SAMPLE_USERS = [
  { id: 'usr-1', name: 'ម្ចាស់ផ្ទះ', email: 'admin@rental.com', role: 'admin', phone: '012 345 678', createdAt: '2026-01-01' },
  { id: 'usr-2', name: 'អ្នកគ្រប់គ្រង', email: 'staff@rental.com', role: 'staff', phone: '098 765 432', createdAt: '2026-02-15' }
];

export function getUsers() {
  const users = localStorage.getItem('rental_users');
  return users ? JSON.parse(users) : SAMPLE_USERS;
}

export function saveUsers(users) {
  localStorage.setItem('rental_users', JSON.stringify(users));
  store.syncCollectionToSupabase('users', users);
}

export function renderUsers() {
  const tableBody = document.getElementById('users-table-body');
  const mobileCards = document.getElementById('users-mobile-cards');
  if (!tableBody && !mobileCards) return;

  const users = getUsers();

  if (users.length === 0) {
    const emptyHtml = `
      <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-users-slash"></i>
        </div>
        <p class="text-sm font-semibold text-slate-600">មិនមានគណនីអ្នកប្រើប្រាស់ទេ</p>
      </div>
    `;
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-400">${emptyHtml}</td></tr>`;
    if (mobileCards) mobileCards.innerHTML = emptyHtml;
    return;
  }

  // 1. Render Desktop Table Body
  if (tableBody) {
    tableBody.innerHTML = users.map((u, idx) => `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition text-sm">
        <td class="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">${idx + 1}</td>
        <td class="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2.5 whitespace-nowrap">
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shadow-inner">
            ${u.name.charAt(0)}
          </div>
          <span>${u.name}</span>
        </td>
        <td class="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
          <span class="flex items-center gap-1.5"><i class="fa-solid fa-envelope text-slate-400"></i> ${u.email}</span>
        </td>
        <td class="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
          ${u.phone ? `<span class="flex items-center gap-1.5"><i class="fa-solid fa-phone text-emerald-600"></i> ${u.phone}</span>` : '-'}
        </td>
        <td class="py-3.5 px-4 whitespace-nowrap">
          <span class="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'}">
            <i class="fa-solid ${u.role === 'admin' ? 'fa-user-shield' : 'fa-user'} text-[10px]"></i>
            ${u.role === 'admin' ? 'ម្ចាស់ប្រព័ន្ធ' : 'បុគ្គលិក'}
          </span>
        </td>
        <td class="py-3.5 px-4 text-right whitespace-nowrap">
          <button onclick="window.deleteUser('${u.id}')" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition" title="លុប">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // 2. Render Mobile Cards View (Phones)
  if (mobileCards) {
    mobileCards.innerHTML = users.map(u => `
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shadow-inner flex-shrink-0">
              ${u.name.charAt(0)}
            </div>
            <div>
              <div class="font-bold text-sm text-slate-900">${u.name}</div>
              <div class="text-xs text-slate-500 font-mono flex items-center gap-1">
                <i class="fa-solid fa-envelope text-[10px] text-slate-400"></i> ${u.email}
              </div>
            </div>
          </div>
          
          <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'}">
            <i class="fa-solid ${u.role === 'admin' ? 'fa-user-shield' : 'fa-user'} text-[10px]"></i>
            ${u.role === 'admin' ? 'Admin' : 'Staff'}
          </span>
        </div>

        ${u.phone ? `
          <div class="flex items-center justify-between text-xs pt-1 text-slate-600">
            <span class="text-slate-400">លេខទូរស័ព្ទ:</span>
            <a href="tel:${u.phone}" class="font-mono font-semibold text-emerald-600 flex items-center gap-1">
              <i class="fa-solid fa-phone text-[10px]"></i> ${u.phone}
            </a>
          </div>
        ` : ''}

        <div class="flex justify-end pt-2 border-t border-slate-100">
          <button onclick="window.deleteUser('${u.id}')" class="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1 transition">
            <i class="fa-solid fa-trash-can text-xs"></i> <span>លុបគណនី</span>
          </button>
        </div>
      </div>
    `).join('');
  }
}

export function openUserModal() {
  const modal = document.getElementById('user-modal');
  if (modal) modal.classList.remove('hidden');
}

export function closeUserModal() {
  const modal = document.getElementById('user-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleUserFormSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('new-user-name').value.trim();
  const email = document.getElementById('new-user-email').value.trim();
  const phone = document.getElementById('new-user-phone').value.trim();
  const role = document.getElementById('new-user-role').value;

  if (!name || !email) {
    showToast('សូមបញ្ចូលឈ្មោះ និងអ៊ីមែល!', 'warning');
    return;
  }

  const users = getUsers();
  const newUser = {
    id: 'usr-' + Date.now(),
    name,
    email,
    phone,
    role,
    createdAt: new Date().toISOString().split('T')[0]
  };
  users.push(newUser);

  saveUsers(users);
  store.writeDocToSupabase('users', newUser.id, newUser);
  closeUserModal();
  renderUsers();
  showToast('បានបន្ថែមគណនីថ្មីជោគជ័យ!', 'success');
}
