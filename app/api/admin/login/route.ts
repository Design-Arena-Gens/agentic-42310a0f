import { NextResponse } from "next/server";
import { createAdminToken, verifyAdminPassword } from "@/lib/admin";

export async function POST(request: Request) {
  const data = await request.json();
  const password = String(data?.password ?? "");

  if (!password) {
    return NextResponse.json({ error: "INVALID_PASSWORD" }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const token = createAdminToken();

  return NextResponse.json({ token });
}
