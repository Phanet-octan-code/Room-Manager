const fetch = globalThis.fetch;

async function runE2ETests() {
  const baseUrl = 'http://localhost:5173';
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log('  ✓ PASS:', name);
      passed++;
    } else {
      console.error('  ✗ FAIL:', name);
      failed++;
    }
  }

  console.log('========================================================');
  console.log('  RUNNING FULL E2E CLOUD INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  // Test 1: Health & Database Connection Status
  console.log('[1] Testing Server & Database Connection (/api/status, /api/test)...');
  try {
    const statusRes = await fetch(baseUrl + '/api/status');
    const statusData = await statusRes.json();
    assert(statusRes.ok, 'HTTP 200 from /api/status');
    assert(statusData.connected === true, 'Supabase PostgreSQL connected: true');
    assert(Boolean(statusData.host), 'Supabase host verified: ' + statusData.host);

    const testRes = await fetch(baseUrl + '/api/test');
    const testData = await testRes.json();
    assert(testRes.ok && testData.success === true, 'PostgreSQL query execution test succeeded');
  } catch (err) {
    assert(false, 'Status test exception: ' + err.message);
  }

  // Test 2: Cloudinary Image Upload API
  console.log('\n[2] Testing Cloudinary Image Upload (/api/upload)...');
  let uploadedCloudinaryUrl = '';
  try {
    const sampleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const uploadRes = await fetch(baseUrl + '/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: sampleImage, folder: 'e2e_test' })
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.ok && uploadData.success === true, 'HTTP 200 & success from /api/upload');
    assert(uploadData.url && uploadData.url.startsWith('https://res.cloudinary.com/'), 'Cloudinary CDN HTTPS URL returned: ' + uploadData.url);
    uploadedCloudinaryUrl = uploadData.url;
  } catch (err) {
    assert(false, 'Cloudinary upload exception: ' + err.message);
  }

  // Test 3: Document Sync (CRUD) on Supabase PostgreSQL
  console.log('\n[3] Testing Supabase Real-Time CRUD Operations (/api/sync/*)...');
  const testTenantId = 'e2e_tenant_' + Date.now();
  const testTenant = {
    id: testTenantId,
    name: 'តេស្ត អ្នកជួល E2E',
    phone: '012 345 678',
    gender: 'female',
    roomId: null,
    startDate: '2026-08-25',
    status: 'active',
    photoUrl: uploadedCloudinaryUrl,
    idCardPhotoUrl: uploadedCloudinaryUrl
  };

  try {
    // Create Document
    const createRes = await fetch(baseUrl + '/api/sync/doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName: 'tenants', docId: testTenantId, data: testTenant })
    });
    const createData = await createRes.json();
    assert(createRes.ok && createData.success === true, 'Successfully inserted document into Supabase');

    // Pull and Verify
    const pullRes = await fetch(baseUrl + '/api/pull/all');
    const pullData = await pullRes.json();
    assert(pullRes.ok && pullData.success === true, 'Successfully pulled all data from Supabase');
    const foundTenant = pullData.data.tenants.find(t => t.id === testTenantId);
    assert(Boolean(foundTenant), 'Found synced tenant in live Supabase collection');
    assert(foundTenant && foundTenant.photoUrl === uploadedCloudinaryUrl, 'Verified Cloudinary image URL persisted in Supabase');

    // Delete Document
    const delRes = await fetch(baseUrl + '/api/sync/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName: 'tenants', docId: testTenantId })
    });
    const delData = await delRes.json();
    assert(delRes.ok && delData.success === true, 'Successfully deleted test document from Supabase');
  } catch (err) {
    assert(false, 'CRUD test exception: ' + err.message);
  }

  // Test 4: Static File Delivery & Assets
  console.log('\n[4] Testing Static Asset Delivery (HTML/JS/CSS)...');
  try {
    const htmlRes = await fetch(baseUrl + '/');
    assert(htmlRes.ok && htmlRes.headers.get('content-type').includes('text/html'), 'Delivered index.html with 200 OK');

    const appJsRes = await fetch(baseUrl + '/js/app.js');
    assert(appJsRes.ok, 'Delivered js/app.js with 200 OK');

    const storeJsRes = await fetch(baseUrl + '/js/store.js');
    assert(storeJsRes.ok, 'Delivered js/store.js with 200 OK');
  } catch (err) {
    assert(false, 'Static asset test exception: ' + err.message);
  }

  console.log('\n========================================================');
  console.log('  E2E TEST RUN COMPLETED: ' + passed + ' PASSED, ' + failed + ' FAILED');
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

runE2ETests();
