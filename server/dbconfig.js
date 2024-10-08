import createPool from "mysql2";
import { config as dotenvConfig } from "dotenv";
import mysql from "mysql2/promise";

dotenvConfig();
const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export { dbPool };
