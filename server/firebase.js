import { getApps, initializeApp, cert, applicationDefault } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import os from 'os';

const FIREBASE_CLI_CLIENT_ID = process.env.FIREBASE_CLI_CLIENT_ID;
const FIREBASE_CLI_CLIENT_SECRET = process.env.FIREBASE_CLI_CLIENT_SECRET;
const ADC_PATH = path.join(os.tmpdir(), 'orbit-ems-adc.json');

let firestoreInstance;

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }
  return undefined;
}

/**
 * Write a temporary application-default credential file using the
 * Firebase CLI's stored OAuth refresh token. This lets the Admin SDK's
 * Firestore client authenticate without a service account key.
 */
function writeAppDefaultCredential() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) return false;

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const { refresh_token } = config.tokens || {};
    if (!refresh_token) return false;

    const adc = {
      type: 'authorized_user',
      client_id: FIREBASE_CLI_CLIENT_ID,
      client_secret: FIREBASE_CLI_CLIENT_SECRET,
      refresh_token,
    };
    fs.writeFileSync(ADC_PATH, JSON.stringify(adc, null, 2), 'utf8');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = ADC_PATH;
    return true;
  } catch {
    return false;
  }
}

function cleanup() {
  if (fs.existsSync(ADC_PATH)) {
    try { fs.unlinkSync(ADC_PATH); } catch {}
  }
}

export function initFirebase() {
  if (getApps().length) return;

  const serviceAccount = getServiceAccount();

  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) });
  } else if (writeAppDefaultCredential()) {
    const credential = applicationDefault();
    initializeApp({ credential, projectId: process.env.VITE_FIREBASE_PROJECT_ID });
  } else {
    initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
  }

  const dbId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || '(default)';
  firestoreInstance = getFirestore(dbId);
}

/* Clean up temp ADC file on exit — gRPC reads it lazily so we can't delete sooner */
process.on('exit', cleanup);

export function getDb() {
  if (!firestoreInstance) {
    initFirebase();
  }
  return firestoreInstance;
}
