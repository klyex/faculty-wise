const SECRET_KEY = process.env.NEXT_PUBLIC_API_ENCRYPTION_KEY || "FacultyWiseSecurePayloadKey2026_x89!";

function encryptPayload(data) {
  const jsonStr = JSON.stringify(data);
  let result = "";
  for (let i = 0; i < jsonStr.length; i++) {
    const charCode = jsonStr.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    const cipherChar = (charCode ^ keyChar).toString(16).padStart(2, "0");
    result += cipherChar;
  }
  return result;
}

function decryptPayload(hexStr) {
  let result = "";
  for (let i = 0; i < hexStr.length; i += 2) {
    const hexChar = hexStr.substring(i, i + 2);
    const charCode = parseInt(hexChar, 16);
    const keyChar = SECRET_KEY.charCodeAt((i / 2) % SECRET_KEY.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }
  return JSON.parse(result);
}

const rawPayload = {
  userQuery: `Please add a CS-202 class on Friday from 10:00 to 11:30 in Lab 101.`,
  profile: {
    displayName: "Dr. John Smith",
    role: "teacher",
    email: "john.smith@university.edu",
    departmentId: "Computer Science"
  },
  schedules: [],
  courses: [],
  rooms: []
};

async function run() {
  try {
    console.log("Sending request to local dev server http://localhost:3000/api/ai-test...");
    const encryptedData = encryptPayload(rawPayload);

    const response = await fetch("http://localhost:3000/api/ai-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data: encryptedData })
    });

    console.log("Status:", response.status);
    const body = await response.json();
    if (body.data) {
      const decrypted = decryptPayload(body.data);
      console.log("Decrypted Response Body:", decrypted);
    } else {
      console.log("Response Body (unencrypted):", body);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}

run();

