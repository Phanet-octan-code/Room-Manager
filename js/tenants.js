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
        ? `<span class="whitespace-nowrap px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs inline-flex items-center gap-1.5"><i class="fa-solid fa-door-closed text-[10px]"></i> បន្ទប់ ${cleanRoomNum}</span>`
        : `<span class="whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium inline-block">មិនទាន់មានបន្ទប់</span>`;

      const genderBadge = tenant.gender === 'female' 
        ? `<span class="whitespace-nowrap px-3 py-1 bg-pink-50 text-pink-700 border border-pink-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"><i class="fa-solid fa-venus text-[10px]"></i> ស្រី</span>`
        : `<span class="whitespace-nowrap px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"><i class="fa-solid fa-mars text-[10px]"></i> ប្រុស</span>`;

      const statusBadge = (tenant.status || 'active') === 'active'
        ? `<span class="whitespace-nowrap px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ស្នាក់នៅ</span>`
        : `<span class="whitespace-nowrap px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-slate-400"></span> ចាកចេញ</span>`;

      return `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition text-sm">
          <td class="py-3.5 px-3 text-slate-500 text-xs text-center whitespace-nowrap">${index + 1}</td>
          
          <!-- Photo / Avatar -->
          <td class="py-3.5 px-3 text-center whitespace-nowrap">
            ${tenant.photoUrl ? `
              <img src="${tenant.photoUrl}" onclick="window.viewTenantPhoto('${tenant.photoUrl}', '${tenant.name}')" 
                   class="w-10 h-10 rounded-full object-cover border border-slate-200 cursor-pointer hover:scale-105 transition shadow-xs mx-auto" 
                   title="ចុចដើម្បីមើលរូបភាពធំ">
            ` : `
              <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-inner mx-auto">
                ${tenant.name.charAt(0)}
              </div>
            `}
          </td>

          <!-- Name & ID -->
          <td class="py-3.5 px-3 whitespace-nowrap">
            <div class="font-bold text-slate-900 text-sm">${tenant.name}</div>
            <div class="text-[11px] text-slate-400">ID: ${tenant.id}</div>
          </td>

          <!-- Gender -->
          <td class="py-3.5 px-3 whitespace-nowrap">${genderBadge}</td>

          <!-- Phone -->
          <td class="py-3.5 px-3 font-mono text-xs text-slate-700 whitespace-nowrap">
            <a href="tel:${tenant.phone}" class="hover:text-blue-600 font-semibold inline-flex items-center gap-1.5">
              <i class="fa-solid fa-phone text-xs text-emerald-600"></i>
              ${tenant.phone}
            </a>
          </td>

          <!-- ID Card -->
          <td class="py-3.5 px-3 text-slate-600 font-mono text-xs whitespace-nowrap">
            <div class="flex items-center gap-1.5">
              <span>${tenant.idCard || '-'}</span>
              ${tenant.idCardPhotoUrl ? `
                <button type="button" onclick="window.viewTenantPhoto('${tenant.idCardPhotoUrl}', '${tenant.name} (អត្តសញ្ញាណប័ណ្ណ)')" 
                        class="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition border border-blue-200 shadow-2xs" 
                        title="ចុចមើលរូបថតអត្តសញ្ញាណប័ណ្ណ">
                  <i class="fa-solid fa-id-card text-[11px]"></i>
                </button>
              ` : ''}
            </div>
          </td>

          <!-- Address -->
          <td class="py-3.5 px-3 text-slate-600 text-xs whitespace-nowrap" title="${tenant.address || '-'}">
            ${tenant.address || '-'}
          </td>

          <!-- Room -->
          <td class="py-3.5 px-3 whitespace-nowrap">${roomBadge}</td>

          <!-- Start Date -->
          <td class="py-3.5 px-3 text-slate-600 text-xs font-mono whitespace-nowrap">${tenant.startDate || '-'}</td>

          <!-- Status -->
          <td class="py-3.5 px-3 whitespace-nowrap">${statusBadge}</td>

          <!-- Action Buttons -->
          <td class="py-3.5 px-3 text-right space-x-1.5 space-x-reverse whitespace-nowrap">
            <button onclick="window.editTenant('${tenant.id}')" class="text-blue-600 hover:text-blue-800 p-1.5 font-medium rounded-lg hover:bg-blue-50 transition" title="កែប្រែ">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="window.deleteTenant('${tenant.id}')" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition" title="លុប">
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
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          
          <!-- Card Header: Photo + Name + Status -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              ${tenant.photoUrl ? `
                <img src="${tenant.photoUrl}" onclick="window.viewTenantPhoto('${tenant.photoUrl}', '${tenant.name}')" 
                     class="w-12 h-12 rounded-full object-cover border border-slate-200 cursor-pointer shadow-xs flex-shrink-0" 
                     title="ចុចដើម្បីមើលរូបភាព">
              ` : `
                <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base shadow-inner flex-shrink-0">
                  ${tenant.name.charAt(0)}
                </div>
              `}
              <div class="min-w-0">
                <div class="font-bold text-sm text-slate-900 truncate">${tenant.name}</div>
                <div class="text-[11px] text-slate-400 font-mono">ID: ${tenant.id}</div>
              </div>
            </div>
            
            <span class="text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 flex-shrink-0 ${isOccupied ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}">
              <span class="w-2 h-2 rounded-full ${isOccupied ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
              <span class="text-[11px]">${isOccupied ? 'ស្នាក់នៅ' : 'ចាកចេញ'}</span>
            </span>
          </div>

          <!-- Room & Phone Quick Info -->
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div>
              <span class="text-slate-400 block text-[10px]">បន្ទប់ស្នាក់នៅ:</span>
              <span class="font-bold text-blue-900 flex items-center gap-1 mt-0.5">
                <i class="fa-solid fa-door-closed text-blue-600"></i> ${room ? `បន្ទប់ ${room.roomNumber}` : 'គ្មានបន្ទប់'}
              </span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">លេខទូរស័ព្ទ:</span>
              <a href="tel:${tenant.phone}" class="font-bold text-emerald-700 flex items-center gap-1 mt-0.5 font-mono">
                <i class="fa-solid fa-phone text-emerald-600"></i> ${tenant.phone}
              </a>
            </div>
          </div>

          <!-- Other Details -->
          <div class="text-xs text-slate-600 space-y-1.5 pt-1">
            ${(tenant.idCard || tenant.idCardPhotoUrl) ? `
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 flex items-center gap-1"><i class="fa-solid fa-address-card text-slate-400"></i> អត្តសញ្ញាណប័ណ្ណ:</span>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-medium text-slate-700">${tenant.idCard || '-'}</span>
                  ${tenant.idCardPhotoUrl ? `
                    <button type="button" onclick="window.viewTenantPhoto('${tenant.idCardPhotoUrl}', '${tenant.name} (អត្តសញ្ញាណប័ណ្ណ)')" 
                            class="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-sans font-semibold text-[10px] flex items-center gap-1 border border-blue-200">
                      <i class="fa-solid fa-id-card text-[10px]"></i> មើលរូប
                    </button>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            ${tenant.address ? `
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 flex items-center gap-1"><i class="fa-solid fa-location-dot text-slate-400"></i> អាសយដ្ឋាន:</span>
                <span class="text-slate-700 max-w-[180px] truncate text-right">${tenant.address}</span>
              </div>
            ` : ''}
            ${tenant.startDate ? `
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-400 flex items-center gap-1"><i class="fa-solid fa-calendar-days text-slate-400"></i> ថ្ងៃចូលនៅ:</span>
                <span class="font-mono text-slate-700">${tenant.startDate}</span>
              </div>
            ` : ''}
          </div>

          <!-- Card Actions -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <a href="tel:${tenant.phone}" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-semibold flex items-center gap-1.5 border border-emerald-200 transition">
              <i class="fa-solid fa-phone text-xs"></i> <span>ខលទូរស័ព្ទ</span>
            </a>
            <div class="flex items-center gap-2">
              <button onclick="window.editTenant('${tenant.id}')" class="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold flex items-center gap-1.5 border border-blue-200 transition">
                <i class="fa-solid fa-pen-to-square"></i> <span>កែប្រែ</span>
              </button>
              <button onclick="window.deleteTenant('${tenant.id}')" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition" title="លុបអ្នកជួល">
                <i class="fa-solid fa-trash-can"></i>
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

  if (currentCameraTarget === 'idcard') {
    document.getElementById('tenant-idcard-photo-data').value = currentCapturedPhotoData;
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
    document.getElementById('tenant-photo-data').value = currentCapturedPhotoData;
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
  if (!modal || !img) return;

  img.src = photoUrl;
  if (title) title.innerHTML = `<i class="fa-solid fa-image text-blue-600"></i> <span>រូបថត/អត្តសញ្ញាណប័ណ្ណ: ${name}</span>`;
  modal.classList.remove('hidden');
}

export function closePhotoViewer() {
  const modal = document.getElementById('photo-viewer-modal');
  if (modal) modal.classList.add('hidden');
}
