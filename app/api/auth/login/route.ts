import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const data = await request.json();
  const username = String(data?.username ?? "").trim().toLowerCase();

  if (!username) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      nfts: { include: { template: true } },
      boosts: { include: { template: true } },
      cosmetics: { include: { item: true } }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
