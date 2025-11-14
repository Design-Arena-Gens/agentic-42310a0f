import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const data = await request.json();
  const username = String(data?.username ?? "").trim().toLowerCase();
  const displayName = String(data?.displayName ?? "").trim();

  if (!username || !displayName) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      username,
      displayName,
      goldBalance: 0,
      usdBalance: 0,
      energy: 120,
      farmLastClaimedAt: new Date()
    }
  });

  return NextResponse.json({ user });
}
