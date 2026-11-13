/**
 * Deploy Firestore & Storage rules via Firebase Rules REST API
 * menggunakan service account dari .env (tanpa perlu firebase login).
 * Jalankan: node scripts/deploy-rules.mjs
 */
import { config } from 'dotenv';
import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

config({ path: '.env' });

const PROJECT = process.env.FIREBASE_PROJECT_ID;
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
});

async function api(method, url, body) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const res = await fetch(`https://firebaserules.googleapis.com/v1/${url}`, {
    method,
    headers: { Authorization: `Bearer ${token.token || token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  const firestoreRules = readFileSync('firestore.rules', 'utf8');
  const storageRules = readFileSync('storage.rules', 'utf8');

  console.log('[1/4] Membuat ruleset Firestore...');
  const fsRuleset = await api('POST', `projects/${PROJECT}/rulesets`, {
    source: { files: [{ name: 'firestore.rules', content: firestoreRules }] },
  });
  console.log('  ruleset:', fsRuleset.name);

  console.log('[2/4] Rilis ruleset ke cloud.firestore...');
  try {
    await api('PATCH', `projects/${PROJECT}/releases/cloud.firestore`, {
      name: `projects/${PROJECT}/releases/cloud.firestore`, rulesetName: fsRuleset.name,
    });
  } catch (e) {
    if (!e.message.includes('404')) throw e;
    await api('POST', `projects/${PROJECT}/releases?releaseId=cloud.firestore`, {
      name: `projects/${PROJECT}/releases/cloud.firestore`, rulesetName: fsRuleset.name,
    });
  }
  console.log('  ✓ Firestore rules aktif');

  console.log('[3/4] Membuat ruleset Storage...');
  const stRuleset = await api('POST', `projects/${PROJECT}/rulesets`, {
    source: { files: [{ name: 'storage.rules', content: storageRules }] },
  });
  console.log('  ruleset:', stRuleset.name);

  console.log('[4/4] Rilis ruleset ke firebase.storage...');
  const stReleaseName = `projects/${PROJECT}/releases/firebase.storage/${BUCKET}`;
  try {
    await api('PATCH', `projects/${PROJECT}/releases/firebase.storage/${BUCKET}`, {
      name: stReleaseName, rulesetName: stRuleset.name,
    });
  } catch (e) {
    if (!e.message.includes('404')) throw e;
    await api('POST', `projects/${PROJECT}/releases?releaseId=${encodeURIComponent(`firebase.storage/${BUCKET}`)}`, {
      name: stReleaseName, rulesetName: stRuleset.name,
    });
  }
  console.log('  ✓ Storage rules aktif');
  console.log('\n✅ Semua rules berhasil di-deploy.');
}

main().catch((e) => { console.error('GAGAL:', e.message); process.exit(1); });
