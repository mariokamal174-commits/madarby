import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    storage: undefined,
  },
});

const adminEmail = process.env.ADMIN_EMAIL || 'admin@madarby.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'AdminReset123!';

async function deleteAllRows(tableName) {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    if (error.message?.includes('Could not find the table') || error.message?.includes('does not exist')) {
      console.log(`Skipping missing table ${tableName}`);
      return;
    }
    console.error(`Failed deleting rows from ${tableName}`, error);
    throw error;
  }
}

async function deleteAllAuthUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Failed listing auth users', error);
    throw error;
  }

  for (const user of data.users ?? []) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`Failed deleting auth user ${user.id}`, deleteError);
      throw deleteError;
    }
  }
}

async function ensureAdminUser() {
  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'Admin',
      primary_role: 'admin',
      phone: '',
      city: '',
    },
  });

  if (createError) {
    console.error('Failed creating admin user', createError);
    throw createError;
  }

  const userId = createdUser.user?.id;
  if (!userId) {
    throw new Error('Admin user id missing');
  }

  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: 'Admin',
      phone: '',
      city: '',
      primary_role: 'admin',
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.error('Failed creating profile for admin', profileError);
    throw profileError;
  }

  const { error: roleError } = await supabase.from('user_roles').upsert(
    { user_id: userId, role: 'admin' },
    { onConflict: 'user_id,role' }
  );

  if (roleError) {
    console.error('Failed creating role for admin', roleError);
    throw roleError;
  }

  console.log(JSON.stringify({
    message: 'Admin account created',
    email: adminEmail,
    password: adminPassword,
    userId,
  }, null, 2));
}

async function main() {
  console.log('Deleting auth users...');
  await deleteAllAuthUsers();

  const tables = [
    'coach_verifications',
    'player_preferences',
    'favorites',
    'reviews',
    'bookings',
    'coach_availability',
    'coach_sports',
    'academy_sports',
    'coaches',
    'academies',
    'profiles',
    'user_roles',
    'sports',
  ];

  for (const table of tables) {
    console.log(`Deleting rows from ${table}...`);
    await deleteAllRows(table);
  }

  console.log('Creating admin account...');
  await ensureAdminUser();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
