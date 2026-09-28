import { NextResponse } from "next/server";
import { askAi } from "@/lib/ai-service";
import { decryptPayload, encryptPayload } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.data) {
      return NextResponse.json({ error: "Encrypted payload is required" }, { status: 400 });
    }

    // Decrypt client data
    const decrypted = decryptPayload(body.data);
    const { userQuery, profile, schedules = [], courses = [], rooms = [] } = decrypted;

    if (!userQuery) {
      return NextResponse.json({ error: "Query is required inside payload" }, { status: 400 });
    }

    // Build the prompt securely on the server side
    let enrichedSchedules = "";
    if (profile) {
      const mySchedules = schedules.filter((s: any) => {
        if (profile.role === "teacher") return s.teacherId === profile.id;
        return true; // Default or show all
      });

      enrichedSchedules = mySchedules
        .map((s: any) => {
          const course = courses.find((c: any) => c.id === s.courseId) as any;
          const room = rooms.find((r: any) => r.id === s.roomId) as any;
          return `- Course: ${course?.name || s.courseId} (${s.courseId}), Day: ${s.dayOfWeek}, Time: ${s.startTime}-${s.endTime}, Room: ${room?.name || s.roomId} (${room?.building || "University Main"})`;
        })
        .join("\n");
    }

    const systemPrompt = profile
      ? `Context: Active User is ${profile.displayName} (Role: ${profile.role}, Email: ${profile.email}, Department: ${profile.departmentId || "Computer Science"}).
Their active schedule contains the following details:
${enrichedSchedules || "No active schedules assigned."}

User Question: ${userQuery}

Instruction: Answer the User Question in a highly professional, helpful manner. Utilize their schedule context naturally so they do NOT need to repeat it. Limit your output to a concise, structured response. Do NOT use raw markdown bullet asterisks (* or **) in your text. Instead, write clear paragraphs or numbered points.`
      : `User Question: ${userQuery}
Instruction: Answer the User Question in a highly professional, helpful manner. Limit your output to a concise, structured response. Do NOT use raw markdown bullet asterisks (* or **) in your text. Instead, write clear paragraphs or numbered points.`;

    // Query AI
    const aiResponse = await askAi(systemPrompt);

    // Encrypt response before sending back
    const encryptedResult = encryptPayload(aiResponse);

    return NextResponse.json({ data: encryptedResult });
  } catch (error: any) {
    console.error("AI Server Error:", error);
    // Return encrypted error so format remains consistent, or clear text error if decryption failed
    try {
      const errPayload = encryptPayload({ error: error.message });
      return NextResponse.json({ data: errPayload }, { status: 500 });
    } catch {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}

