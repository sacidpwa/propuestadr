const { Pool } = require('pg');
const pool = new Pool({
  host: 'db.exuptqyetxblsebxwmmy.supabase.co',
  port: 5432,
  user: 'postgres',
  password: '8419Dranurr#',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  // Tables in DB
  const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log('=== TABLAS EN DB ===');
  tables.rows.forEach(r => console.log(' ', r.tablename));

  // Columns of key tables
  const keyTables = ['patient_invoices', 'expense_entries', 'expense_categories', 'medical_items', 'petty_cash'];
  for (const t of keyTables) {
    const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [t]);
    console.log(`\n=== ${t} (${cols.rows.length} cols) ===`);
    cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
  }

  // Check RLS policies on medical_items
  const policies = await pool.query("SELECT policyname, cmd FROM pg_policies WHERE tablename = 'medical_items'");
  console.log('\n=== medical_items policies ===');
  policies.rows.forEach(r => console.log(`  ${r.policyname} (${r.cmd})`));

  pool.end();
}

check().catch(e => { console.error(e.message); process.exit(1); });
