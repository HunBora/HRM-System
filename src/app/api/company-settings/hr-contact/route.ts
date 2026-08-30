import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { hrContactUrl } = await req.json();

    if (!hrContactUrl) {
      return NextResponse.json({ error: "No hrContactUrl provided" }, { status: 400 });
    }

    const settings = await prisma.companySettings.upsert({
      where: { id: "default" },
      update: { hrContactUrl },
      create: { hrContactUrl },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Failed to update hrContactUrl:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
