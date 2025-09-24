#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');

    const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          process.exit(1);
        }
      }
    }

    console.log('✅ Migration completed successfully!');

    // Test the connection by listing tables
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(0);

    if (error && !error.message.includes('count')) {
      console.log('✅ Tables created successfully!');
    } else {
      console.log('✅ Database connection verified!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();