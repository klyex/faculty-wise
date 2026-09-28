
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listCollections() {
  const serviceAccount = require('./service-account.json');
  
  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();
  const collections = await db.listCollections();
  console.log('Collections in database:');
  collections.forEach(collection => {
    console.log(`- ${collection.id}`);
  });
}

listCollections().catch(console.error);
