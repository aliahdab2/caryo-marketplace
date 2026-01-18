import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("Test Error: Checking if Sentry is working!");
}
