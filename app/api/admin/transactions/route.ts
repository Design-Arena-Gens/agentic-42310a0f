import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminToken } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireAdminToken();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 50);

  const transactionsRaw = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
    include: {
      user: { select: { displayName: true } }
    }
  });

  const transactions = transactionsRaw.map((transaction) => ({
    ...transaction,
    metadata: transaction.metadata ? safeParseJSON(transaction.metadata) : null
  }));

  return NextResponse.json({ transactions });
}

function safeParseJSON(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
