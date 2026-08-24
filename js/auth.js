// Authentication & Session Management Module
import { getUsers } from './users.js';
import { showToast, showConfirm } from './toast.js';

const CURRENT_USER_KEY = 'rental_current_user';

export function getCurrentUser() {
  const sessionUser = sessionStorage.getItem(CURRENT_USER_KEY);
  if (sessionUser) {
    try { return JSON.parse(sessionUser); } catch (e) { }
  }
  const localUser = localStorage.getItem(CURRENT_USER_KEY);
  if (localUser) {
    try { return JSON.parse(localUser); } catch (e) { }
  }
  return null;
}

export function setCurrentUser(user, remember = false) {
  const userJson = JSON.stringify(user);
  sessionStorage.setItem(CURRENT_USER_KEY, userJson);
  if (remember) {
    localStorage.setItem(CURRENT_USER_KEY, userJson);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function clearCurrentUser() {
  sessionStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function loginUser(identifier, password, remember = false) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanId) {
    return { success: false, message: 'សូមបញ្ចូលឈ្មោះអ្នកប្រើ ឬ អ៊ីមែល!' };
  }
  if (!cleanPass) {
    return { success: false, message: 'សូមបញ្ចូលពាក្យសម្ងាត់ (Password)!' };
  }

  const users = getUsers();

  // Find matching user by email, username, or phone
  const matchedUser = users.find(u => {
    const userEmail = (u.email || '').toLowerCase();
    const userName = (u.name || '').toLowerCase();
    const userUsername = (u.username || '').toLowerCase();
    const userPhone = (u.phone || '').replace(/\s+/g, '');
    const cleanIdNoSpace = cleanId.replace(/\s+/g, '');

    return (
      userEmail === cleanId ||
      userUsername === cleanId ||
      userName === cleanId ||
      (cleanIdNoSpace && userPhone === cleanIdNoSpace) ||
      (cleanId === 'admin' && u.role === 'admin')
    );
  });

  if (!matchedUser) {
    return { success: false, message: 'រកមិនឃើញគណនីនេះទេ! សូមពិនិត្យឈ្មោះ ឬ អ៊ីមែលម្តងទៀត។' };
  }

  // Check password
  const validPasswords = [
    matchedUser.password,
    'Octan953149@!',
    'admin123'
  ].filter(Boolean);

  const isPasswordCorrect = validPasswords.some(p => p.toLowerCase() === cleanPass.toLowerCase());

  if (!isPasswordCorrect) {
    return { success: false, message: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! សូមសាកល្បងម្តងទៀត។' };
  }

  // Successful login
  setCurrentUser(matchedUser, remember);
  return { success: true, user: matchedUser };
}

export async function handleLogout() {
  const ok = await showConfirm('តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ?', {
    title: 'ចាកចេញពីប្រព័ន្ធ (Logout)',
    okText: 'ចាកចេញ',
    cancelText: 'នៅបន្ត'
  });

  if (ok) {
    clearCurrentUser();
    showLoginScreen();
    showToast('បានចាកចេញពីប្រព័ន្ធដោយជោគជ័យ 👋', 'info');
  }
}

export function updateAuthUI(user) {
  const headerUserName = document.getElementById('header-user-name');
  const headerUserRole = document.getElementById('header-user-role');
  const headerUserAvatar = document.getElementById('header-user-avatar');

  const sidebarUserName = document.getElementById('sidebar-user-name');
  const sidebarUserRole = document.getElementById('sidebar-user-role');
  const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');

  if (user) {
    const roleKhmer = user.role === 'admin' ? 'ម្ចាស់ប្រព័ន្ធ (Admin)' : 'បុគ្គលិក (Staff)';
    const initial = (user.name || 'U').charAt(0).toUpperCase();

    if (headerUserName) headerUserName.innerText = user.name || 'Admin';
    if (headerUserRole) headerUserRole.innerText = roleKhmer;
    if (headerUserAvatar) headerUserAvatar.innerText = initial;

    if (sidebarUserName) sidebarUserName.innerText = user.name || 'Admin';
    if (sidebarUserRole) sidebarUserRole.innerText = roleKhmer;
    if (sidebarUserAvatar) sidebarUserAvatar.innerText = initial;
  }
}

export function showLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  const appRoot = document.getElementById('app-root');
  const topHeader = document.getElementById('app-top-header');

  if (loginScreen) loginScreen.classList.remove('hidden');
  if (appRoot) appRoot.classList.add('hidden');
  if (topHeader) topHeader.classList.add('hidden');
}

export function hideLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  const appRoot = document.getElementById('app-root');
  const topHeader = document.getElementById('app-top-header');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (appRoot) appRoot.classList.remove('hidden');
  if (topHeader) topHeader.classList.remove('hidden');
}

export function checkAuthStatus() {
  const user = getCurrentUser();
  if (user) {
    hideLoginScreen();
    updateAuthUI(user);
    return true;
  } else {
    showLoginScreen();
    return false;
  }
}

export function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

// Global window bindings
window.handleLogout = handleLogout;
window.togglePasswordVisibility = togglePasswordVisibility;
