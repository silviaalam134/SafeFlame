const express = require('express');
const app = express();

console.log('🆕 FRESH SERVER STARTING...');

app.get('/api/test', (req, res) => {
  console.log('🎯 FRESH ROUTE HIT!');
  res.json({ message: 'FRESH SERVER WORKS!', time: new Date().toISOString() });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🆕 FRESH SERVER on port ${PORT}`);
});