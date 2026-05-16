import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: '15m',
    refreshExpiresIn: '30d',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  cron: {
    secret: process.env.CRON_SECRET || '',
  },
  leetcode: {
    baseUrl: process.env.LEETCODE_API_BASE_URL || 'https://alfa-leetcode-api.onrender.com',
  },
} as const;
