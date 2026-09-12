// =======================================================
// Firebase Cloud Firestore Configuration & Client Module
// Project: room-payment
// =======================================================

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  writeBatch,
  onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js';
import { 
  getStorage, 
  ref as storageRef, 
  uploadString, 
  uploadBytes, 
  getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// Pre-configured credentials provided for room-payment
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDMLsB2drG1t9y0U2UO9MD52kiWhMRQH5s",
  authDomain: "room-payment.firebaseapp.com",
  projectId: "room-payment",
  storageBucket: "room-payment.firebasestorage.app",
  messagingSenderId: "276598215933",
  appId: "1:276598215933:web:d81e7b5c2c690d5089da94",
  measurementId: "G-BNQFL0CT5B"
};

let firebaseApp = null;
let firestoreDb = null;
let analyticsInstance = null;
let isConnected = false;
let lastError = null;
let rulesWarning = false;
let activeListeners = new Map();

// Helper: Sanitize object so Firestore does not reject undefined values
function sanitizeForFirestore(val) {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map(sanitizeForFirestore);
  }
  if (typeof val === 'object' && !(val instanceof Date)) {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        res[k] = sanitizeForFirestore(v);
      }
    }
    return res;
  }
  return val;
}

// Retrieve saved config or default
export function getSavedFirebaseConfig() {
  try {
    const saved = localStorage.getItem('rental_firebase_config');
    if (saved) return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Error reading saved Firebase config:', e);
  }
  return { ...DEFAULT_FIREBASE_CONFIG };
}

// Save config
export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem('rental_firebase_config', JSON.stringify(config));
    return initializeFirebase(config);
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Clear config back to defaults
export function clearFirebaseConfig() {
  localStorage.removeItem('rental_firebase_config');
  return initializeFirebase(DEFAULT_FIREBASE_CONFIG);
}

// Initialize Firebase App & Firestore
export async function initializeFirebase(customConfig = null) {
  try {
    const config = customConfig || getSavedFirebaseConfig();

    if (!config.apiKey || !config.projectId) {
      isConnected = false;
      lastError = 'Missing Firebase API Key or Project ID';
      return { success: false, connected: false, error: lastError };
    }

    // Reuse or create App
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    firestoreDb = getFirestore(firebaseApp);

    // Initialize Analytics if supported
    try {
      if (await isAnalyticsSupported()) {
        analyticsInstance = getAnalytics(firebaseApp);
      }
    } catch (anErr) {
      // Analytics is non-critical
    }

    // Ping Firestore with lightweight read
    const testResult = await testFirebaseConnection();
    return testResult;
  } catch (err) {
    isConnected = false;
    lastError = err.message || String(err);
    console.warn('[Firebase Init Notice]:', err);
    return { 
      success: false, 
      connected: false, 
      error: lastError, 
      code: err.code 
    };
  }
}

// Test Firebase connection & check Firestore Security Rules
export async function testFirebaseConnection() {
  if (!firestoreDb) {
    try {
      const config = getSavedFirebaseConfig();
      if (getApps().length === 0) {
        firebaseApp = initializeApp(config);
      } else {
        firebaseApp = getApp();
      }
      firestoreDb = getFirestore(firebaseApp);
    } catch (e) {
      isConnected = false;
      lastError = e.message;
      return { success: false, connected: false, error: e.message };
    }
  }

  try {
    // Attempt to read the settings/global_settings or test doc
    const testRef = doc(firestoreDb, '_connection_test', 'status');
    // Try writing and deleting test doc to verify read & write permission
    await setDoc(testRef, {
      ping: 'ok',
      clientTime: new Date().toISOString()
    }, { merge: true });

    isConnected = true;
    rulesWarning = false;
    lastError = null;
    console.log('✓ Firebase Firestore connected and read/write verified successfully!');
    return {
      success: true,
      connected: true,
      message: 'Firebase Firestore បានភ្ជាប់ និងអាច Read/Write បានជោគជ័យ!'
    };
  } catch (err) {
    console.warn('[Firebase Connection Test]', err.message || err);
    lastError = err.message || String(err);

    if (err.code === 'permission-denied' || String(err).toLowerCase().includes('permission')) {
      // Database exists but rules block read/write
      isConnected = false;
      rulesWarning = true;
      lastError = 'Firebase Firestore បានភ្ជាប់រួចរាល់ ប៉ុន្តែ Security Rules កំពុង Lock (Permission Denied)។ សូមបើក Security Rules ក្នុង Firebase Console';
      return {
        success: false,
        connected: false,
        rulesWarning: true,
        code: 'permission-denied',
        error: lastError
      };
    }

    isConnected = false;
    return {
      success: false,
      connected: false,
      code: err.code,
      error: err.message
    };
  }
}

export function isFirebaseConnected() {
  return isConnected;
}

export function getFirebaseDb() {
  return firestoreDb;
}

export function hasFirebaseRulesWarning() {
  return rulesWarning;
}

export function getFirebaseLastError() {
  return lastError;
}

// Write single document to Firestore
export async function writeDocToFirebase(collectionName, docId, data) {
  if (rulesWarning) {
    return { success: false, error: 'Firestore Security Rules are locked (permission-denied)', code: 'permission-denied' };
  }
  if (!firestoreDb) {
    await initializeFirebase();
  }
  if (!firestoreDb || rulesWarning) return { success: false, error: 'Firebase not initialized or rules locked' };

  try {
    const cleanData = sanitizeForFirestore({
      ...data,
      _updatedAt: new Date().toISOString()
    });
    const docRef = doc(firestoreDb, collectionName, String(docId));
    await setDoc(docRef, cleanData, { merge: true });
    isConnected = true;
    rulesWarning = false;
    return { success: true };
  } catch (err) {
    const isPermission = err.code === 'permission-denied' || String(err).toLowerCase().includes('permission');
    if (isPermission) {
      rulesWarning = true;
      console.warn(`[Firebase Permission Denied] Firestore Security Rules are locked. Please set "allow read, write: if true;" in Firebase Console.`);
    } else {
      console.warn(`[Firebase writeDoc error] ${collectionName}/${docId}:`, err);
    }
    return { success: false, error: err.message, code: err.code };
  }
}

// Delete single document from Firestore
export async function deleteDocFromFirebase(collectionName, docId) {
  if (rulesWarning) {
    return { success: false, error: 'Firestore Security Rules are locked (permission-denied)', code: 'permission-denied' };
  }
  if (!firestoreDb) {
    await initializeFirebase();
  }
  if (!firestoreDb || rulesWarning) return { success: false, error: 'Firebase not initialized or rules locked' };

  try {
    const docRef = doc(firestoreDb, collectionName, String(docId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    const isPermission = err.code === 'permission-denied' || String(err).toLowerCase().includes('permission');
    if (isPermission) {
      rulesWarning = true;
    } else {
      console.warn(`[Firebase deleteDoc error] ${collectionName}/${docId}:`, err);
    }
    return { success: false, error: err.message, code: err.code };
  }
}

// Batch sync collection to Firestore
export async function syncCollectionToFirebase(collectionName, items) {
  if (rulesWarning) {
    return { success: false, error: 'Firestore Security Rules are locked (permission-denied)', code: 'permission-denied' };
  }
  if (!firestoreDb) {
    await initializeFirebase();
  }
  if (!firestoreDb || rulesWarning) return { success: false, error: 'Firebase not initialized or rules locked' };

  try {
    if (!Array.isArray(items)) {
      // Single object (e.g. settings)
      return await writeDocToFirebase(collectionName, 'global_settings', items);
    }

    // Firestore batch supports up to 500 operations
    const chunks = [];
    for (let i = 0; i < items.length; i += 400) {
      chunks.push(items.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(firestoreDb);
      for (const item of chunk) {
        const id = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const cleanData = sanitizeForFirestore({
          ...item,
          _updatedAt: new Date().toISOString()
        });
        const docRef = doc(firestoreDb, collectionName, String(id));
        batch.set(docRef, cleanData, { merge: true });
      }
      await batch.commit();
    }

    isConnected = true;
    rulesWarning = false;
    return { success: true, count: items.length };
  } catch (err) {
    const isPermission = err.code === 'permission-denied' || String(err).toLowerCase().includes('permission');
    if (isPermission) {
      rulesWarning = true;
      console.warn(`[Firebase Permission Denied] Firestore Security Rules are locked. Please set "allow read, write: if true;" in Firebase Console.`);
    } else {
      console.warn(`[Firebase syncCollection error] ${collectionName}:`, err);
    }
    return { success: false, error: err.message, code: err.code };
  }
}

// Push all local data to Firebase Cloud Firestore
export async function pushAllToFirebase(payload) {
  if (!firestoreDb) {
    await initializeFirebase();
  }
  if (!firestoreDb) return { success: false, error: 'Firebase not initialized' };

  try {
    const collections = ['rooms', 'tenants', 'meter_readings', 'invoices', 'expenses', 'users'];
    const results = {};

    for (const col of collections) {
      if (Array.isArray(payload[col])) {
        results[col] = await syncCollectionToFirebase(col, payload[col]);
      }
    }

    if (payload.settings) {
      results.settings = await writeDocToFirebase('settings', 'global_settings', payload.settings);
    }

    isConnected = true;
    rulesWarning = false;
    return { success: true, message: 'បាន Sync ទិន្នន័យទាំងអស់ទៅ Firebase Firestore ជោគជ័យ!', details: results };
  } catch (err) {
    console.error('[Firebase pushAll error]:', err);
    if (err.code === 'permission-denied') rulesWarning = true;
    return { success: false, error: err.message, code: err.code };
  }
}

// Pull all live collections from Firebase Cloud Firestore
export async function pullAllFromFirebase() {
  if (!firestoreDb) {
    await initializeFirebase();
  }
  if (!firestoreDb) return { success: false, error: 'Firebase not initialized' };

  try {
    const collections = ['rooms', 'tenants', 'meter_readings', 'invoices', 'expenses', 'users'];
    const result = {
      rooms: [],
      tenants: [],
      meter_readings: [],
      invoices: [],
      expenses: [],
      users: [],
      settings: null
    };

    for (const col of collections) {
      const colRef = collection(firestoreDb, col);
      const snapshot = await getDocs(colRef);
      result[col] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (d) {
          result[col].push({ id: docSnap.id, ...d });
        }
      });
    }

    // Pull settings document
    try {
      const settingsRef = doc(firestoreDb, 'settings', 'global_settings');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        result.settings = settingsSnap.data();
      }
    } catch (sErr) {
      console.warn('Could not read settings from Firestore:', sErr);
    }

    isConnected = true;
    rulesWarning = false;
    return { success: true, data: result };
  } catch (err) {
    console.error('[Firebase pullAll error]:', err);
    if (err.code === 'permission-denied') rulesWarning = true;
    return { success: false, error: err.message, code: err.code };
  }
}

// Optional real-time listener for collections
export function subscribeFirebaseCollection(collectionName, onUpdate) {
  if (!firestoreDb) return () => {};
  try {
    const colRef = collection(firestoreDb, collectionName);
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(items);
    }, (err) => {
      console.warn(`Firestore snapshot error on ${collectionName}:`, err);
      if (err.code === 'permission-denied') rulesWarning = true;
    });
    activeListeners.set(collectionName, unsubscribe);
    return unsubscribe;
  } catch (e) {
    console.warn(`Failed to subscribe to ${collectionName}:`, e);
    return () => {};
  }
}

// ==================== FIREBASE STORAGE IMAGE UPLOAD ====================
let storageInstance = null;

export const DEFAULT_STORAGE_RULES = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;

export function getFirebaseStorage(customBucket) {
  if (customBucket && firebaseApp) {
    try {
      return getStorage(firebaseApp, `gs://${customBucket.replace(/^gs:\/\//, '')}`);
    } catch (e) {
      console.warn('Custom bucket init notice:', e);
    }
  }
  if (!storageInstance && firebaseApp) {
    try {
      storageInstance = getStorage(firebaseApp);
    } catch (e) {
      console.warn('Firebase Storage init error:', e);
    }
  }
  return storageInstance;
}

// Upload image to Firebase Storage and get permanent download link
export async function uploadImageToFirebase(dataUrlOrFile, folder = 'tenants') {
  if (!firebaseApp) {
    await initializeFirebase();
  }
  if (!firebaseApp) return null;

  const cfg = getSavedFirebaseConfig();
  const bucketsToTry = [];
  if (cfg.storageBucket) bucketsToTry.push(cfg.storageBucket);
  if (cfg.projectId) {
    const b1 = `${cfg.projectId}.firebasestorage.app`;
    const b2 = `${cfg.projectId}.appspot.com`;
    if (!bucketsToTry.includes(b1)) bucketsToTry.push(b1);
    if (!bucketsToTry.includes(b2)) bucketsToTry.push(b2);
  }

  for (const bucket of bucketsToTry) {
    try {
      const storage = getFirebaseStorage(bucket);
      if (!storage) continue;

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${folder}/${timestamp}_${randomStr}.jpg`;
      const fileRef = storageRef(storage, fileName);

      if (typeof dataUrlOrFile === 'string' && dataUrlOrFile.startsWith('data:')) {
        await uploadString(fileRef, dataUrlOrFile, 'data_url');
      } else if (typeof dataUrlOrFile === 'object') {
        await uploadBytes(fileRef, dataUrlOrFile);
      } else {
        return null;
      }

      const downloadUrl = await getDownloadURL(fileRef);
      console.log(`✓ [Firebase Storage (${bucket})] Image link created:`, downloadUrl);
      return downloadUrl;
    } catch (err) {
      console.warn(`[Firebase Storage bucket try ${bucket} notice]:`, err.code || err.message);
    }
  }

  return null;
}
window.uploadImageToFirebase = uploadImageToFirebase;

// Test Firebase Storage connection and read/write permissions
export async function testFirebaseStorage() {
  if (!firebaseApp) {
    await initializeFirebase();
  }
  if (!firebaseApp) {
    return { success: false, error: 'Firebase App is not initialized' };
  }

  const cfg = getSavedFirebaseConfig();
  const bucketsToTry = [];
  if (cfg.storageBucket) bucketsToTry.push(cfg.storageBucket);
  if (cfg.projectId) {
    const b1 = `${cfg.projectId}.firebasestorage.app`;
    const b2 = `${cfg.projectId}.appspot.com`;
    if (!bucketsToTry.includes(b1)) bucketsToTry.push(b1);
    if (!bucketsToTry.includes(b2)) bucketsToTry.push(b2);
  }

  let notInitCount = 0;
  for (const bucket of bucketsToTry) {
    try {
      const storage = getFirebaseStorage(bucket);
      if (!storage) continue;

      const testRef = storageRef(storage, `_test_ping_${Date.now()}.txt`);
      await uploadString(testRef, 'ping_ok', 'raw');
      const testUrl = await getDownloadURL(testRef);

      return {
        success: true,
        bucket,
        url: testUrl
      };
    } catch (err) {
      if (err.code === 'storage/unauthorized' || err.code === 'storage/permission-denied') {
        return {
          success: false,
          bucket,
          rulesWarning: true,
          error: 'ជាប់សិទ្ធិ (Storage Rules Locked): សូមចូល Firebase Console → Storage → Rules រួចដាក់ allow read, write: if true;'
        };
      }
      if (err.code === 'storage/unknown' || (err.message && (err.message.includes('404') || err.message.includes('Not Found')))) {
        notInitCount++;
        continue;
      }
      return { success: false, bucket, error: err.message || err.code };
    }
  }

  if (notInitCount > 0) {
    return {
      success: false,
      notInitialized: true,
      error: 'Cloud Storage មិនទាន់ត្រូវបានចុច "Get started" ក្នុង Firebase Console នៅឡើយទេ។'
    };
  }

  return { success: false, error: 'មិនអាចភ្ជាប់ Firebase Storage បានទេ' };
}
window.testFirebaseStorage = testFirebaseStorage;


