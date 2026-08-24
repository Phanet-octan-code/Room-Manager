// Users & Staff Management Module
import { store } from './store.js';
import { showToast, showConfirm } from './toast.js';

const SAMPLE_USERS = [
  { id: 'usr-1', name: 'ម្ចាស់ផ្ទះ', email: 'phanet@gmail.com', username: 'admin', role: 'admin', phone: '012 345 678', password: 'Octan953149@!', createdAt: '2026-01-01' }
];

export function getUsers() {
  const users = localStorage.getItem('rental_users');
  if (!users) {
    localStorage.setItem('rental_users', JSON.stringify(SAMPLE_USERS));
    return SAMPLE_USERS;
  }
  try {
    let parsed = JSON.parse(users);
    // Remove old demo staff account if present
    parsed = parsed.filter(u => u.id !== 'usr-2' && u.email !== 'staff@rental.com');
    if (parsed.length === 0) {
      parsed = SAMPLE_USERS;
    }
    localStorage.setItem('rental_users', JSON.stringify(parsed));
    return parsed;
  } catch (e) {
    return SAMPLE_USERS;
  }
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
        <td class="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
          <button onclick="window.openChangePasswordModal('${u.id}')" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200 transition inline-flex items-center gap-1" title="ប្តូរពាក្យសម្ងាត់">
            <i class="fa-solid fa-key text-[10px]"></i> <span>ប្តូរលេខសម្ងាត់</span>
          </button>
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

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="window.openChangePasswordModal('${u.id}')" class="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-semibold flex items-center gap-1 transition border border-amber-200">
            <i class="fa-solid fa-key text-xs"></i> <span>ប្តូរលេខសម្ងាត់</span>
          </button>
          <button onclick="window.deleteUser('${u.id}')" class="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1 transition">
            <i class="fa-solid fa-trash-can text-xs"></i> <span>លុប</span>
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
  const password = document.getElementById('new-user-password')?.value?.trim() || (role === 'admin' ? 'admin123' : 'staff123');

  if (!name || !email) {
    showToast('សូមបញ្ចូលឈ្មោះ និងអ៊ីមែល!', 'warning');
    return;
  }

  const users = getUsers();
  const username = email.split('@')[0] || name.toLowerCase().replace(/\s+/g, '');
  const newUser = {
    id: 'usr-' + Date.now(),
    name,
    email,
    username,
    phone,
    role,
    password,
    createdAt: new Date().toISOString().split('T')[0]
  };
  users.push(newUser);

  saveUsers(users);
  store.writeDocToSupabase('users', newUser.id, newUser);
  closeUserModal();
  renderUsers();
  showToast('បានបន្ថែមគណនីថ្មីជោគជ័យ!', 'success');
}

export function openChangePasswordModal(userId) {
  const modal = document.getElementById('change-password-modal');
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!modal || !user) return;

  const idInput = document.getElementById('change-pass-user-id');
  const nameEl = document.getElementById('change-pass-user-name');
  const emailEl = document.getElementById('change-pass-user-email');
  const newPassInput = document.getElementById('change-pass-new-password');
  const confirmPassInput = document.getElementById('change-pass-confirm-password');

  if (idInput) idInput.value = user.id;
  if (nameEl) nameEl.innerText = user.name;
  if (emailEl) emailEl.innerText = `${user.email} (${user.role === 'admin' ? 'ម្ចាស់ប្រព័ន្ធ' : 'បុគ្គលិក'})`;
  if (newPassInput) newPassInput.value = '';
  if (confirmPassInput) confirmPassInput.value = '';

  modal.classList.remove('hidden');
}

export function closeChangePasswordModal() {
  const modal = document.getElementById('change-password-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleChangePasswordSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('change-pass-user-id')?.value;
  const newPass = document.getElementById('change-pass-new-password')?.value?.trim();
  const confirmPass = document.getElementById('change-pass-confirm-password')?.value?.trim();

  if (!newPass) {
    showToast('សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី!', 'warning');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('ការបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ!', 'error');
    return;
  }

  const users = getUsers();
  const userIdx = users.findIndex(u => u.id === userId);
  if (userIdx === -1) {
    showToast('រកមិនឃើញគណនីនេះទេ!', 'error');
    return;
  }

  users[userIdx].password = newPass;
  saveUsers(users);
  store.writeDocToSupabase('users', users[userIdx].id, users[userIdx]);
  
  // If current logged-in user password changed, update session
  const currentSession = sessionStorage.getItem('rental_current_user') || localStorage.getItem('rental_current_user');
  if (currentSession) {
    try {
      const current = JSON.parse(currentSession);
      if (current.id === userId) {
        current.password = newPass;
        sessionStorage.setItem('rental_current_user', JSON.stringify(current));
        if (localStorage.getItem('rental_current_user')) {
          localStorage.setItem('rental_current_user', JSON.stringify(current));
        }
      }
    } catch(e) {}
  }

  closeChangePasswordModal();
  renderUsers();
  showToast(`បានប្តូរពាក្យសម្ងាត់សម្រាប់ ${users[userIdx].name} ជោគជ័យ ✓`, 'success');
}

export async function deleteUser(id) {
  const users = getUsers();
  const user = users.find(u => u.id === id);
  if (!user) return;

  if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
    showToast('មិនអាចលុប Admin ចុងក្រោយបានទេ!', 'warning');
    return;
  }

  const ok = await showConfirm(`តើអ្នកពិតជាចង់លុបគណនី ${user.name} (${user.email}) មែនទេ?`, {
    title: 'លុបគណនី',
    danger: true,
    okText: 'លុប'
  });

  if (ok) {
    const updatedUsers = users.filter(u => u.id !== id);
    saveUsers(updatedUsers);
    store.deleteDocFromSupabase('users', id);
    renderUsers();
    showToast('បានលុបគណនីរួចរាល់', 'success');
  }
}

// Global window bindings
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.deleteUser = deleteUser;
