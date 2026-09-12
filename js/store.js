// ========================================================
// Central Data Store & Realtime Cloud Sync
// Connects to Firebase Cloud Firestore & Supabase PostgreSQL
// ========================================================

import { 
  isFirebaseConnected, 
  initializeFirebase, 
  writeDocToFirebase, 
  deleteDocFromFirebase, 
  syncCollectionToFirebase, 
  pushAllToFirebase, 
  pullAllFromFirebase 
} from './firebase-config.js';
import { isSupabaseConnected, initializeSupabase } from './supabase-config.js';

export const DEFAULT_SETTINGS = {
  appName: 'បន្ទប់ជួល Management System',
  landlordName: 'PHANET THAI',
  landlordPhone: '012 345 678',
  landlordAddress: 'ផ្លូវលេខ 2004, សង្កាត់កាកាប, ខណ្ឌពោធិ៍សែនជ័យ, ភ្នំពេញ',
  electricityRate: 1000,   // 1,000 KHR / kWh
  waterRate: 2200,         // 2,200 KHR / m³
  trashFee: 4000,          // 4,000 KHR / month
  wifiFee: 0,
  exchangeRate: 4000,      // 4,000 KHR / 1 USD
  currencyDefault: 'USD',
  abaKhqrAccount: '008 270 003',      // USD
  abaKhqrAccountKhr: '008 270 004',   // KHR
  abaAccountName: 'PHANET THAI',
  qrImageUrl: 'img/aba_qr.png',
  invoiceNote: 'សូមទូទាត់ប្រាក់ឱ្យបានមុនថ្ងៃទី ០៥ នៃខែនីមួយៗ។ សូមអរគុណ!'
};

class Store {
  constructor() {
    this.cache = {
      rooms: [],
      tenants: [],
      meter_readings: [],
      invoices: [],
      expenses: [],
      users: [],
      settings: { ...DEFAULT_SETTINGS }
    };
    this.listeners = [];
    this.initData();
  }

  // Initialize storage keys from local cache initially
  initData() {
    try {
      const storedRooms = localStorage.getItem('rental_rooms');
      if (storedRooms) this.cache.rooms = JSON.parse(storedRooms);

      const storedTenants = localStorage.getItem('rental_tenants');
      if (storedTenants) this.cache.tenants = JSON.parse(storedTenants);

      const storedReadings = localStorage.getItem('rental_meter_readings');
      if (storedReadings) this.cache.meter_readings = JSON.parse(storedReadings);

      const storedInvoices = localStorage.getItem('rental_invoices');
      if (storedInvoices) this.cache.invoices = JSON.parse(storedInvoices);

      const storedExpenses = localStorage.getItem('rental_expenses');
      if (storedExpenses) this.cache.expenses = JSON.parse(storedExpenses);

      const storedUsers = localStorage.getItem('rental_users');
      if (storedUsers) this.cache.users = JSON.parse(storedUsers);

      const storedSettings = localStorage.getItem('rental_settings');
      if (storedSettings) this.cache.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
    } catch (e) {
      console.warn('Cache load notice:', e);
    }
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(this.cache); } catch (e) { console.error('Listener error:', e); }
    });
  }

  get(key) {
    if (key === 'settings') return this.cache.settings || DEFAULT_SETTINGS;
    return this.cache[key] || [];
  }

  set(key, data) {
    try {
      this.cache[key] = data;
      localStorage.setItem(`rental_${key}`, JSON.stringify(data));
      this.syncCollectionToCloud(key, data);
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
      return false;
    }
  }

  // Unified write document to Cloud (Firebase Firestore + Supabase fallback)
  async writeDocToCloud(collectionName, docId, data) {
    // 1. Write to Firebase Firestore
    writeDocToFirebase(collectionName, docId, data).catch(err => {
      console.warn(`[Firebase write notice] ${collectionName}/${docId}:`, err);
    });
    // 2. Write to Supabase PostgreSQL (if available)
    this.writeDocToSupabase(collectionName, docId, data);
  }

  // Unified delete document from Cloud
  async deleteDocFromCloud(collectionName, docId) {
    // 1. Delete from Firebase Firestore
    deleteDocFromFirebase(collectionName, docId).catch(err => {
      console.warn(`[Firebase delete notice] ${collectionName}/${docId}:`, err);
    });
    // 2. Delete from Supabase
    this.deleteDocFromSupabase(collectionName, docId);
  }

  // Unified sync collection to Cloud
  async syncCollectionToCloud(collectionName, data) {
    syncCollectionToFirebase(collectionName, data).catch(err => {
      console.warn(`[Firebase sync notice] ${collectionName}:`, err);
    });
    this.syncCollectionToSupabase(collectionName, data);
  }

  // Write single document directly to Supabase
  async writeDocToSupabase(collectionName, docId, data) {
    if (!isSupabaseConnected()) return;
    try {
      await fetch('/api/sync/doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName, docId, data })
      });
    } catch (err) {
      // Silently ignore when backend is not active
    }
  }

  // Delete document directly from Supabase
  async deleteDocFromSupabase(collectionName, docId) {
    if (!isSupabaseConnected()) return;
    try {
      await fetch('/api/sync/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName, docId })
      });
    } catch (err) {
      // Silently ignore when backend is not active
    }
  }

  // Bulk sync collection to Supabase
  async syncCollectionToSupabase(collectionName, data) {
    if (!isSupabaseConnected()) return;
    try {
      if (Array.isArray(data)) {
        await fetch('/api/sync/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectionName, items: data })
        });
      } else {
        await fetch('/api/sync/doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectionName: 'settings', docId: 'global_settings', data })
        });
      }
    } catch (err) {
      // Silently ignore when backend is not active
    }
  }

  // Push all local data to Firebase Cloud Firestore
  async pushAllToFirebase() {
    const payload = {
      rooms: this.getRooms(),
      tenants: this.getTenants(),
      meter_readings: this.getReadings(),
      invoices: this.getInvoices(),
      expenses: this.getExpenses(),
      settings: this.getSettings(),
      users: this.get('users')
    };
    return await pushAllToFirebase(payload);
  }

  // Pull all live collections from Firebase Cloud Firestore
  async loadFromFirebase() {
    try {
      const res = await pullAllFromFirebase();
      if (!res.success || !res.data) return false;
      const d = res.data;

      let hasData = false;

      if (Array.isArray(d.rooms) && d.rooms.length > 0) {
        this.cache.rooms = d.rooms;
        localStorage.setItem('rental_rooms', JSON.stringify(d.rooms));
        hasData = true;
      }
      if (Array.isArray(d.tenants) && d.tenants.length > 0) {
        this.cache.tenants = d.tenants;
        localStorage.setItem('rental_tenants', JSON.stringify(d.tenants));
        hasData = true;
      }
      if (Array.isArray(d.meter_readings) && d.meter_readings.length > 0) {
        this.cache.meter_readings = d.meter_readings;
        localStorage.setItem('rental_meter_readings', JSON.stringify(d.meter_readings));
        hasData = true;
      }
      if (Array.isArray(d.invoices) && d.invoices.length > 0) {
        this.cache.invoices = d.invoices;
        localStorage.setItem('rental_invoices', JSON.stringify(d.invoices));
        hasData = true;
      }
      if (Array.isArray(d.expenses) && d.expenses.length > 0) {
        this.cache.expenses = d.expenses;
        localStorage.setItem('rental_expenses', JSON.stringify(d.expenses));
        hasData = true;
      }
      if (Array.isArray(d.users) && d.users.length > 0) {
        this.cache.users = d.users;
        localStorage.setItem('rental_users', JSON.stringify(d.users));
        hasData = true;
      }
      if (d.settings && typeof d.settings === 'object' && Object.keys(d.settings).length > 0) {
        this.cache.settings = { ...DEFAULT_SETTINGS, ...d.settings };
        localStorage.setItem('rental_settings', JSON.stringify(this.cache.settings));
        hasData = true;
      }

      this.notifyListeners();
      return hasData;
    } catch (err) {
      console.error('Error pulling data from Firebase:', err);
      return false;
    }
  }

  // Push all local data to Supabase
  async pushAllToSupabase() {
    try {
      const payload = {
        rooms: this.getRooms(),
        tenants: this.getTenants(),
        meter_readings: this.getReadings(),
        invoices: this.getInvoices(),
        expenses: this.getExpenses(),
        settings: this.getSettings(),
        users: this.get('users')
      };

      const res = await fetch('/api/sync/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Pull all live collections from Supabase
  async loadFromSupabase() {
    try {
      const res = await fetch('/api/pull/all');
      if (!res.ok) return false;
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        if (Array.isArray(d.rooms)) {
          this.cache.rooms = d.rooms;
          localStorage.setItem('rental_rooms', JSON.stringify(d.rooms));
        }
        if (Array.isArray(d.tenants)) {
          this.cache.tenants = d.tenants;
          localStorage.setItem('rental_tenants', JSON.stringify(d.tenants));
        }
        if (Array.isArray(d.meter_readings)) {
          this.cache.meter_readings = d.meter_readings;
          localStorage.setItem('rental_meter_readings', JSON.stringify(d.meter_readings));
        }
        if (Array.isArray(d.invoices)) {
          this.cache.invoices = d.invoices;
          localStorage.setItem('rental_invoices', JSON.stringify(d.invoices));
        }
        if (Array.isArray(d.expenses)) {
          this.cache.expenses = d.expenses;
          localStorage.setItem('rental_expenses', JSON.stringify(d.expenses));
        }
        if (Array.isArray(d.users) && d.users.length) {
          this.cache.users = d.users;
          localStorage.setItem('rental_users', JSON.stringify(d.users));
        }
        if (d.settings && typeof d.settings === 'object') {
          this.cache.settings = { ...DEFAULT_SETTINGS, ...d.settings };
          localStorage.setItem('rental_settings', JSON.stringify(this.cache.settings));
        }
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error pulling data from Supabase:', err);
      return false;
    }
  }

  // Settings
  getSettings() {
    return this.cache.settings || DEFAULT_SETTINGS;
  }

  saveSettings(settings) {
    this.cache.settings = { ...DEFAULT_SETTINGS, ...settings };
    localStorage.setItem('rental_settings', JSON.stringify(this.cache.settings));
    this.writeDocToCloud('settings', 'global_settings', this.cache.settings);
    this.notifyListeners();
  }

  // Rooms
  getRooms() { return this.get('rooms'); }
  saveRooms(rooms) { return this.set('rooms', rooms); }

  getRoomById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const cleanNum = cleanId.replace(/^room[-_]?/i, '');
    return this.getRooms().find(r => 
      r.id === cleanId || 
      String(r.id) === cleanId ||
      r.roomNumber === cleanId ||
      String(r.roomNumber) === cleanId ||
      String(r.roomNumber) === cleanNum ||
      r.id === `room_${cleanNum}` ||
      `room_${r.roomNumber}` === cleanId
    ) || null;
  }

  getTenantForRoom(roomId) {
    if (!roomId) return null;
    const room = this.getRoomById(roomId);
    const tenants = this.getTenants();

    // 1. Direct tenantId reference on room object
    if (room && room.tenantId) {
      const t = tenants.find(t => t.id === room.tenantId);
      if (t) return t;
    }

    // 2. Direct roomId reference on tenant object
    const targetRoomId = room ? room.id : roomId;
    const roomNum = room ? String(room.roomNumber).replace(/^room[-_]?/i, '') : String(roomId).replace(/^room[-_]?/i, '');

    // Check active tenants first
    const activeTenant = tenants.find(t => 
      t.status !== 'inactive' && (
        t.roomId === targetRoomId ||
        t.roomId === roomId ||
        t.roomId === roomNum ||
        `room_${t.roomId}` === targetRoomId ||
        (t.roomId && String(t.roomId).replace(/^room[-_]?/i, '') === roomNum)
      )
    );
    if (activeTenant) {
      // Auto-heal relationship if room didn't have tenantId set
      if (room && room.tenantId !== activeTenant.id) {
        room.tenantId = activeTenant.id;
        room.status = 'occupied';
        this.updateRoom(room.id, { tenantId: activeTenant.id, status: 'occupied' });
      }
      return activeTenant;
    }

    // 3. Fallback to any tenant matching roomId
    const anyTenant = tenants.find(t => 
      t.roomId === targetRoomId ||
      t.roomId === roomId ||
      t.roomId === roomNum ||
      `room_${t.roomId}` === targetRoomId ||
      (t.roomId && String(t.roomId).replace(/^room[-_]?/i, '') === roomNum)
    );
    if (anyTenant && room && room.tenantId !== anyTenant.id) {
      room.tenantId = anyTenant.id;
      this.updateRoom(room.id, { tenantId: anyTenant.id });
    }
    return anyTenant || null;
  }

  addRoom(room) {
    const rooms = this.getRooms();
    const cleanNum = String(room.roomNumber || '').replace(/\s+/g, '');
    const newRoom = {
      id: `room_${cleanNum || Date.now()}`,
      roomNumber: room.roomNumber,
      floor: parseInt(room.floor) || 1,
      roomType: room.roomType || 'fan',
      price: parseFloat(room.price) || 50,
      deposit: parseFloat(room.deposit) || 0,
      status: room.status || 'available',
      tenantId: room.tenantId || null,
      description: room.description || '',
      createdAt: new Date().toISOString()
    };
    rooms.push(newRoom);
    this.saveRooms(rooms);
    this.writeDocToCloud('rooms', newRoom.id, newRoom);
    return newRoom;
  }

  updateRoom(id, updatedData) {
    let rooms = this.getRooms();
    rooms = rooms.map(r => r.id === id ? { ...r, ...updatedData } : r);
    this.saveRooms(rooms);
    const updated = rooms.find(r => r.id === id);
    if (updated) this.writeDocToCloud('rooms', id, updated);
  }

  deleteRoom(id) {
    const rooms = this.getRooms().filter(r => r.id !== id);
    this.saveRooms(rooms);
    this.deleteDocFromCloud('rooms', id);

    // Unassign room from tenant if assigned
    const tenants = this.getTenants().map(t => {
      if (t.roomId === id) {
        const updated = { ...t, roomId: null };
        this.writeDocToCloud('tenants', t.id, updated);
        return updated;
      }
      return t;
    });
    this.saveTenants(tenants);
  }

  // Tenants
  getTenants() { return this.get('tenants'); }
  saveTenants(tenants) { return this.set('tenants', tenants); }

  getTenantById(id) {
    return this.getTenants().find(t => t.id === id);
  }

  addTenant(tenant) {
    const tenants = this.getTenants();
    const uniqueId = tenant.id || `tenant_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newTenant = {
      id: uniqueId,
      name: tenant.name,
      phone: tenant.phone,
      roomId: tenant.roomId || null,
      startDate: tenant.startDate || new Date().toISOString().split('T')[0],
      gender: tenant.gender || 'male',
      address: tenant.address || '',
      idCard: tenant.idCard || '',
      idCardPhotoUrl: tenant.idCardPhotoUrl || tenant.idCardPhoto || tenant.idCardImage || '',
      status: tenant.status || 'active',
      emergencyPhone: tenant.emergencyPhone || '',
      photoUrl: tenant.photoUrl || ''
    };
    tenants.push(newTenant);
    this.saveTenants(tenants);
    this.writeDocToCloud('tenants', newTenant.id, newTenant);

    if (newTenant.roomId) {
      this.updateRoom(newTenant.roomId, {
        status: 'occupied',
        tenantId: newTenant.id
      });
    }
    return newTenant;
  }

  updateTenant(id, updatedData) {
    let tenants = this.getTenants();
    const oldTenant = tenants.find(t => t.id === id);

    tenants = tenants.map(t => t.id === id ? { ...t, ...updatedData } : t);
    this.saveTenants(tenants);

    const updated = tenants.find(t => t.id === id);
    if (updated) this.writeDocToCloud('tenants', id, updated);

    if (oldTenant && updatedData.roomId && oldTenant.roomId !== updatedData.roomId) {
      if (oldTenant.roomId) {
        this.updateRoom(oldTenant.roomId, { status: 'available', tenantId: null });
      }
      if (updatedData.status === 'active') {
        this.updateRoom(updatedData.roomId, { status: 'occupied', tenantId: id });
      }
    } else if (updatedData.status === 'inactive' && oldTenant && oldTenant.roomId) {
      this.updateRoom(oldTenant.roomId, { status: 'available', tenantId: null });
    }
  }

  deleteTenant(id) {
    const tenant = this.getTenantById(id);
    if (tenant && tenant.roomId) {
      this.updateRoom(tenant.roomId, { status: 'available', tenantId: null });
    }
    const tenants = this.getTenants().filter(t => t.id !== id);
    this.saveTenants(tenants);
    this.deleteDocFromCloud('tenants', id);
  }

  // Meter Readings
  getReadings() { return this.get('meter_readings'); }
  saveReadings(readings) { return this.set('meter_readings', readings); }

  getReadingForRoomMonth(roomId, month) {
    if (!roomId || !month) return null;
    return this.getReadings().find(r => 
      (r.roomId === roomId || String(r.roomId).replace(/^room[-_]?/i, '') === String(roomId).replace(/^room[-_]?/i, '')) && 
      r.month === month
    ) || null;
  }

  getReading(param1, param2) {
    if (!param1 && !param2) return null;
    const isMonth1 = typeof param1 === 'string' && /^\d{4}-\d{2}$/.test(param1);
    const month = isMonth1 ? param1 : param2;
    const roomId = isMonth1 ? param2 : param1;
    return this.getReadingForRoomMonth(roomId, month) || null;
  }

  getPreviousReading(roomId, currentMonth) {
    if (!roomId) return null;
    const cleanRoom = String(roomId).replace(/^room[-_]?/i, '');
    const readings = this.getReadings()
      .filter(r => (r.roomId === roomId || String(r.roomId).replace(/^room[-_]?/i, '') === cleanRoom) && (!currentMonth || r.month < currentMonth))
      .sort((a, b) => b.month.localeCompare(a.month));
    return readings[0] || null;
  }

  saveReading(param1, param2, param3) {
    let reading;
    if (typeof param1 === 'object' && param1 !== null) {
      reading = param1;
    } else {
      const isMonth1 = typeof param1 === 'string' && /^\d{4}-\d{2}$/.test(param1);
      const month = isMonth1 ? param1 : param2;
      const roomId = isMonth1 ? param2 : param1;
      reading = { ...(param3 || {}), month, roomId };
    }
    if (!reading || !reading.roomId || !reading.month) return null;

    const readings = this.getReadings();
    const idx = readings.findIndex(r => r.roomId === reading.roomId && r.month === reading.month);
    let readingDoc;
    if (idx >= 0) {
      readings[idx] = { ...readings[idx], ...reading, updatedAt: new Date().toISOString() };
      readingDoc = readings[idx];
    } else {
      readingDoc = {
        id: `reading_${reading.roomId}_${reading.month}`,
        ...reading,
        createdAt: new Date().toISOString()
      };
      readings.push(readingDoc);
    }
    this.saveReadings(readings);
    this.writeDocToCloud('meter_readings', readingDoc.id, readingDoc);
    return readingDoc;
  }

  // Invoices
  getInvoices() { return this.get('invoices'); }
  saveInvoices(invoices) { return this.set('invoices', invoices); }

  getInvoiceById(id) {
    return this.getInvoices().find(i => i.id === id);
  }

  addInvoice(invoice) {
    const invoices = this.getInvoices();
    const count = invoices.length + 1;
    const padCount = String(count).padStart(4, '0');
    const monthClean = (invoice.month || new Date().toISOString().slice(0, 7)).replace('-', '');
    const newInvoice = {
      id: `inv_${Date.now()}_${padCount}`,
      invoiceNumber: `INV-${monthClean}-${padCount}`,
      roomId: invoice.roomId,
      roomNumber: invoice.roomNumber,
      tenantName: invoice.tenantName,
      tenantPhone: invoice.tenantPhone,
      month: invoice.month,
      startDate: invoice.startDate,
      paymentDate: invoice.paymentDate,
      roomCostUsd: parseFloat(invoice.roomCostUsd) || 0,
      roomCostKhr: parseFloat(invoice.roomCostKhr) || 0,
      elecOld: parseFloat(invoice.elecOld) || 0,
      elecNew: parseFloat(invoice.elecNew) || 0,
      elecUsage: parseFloat(invoice.elecUsage) || 0,
      elecRate: parseFloat(invoice.elecRate) || 1000,
      elecCostKhr: parseFloat(invoice.elecCostKhr) || 0,
      waterOld: parseFloat(invoice.waterOld) || 0,
      waterNew: parseFloat(invoice.waterNew) || 0,
      waterUsage: parseFloat(invoice.waterUsage) || 0,
      waterRate: parseFloat(invoice.waterRate) || 2200,
      waterCostKhr: parseFloat(invoice.waterCostKhr) || 0,
      trashFeeKhr: parseFloat(invoice.trashFeeKhr) || 0,
      wifiFeeKhr: parseFloat(invoice.wifiFeeKhr) || 0,
      otherFeeKhr: parseFloat(invoice.otherFeeKhr) || 0,
      otherFeeNote: invoice.otherFeeNote || '',
      subtotalKhr: parseFloat(invoice.subtotalKhr) || 0,
      exchangeRate: parseFloat(invoice.exchangeRate) || 4000,
      totalUsd: parseFloat(invoice.totalUsd) || 0,
      totalKhr: parseFloat(invoice.totalKhr) || 0,
      status: invoice.status || 'unpaid',
      paidDate: invoice.status === 'paid' ? new Date().toISOString() : null,
      paidAmount: invoice.status === 'paid' ? (parseFloat(invoice.totalUsd) || 0) : 0,
      note: invoice.note || '',
      createdAt: new Date().toISOString()
    };
    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);
    this.writeDocToCloud('invoices', newInvoice.id, newInvoice);
    return newInvoice;
  }

  updateInvoice(id, updatedData) {
    let invoices = this.getInvoices();
    invoices = invoices.map(inv => inv.id === id ? { ...inv, ...updatedData } : inv);
    this.saveInvoices(invoices);
    const updated = invoices.find(i => i.id === id);
    if (updated) this.writeDocToCloud('invoices', id, updated);
  }

  addOrUpdateInvoice(invoice) {
    const invoices = this.getInvoices();
    const existing = invoices.find(i => 
      i.id === invoice.id || 
      (i.roomId === invoice.roomId && i.month === invoice.month)
    );
    if (existing) {
      this.updateInvoice(existing.id, invoice);
      return { ...existing, ...invoice };
    } else {
      return this.addInvoice(invoice);
    }
  }

  updateInvoicePayment(id, status, paidAmount = null) {
    const invoice = this.getInvoiceById(id);
    if (!invoice) return;
    const amount = paidAmount !== null ? paidAmount : invoice.totalUsd;
    const updated = {
      ...invoice,
      status,
      paidAmount: status === 'paid' ? amount : (status === 'partial' ? amount : 0),
      paidDate: status === 'paid' ? new Date().toISOString() : null
    };
    this.updateInvoice(id, updated);
  }

  deleteInvoice(id) {
    const invoices = this.getInvoices().filter(i => i.id !== id);
    this.saveInvoices(invoices);
    this.deleteDocFromCloud('invoices', id);
  }

  // Expenses
  getExpenses() { return this.get('expenses'); }
  saveExpenses(expenses) { return this.set('expenses', expenses); }

  addExpense(expense) {
    const expenses = this.getExpenses();
    const newExpense = {
      id: `exp_${Date.now()}`,
      category: expense.category || 'other',
      description: expense.description || '',
      amountUsd: parseFloat(expense.amountUsd) || 0,
      amountKhr: parseFloat(expense.amountKhr) || 0,
      date: expense.date || new Date().toISOString().split('T')[0],
      receiptUrl: expense.receiptUrl || '',
      createdAt: new Date().toISOString()
    };
    expenses.unshift(newExpense);
    this.saveExpenses(expenses);
    this.writeDocToCloud('expenses', newExpense.id, newExpense);
    return newExpense;
  }

  deleteExpense(id) {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.saveExpenses(expenses);
    this.deleteDocFromCloud('expenses', id);
  }

  // Dashboard Aggregates
  getDashboardStats() {
    const rooms = this.getRooms();
    const tenants = this.getTenants();
    const invoices = this.getInvoices();
    const settings = this.getSettings();

    const currentMonth = new Date().toISOString().slice(0, 7);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const currentMonthInvoices = invoices.filter(i => i.month === currentMonth);
    const unpaidInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'partial');

    const monthlyExpectedUsd = currentMonthInvoices.reduce((sum, i) => sum + (parseFloat(i.totalUsd) || 0), 0);
    const monthlyCollectedUsd = currentMonthInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (parseFloat(i.totalUsd) || 0), 0);

    const unpaidTotalUsd = unpaidInvoices.reduce((sum, i) => sum + (parseFloat(i.totalUsd) || 0), 0);
    const unpaidTotalKhr = unpaidInvoices.reduce((sum, i) => sum + (parseFloat(i.totalKhr) || 0), 0);

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      occupancyRate,
      totalTenants: tenants.filter(t => (t.status || 'active') === 'active').length,
      monthlyExpectedUsd,
      monthlyCollectedUsd,
      unpaidInvoicesCount: unpaidInvoices.length,
      unpaidTotalUsd,
      unpaidTotalKhr,
      exchangeRate: settings.exchangeRate || 4000
    };
  }
}

export const store = new Store();
