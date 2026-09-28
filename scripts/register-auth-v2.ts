import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('❌ Error: service-account.json not found in the root directory.');
  console.log('\nTo fix this:');
  console.log('1. Go to Firebase Console -> Project Settings -> Service Accounts.');
  console.log('2. Click "Generate new private key".');
  console.log('3. Save the downloaded JSON as "service-account.json" in the root folder of this project.');
  console.log('4. Run this script again: npx tsx scripts/register-auth-v2.ts\n');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const users = [
  {
    uid: "7utO6Dqf8YOWeF4ZAeWVXbs2NyV2",
    email: "wwen485@gmail.com",
    displayName: "John Doe",
    password: "Password123!"
  },
  {
    uid: "user-001",
    email: "john.smith@university.edu",
    displayName: "Dr. John Smith",
    password: "Password123!"
  },
  {
    uid: "user-002",
    email: "sarah.johnson@university.edu",
    displayName: "Prof. Sarah Johnson",
    password: "Password123!"
  },
  {
    uid: "user-003",
    email: "alice.brown@university.edu",
    displayName: "Alice Brown",
    password: "Password123!"
  }
];

async function syncUsers() {
  console.log('🔄 Syncing users with Firebase Auth...');
  
  for (const user of users) {
    try {
      // Try to update existing user
      await getAuth().updateUser(user.uid, {
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true
      });
      console.log(`✅ Updated: ${user.email} (${user.uid})`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new user if not found
        await getAuth().createUser({
          uid: user.uid,
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          emailVerified: true
        });
        console.log(`✅ Created: ${user.email} (${user.uid})`);
      } else {
        console.error(`❌ Error for ${user.email}:`, error.message);
      }
    }
  }
  
  console.log('\n✨ All users have been synchronized. You can now login with Password123!');
}

syncUsers().catch(console.error);
