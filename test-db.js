const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'water_project_db'
  });
  
  const [rows] = await connection.execute('SHOW CREATE VIEW v_subscription_status');
  console.log(rows[0]['Create View']);
  
  connection.end();
}

test().catch(console.error);
