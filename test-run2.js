const http = require('http');
const BASE = 'http://localhost:3005/api';
let adminToken = '', userToken = '';
let passed = 0, failed = 0;
const ts = Date.now();

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname, port: url.port, path: url.pathname + url.search, method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }
    };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function t(name, fn) {
  try { await fn(); console.log('  [OK] ' + name); passed++; }
  catch (err) { console.log('  [FAIL] ' + name + ': ' + err.message); failed++; }
}

async function run() {
  console.log('\n=========================================');
  console.log('  NexusMeta API Full Test');
  console.log('=========================================\n');

  console.log('[Auth]');
  await t('admin login', async () => {
    const r = await req('POST','/auth/admin/login',{email:'admin@xuanmi.net',password:'admin123'});
    if(!r.body.success) throw new Error(r.body.error||'fail');
    adminToken = r.body.data.token;
  });
  await t('user register', async () => {
    const r = await req('POST','/auth/register',{email:'test'+ts+'@demo.com',password:'test123',name:'Test'});
    if(!r.body.success) throw new Error(r.body.error||'fail');
    userToken = r.body.data.token;
  });
  await t('login fail', async () => { const r = await req('POST','/auth/login',{email:'test'+ts+'@demo.com',password:'wrong'}); if(r.body.success) throw new Error('shoud fail'); });
  await t('get profile', async () => { const r = await req('GET','/auth/profile',null,adminToken); if(!r.body.success) throw new Error('fail'); });

  console.log('[Dashboard]');
  await t('stats', async () => { const r = await req('GET','/dashboard/stats',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('revenue-trend', async () => { const r = await req('GET','/dashboard/revenue-trend',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('user-regions', async () => { const r = await req('GET','/dashboard/user-regions',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('recent-orders', async () => { const r = await req('GET','/dashboard/recent-orders',null,adminToken); if(!r.body.success||!Array.isArray(r.body.data)) throw new Error('fail'); });

  console.log('[Users]');
  await t('list', async () => { const r = await req('GET','/users?page=1&limit=10',null,adminToken); if(!r.body.success||!r.body.data) throw new Error('fail'); });
  await t('search', async () => { const r = await req('GET','/users?search=admin',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('filter status', async () => { const r = await req('GET','/users?status=BANNED',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('detail', async () => { const r = await req('GET','/users/user-001',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('create', async () => { const r = await req('POST','/users',{name:'New',email:'new'+ts+'@test.cn',password:'test123'},adminToken); if(!r.body.success) throw new Error(r.body.error||'fail'); });
  await t('update', async () => { const r = await req('PUT','/users/user-001',{region:'SG'},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('status change', async () => { const r = await req('PATCH','/users/user-001/status',{status:'BANNED'},adminToken); if(!r.body.success) throw new Error('fail'); await req('PATCH','/users/user-001/status',{status:'ACTIVE'},adminToken); });
  await t('delete', async () => { const r = await req('DELETE','/users/user-008',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('auth guard', async () => { const r = await req('GET','/users',null,userToken); if(r.body.success) throw new Error('should reject'); });

  console.log('[Content]');
  await t('faqs list', async () => { const r = await req('GET','/content/faqs',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('faq create', async () => { const r = await req('POST','/content/faqs',{question:'Q'+ts,answer:'A!',lang:'zh'},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('faq update', async () => { const r = await req('PUT','/content/faqs/1',{question:'UPD'},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('reviews list', async () => { const r = await req('GET','/content/reviews',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('review create', async () => { const r = await req('POST','/content/reviews',{name:'X',role:'Y',content:'Z',rating:5,lang:'zh'},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('review update', async () => { const r = await req('PUT','/content/reviews/1',{rating:4},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('logos list', async () => { const r = await req('GET','/content/logos',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('logo create', async () => { const r = await req('POST','/content/logos',{name:'L'+ts},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('logo delete', async () => { const r = await req('DELETE','/content/logos/8',null,adminToken); if(!r.body.success) throw new Error('fail'); });

  console.log('[Orders]');
  await t('list', async () => { const r = await req('GET','/orders?page=1&limit=10',null,adminToken); if(!r.body.success||!r.body.summary) throw new Error(JSON.stringify(r.body).slice(0,100)); });
  await t('filter status', async () => { const r = await req('GET','/orders?status=COMPLETED',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('detail', async () => { const r = await req('GET','/orders/order-001',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('status change', async () => { const r = await req('PATCH','/orders/order-002/status',{status:'CANCELLED'},adminToken); if(!r.body.success) throw new Error('fail'); await req('PATCH','/orders/order-002/status',{status:'COMPLETED'},adminToken); });
  await t('export csv', async () => { const r = await req('GET','/orders/export',null,adminToken); if(r.status!==200) throw new Error('status='+r.status); });

  console.log('[Languages]');
  await t('get trans', async () => { const r = await req('GET','/languages/translations',null,adminToken); if(!r.body.success||!r.body.data.sections) throw new Error('fail'); });
  await t('batch-update', async () => { const r = await req('PUT','/languages/translations',{translations:[{key:'hero.title',zh:'X',en:'Y',tw:'Z',section:'Hero'}]},adminToken); if(!r.body.success) throw new Error('fail'); });

  console.log('[Settings]');
  await t('get', async () => { const r = await req('GET','/settings',null,adminToken); if(!r.body.success||!r.body.data.siteName) throw new Error('fail'); });
  await t('update', async () => { const r = await req('PUT','/settings',{siteName:'T'+ts},adminToken); if(!r.body.success) throw new Error('fail'); });

  console.log('[Logs]');
  await t('list', async () => { const r = await req('GET','/logs?page=1&limit=10',null,adminToken); if(!r.body.success||!r.body.data) throw new Error('fail'); });
  await t('filter action', async () => { const r = await req('GET','/logs?action=登录',null,adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('export csv', async () => { const r = await req('GET','/logs/export',null,adminToken); if(r.status!==200) throw new Error('status='+r.status); });

  console.log('[Profile]');
  await t('get', async () => { const r = await req('GET','/profile',null,adminToken); if(!r.body.success||!r.body.data.name) throw new Error('fail'); });
  await t('update', async () => { const r = await req('PUT','/profile',{name:'X'+ts},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('password', async () => { const r = await req('PUT','/profile/change-password',{currentPassword:'admin123',newPassword:'admin123',confirmPassword:'admin123'},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('reset-key', async () => { const r = await req('POST','/profile/reset-api-key',{},adminToken); if(!r.body.success) throw new Error('fail'); });
  await t('clear-cache', async () => { const r = await req('POST','/profile/clear-cache',{},adminToken); if(!r.body.success) throw new Error('fail'); });

  console.log('[Security]');
  await t('no-auth', async () => { const r = await req('GET','/users',null,''); if(r.body.success) throw new Error('should reject'); });
  await t('validation', async () => { const r = await req('POST','/users',{name:'X'},adminToken); if(r.body.success) throw new Error('should reject'); });
  await t('bad format', async () => { const r = await req('POST','/users',{name:'X',email:'bad',password:'1'},adminToken); if(r.body.success) throw new Error('should reject'); });
  await t('404', async () => { const r = await req('GET','/unknown',null,''); if(r.status!==404) throw new Error('should 404'); });

  console.log('\n=========================================');
  console.log('  Result: ' + passed + ' passed / ' + failed + ' failed');
  console.log('=========================================\n');
}
run().catch(console.error);
