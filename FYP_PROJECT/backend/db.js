// db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "CDNA_CSS",
  password: "postgres",
  port: 5432,
});

// Test the connection
pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL!");
    client.release();
  })
  .catch(err => console.error("❌ DB connection error:", err.stack));

export default pool;
