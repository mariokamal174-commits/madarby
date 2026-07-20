/*
  Script: create_test_coach.js
  Purpose: Helper to create a test coach entry and upload sample files to the "coach-documents" bucket.
  Usage:
    Set env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    node scripts/create_test_coach.js --email test@example.com --password secret --avatar ./avatar.jpg --cert ./cert1.jpg --license ./license.jpg

  NOTE: This script uses the service_role key and therefore MUST be run locally in a safe environment (never commit the key).
*/

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables first.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const email = argv.email || 'coach-test@example.com';
  const password = argv.password || 'Password123!';
  const avatarPath = argv.avatar;
  const certPath = argv.cert;
  const licensePath = argv.license;

  try {
    console.log('Creating auth user (admin)...');
    const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Test Coach', primary_role: 'coach' },
    });
    if (createErr) throw createErr;
    const userId = userData.id || userData?.user?.id;
    console.log('Created user id:', userId);

    console.log('Upserting profile and coach rows...');
    const { error: pErr } = await supabase.from('profiles').upsert({ id: userId, full_name: 'Test Coach', primary_role: 'coach' }, { onConflict: 'id' });
    if (pErr) throw pErr;
    const { error: cErr } = await supabase.from('coaches').upsert({ user_id: userId, full_name: 'Test Coach', title_ar: 'اختبار', approved: false, verified: false }, { onConflict: 'user_id' });
    if (cErr) throw cErr;

    // Upload files
    const uploaded = {};
    if (avatarPath && existsSync(avatarPath)) {
      const avatarData = await fs.readFile(avatarPath);
      const dest = `${userId}/avatar/${Date.now()}-${path.basename(avatarPath)}`;
      const { error: upErr } = await supabase.storage.from('coach-documents').upload(dest, avatarData, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      uploaded.avatar = supabase.storage.from('coach-documents').getPublicUrl(dest).data.publicUrl;
    }
    if (certPath && existsSync(certPath)) {
      const certData = await fs.readFile(certPath);
      const dest = `${userId}/certs/${Date.now()}-${path.basename(certPath)}`;
      const { error: upErr } = await supabase.storage.from('coach-documents').upload(dest, certData, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      uploaded.cert = supabase.storage.from('coach-documents').getPublicUrl(dest).data.publicUrl;
    }
    if (licensePath && existsSync(licensePath)) {
      const licData = await fs.readFile(licensePath);
      const dest = `${userId}/license/${Date.now()}-${path.basename(licensePath)}`;
      const { error: upErr } = await supabase.storage.from('coach-documents').upload(dest, licData, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      uploaded.license = supabase.storage.from('coach-documents').getPublicUrl(dest).data.publicUrl;
    }

    console.log('Uploaded files:', uploaded);

    console.log('Inserting coach_verifications row...');
    const { error: vErr } = await supabase.from('coach_verifications').insert({ coach_id: userId, certificates: uploaded.cert ? [uploaded.cert] : [], license_card_url: uploaded.license || null, status: 'pending' });
    if (vErr) throw vErr;

    console.log('Test coach created successfully.');
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  }
}

main();
