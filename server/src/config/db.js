const mysql = require('mysql2');

const dotenv = require('dotenv');
dotenv.config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);

const pool = mysql.createPool({
host: process.env.DB_HOST,
port: process.env.DB_PORT,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
ssl: { rejectUnauthorized: false },
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0,
connectTimeout: 10000
});

pool.getConnection((err, connection) => {
if (err) {
    console.error('Pool connection failed at startup:', err.message);
    process.exit(1);
}
console.log('MySQL pool created successfully');
connection.release();
});

module.exports = pool.promise();