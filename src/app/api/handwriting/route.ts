import { NextResponse } from "next/server";

type HandwritingRequest = {
  imageData?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as HandwritingRequest;

  if (!body.imageData) {
    return NextResponse.json(
      { text: "" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    text: "Handwriting recognition is not connected yet. Replace with OCR integration.",
  });
}
