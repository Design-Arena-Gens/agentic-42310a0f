import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    requireAdminToken();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      nfts: { include: { template: true } }
    }
  });

  return NextResponse.json({ users });
}
