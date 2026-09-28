require('dotenv').config({ path: '.env.local' });

// Define a common mock key setup for standalone execution
const apiKey = process.env.NEXT_PUBLIC_INNOVATECH_API_KEY;
const endpoint = process.env.NEXT_PUBLIC_AI_CHAT_ENDPOINT;

console.log("Credentials:");
console.log("- API Key:", apiKey ? "Loaded (hidden)" : "MISSING");
console.log("- Endpoint:", endpoint);

const testPrompt = `System: You are the FacultyWise AI Scheduling Engine. 
The user wants to schedule a course. Check the request details for conflicts and output a JSON block wrapped in three backticks and the word "json" containing:
{
  "valid": true,
  "reason": "Clear explanation of checks completed",
  "proposedEntry": {
    "courseId": "CS-202",
    "roomId": "room-001",
    "dayOfWeek": "Friday",
    "startTime": "10:00",
    "endTime": "11:30",
    "semester": "Spring 2026"
  }
}

User request: "Please add a CS-202 class on Friday from 10:00 to 11:30 in Lab 101."`;

async function run() {
  try {
    console.log("\nSending prompt to InnovaTech AI...");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        question: testPrompt
      })
    });

    console.log("Response Status:", response.status);
    const text = await response.text();
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Test Error:", err);
  }
}

run();
