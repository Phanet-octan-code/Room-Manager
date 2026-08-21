// ============================================
// Central Data Store & Supabase Realtime Sync
// Connects directly to Supabase PostgreSQL
// ============================================

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
    this.initData();
  }

  // Initialize storage keys
  initData() {
    if (!localStorage.getItem('rental_rooms')) {
      localStorage.setItem('rental_rooms', JSON.stringify([]));
    }
    if (!localStorage.getItem('rental_tenants')) {
      localStorage.setItem('rental_tenants', JSON.stringify([]));
    }
    if (!localStorage.getItem('rental_meter_readings')) {
      localStorage.setItem('rental_meter_readings', JSON.stringify([]));
    }
    if (!localStorage.getItem('rental_invoices')) {
      localStorage.setItem('rental_invoices', JSON.stringify([]));
    }
    if (!localStorage.getItem('rental_expenses')) {
      localStorage.setItem('rental_expenses', JSON.stringify([]));
    }
    if (!localStorage.getItem('rental_settings')) {
      localStorage.setItem('rental_settings', JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  get(key) {
    try {
      const data = localStorage.getItem(`rental_${key}`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return [];
    }
  }

  set(key, data) {
    try {
      localStorage.setItem(`rental_${key}`, JSON.stringify(data));
      this.syncCollectionToSupabase(key, data);
      return true;
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
      return false;
    }
  }

  // Write single document directly to Supabase
  async writeDocToSupabase(collectionName, docId, data) {
    try {
      await fetch('/api/sync/doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName, docId, data })
      });
      console.log(`[Supabase] Document ${collectionName}/${docId} synced.`);
    } catch (err) {
      console.warn(`[Supabase write error] ${collectionName}/${docId}:`, err);
    }
  }

  // Delete document directly from Supabase
  async deleteDocFromSupabase(collectionName, docId) {
    try {
      await fetch('/api/sync/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionName, docId })
      });
      console.log(`[Supabase] Document ${collectionName}/${docId} deleted.`);
    } catch (err) {
      console.warn(`[Supabase delete error] ${collectionName}/${docId}:`, err);
    }
  }

  // Bulk sync collection to Supabase
  async syncCollectionToSupabase(collectionName, data) {
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
      console.warn(`[Supabase collection sync error] ${collectionName}:`, err);
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
        if (d.rooms && d.rooms.length) localStorage.setItem('rental_rooms', JSON.stringify(d.rooms));
        if (d.tenants && d.tenants.length) localStorage.setItem('rental_tenants', JSON.stringify(d.tenants));
        if (d.meter_readings && d.meter_readings.length) localStorage.setItem('rental_meter_readings', JSON.stringify(d.meter_readings));
        if (d.invoices && d.invoices.length) localStorage.setItem('rental_invoices', JSON.stringify(d.invoices));
        if (d.expenses && d.expenses.length) localStorage.setItem('rental_expenses', JSON.stringify(d.expenses));
        if (d.users && d.users.length) localStorage.setItem('rental_users', JSON.stringify(d.users));
        if (d.settings) localStorage.setItem('rental_settings', JSON.stringify(d.settings));
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
    try {
      const s = localStorage.getItem('rental_settings');
      return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings) {
    localStorage.setItem('rental_settings', JSON.stringify(settings));
    this.writeDocToSupabase('settings', 'global_settings', settings);
  }

  // Rooms
  getRooms() { return this.get('rooms'); }
  saveRooms(rooms) { return this.set('rooms', rooms); }

  getRoomById(id) {
    return this.getRooms().find(r => r.id === id);
  }

  addRoom(room) {
    const rooms = this.getRooms();
    const cleanNum = String(room.roomNumber || '').replace(/\s+/g, '');
    const newRoom = {
      id: `room_${cleanNum || Date.now()}`,
      roomNumber: cleanNum || '101',
      floor: parseInt(room.floor) || 1,
      rent: parseFloat(room.rent || room.price) || 0,
      price: parseFloat(room.price || room.rent) || 0,
      deposit: parseFloat(room.deposit) || 0,
      roomType: room.roomType || 'fan',
      status: room.status || 'available',
      tenantId: room.tenantId || null,
      description: room.description || '',
      createdAt: new Date().toISOString()
    };
    rooms.push(newRoom);
    this.saveRooms(rooms);
    this.writeDocToSupabase('rooms', newRoom.id, newRoom);
    return newRoom;
  }

  updateRoom(id, updatedData) {
    let rooms = this.getRooms();
    rooms = rooms.map(r => r.id === id ? {
      ...r,
      ...updatedData,
      rent: updatedData.rent !== undefined ? updatedData.rent : (updatedData.price !== undefined ? updatedData.price : r.rent),
      price: updatedData.price !== undefined ? updatedData.price : (updatedData.rent !== undefined ? updatedData.rent : r.price)
    } : r);
    this.saveRooms(rooms);
    const updated = rooms.find(r => r.id === id);
    if (updated) this.writeDocToSupabase('rooms', id, updated);
  }

  deleteRoom(id) {
    let rooms = this.getRooms();
    rooms = rooms.filter(r => r.id !== id);
    this.saveRooms(rooms);
    this.deleteDocFromSupabase('rooms', id);
  }

  // Tenants
  getTenants() { return this.get('tenants'); }
  saveTenants(tenants) { return this.set('tenants', tenants); }

  getTenantById(id) {
    return this.getTenants().find(t => t.id === id);
  }

  addTenant(tenant) {
    const tenants = this.getTenants();
    const count = tenants.length + 1;
    const padCount = String(count).padStart(3, '0');
    const newTenant = {
      id: `tenant_${padCount}`,
      name: tenant.name,
      phone: tenant.phone,
      roomId: tenant.roomId || null,
      startDate: tenant.startDate || new Date().toISOString().split('T')[0],
      gender: tenant.gender || 'male',
      address: tenant.address || '',
      idCard: tenant.idCard || '',
      status: tenant.status || 'active',
      emergencyPhone: tenant.emergencyPhone || '',
      photoUrl: tenant.photoUrl || ''
    };
    tenants.push(newTenant);
    this.saveTenants(tenants);
    this.writeDocToSupabase('tenants', newTenant.id, newTenant);

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
    if (updated) this.writeDocToSupabase('tenants', id, updated);

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
    let tenants = this.getTenants();
    tenants = tenants.filter(t => t.id !== id);
    this.saveTenants(tenants);
    this.deleteDocFromSupabase('tenants', id);
  }

  // Meter Readings
  getReadings() { return this.get('meter_readings'); }
  saveReadings(readings) { return this.set('meter_readings', readings); }

  getReading(month, roomId) {
    const readings = this.getReadings();
    return readings.find(r => r.month === month && r.roomId === roomId);
  }

  saveReading(month, roomId, data) {
    let readings = this.getReadings();
    const settings = this.getSettings();

    const waterOld = data.waterOld !== undefined ? data.waterOld : (data.oldWater || 0);
    const waterNew = data.waterNew !== undefined ? data.waterNew : (data.newWater || waterOld);
    const electricityOld = data.electricityOld !== undefined ? data.electricityOld : (data.oldElectric || 0);
    const electricityNew = data.electricityNew !== undefined ? data.electricityNew : (data.newElectric || electricityOld);

    const waterUsage = Math.max(0, waterNew - waterOld);
    const electricUsage = Math.max(0, electricityNew - electricityOld);
    const waterAmount = waterUsage * (settings.waterRate || 2200);
    const electricityAmount = electricUsage * (settings.electricityRate || 1000);

    const cleanId = `reading_${month.replace('-', '')}_${roomId}`;

    const entry = {
      id: cleanId,
      roomId,
      month,
      waterOld,
      waterNew,
      oldWater: waterOld,
      newWater: waterNew,
      waterUsage,
      waterAmount,
      electricityOld,
      electricityNew,
      oldElectric: electricityOld,
      newElectric: electricityNew,
      electricUsage,
      electricityAmount,
      updatedAt: new Date().toISOString()
    };

    const idx = readings.findIndex(r => r.month === month && r.roomId === roomId);
    if (idx >= 0) {
      readings[idx] = { ...readings[idx], ...entry };
    } else {
      readings.push(entry);
    }
    this.saveReadings(readings);
    this.writeDocToSupabase('meter_readings', entry.id, entry);
  }

  // Invoices
  getInvoices() { return this.get('invoices'); }
  saveInvoices(invoices) { return this.set('invoices', invoices); }

  getInvoiceById(id) {
    return this.getInvoices().find(inv => inv.id === id);
  }

  addOrUpdateInvoice(invoiceData) {
    let invoices = this.getInvoices();
    const count = invoices.length + 1;
    const invoiceId = invoiceData.id || `invoice_${String(count).padStart(3, '0')}`;

    const fullDoc = {
      id: invoiceId,
      createdAt: new Date().toISOString(),
      ...invoiceData
    };

    const idx = invoices.findIndex(i => i.id === invoiceId);
    if (idx >= 0) {
      invoices[idx] = { ...invoices[idx], ...fullDoc, updatedAt: new Date().toISOString() };
    } else {
      invoices.push(fullDoc);
    }
    this.saveInvoices(invoices);
    this.writeDocToSupabase('invoices', invoiceId, fullDoc);
  }

  deleteInvoice(id) {
    let invoices = this.getInvoices();
    invoices = invoices.filter(i => i.id !== id);
    this.saveInvoices(invoices);
    this.deleteDocFromSupabase('invoices', id);
  }

  updateInvoicePayment(id, status, paidAmount = null) {
    let invoices = this.getInvoices();
    invoices = invoices.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          status,
          paidAmount: status === 'paid' ? (inv.totalUsd || inv.totalKhr) : (paidAmount !== null ? paidAmount : inv.paidAmount),
          paidDate: status === 'paid' ? new Date().toISOString() : null
        };
      }
      return inv;
    });
    this.saveInvoices(invoices);
    const updated = invoices.find(i => i.id === id);
    if (updated) this.writeDocToSupabase('invoices', id, updated);
  }

  // Expenses
  getExpenses() { return this.get('expenses'); }
  saveExpenses(expenses) { return this.set('expenses', expenses); }

  addExpense(exp) {
    const expenses = this.getExpenses();
    const count = expenses.length + 1;
    const newExp = {
      id: `exp_${String(count).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      ...exp
    };
    expenses.push(newExp);
    this.saveExpenses(expenses);
    this.writeDocToSupabase('expenses', newExp.id, newExp);
    return newExp;
  }

  deleteExpense(id) {
    let expenses = this.getExpenses();
    expenses = expenses.filter(e => e.id !== id);
    this.saveExpenses(expenses);
    this.deleteDocFromSupabase('expenses', id);
  }

  // Backup & Restore
  exportBackup() {
    const backup = {
      version: '3.0',
      databaseEngine: 'Supabase PostgreSQL',
      supabaseProject: 'rsaxtgzmyzinvyuimthi',
      supabaseHost: 'aws-0-ap-southeast-1.pooler.supabase.com',
      exportedAt: new Date().toISOString(),
      rooms: this.getRooms(),
      tenants: this.getTenants(),
      meter_readings: this.getReadings(),
      invoices: this.getInvoices(),
      expenses: this.getExpenses(),
      settings: this.getSettings()
    };
    return JSON.stringify(backup, null, 2);
  }

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.rooms) this.saveRooms(data.rooms);
      if (data.tenants) this.saveTenants(data.tenants);
      if (data.meter_readings || data.readings) this.saveReadings(data.meter_readings || data.readings);
      if (data.invoices) this.saveInvoices(data.invoices);
      if (data.expenses) this.saveExpenses(data.expenses);
      if (data.settings) this.saveSettings(data.settings);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  resetToDefault() {
    localStorage.setItem('rental_rooms', JSON.stringify([]));
    localStorage.setItem('rental_tenants', JSON.stringify([]));
    localStorage.setItem('rental_meter_readings', JSON.stringify([]));
    localStorage.setItem('rental_invoices', JSON.stringify([]));
    localStorage.setItem('rental_expenses', JSON.stringify([]));
    localStorage.setItem('rental_settings', JSON.stringify(DEFAULT_SETTINGS));
    this.pushAllToSupabase();
  }
}

export const store = new Store();
