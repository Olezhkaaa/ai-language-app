import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Speech-to-text is handled in the browser via Web Speech API. Replace this route with server-side STT if needed.",
  });
}
