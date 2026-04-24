import * as admin from "firebase-admin";

if (!admin.apps.length) {
  // Check if we are in development or production
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Local: Use the JSON file
    const serviceAccount = require("../../house-party-next-firebase-adminsdk-fbsvc-ca460781a3.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Production: Use built-in credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: "house-party-next",
    });
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();