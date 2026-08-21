/**
 * Toast Notification & Confirm Dialog System
 * Replaces native alert() and confirm() with beautiful animated UI
 */

// ── Toast Container Setup ──
function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

// Toast icon map
const TOAST_ICONS = {
  success: 'fa-solid fa-check',
  error: 'fa-solid fa-xmark',
  warning: 'fa-solid fa-exclamation',
  info: 'fa-solid fa-info'
};

const TOAST_TITLES = {
  success: 'ជោគជ័យ',
  error: 'មានបញ្ហា',
  warning: 'ព្រមានសំខាន់',
  info: 'ព័ត៌មាន'
};

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Duration in ms (default 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${TOAST_ICONS[type]}"></i>
    </div>
    <div class="toast-body">
      <div class="toast-title">${TOAST_TITLES[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="toast-progress" style="animation: progressShrink ${duration}ms linear forwards"></div>
  `;

  container.appendChild(toast);

  // Auto-remove after duration
  const timer = setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);

  // Cancel timer on manual close
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  });
}

/**
 * Show a confirm dialog (replaces native confirm())
 * @param {string} message - The confirmation message
 * @param {Object} options - Optional config { title, okText, cancelText, danger }
 * @returns {Promise<boolean>}
 */
export function showConfirm(message, options = {}) {
  const {
    title = 'បញ្ជាក់សកម្មភាព',
    okText = 'យល់ព្រម',
    cancelText = 'បោះបង់',
    danger = false
  } = options;

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-icon" style="${danger ? 'background:#fef2f2; color:#dc2626' : ''}">
          <i class="fa-solid ${danger ? 'fa-triangle-exclamation' : 'fa-question'}"></i>
        </div>
        <div class="confirm-title">${title}</div>
        <div class="confirm-message">${message}</div>
        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn-cancel" id="confirm-no">${cancelText}</button>
          <button class="confirm-btn ${danger ? 'confirm-btn-danger' : 'confirm-btn-ok'}" id="confirm-yes">${okText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.2s ease';
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    overlay.querySelector('#confirm-yes').addEventListener('click', () => close(true));
    overlay.querySelector('#confirm-no').addEventListener('click', () => close(false));

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });

    // Close on Escape key
    const onKey = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        close(false);
      }
    };
    document.addEventListener('keydown', onKey);
  });
}

// Make available globally
window.showToast = showToast;
window.showConfirm = showConfirm;
