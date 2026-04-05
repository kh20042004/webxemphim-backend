// Test script để kiểm tra API trả về avgRating
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/movies?limit=1',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('\n✅ API Response:');
      console.log(JSON.stringify(result.data[0], null, 2));
      
      if (result.data[0].avgRating !== undefined) {
        console.log('\n✅ avgRating field found:', result.data[0].avgRating);
      } else {
        console.log('\n❌ avgRating field NOT found');
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
