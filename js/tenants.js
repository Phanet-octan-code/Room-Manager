// Tenant Management Module (Matching User Specification)
import { store } from './store.js';
import { showToast } from './toast.js';

export function renderTenants() {
  const tableBody = document.getElementById('tenants-table-body');
  const mobileCards = document.getElementById('tenants-mobile-cards');
  if (!tableBody && !mobileCards) return;

  const tenants = store.getTenants();
  const rooms = store.getRooms();
  
  const searchQuery = document.getElementById('tenant-search')?.value?.toLowerCase() || '';
  const statusFilter = document.getElementById('tenant-status-filter')?.value || 'all';
  const genderFilter = document.getElementById('tenant-gender-filter')?.value || 'all';

  const filteredTenants = tenants.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery) ||
                        t.phone.includes(searchQuery) ||
                        (t.idCard && t.idCard.includes(searchQuery)) ||
                        (t.address && t.address.toLowerCase().includes(searchQuery));
    const matchStatus = statusFilter === 'all' || (t.status || 'active') === statusFilter;
    const matchGender = genderFilter === 'all' || (t.gender || 'male') === genderFilter;
    return matchSearch && matchStatus && matchGender;
  });

  // Empty state handling
  if (filteredTenants.length === 0) {
    const emptyHtml = `
      <div class="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-users-slash"></i>
        </div>
        <p class="text-sm font-semibold text-slate-600">មិនមានទិន្នន័យអ្នកជួលត្រូវបង្ហាញទេ</p>
        <p class="text-xs text-slate-400 mt-1">សូមសាកល្បងផ្លាស់ប្តូរការស្វែងរក ឬបន្ថែមអ្នកជួលថ្មី</p>
      </div>
    `;
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="11" class="py-8 text-center text-slate-400">${emptyHtml}</td></tr>`;
    }
    if (mobileCards) {
      mobileCards.innerHTML = emptyHtml;
    }
    return;
  }

  // 1. Render Desktop Table Body
  if (tableBody) {
    tableBody.innerHTML = filteredTenants.map((tenant, index) => {
      const room = rooms.find(r => r.id === tenant.roomId);
      const cleanRoomNum = room ? ((room.roomNumber || '').replace(/^room[-_]?/i, '') || room.roomNumber) : '';
      const roomBadge = room 
        ? `<span class="whitespace-nowrap px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 border border-blue-200"><i class="fa-solid fa-door-closed text-[10px] text-blue-500"></i> បន្ទប់ ${cleanRoomNum}</span>`
        : `<span class="whitespace-nowrap px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-xs font-normal border border-slate-200/60 inline-block italic">គ្មានបន្ទប់</span>`;

      const genderBadge = tenant.gender === 'female' 
        ? `<span class="whitespace-nowrap px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"><i class="fa-solid fa-venus text-[10px] text-blue-500"></i> ស្រី</span>`
        : `<span class="whitespace-nowrap px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"><i class="fa-solid fa-mars text-[10px] text-blue-500"></i> ប្រុស</span>`;

      const statusBadge = (tenant.status || 'active') === 'active'
        ? `<span class="whitespace-nowrap px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ស្នាក់នៅ</span>`
        : `<span class="whitespace-nowrap px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> ចាកចេញ</span>`;

      return `
        <tr onclick="window.viewTenantDetails('${tenant.id}')" class="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer transition text-sm group" title="ចុចដើម្បីមើលព័ត៌មានលម្អិតអ្នកជួល">
          <td class="py-3.5 px-3 text-slate-400 text-xs text-center whitespace-nowrap">${index + 1}</td>
          
          <!-- Photo / Avatar -->
          <td class="py-3.5 px-3 text-center whitespace-nowrap">
            ${tenant.photoUrl ? `
              <img src="${tenant.photoUrl}" onclick="event.stopPropagation(); window.viewTenantPhoto('${tenant.photoUrl}', '${tenant.name}')" 
                   class="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer hover:scale-105 transition shadow-2xs mx-auto" 
                   title="ចុចដើម្បីមើលរូបភាពធំ">
            ` : `
              <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition flex items-center justify-center font-bold text-xs border border-blue-200 mx-auto">
                ${tenant.name.charAt(0)}
              </div>
            `}
          </td>

          <!-- Name & ID -->
          <td class="py-3.5 px-3 whitespace-nowrap">
            <div class="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition flex items-center gap-1.5">
              <span>${tenant.name}</span>
              <i class="fa-solid fa-circle-info text-[11px] text-blue-500 opacity-0 group-hover:opacity-100 transition"></i>
            </div>
            <div class="text-[11px] text-slate-400 font-mono">ID: ${tenant.id}</div>
          </td>

          <!-- Gender -->
          <td class="py-3.5 px-3 whitespace-nowrap">${genderBadge}</td>

          <!-- Phone (Green) -->
          <td class="py-3.5 px-3 font-mono text-xs text-slate-700 whitespace-nowrap">
            <a href="tel:${tenant.phone}" onclick="event.stopPropagation()" class="text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1.5" title="ចុចដើម្បីខល">
              <i class="fa-solid fa-phone text-xs text-emerald-600"></i>
              ${tenant.phone}
            </a>
          </td>

          <!-- ID Card (Blue) -->
          <td class="py-3.5 px-3 text-slate-700 font-mono text-xs whitespace-nowrap">
            <div class="flex items-center gap-1.5">
              <span>${tenant.idCard || '-'}</span>
              ${tenant.idCardPhotoUrl ? `
                <button type="button" onclick="event.stopPropagation(); window.viewTenantPhoto('${tenant.idCardPhotoUrl}', '${tenant.name} (អត្តសញ្ញាណប័ណ្ណ)')" 
                        class="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition border border-blue-200" 
                        title="ចុចមើលរូបថតអត្តសញ្ញាណប័ណ្ណ">
                  <i class="fa-solid fa-id-card text-[11px]"></i>
                </button>
              ` : ''}
            </div>
          </td>

          <!-- Address -->
          <td class="py-3.5 px-3 text-slate-600 text-xs max-w-[180px] truncate" title="${tenant.address || '-'}">
            ${tenant.address || '-'}
          </td>

          <!-- Room (Blue) -->
          <td class="py-3.5 px-3 whitespace-nowrap">${roomBadge}</td>

          <!-- Start Date -->
          <td class="py-3.5 px-3 text-slate-600 text-xs font-mono whitespace-nowrap">${tenant.startDate || '-'}</td>

          <!-- Status (Green/Red) -->
          <td class="py-3.5 px-3 whitespace-nowrap">${statusBadge}</td>

          <!-- Action Buttons (Blue View/Edit, Red Delete) -->
          <td class="py-3.5 px-3 text-right space-x-1.5 space-x-reverse whitespace-nowrap">
            <button onclick="event.stopPropagation(); window.viewTenantDetails('${tenant.id}')" class="text-blue-600 hover:text-blue-800 p-1.5 font-medium rounded-lg hover:bg-blue-50 transition" title="មើលព័ត៌មានលម្អិតអ្នកជួល">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button onclick="event.stopPropagation(); window.editTenant('${tenant.id}')" class="text-blue-600 hover:text-blue-800 p-1.5 font-medium rounded-lg hover:bg-blue-50 transition" title="កែប្រែ">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="event.stopPropagation(); window.deleteTenant('${tenant.id}')" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition" title="លុប">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Render Mobile Cards View (Phones)
  if (mobileCards) {
    mobileCards.innerHTML = filteredTenants.map(tenant => {
      const room = rooms.find(r => r.id === tenant.roomId);
      const isOccupied = (tenant.status || 'active') === 'active';

      return `
        <div onclick="window.viewTenantDetails('${tenant.id}')" class="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 cursor-pointer hover:border-blue-300 transition">
          
          <!-- Card Header: Avatar + Name + Status -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="relative flex-shrink-0">
                ${tenant.photoUrl ? `
                  <img src="${tenant.photoUrl}" onclick="event.stopPropagation(); window.viewTenantPhoto('${tenant.photoUrl}', '${tenant.name}')" 
                       class="w-11 h-11 rounded-full object-cover border border-slate-200 cursor-pointer shadow-2xs" title="ចុចមើលរូបធំ">
                ` : `
                  <div class="w-11 h-11 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200 shadow-2xs">
                    ${tenant.name.charAt(0)}
                  </div>
                `}
              </div>
              <div class="min-w-0">
                <div class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <span class="truncate">${tenant.name}</span>
                  <i class="fa-solid fa-chevron-right text-[10px] text-blue-500"></i>
                </div>
                <div class="text-[11px] text-slate-400 font-mono">ID: ${tenant.id}</div>
              </div>
            </div>
            
            <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 flex-shrink-0 ${isOccupied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}">
              <span class="w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
              <span class="text-[11px]">${isOccupied ? 'ស្នាក់នៅ' : 'ចាកចេញ'}</span>
            </span>
          </div>

          <!-- Room & Phone Quick Info (Blue & Green) -->
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>
              <span class="text-slate-400 block text-[10px]">បន្ទប់ស្នាក់នៅ:</span>
              <span class="font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                <i class="fa-solid fa-door-closed text-blue-500"></i> ${room ? `បន្ទប់ ${room.roomNumber}` : 'គ្មានបន្ទប់'}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">លេខទូរស័ព្ទ:</span>
              <a href="tel:${tenant.phone}" onclick="event.stopPropagation()" class="font-bold text-emerald-700 hover:underline flex items-center gap-1 mt-0.5 font-mono" title="ខលទូរស័ព្ទ">
                <i class="fa-solid fa-phone text-emerald-600"></i> ${tenant.phone}
              </a>
            </div>
          </div>

          <!-- Other Details -->
          <div class="text-xs text-slate-600 space-y-1.5 pt-1">
            ${(tenant.idCard || tenant.idCardPhotoUrl) ? `
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 flex items-center gap-1"><i class="fa-solid fa-address-card text-blue-600"></i> អត្តសញ្ញាណប័ណ្ណ:</span>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-medium text-slate-700">${tenant.idCard || '-'}</span>
                  ${tenant.idCardPhotoUrl ? `
                    <button type="button" onclick="event.stopPropagation(); window.viewTenantPhoto('${tenant.idCardPhotoUrl}', '${tenant.name} (អត្តសញ្ញាណប័ណ្ណ)')" 
                            class="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-sans font-semibold text-[10px] flex items-center gap-1 border border-blue-200">
                      <i class="fa-solid fa-id-card text-[10px]"></i> មើលរូប
                    </button>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            ${tenant.address ? `
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 flex items-center gap-1"><i class="fa-solid fa-location-dot text-blue-600"></i> អាសយដ្ឋាន:</span>
                <span class="text-slate-700 max-w-[180px] truncate text-right">${tenant.address}</span>
              </div>
            ` : ''}
            ${tenant.startDate ? `
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 flex items-center gap-1"><i class="fa-solid fa-calendar-days text-blue-600"></i> ថ្ងៃចូលនៅ:</span>
                <span class="font-mono text-slate-700">${tenant.startDate}</span>
              </div>
            ` : ''}
          </div>

          <!-- Card Actions (Blue View/Edit, Green Call, Red Delete) -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs" onclick="event.stopPropagation()">
            <div class="flex items-center gap-1.5">
              <button onclick="window.viewTenantDetails('${tenant.id}')" class="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold flex items-center gap-1.5 border border-blue-200 transition">
                <i class="fa-solid fa-eye text-xs"></i> <span>មើលព័ត៌មាន</span>
              </button>
              <a href="tel:${tenant.phone}" class="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-semibold flex items-center gap-1 border border-emerald-200 transition" title="ខលទូរស័ព្ទ">
                <i class="fa-solid fa-phone text-xs text-emerald-600"></i>
              </a>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="window.editTenant('${tenant.id}')" class="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold flex items-center gap-1 border border-blue-200 transition" title="កែប្រែ">
                <i class="fa-solid fa-pen-to-square text-xs"></i>
              </button>
              <button onclick="window.deleteTenant('${tenant.id}')" class="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition" title="លុប">
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>

        </div>
      `;
    }).join('');
  }
}

export function populateTenantRoomSelect(selectedRoomId = '') {
  const select = document.getElementById('tenant-room-id');
  if (!select) return;

  const rooms = store.getRooms();
  let options = '<option value="">-- ជ្រើសរើសបន្ទប់ --</option>';

  rooms.forEach(room => {
    const isCurrent = room.id === selectedRoomId;
    const isAvailable = room.status === 'available';
    const cleanRoomNum = (room.roomNumber || '').replace(/^room[-_]?/i, '') || room.roomNumber;
    if (isAvailable || isCurrent) {
      options += `<option value="${room.id}" ${isCurrent ? 'selected' : ''}>បន្ទប់ ${cleanRoomNum} (ជាន់ទី ${room.floor || 1} - $${room.price}/ខែ)</option>`;
    }
  });

  select.innerHTML = options;
}

let currentCameraStream = null;
let currentFacingMode = 'environment';
let currentCapturedPhotoData = '';
let currentCameraTarget = 'profile'; // 'profile' or 'idcard'

export async function triggerCameraCapture(target = 'profile') {
  currentCameraTarget = target;
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-stream-video');
  const preview = document.getElementById('camera-snap-preview');
  const liveControls = document.getElementById('camera-live-controls');
  const previewControls = document.getElementById('camera-preview-controls');
  const gridOverlay = document.getElementById('camera-grid-overlay');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const inputId = target === 'idcard' ? 'tenant-idcard-camera-input' : 'tenant-camera-input';
    const cameraInput = document.getElementById(inputId);
    if (cameraInput) cameraInput.click();
    return;
  }

  // Reset UI state to live video
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  if (video) video.classList.remove('hidden');
  if (gridOverlay) gridOverlay.classList.remove('hidden');
  if (liveControls) {
    liveControls.classList.remove('hidden');
    liveControls.classList.add('flex');
  }
  if (previewControls) {
    previewControls.classList.add('hidden');
    previewControls.classList.remove('flex');
  }

  if (modal) modal.classList.remove('hidden');
  await startCameraStream(currentFacingMode);
}
window.triggerCameraCapture = triggerCameraCapture;

async function startCameraStream(facingMode = 'environment') {
  stopCameraStream();
  const video = document.getElementById('camera-stream-video');
  if (!video) return;

  try {
    const constraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    };
    currentCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentCameraStream;
    await video.play();
  } catch (err) {
    console.warn('[Camera Error]:', err);
    try {
      currentCameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = currentCameraStream;
      await video.play();
    } catch (fallbackErr) {
      console.error('[Camera Fallback Error]:', fallbackErr);
      closeCameraModal();
      const inputId = currentCameraTarget === 'idcard' ? 'tenant-idcard-camera-input' : 'tenant-camera-input';
      const cameraInput = document.getElementById(inputId);
      if (cameraInput) cameraInput.click();
      showToast('កំពុងបើកកាមេរ៉ាពីទូរស័ព្ទ...', 'info');
    }
  }
}

export function stopCameraStream() {
  if (currentCameraStream) {
    currentCameraStream.getTracks().forEach(track => track.stop());
    currentCameraStream = null;
  }
  const video = document.getElementById('camera-stream-video');
  if (video) video.srcObject = null;
}

export function closeCameraModal() {
  stopCameraStream();
  const modal = document.getElementById('camera-modal');
  if (modal) modal.classList.add('hidden');
}
window.closeCameraModal = closeCameraModal;

export async function flipCameraFacingMode() {
  currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  await startCameraStream(currentFacingMode);
}
window.flipCameraFacingMode = flipCameraFacingMode;

export function snapCameraPhoto() {
  const video = document.getElementById('camera-stream-video');
  const canvas = document.getElementById('camera-capture-canvas');
  const preview = document.getElementById('camera-snap-preview');
  const liveControls = document.getElementById('camera-live-controls');
  const previewControls = document.getElementById('camera-preview-controls');
  const gridOverlay = document.getElementById('camera-grid-overlay');

  if (!video || !canvas) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  currentCapturedPhotoData = canvas.toDataURL('image/jpeg', 0.88);

  // Show captured preview
  if (preview) {
    preview.src = currentCapturedPhotoData;
    preview.classList.remove('hidden');
  }
  if (video) video.classList.add('hidden');
  if (gridOverlay) gridOverlay.classList.add('hidden');

  if (liveControls) {
    liveControls.classList.add('hidden');
    liveControls.classList.remove('flex');
  }
  if (previewControls) {
    previewControls.classList.remove('hidden');
    previewControls.classList.add('flex');
  }
}
window.snapCameraPhoto = snapCameraPhoto;

export function retakeCameraPhoto() {
  const video = document.getElementById('camera-stream-video');
  const preview = document.getElementById('camera-snap-preview');
  const liveControls = document.getElementById('camera-live-controls');
  const previewControls = document.getElementById('camera-preview-controls');
  const gridOverlay = document.getElementById('camera-grid-overlay');

  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  if (video) video.classList.remove('hidden');
  if (gridOverlay) gridOverlay.classList.remove('hidden');

  if (liveControls) {
    liveControls.classList.remove('hidden');
    liveControls.classList.add('flex');
  }
  if (previewControls) {
    previewControls.classList.add('hidden');
    previewControls.classList.remove('flex');
  }
}
window.retakeCameraPhoto = retakeCameraPhoto;

export function confirmCameraPhoto() {
  if (!currentCapturedPhotoData) return;

  if (window._pendingIdCardTenantId) {
    const targetId = window._pendingIdCardTenantId;
    store.updateTenant(targetId, { idCardPhotoUrl: currentCapturedPhotoData });
    showToast('បានថត និងរក្សាទុករូបថតអត្តសញ្ញាណប័ណ្ណជោគជ័យ ✓', 'success');
    renderTenants();
    viewTenantDetails(targetId);
    window._pendingIdCardTenantId = null;
    closeCameraModal();
    return;
  }

  if (currentCameraTarget === 'idcard') {
    const dataInput = document.getElementById('tenant-idcard-photo-data');
    if (dataInput) dataInput.value = currentCapturedPhotoData;
    const preview = document.getElementById('tenant-idcard-preview');
    const placeholder = document.getElementById('tenant-idcard-placeholder');
    const removeBtn = document.getElementById('tenant-idcard-remove-btn');

    if (preview) {
      preview.src = currentCapturedPhotoData;
      preview.classList.remove('hidden');
    }
    if (placeholder) placeholder.classList.add('hidden');
    if (removeBtn) {
      removeBtn.classList.remove('hidden');
      removeBtn.classList.add('inline-flex');
    }
    showToast('បានថតរូបអត្តសញ្ញាណប័ណ្ណជោគជ័យ ✓', 'success');
  } else {
    const dataInput = document.getElementById('tenant-photo-data');
    if (dataInput) dataInput.value = currentCapturedPhotoData;
    const preview = document.getElementById('tenant-photo-preview');
    const placeholder = document.getElementById('tenant-photo-placeholder');
    const removeBtn = document.getElementById('tenant-photo-remove-btn');

    if (preview) {
      preview.src = currentCapturedPhotoData;
      preview.classList.remove('hidden');
    }
    if (placeholder) placeholder.classList.add('hidden');
    if (removeBtn) {
      removeBtn.classList.remove('hidden');
      removeBtn.classList.add('inline-flex');
    }
    showToast('បានថតរូបអ្នកជួលជោគជ័យ ✓', 'success');
  }

  closeCameraModal();
}
window.confirmCameraPhoto = confirmCameraPhoto;

export function removeTenantPhoto() {
  document.getElementById('tenant-photo-data').value = '';
  const preview = document.getElementById('tenant-photo-preview');
  const placeholder = document.getElementById('tenant-photo-placeholder');
  const removeBtn = document.getElementById('tenant-photo-remove-btn');
  const photoInput = document.getElementById('tenant-photo-input');
  const cameraInput = document.getElementById('tenant-camera-input');
  if (photoInput) photoInput.value = '';
  if (cameraInput) cameraInput.value = '';
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  if (placeholder) placeholder.classList.remove('hidden');
  if (removeBtn) {
    removeBtn.classList.add('hidden');
    removeBtn.classList.remove('inline-flex');
  }
}
window.removeTenantPhoto = removeTenantPhoto;

export function removeTenantIdCardPhoto() {
  document.getElementById('tenant-idcard-photo-data').value = '';
  const preview = document.getElementById('tenant-idcard-preview');
  const placeholder = document.getElementById('tenant-idcard-placeholder');
  const removeBtn = document.getElementById('tenant-idcard-remove-btn');
  const photoInput = document.getElementById('tenant-idcard-photo-input');
  const cameraInput = document.getElementById('tenant-idcard-camera-input');
  if (photoInput) photoInput.value = '';
  if (cameraInput) cameraInput.value = '';
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  if (placeholder) placeholder.classList.remove('hidden');
  if (removeBtn) {
    removeBtn.classList.add('hidden');
    removeBtn.classList.remove('inline-flex');
  }
}
window.removeTenantIdCardPhoto = removeTenantIdCardPhoto;

export function openTenantModal(tenantId = null, preSelectRoomId = null) {
  const modal = document.getElementById('tenant-modal');
  const form = document.getElementById('tenant-form');
  const title = document.getElementById('tenant-modal-title');
  const photoPreview = document.getElementById('tenant-photo-preview');
  const photoPlaceholder = document.getElementById('tenant-photo-placeholder');
  const removeBtn = document.getElementById('tenant-photo-remove-btn');

  const idcardPreview = document.getElementById('tenant-idcard-preview');
  const idcardPlaceholder = document.getElementById('tenant-idcard-placeholder');
  const idcardRemoveBtn = document.getElementById('tenant-idcard-remove-btn');

  if (!modal || !form) return;

  form.reset();
  document.getElementById('tenant-id').value = '';
  document.getElementById('tenant-photo-data').value = '';
  document.getElementById('tenant-idcard-photo-data').value = '';

  if (photoPreview) photoPreview.classList.add('hidden');
  if (photoPlaceholder) photoPlaceholder.classList.remove('hidden');
  if (removeBtn) {
    removeBtn.classList.add('hidden');
    removeBtn.classList.remove('inline-flex');
  }

  if (idcardPreview) idcardPreview.classList.add('hidden');
  if (idcardPlaceholder) idcardPlaceholder.classList.remove('hidden');
  if (idcardRemoveBtn) {
    idcardRemoveBtn.classList.add('hidden');
    idcardRemoveBtn.classList.remove('inline-flex');
  }

  let selectedRoom = preSelectRoomId;

  if (tenantId) {
    title.innerHTML = '<i class="fa-solid fa-user-pen text-blue-600"></i> <span>កែប្រែព័ត៌មានអ្នកជួល</span>';
    const tenant = store.getTenantById(tenantId);
    if (tenant) {
      document.getElementById('tenant-id').value = tenant.id;
      document.getElementById('tenant-name').value = tenant.name;
      document.getElementById('tenant-gender').value = tenant.gender || 'male';
      document.getElementById('tenant-phone').value = tenant.phone;
      document.getElementById('tenant-idcard').value = tenant.idCard || '';
      document.getElementById('tenant-address').value = tenant.address || '';
      document.getElementById('tenant-start-date').value = tenant.startDate || '';
      document.getElementById('tenant-status').value = tenant.status || 'active';
      document.getElementById('tenant-emergency').value = tenant.emergencyPhone || '';
      selectedRoom = tenant.roomId;

      if (tenant.photoUrl) {
        document.getElementById('tenant-photo-data').value = tenant.photoUrl;
        if (photoPreview) {
          photoPreview.src = tenant.photoUrl;
          photoPreview.classList.remove('hidden');
        }
        if (photoPlaceholder) {
          photoPlaceholder.classList.add('hidden');
        }
        if (removeBtn) {
          removeBtn.classList.remove('hidden');
          removeBtn.classList.add('inline-flex');
        }
      }

      if (tenant.idCardPhotoUrl) {
        document.getElementById('tenant-idcard-photo-data').value = tenant.idCardPhotoUrl;
        if (idcardPreview) {
          idcardPreview.src = tenant.idCardPhotoUrl;
          idcardPreview.classList.remove('hidden');
        }
        if (idcardPlaceholder) {
          idcardPlaceholder.classList.add('hidden');
        }
        if (idcardRemoveBtn) {
          idcardRemoveBtn.classList.remove('hidden');
          idcardRemoveBtn.classList.add('inline-flex');
        }
      }
    }
  } else {
    title.innerHTML = '<i class="fa-solid fa-user-plus text-blue-600"></i> <span>ចុះឈ្មោះអ្នកជួលថ្មី</span>';
    document.getElementById('tenant-gender').value = 'male';
    document.getElementById('tenant-status').value = 'active';
    document.getElementById('tenant-start-date').value = new Date().toISOString().split('T')[0];
  }

  populateTenantRoomSelect(selectedRoom);
  modal.classList.remove('hidden');
}

export function closeTenantModal() {
  const modal = document.getElementById('tenant-modal');
  if (modal) modal.classList.add('hidden');
}

export function handleTenantPhotoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64 = evt.target.result;
    document.getElementById('tenant-photo-data').value = base64;
    const preview = document.getElementById('tenant-photo-preview');
    const placeholder = document.getElementById('tenant-photo-placeholder');
    const removeBtn = document.getElementById('tenant-photo-remove-btn');
    if (preview) {
      preview.src = base64;
      preview.classList.remove('hidden');
    }
    if (placeholder) {
      placeholder.classList.add('hidden');
    }
    if (removeBtn) {
      removeBtn.classList.remove('hidden');
      removeBtn.classList.add('inline-flex');
    }
  };
  reader.readAsDataURL(file);
}

export function handleTenantIdCardPhotoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64 = evt.target.result;
    document.getElementById('tenant-idcard-photo-data').value = base64;
    const preview = document.getElementById('tenant-idcard-preview');
    const placeholder = document.getElementById('tenant-idcard-placeholder');
    const removeBtn = document.getElementById('tenant-idcard-remove-btn');
    if (preview) {
      preview.src = base64;
      preview.classList.remove('hidden');
    }
    if (placeholder) {
      placeholder.classList.add('hidden');
    }
    if (removeBtn) {
      removeBtn.classList.remove('hidden');
      removeBtn.classList.add('inline-flex');
    }
  };
  reader.readAsDataURL(file);
}

export function handleTenantFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('tenant-id').value;
  const tenantData = {
    name: document.getElementById('tenant-name').value.trim(),
    gender: document.getElementById('tenant-gender').value,
    phone: document.getElementById('tenant-phone').value.trim(),
    idCard: document.getElementById('tenant-idcard').value.trim(),
    idCardPhotoUrl: document.getElementById('tenant-idcard-photo-data').value || '',
    address: document.getElementById('tenant-address').value.trim(),
    roomId: document.getElementById('tenant-room-id').value || null,
    startDate: document.getElementById('tenant-start-date').value,
    status: document.getElementById('tenant-status').value,
    emergencyPhone: document.getElementById('tenant-emergency').value.trim(),
    photoUrl: document.getElementById('tenant-photo-data').value || ''
  };

  if (!tenantData.name || !tenantData.phone) {
    showToast('សូមបញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទអ្នកជួល!', 'warning');
    return;
  }

  if (id) {
    store.updateTenant(id, tenantData);
    showToast('បានកែប្រែព័ត៌មានអ្នកជួលជោគជ័យ!', 'success');
  } else {
    store.addTenant(tenantData);
    showToast('បានចុះឈ្មោះអ្នកជួលថ្មីជោគជ័យ!', 'success');
  }

  closeTenantModal();
  renderTenants();
  window.renderRooms();
  window.updateDashboardStats();
}

export function viewTenantPhoto(photoUrl, name) {
  const modal = document.getElementById('photo-viewer-modal');
  const img = document.getElementById('photo-viewer-img');
  const title = document.getElementById('photo-viewer-title');
  const downloadBtn = document.getElementById('photo-viewer-download-btn');
  if (!modal || !img) return;

  img.src = photoUrl;
  if (downloadBtn) {
    downloadBtn.href = photoUrl;
    downloadBtn.download = `${(name || 'photo').replace(/[^a-zA-Z0-9_\u1780-\u17FF]/g, '_')}.jpg`;
  }
  if (title) title.innerHTML = `<i class="fa-solid fa-image text-blue-600"></i> <span>${name}</span>`;
  modal.classList.remove('hidden');
}

export function closePhotoViewer() {
  const modal = document.getElementById('photo-viewer-modal');
  if (modal) modal.classList.add('hidden');
}

let currentViewingTenantId = null;

// Quick helper to upload ID Card photo directly from Tenant Details Modal
export function quickUploadIdCard(tenantId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      store.updateTenant(tenantId, { idCardPhotoUrl: base64 });
      showToast('បានរក្សាទុករូបថតអត្តសញ្ញាណប័ណ្ណជោគជ័យ ✓', 'success');
      renderTenants();
      viewTenantDetails(tenantId);
    };
    reader.readAsDataURL(file);
  };
  input.click();
}
window.quickUploadIdCard = quickUploadIdCard;

// Quick helper to snap ID Card photo directly from Camera
export function quickSnapIdCard(tenantId) {
  window._pendingIdCardTenantId = tenantId;
  triggerCameraCapture('idcard');
}
window.quickSnapIdCard = quickSnapIdCard;

// Quick helper to remove ID Card photo
export function removeIdCardPhotoForTenant(tenantId) {
  store.updateTenant(tenantId, { idCardPhotoUrl: '' });
  showToast('បានលុបរូបថតអត្តសញ្ញាណប័ណ្ណរួចរាល់', 'info');
  renderTenants();
  viewTenantDetails(tenantId);
}
window.removeIdCardPhotoForTenant = removeIdCardPhotoForTenant;

// Helper to calculate exact duration of stay in Khmer
function calculateStayDuration(startDateStr) {
  if (!startDateStr) return 'មិនបានបញ្ជាក់';
  const start = new Date(startDateStr);
  const now = new Date();
  if (isNaN(start.getTime())) return startDateStr;

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffTime = Math.max(0, now - start);
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const parts = [];
  if (years > 0) parts.push(`${years} ឆ្នាំ`);
  if (months > 0) parts.push(`${months} ខែ`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ថ្ងៃ`);

  return `${parts.join(' ')} (សរុប ${totalDays} ថ្ងៃ)`;
}

// Open Full Detail View for a Tenant
export function viewTenantDetails(tenantId) {
  currentViewingTenantId = tenantId;
  const tenant = store.getTenantById(tenantId);
  if (!tenant) {
    showToast('រកមិនឃើញទិន្នន័យអ្នកជួលនេះទេ', 'warning');
    return;
  }

  const modal = document.getElementById('tenant-view-modal');
  const content = document.getElementById('tenant-view-content');
  const footer = document.getElementById('tenant-view-footer');
  if (!modal || !content) return;

  const rooms = store.getRooms();
  const room = rooms.find(r => r.id === tenant.roomId);
  const cleanRoomNum = room ? ((room.roomNumber || '').replace(/^room[-_]?/i, '') || room.roomNumber) : '';
  const settings = store.getSettings();
  const exchangeRate = settings.exchangeRate || 4000;

  const idCardPhoto = tenant.idCardPhotoUrl || tenant.idCardPhoto || tenant.idCardImage || '';
  const profilePhoto = tenant.photoUrl || tenant.photo || tenant.avatarUrl || '';

  const roomTypeMap = {
    fan: { label: 'បន្ទប់កង្ហារ', icon: 'fa-fan', color: 'text-blue-600' },
    ac: { label: 'បន្ទប់ម៉ាស៊ីនត្រជាក់', icon: 'fa-snowflake', color: 'text-cyan-600' },
    vip: { label: 'បន្ទប់ VIP', icon: 'fa-crown', color: 'text-amber-500' },
    studio: { label: 'បន្ទប់ Studio', icon: 'fa-couch', color: 'text-indigo-600' }
  };
  const roomTypeInfo = room ? (roomTypeMap[room.roomType] || { label: room.roomType || 'បន្ទប់កង្ហារ', icon: 'fa-door-closed', color: 'text-blue-600' }) : null;

  const priceUsd = room ? (room.price || room.rent || 0) : 0;
  const priceKhr = Math.round(priceUsd * exchangeRate);
  const depositUsd = room ? (room.deposit || 0) : 0;
  const depositKhr = Math.round(depositUsd * exchangeRate);

  const isOccupied = (tenant.status || 'active') === 'active';
  
  // THREE-COLOR SYSTEM: Green (Active/Paid), Red (Inactive/Unpaid/Emergency), Blue (Primary/Room/ID/Actions)
  const statusBadge = isOccupied
    ? `<span class="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ស្នាក់នៅ</span>`
    : `<span class="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs"><span class="w-2 h-2 rounded-full bg-rose-400"></span> បានចាកចេញ</span>`;

  const genderBadge = tenant.gender === 'female'
    ? `<span class="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs"><i class="fa-solid fa-venus text-[10px]"></i> ស្រី</span>`
    : `<span class="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs"><i class="fa-solid fa-mars text-[10px]"></i> ប្រុស</span>`;

  // Fetch all invoices for this tenant
  const allInvoices = store.getInvoices();
  const cleanPhone = (tenant.phone || '').replace(/\D/g, '');
  const tenantInvoices = allInvoices.filter(i => {
    const matchRoom = tenant.roomId && i.roomId === tenant.roomId;
    const matchName = i.tenantName && i.tenantName.trim().toLowerCase() === tenant.name.trim().toLowerCase();
    const matchPhone = cleanPhone && i.tenantPhone && i.tenantPhone.replace(/\D/g, '') === cleanPhone;
    return matchRoom || matchName || matchPhone;
  });

  const totalInvoices = tenantInvoices.length;
  const paidInvoices = tenantInvoices.filter(i => i.status === 'paid');
  const unpaidInvoices = tenantInvoices.filter(i => i.status !== 'paid');

  const totalPaidUsd = paidInvoices.reduce((sum, i) => sum + (i.totalUsd || 0), 0);
  const totalPaidKhr = paidInvoices.reduce((sum, i) => sum + (i.totalKhr || 0), 0);

  const totalUnpaidUsd = unpaidInvoices.reduce((sum, i) => sum + (i.totalUsd || 0), 0);
  const totalUnpaidKhr = unpaidInvoices.reduce((sum, i) => sum + (i.totalKhr || 0), 0);

  // Render Full Content
  content.innerHTML = `
    <!-- 1. Hero Card: Profile Avatar + Name + Core Badges (Blue Base) -->
    <div class="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-blue-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5 min-w-0">
        <!-- Avatar -->
        <div class="relative flex-shrink-0">
          ${profilePhoto ? `
            <img src="${profilePhoto}" onclick="window.viewTenantPhoto('${profilePhoto}', '${tenant.name}')" 
                 class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-white/80 shadow-md cursor-pointer hover:scale-105 transition" 
                 title="ចុចដើម្បីមើលរូបភាពពេញ">
          ` : `
            <div class="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-bold text-2xl sm:text-3xl border border-blue-400/40 shadow-inner">
              ${tenant.name.charAt(0)}
            </div>
          `}
          ${profilePhoto ? `
            <button onclick="window.viewTenantPhoto('${profilePhoto}', '${tenant.name}')" class="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm border border-white" title="មើលរូបពេញ">
              <i class="fa-solid fa-magnifying-glass-plus"></i>
            </button>
          ` : ''}
        </div>

        <!-- Name & Badges -->
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h2 class="text-base sm:text-lg font-bold text-white tracking-tight">${tenant.name}</h2>
            <span class="px-2 py-0.5 bg-blue-800/80 text-blue-200 font-mono text-[10px] sm:text-xs rounded border border-blue-700/50">ID: ${tenant.id}</span>
          </div>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            ${genderBadge}
            ${statusBadge}
          </div>
          <div class="text-slate-300 text-[11px] sm:text-xs mt-1.5 flex items-center gap-2 font-mono">
            <i class="fa-solid fa-phone text-emerald-400"></i> 
            <a href="tel:${tenant.phone}" class="hover:text-emerald-300 hover:underline text-emerald-300 font-bold">${tenant.phone}</a>
          </div>
        </div>
      </div>

      <!-- Quick Room Badge (Blue Accent) -->
      <div class="w-full sm:w-auto bg-blue-950/80 p-3 rounded-xl border border-blue-800/60 text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end flex-shrink-0">
        <div>
          <span class="text-[10px] text-blue-200 block uppercase tracking-wider font-medium">បន្ទប់ស្នាក់នៅ</span>
          <span class="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
            <i class="fa-solid fa-door-closed text-blue-400"></i> ${room ? `បន្ទប់ ${cleanRoomNum}` : 'មិនទាន់មាន'}
          </span>
        </div>
        ${room ? `<span class="text-[11px] text-emerald-300 font-mono font-bold sm:mt-1">$${priceUsd}/ខែ</span>` : ''}
      </div>
    </div>

    <!-- 2. Personal & Contact Information Card -->
    <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h4 class="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
          <i class="fa-solid fa-user-shield text-blue-600 text-sm"></i>
          <span>ព័ត៌មានផ្ទាល់ខ្លួន & ទំនាក់ទំនង</span>
        </h4>
        <a href="tel:${tenant.phone}" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95">
          <i class="fa-solid fa-phone text-xs"></i> <span>ខលផ្ទាល់</span>
        </a>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <!-- Full Name -->
        <div class="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
          <span class="text-slate-400 text-[10px] sm:text-[11px] block mb-0.5 flex items-center gap-1">
            <i class="fa-solid fa-user text-blue-600"></i> ឈ្មោះពេញ
          </span>
          <span class="font-bold text-slate-800 text-xs sm:text-sm">${tenant.name}</span>
        </div>

        <!-- Gender -->
        <div class="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
          <span class="text-slate-400 text-[10px] sm:text-[11px] block mb-0.5 flex items-center gap-1">
            <i class="fa-solid fa-venus-mars text-blue-600"></i> ភេទ
          </span>
          <span class="font-bold text-slate-800 text-xs sm:text-sm">${tenant.gender === 'female' ? 'ស្រី (Female)' : 'ប្រុស (Male)'}</span>
        </div>

        <!-- Phone Number (Green Theme) -->
        <div class="bg-emerald-50/50 p-2.5 sm:p-3 rounded-xl border border-emerald-100">
          <span class="text-slate-500 text-[10px] sm:text-[11px] block mb-0.5 flex items-center gap-1">
            <i class="fa-solid fa-phone text-emerald-600"></i> លេខទូរស័ព្ទចម្បង
          </span>
          <div class="flex items-center justify-between gap-2">
            <a href="tel:${tenant.phone}" class="font-bold font-mono text-emerald-700 text-xs sm:text-sm hover:underline flex items-center gap-1.5">
              ${tenant.phone}
            </a>
            <a href="https://t.me/+855${tenant.phone.replace(/^0/, '')}" target="_blank" class="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-sans font-semibold text-[10px] inline-flex items-center gap-1 border border-blue-200" title="ផ្ញើសារ Telegram">
              <i class="fa-brands fa-telegram text-xs text-blue-500"></i> Telegram
            </a>
          </div>
        </div>

        <!-- Emergency Phone (Red Theme) -->
        <div class="bg-rose-50/50 p-2.5 sm:p-3 rounded-xl border border-rose-100">
          <span class="text-slate-500 text-[10px] sm:text-[11px] block mb-0.5 flex items-center gap-1">
            <i class="fa-solid fa-phone-volume text-rose-500"></i> លេខទូរស័ព្ទបន្ទាន់
          </span>
          ${tenant.emergencyPhone ? `
            <a href="tel:${tenant.emergencyPhone}" class="font-bold font-mono text-rose-700 text-xs sm:text-sm hover:underline flex items-center gap-1.5">
              ${tenant.emergencyPhone}
            </a>
          ` : `
            <span class="text-slate-400 italic text-xs">មិនមាន</span>
          `}
        </div>

        <!-- National ID Card Section (Blue Theme) -->
        <div class="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 sm:col-span-2 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                <i class="fa-solid fa-address-card"></i>
              </div>
              <div>
                <span class="text-slate-800 text-xs font-bold block">លេខអត្តសញ្ញាណប័ណ្ណ (National ID)</span>
                <span class="font-bold font-mono text-blue-900 text-sm">${tenant.idCard || '<span class="text-slate-400 font-normal font-sans text-xs">មិនទាន់បញ្ចូលលេខ</span>'}</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              ${idCardPhoto ? `
                <button onclick="window.viewTenantPhoto('${idCardPhoto}', '${tenant.name} (អត្តសញ្ញាណប័ណ្ណ)')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-2xs transition active:scale-95">
                  <i class="fa-solid fa-magnifying-glass-plus text-xs"></i> <span>ពង្រីករូបធំ</span>
                </button>
                <button onclick="window.quickUploadIdCard('${tenant.id}')" class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-semibold text-xs inline-flex items-center gap-1 border border-blue-200 transition active:scale-95 shadow-2xs" title="ប្តូររូបថតកាត">
                  <i class="fa-solid fa-camera text-blue-600 text-xs"></i> <span>ប្តូររូប</span>
                </button>
                <button onclick="window.removeIdCardPhotoForTenant('${tenant.id}')" class="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition active:scale-95" title="លុបរូបកាត">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              ` : `
                <button onclick="window.quickSnapIdCard('${tenant.id}')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-2xs transition active:scale-95">
                  <i class="fa-solid fa-camera text-xs"></i> <span>ថតរូបកាត</span>
                </button>
                <button onclick="window.quickUploadIdCard('${tenant.id}')" class="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-semibold text-xs inline-flex items-center gap-1 border border-blue-200 shadow-2xs transition active:scale-95">
                  <i class="fa-solid fa-image text-blue-600 text-xs"></i> <span>ជ្រើសរូប</span>
                </button>
              `}
            </div>
          </div>

          <!-- Prominent ID Card Image Container -->
          ${idCardPhoto ? `
            <div class="relative bg-slate-900 rounded-2xl overflow-hidden border-2 border-blue-200 shadow-sm group">
              <!-- Top Ribbon (Blue) -->
              <div class="bg-blue-900 text-white px-3.5 py-2 flex items-center justify-between text-xs font-semibold border-b border-blue-800">
                <span class="flex items-center gap-2">
                  <i class="fa-solid fa-id-badge text-blue-300"></i>
                  <span>រូបថតអត្តសញ្ញាណប័ណ្ណ — ${tenant.name}</span>
                </span>
                <span class="font-mono text-blue-200 bg-blue-950 px-2.5 py-0.5 rounded border border-blue-700 text-xs">${tenant.idCard || ''}</span>
              </div>

              <!-- Image display box -->
              <div onclick="window.viewTenantPhoto('${idCardPhoto}', '${tenant.name} (អត្តសញ្ញាណប័ណ្ណ)')" class="p-3.5 flex items-center justify-center bg-slate-950 cursor-pointer group-hover:bg-slate-900/90 transition" title="ចុចលើរូបដើម្បីមើលរូបភាពពេញអេក្រង់">
                <img src="${idCardPhoto}" alt="National ID Card - ${tenant.name}" class="max-h-72 w-auto max-w-full object-contain rounded-xl shadow-md group-hover:scale-[1.01] transition duration-300 border border-slate-800">
              </div>

              <!-- Bottom Bar -->
              <div class="bg-slate-900 text-slate-300 px-3.5 py-2 flex items-center justify-between text-xs border-t border-slate-800">
                <span class="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <i class="fa-solid fa-hand-pointer text-blue-400"></i> ចុចលើរូបដើម្បីពង្រីកពេញអេក្រង់
                </span>
                <button onclick="window.viewTenantPhoto('${idCardPhoto}', '${tenant.name} (អត្តសញ្ញាណប័ណ្ណ)')" class="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 text-xs">
                  <i class="fa-solid fa-up-right-and-down-left-from-center text-[10px]"></i> <span>មើលរូបពេញ</span>
                </button>
              </div>
            </div>
          ` : `
            <div class="bg-white p-4 sm:p-5 rounded-2xl border-2 border-dashed border-blue-200 text-center space-y-2.5">
              <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl mx-auto border border-blue-100">
                <i class="fa-solid fa-id-card"></i>
              </div>
              <div>
                <span class="font-bold text-slate-800 text-xs sm:text-sm block">មិនទាន់មានរូបថតអត្តសញ្ញាណប័ណ្ណ</span>
                <span class="text-[11px] text-slate-400 block mt-0.5">លោកអ្នកអាចថតរូបកាតផ្ទាល់ ឬជ្រើសរូបភាពពីទូរស័ព្ទ / កុំព្យូទ័រ</span>
              </div>
              <div class="flex items-center justify-center gap-2 pt-1">
                <button onclick="window.quickSnapIdCard('${tenant.id}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition active:scale-95">
                  <i class="fa-solid fa-camera text-xs"></i> <span>ថតរូបកាតឥឡូវនេះ</span>
                </button>
                <button onclick="window.quickUploadIdCard('${tenant.id}')" class="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-blue-200 transition active:scale-95">
                  <i class="fa-solid fa-image text-blue-600 text-xs"></i> <span>ជ្រើសរើសរូបពីម៉ាស៊ីន</span>
                </button>
              </div>
            </div>
          `}
        </div>

        <!-- Hometown / Origin Address -->
        <div class="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 sm:col-span-2">
          <span class="text-slate-400 text-[10px] sm:text-[11px] block mb-0.5 flex items-center gap-1">
            <i class="fa-solid fa-location-dot text-blue-600"></i> អាសយដ្ឋានដើម / ស្រុកកំណើត
          </span>
          <span class="font-medium text-slate-800 text-xs sm:text-sm">${tenant.address || '<span class="text-slate-400 italic">មិនបានបញ្ជាក់</span>'}</span>
        </div>
      </div>
    </div>

    <!-- 3. Room & Lease Contract Information Card (Blue & Green Accents) -->
    <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h4 class="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
          <i class="fa-solid fa-door-open text-blue-600 text-sm"></i>
          <span>ព័ត៌មានបន្ទប់ស្នាក់នៅ & កិច្ចសន្យា</span>
        </h4>
        ${room ? `
          <button onclick="window.closeTenantViewModal(); window.quickCreateInvoice('${room.id}')" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition">
            <i class="fa-solid fa-file-invoice-dollar text-xs"></i> <span>ចេញវិក្កយបត្រ</span>
          </button>
        ` : ''}
      </div>

      ${room ? `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <!-- Room Number (Blue) -->
          <div class="bg-blue-50/70 p-2.5 sm:p-3 rounded-xl border border-blue-100">
            <span class="text-blue-600 text-[10px] sm:text-[11px] block mb-0.5 font-semibold">បន្ទប់ស្នាក់នៅ</span>
            <span class="font-bold text-blue-900 text-sm sm:text-base flex items-center gap-1.5">
              <i class="fa-solid fa-door-closed text-blue-600"></i> បន្ទប់ ${cleanRoomNum}
            </span>
          </div>

          <!-- Floor -->
          <div class="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
            <span class="text-slate-400 text-[10px] sm:text-[11px] block mb-0.5">ជាន់ទី</span>
            <span class="font-bold text-slate-800 text-xs sm:text-sm">ជាន់ទី ${room.floor || 1}</span>
          </div>

          <!-- Room Type -->
          <div class="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
            <span class="text-slate-400 text-[10px] sm:text-[11px] block mb-0.5">ប្រភេទបន្ទប់</span>
            <span class="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
              <i class="fa-solid ${roomTypeInfo.icon} text-blue-600"></i> ${roomTypeInfo.label}
            </span>
          </div>

          <!-- Monthly Rent (Green Theme) -->
          <div class="bg-emerald-50/70 p-2.5 sm:p-3 rounded-xl border border-emerald-100">
            <span class="text-emerald-700 text-[10px] sm:text-[11px] block mb-0.5 font-semibold">ថ្លៃឈ្នួលបន្ទប់ / ខែ</span>
            <div class="font-bold font-mono text-emerald-700 text-sm sm:text-base">$${priceUsd}</div>
            <div class="text-[10px] text-slate-500 font-mono">≈ ${priceKhr.toLocaleString()} ៛</div>
          </div>

          <!-- Deposit (Blue Theme) -->
          <div class="bg-blue-50/70 p-2.5 sm:p-3 rounded-xl border border-blue-100">
            <span class="text-blue-700 text-[10px] sm:text-[11px] block mb-0.5 font-semibold">ប្រាក់កក់ធានា</span>
            <div class="font-bold font-mono text-blue-800 text-sm sm:text-base">$${depositUsd}</div>
            <div class="text-[10px] text-slate-500 font-mono">≈ ${depositKhr.toLocaleString()} ៛</div>
          </div>

          <!-- Move-in Date -->
          <div class="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
            <span class="text-slate-400 text-[10px] sm:text-[11px] block mb-0.5">ថ្ងៃចូលស្នាក់នៅ</span>
            <span class="font-bold font-mono text-slate-800 text-xs sm:text-sm">${tenant.startDate || '-'}</span>
          </div>

          <!-- Stay Duration -->
          <div class="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-3">
            <span class="text-slate-400 text-[10px] sm:text-[11px] block mb-0.5 flex items-center gap-1">
              <i class="fa-solid fa-clock-rotate-left text-blue-600"></i> រយៈពេលដែលបានស្នាក់នៅ
            </span>
            <span class="font-bold text-slate-900 text-xs sm:text-sm font-khmer">
              ${calculateStayDuration(tenant.startDate)}
            </span>
          </div>

          ${room.description ? `
            <div class="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-3">
              <span class="text-slate-400 text-[10px] sm:text-[11px] block mb-0.5">កំណត់ចំណាំបន្ទប់</span>
              <span class="text-slate-700 text-xs">${room.description}</span>
            </div>
          ` : ''}
        </div>
      ` : `
        <div class="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center space-y-2">
          <p class="text-rose-700 font-semibold text-xs">អ្នកជួលនេះមិនទាន់មានបន្ទប់ស្នាក់នៅច្បាស់លាស់នៅឡើយទេ</p>
          <button onclick="window.closeTenantViewModal(); window.openTenantModal('${tenant.id}')" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs">
            <i class="fa-solid fa-door-open mr-1"></i> កំណត់បន្ទប់ស្នាក់នៅ
          </button>
        </div>
      `}
    </div>

    <!-- 4. Billing & Payment History Summary (3 Colors: Blue Total, Green Paid, Red Unpaid) -->
    <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h4 class="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
          <i class="fa-solid fa-receipt text-blue-600 text-sm"></i>
          <span>ប្រវត្តិវិក្កយបត្រ & ការទូទាត់ (${totalInvoices} ប័ណ្ណ)</span>
        </h4>
        <span class="text-[11px] text-slate-400 font-mono">Billing & Invoices</span>
      </div>

      <!-- 3 Summary Metric Cards: Blue (Total), Green (Paid), Red (Unpaid) -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
        <!-- Blue: Total Invoices -->
        <div class="bg-blue-50/70 p-2.5 sm:p-3 rounded-xl border border-blue-100 text-center">
          <span class="text-[10px] sm:text-[11px] text-blue-700 block font-semibold">វិក្កយបត្រសរុប</span>
          <span class="text-base sm:text-lg font-bold font-mono text-blue-900">${totalInvoices}</span>
        </div>
        <!-- Green: Paid -->
        <div class="bg-emerald-50/70 p-2.5 sm:p-3 rounded-xl border border-emerald-100 text-center">
          <span class="text-[10px] sm:text-[11px] text-emerald-700 block font-semibold">បានបង់រួច</span>
          <span class="text-xs sm:text-sm font-bold font-mono text-emerald-700 block">$${totalPaidUsd.toFixed(2)}</span>
          <span class="text-[9px] sm:text-[10px] text-slate-500 font-mono block">≈ ${totalPaidKhr.toLocaleString()} ៛</span>
        </div>
        <!-- Red: Unpaid Debt -->
        <div class="bg-rose-50/70 p-2.5 sm:p-3 rounded-xl border border-rose-100 text-center">
          <span class="text-[10px] sm:text-[11px] text-rose-700 block font-semibold">ជំពាក់/មិនទាន់បង់</span>
          <span class="text-xs sm:text-sm font-bold font-mono text-rose-700 block">$${totalUnpaidUsd.toFixed(2)}</span>
          <span class="text-[9px] sm:text-[10px] text-slate-500 font-mono block">≈ ${totalUnpaidKhr.toLocaleString()} ៛</span>
        </div>
      </div>

      <!-- Invoices List Table -->
      <div class="overflow-x-auto border border-slate-100 rounded-xl mt-2">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <th class="py-2.5 px-3">លេខប័ណ្ណ</th>
              <th class="py-2.5 px-3">ប្រចាំខែ</th>
              <th class="py-2.5 px-3">ទឹកប្រាក់សរុប</th>
              <th class="py-2.5 px-3">ស្ថានភាព</th>
              <th class="py-2.5 px-3 text-right">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${tenantInvoices.length > 0 ? tenantInvoices.map(inv => {
              let invBadge = '';
              if (inv.status === 'paid') {
                invBadge = `<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold text-[10px]">បានបង់រួច</span>`;
              } else if (inv.status === 'partial') {
                invBadge = `<span class="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold text-[10px]">បង់មួយផ្នែក</span>`;
              } else {
                invBadge = `<span class="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-semibold text-[10px]">មិនទាន់បង់</span>`;
              }

              return `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-2.5 px-3 font-mono font-bold text-blue-900">${inv.invoiceNumber}</td>
                  <td class="py-2.5 px-3 font-mono text-slate-600">${inv.month}</td>
                  <td class="py-2.5 px-3 font-mono font-bold text-slate-900">
                    <span class="text-emerald-700">$${(inv.totalUsd || 0).toFixed(2)}</span>
                    <span class="text-[10px] text-slate-400 font-normal">(${(inv.totalKhr || 0).toLocaleString()} ៛)</span>
                  </td>
                  <td class="py-2.5 px-3">${invBadge}</td>
                  <td class="py-2.5 px-3 text-right">
                    <button onclick="window.closeTenantViewModal(); window.viewInvoiceModal('${inv.id}')" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition border border-blue-200">
                      <i class="fa-solid fa-receipt text-[10px]"></i> <span>មើលប័ណ្ណ</span>
                    </button>
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="5" class="py-6 text-center text-slate-400 text-xs">
                  <i class="fa-solid fa-receipt text-slate-300 text-lg block mb-1"></i>
                  <span>មិនទាន់មានប្រវត្តិវិក្កយបត្រនៅឡើយទេ</span>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Footer Actions (Green Call, Blue Create Invoice & Edit, Slate/Red Close)
  footer.innerHTML = `
    <div class="flex items-center gap-2">
      <a href="tel:${tenant.phone}" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95">
        <i class="fa-solid fa-phone text-xs"></i> <span>ខលទូរស័ព្ទ</span>
      </a>
      ${room ? `
        <button onclick="window.closeTenantViewModal(); window.quickCreateInvoice('${room.id}')" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95">
          <i class="fa-solid fa-file-invoice-dollar text-xs"></i> <span>ចេញវិក្កយបត្រ</span>
        </button>
      ` : ''}
    </div>

    <div class="flex items-center gap-2">
      <button onclick="window.closeTenantViewModal(); window.openTenantModal('${tenant.id}')" class="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 border border-blue-200 transition active:scale-95">
        <i class="fa-solid fa-pen-to-square text-blue-600 text-xs"></i> <span>កែប្រែ</span>
      </button>
      <button onclick="window.closeTenantViewModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition">
        <span>បិទ</span>
      </button>
    </div>
  `;

  modal.classList.remove('hidden');
}

export function closeTenantViewModal() {
  const modal = document.getElementById('tenant-view-modal');
  if (modal) modal.classList.add('hidden');
}

export function printTenantDetails(tenantId = null) {
  const id = tenantId || currentViewingTenantId;
  if (!id) return;
  const tenant = store.getTenantById(id);
  if (!tenant) return;

  const room = store.getRooms().find(r => r.id === tenant.roomId);
  const cleanRoomNum = room ? ((room.roomNumber || '').replace(/^room[-_]?/i, '') || room.roomNumber) : 'គ្មាន';
  const settings = store.getSettings();

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="km">
    <head>
      <meta charset="UTF-8">
      <title>ព័ត៌មានអ្នកជួល - ${tenant.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Battambang', sans-serif; padding: 28px; color: #1e293b; font-size: 13px; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; color: #0f172a; }
        .sub { font-size: 11px; color: #64748b; }
        .section-title { font-size: 14px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 16px 0 8px 0; }
        .grid { display: flex; flex-wrap: wrap; margin-bottom: 12px; }
        .col { width: 50%; margin-bottom: 8px; }
        .label { font-size: 11px; color: #64748b; display: block; }
        .val { font-size: 13px; font-weight: 600; color: #0f172a; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #eff6ff; color: #1d4ed8; }
        .photo-box { display: flex; gap: 16px; align-items: center; background: #f8fafc; padding: 12px; border-radius: 10px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
        .photo { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">${settings.appName || 'ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល'}</div>
          <div class="sub">ប័ណ្ណព័ត៌មានអ្នកជួល (Tenant Profile Information)</div>
        </div>
        <div style="text-align: right;">
          <div class="val">កាលបរិច្ឆេទ: ${new Date().toLocaleDateString('km-KH')}</div>
          <div class="sub">ID: ${tenant.id}</div>
        </div>
      </div>

      <div class="photo-box">
        ${tenant.photoUrl ? `<img src="${tenant.photoUrl}" class="photo">` : ''}
        <div>
          <h2 style="margin: 0; font-size: 17px; color: #0f172a;">${tenant.name}</h2>
          <div style="margin-top: 4px; display: flex; gap: 6px;">
            <span class="badge">ភេទ: ${tenant.gender === 'female' ? 'ស្រី' : 'ប្រុស'}</span>
            <span class="badge" style="background: #ecfdf5; color: #059669;">ស្ថានភាព: ${(tenant.status || 'active') === 'active' ? 'កំពុងស្នាក់នៅ' : 'បានចាកចេញ'}</span>
            <span class="badge" style="background: #eff6ff; color: #2563eb;">បន្ទប់: ${cleanRoomNum}</span>
          </div>
        </div>
      </div>

      <div class="section-title">១. ព័ត៌មានផ្ទាល់ខ្លួន & ទំនាក់ទំនង</div>
      <div class="grid">
        <div class="col"><span class="label">ឈ្មោះពេញ:</span><span class="val">${tenant.name}</span></div>
        <div class="col"><span class="label">លេខទូរស័ព្ទ:</span><span class="val">${tenant.phone}</span></div>
        <div class="col"><span class="label">លេខទូរស័ព្ទបន្ទាន់:</span><span class="val">${tenant.emergencyPhone || 'គ្មាន'}</span></div>
        <div class="col"><span class="label">លេខអត្តសញ្ញាណប័ណ្ណ:</span><span class="val">${tenant.idCard || 'មិនទាន់មាន'}</span></div>
        <div class="col" style="width: 100%;"><span class="label">អាសយដ្ឋានដើម / ស្រុកកំណើត:</span><span class="val">${tenant.address || 'មិនបានបញ្ជាក់'}</span></div>
      </div>

      <div class="section-title">២. ព័ត៌មានបន្ទប់ស្នាក់នៅ & កិច្ចសន្យា</div>
      <div class="grid">
        <div class="col"><span class="label">លេខបន្ទប់:</span><span class="val">បន្ទប់ ${cleanRoomNum} (ជាន់ទី ${room ? room.floor || 1 : 1})</span></div>
        <div class="col"><span class="label">ថ្លៃឈ្នួលបន្ទប់:</span><span class="val">$${room ? (room.price || room.rent || 0) : 0}/ខែ (≈ ${(Math.round((room ? room.price || 0 : 0) * (settings.exchangeRate || 4000))).toLocaleString()} ៛)</span></div>
        <div class="col"><span class="label">ប្រាក់កក់:</span><span class="val">$${room ? room.deposit || 0 : 0}</span></div>
        <div class="col"><span class="label">ថ្ងៃចូលស្នាក់នៅ:</span><span class="val">${tenant.startDate || '-'}</span></div>
      </div>

      <div style="margin-top: 40px; display: flex; justify-content: space-between; text-align: center;">
        <div>
          <div>ហត្ថលេខាម្ចាស់ផ្ទះ</div>
          <div style="margin-top: 50px; font-weight: bold;">${settings.landlordName || 'ម្ចាស់ផ្ទះ'}</div>
        </div>
        <div>
          <div>ហត្ថលេខាអ្នកជួល</div>
          <div style="margin-top: 50px; font-weight: bold;">${tenant.name}</div>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

window.viewTenantDetails = viewTenantDetails;
window.closeTenantViewModal = closeTenantViewModal;
window.printTenantDetails = printTenantDetails;

