const http = require('http');

const HOST = 'localhost';
const PORT = process.env.PORT || 3000;
const BASE = `http://${HOST}:${PORT}`;

function request(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? Buffer.byteLength(data) : 0,
        ...headers
      },
      timeout: 5000
    };

    const req = http.request(opts, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch (e) { /* keep raw */ }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed });
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, status: 0, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: 'timeout' });
    });

    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log(`Running smoke tests against ${BASE}`);
  console.log('Note: Start the server first (`npm start`) if it is not running.');

  // 1) Create user
  const userResp = await request('/api/users', 'POST', { name: 'Smoke User', email: 'smoke@example.com', phone: '1234567890' });
  console.log('Create user:', userResp.status, userResp.ok ? 'OK' : 'FAIL', userResp.body || userResp.error);

  // 2) Create product
  const productResp = await request('/api/products', 'POST', { name: 'Smoke Widget', price: 9.99, category: 'smoke', stock: 2 });
  console.log('Create product:', productResp.status, productResp.ok ? 'OK' : 'FAIL', productResp.body || productResp.error);

  // 3) Create order (requires userId and productId of 1 or from responses)
  const userId = (userResp.body && userResp.body.data && userResp.body.data.id) ? userResp.body.data.id : 1;
  const productId = (productResp.body && productResp.body.data && productResp.body.data.id) ? productResp.body.data.id : 1;

  const orderResp = await request('/api/orders', 'POST', {
    userId,
    items: [{ productId, quantity: 1, price: 9.99 }],
    totalAmount: 9.99
  });
  console.log('Create order:', orderResp.status, orderResp.ok ? 'OK' : 'FAIL', orderResp.body || orderResp.error);

  // 4) Paginated users
  const pageResp = await request('/api/users?page=1&limit=5');
  console.log('Paginated users:', pageResp.status, pageResp.ok ? 'OK' : 'FAIL');

  // 5) Low stock products
  const lowStockResp = await request('/api/products/stock/low?threshold=5');
  console.log('Low stock products:', lowStockResp.status, lowStockResp.ok ? 'OK' : 'FAIL');

  // 6) Cancel order if created
  const orderId = (orderResp.body && orderResp.body.data && orderResp.body.data.id) ? orderResp.body.data.id : 1;
  const cancelResp = await request(`/api/orders/${orderId}/cancel`, 'POST');
  console.log('Cancel order:', cancelResp.status, cancelResp.ok ? 'OK' : 'FAIL', cancelResp.body || cancelResp.error);

  console.log('Smoke tests complete. Review the outputs above.');
})();
