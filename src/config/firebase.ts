import * as admin from 'firebase-admin';
import { config } from './index';

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!config.firebase.projectId) {
    throw new Error('Firebase configuration is not defined');
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  });

  return firebaseApp;
}
