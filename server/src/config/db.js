const mysql = require('mysql2');

const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
waitForConnections: true,
connectionLimit: 10,      // max 10 concurrent connections
queueLimit: 0,
connectTimeout: 10000     // 10 seconds timeout
});

// Test pool at startup
pool.getConnection((err, connection) => {
if (err) {
    console.error('Pool connection failed at startup:', err.message);
    process.exit(1);
}
console.log('MySQL pool created successfully');
connection.release(); // release back to pool
});

// Export the pool (not single connection)
module.exports = pool.promise();  // Use promise version for cleaner callbacks later