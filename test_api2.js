import http from 'http';

function makeRequest(path, method, body, token, callback) {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => callback(res.statusCode, JSON.parse(data || '{}')));
  });
  req.on('error', e => console.error(e));
  if (body) req.write(JSON.stringify(body));
  req.end();
}

makeRequest('/api/auth/login', 'POST', { username: 'testuser123', password: 'testpassword' }, null, (status, data) => {
    console.log('Login:', status, data?.token?.slice(0, 10));
    if (data.token) {
      makeRequest('/api/accounts', 'POST', { type: 'CUSTOMER', name: 'John Doe2', phone: '0001' }, data.token, (status, result) => {
        console.log('Post Account:', status, result);
        makeRequest('/api/inventory', 'POST', { item_name: 'Item2', quantity: 10, purchase_price: 15 }, data.token, (s, r) => {
           console.log('Post Inventory:', s, r);
        });
      });
    }
});
