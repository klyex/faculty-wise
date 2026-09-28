const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, limit, query } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCuPU4_swN2WVBbdbGMbhTgtyvmin7Z1oE",
  authDomain: "zenvibe-b70f0.firebaseapp.com",
  projectId: "zenvibe-b70f0",
  storageBucket: "zenvibe-b70f0.firebasestorage.app",
  messagingSenderId: "765912317246",
  appId: "1:765912317246:web:dce077fbf01ce54546006f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  console.log("--- SCANNING SCHEDULES ---");
  const schedSnap = await getDocs(query(collection(db, "schedules"), limit(5)));
  schedSnap.forEach(doc => {
    console.log("Schedule Doc ID:", doc.id);
    console.log(JSON.stringify(doc.data(), null, 2));
  });

  console.log("\n--- SCANNING COURSES ---");
  const courseSnap = await getDocs(query(collection(db, "courses"), limit(5)));
  courseSnap.forEach(doc => {
    console.log("Course Doc ID:", doc.id);
    console.log(JSON.stringify(doc.data(), null, 2));
  });

  console.log("\n--- SCANNING COURSE OFFERINGS ---");
  const offeringSnap = await getDocs(query(collection(db, "courseOfferings"), limit(5)));
  offeringSnap.forEach(doc => {
    console.log("Offering Doc ID:", doc.id);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

check().catch(console.error);
