const db = require('./event_db.js');

db.query('SELECT 1 + 1 AS solution', (err, results) => {
  if (err) throw err;
  console.log('Database test query result:', results[0].solution); // 应该输出 2
});