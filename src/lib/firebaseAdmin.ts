import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

if (!admin.apps.length) {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Local: load path from env var so the filename is never hardcoded in source
    const keyPath = process.env.FIREBASE_ADMIN_SDK_PATH;
    if (!keyPath) {
      throw new Error("Missing FIREBASE_ADMIN_SDK_PATH environment variable");
    }
    const resolved = path.resolve(process.cwd(), keyPath);
    const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf-8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Production: Use built-in credentials (Application Default Credentials)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();