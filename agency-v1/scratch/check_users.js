const { Client } = require('pg');
const dbUrl = process.env.DATABASE_URL || "postgresql://legacymark:legacymark_dev@pgbouncer:6432/legacymark_auth";

const url = new URL(dbUrl);
url.pathname = "/legacymark_auth";

const client = new Client({ connectionString: url.toString() });
client.connect()
  .then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tbl_users';"))
  .then(res => {
    console.log("Columns:", res.rows.map(r => r.column_name));
    return client.end();
  })
  .catch(err => {
    console.error("Error checking columns:", err);
    client.end().catch(() => {});
  });
