import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_PRODUCT_WRITE } from "../../../lib/auth/role-guards";
import { getRoleFromRequest, roleGuard } from "../../../lib/auth/server-session";
import { createPrismaClient } from "../../../lib/prisma";

export async function POST(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_PRODUCT_WRITE);
  if (denied) return denied;

  let prisma;
  try {
    prisma = createPrismaClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const detail = String(body.detail ?? "").trim();

    if (!name || !detail) {
      return NextResponse.json({ error: "name and detail are required" }, { status: 400 });
    }

    const existing = await prisma.productPackage.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Product package already exists" }, { status: 409 });
    }

    const created = await prisma.productPackage.create({
      data: {
        name,
        detail,
        active: true
      }
    });

    return NextResponse.json(
      { name: created.name, detail: created.detail, active: created.active },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product package create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_PRODUCT_WRITE);
  if (denied) return denied;

  let prisma;
  try {
    prisma = createPrismaClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const originalName = String(body.originalName ?? "").trim();
    const nextName = String(body.name ?? "").trim();
    const nextDetail = String(body.detail ?? "").trim();

    if (!originalName || !nextName || !nextDetail) {
      return NextResponse.json({ error: "originalName, name and detail are required" }, { status: 400 });
    }

    const existing = await prisma.productPackage.findUnique({ where: { name: originalName } });
    if (!existing) {
      return NextResponse.json({ error: "Product package not found" }, { status: 404 });
    }

    if (originalName !== nextName) {
      const duplicate = await prisma.productPackage.findUnique({ where: { name: nextName } });
      if (duplicate) {
        return NextResponse.json({ error: "Product package already exists" }, { status: 409 });
      }
    }

    const updated = await prisma.productPackage.update({
      where: { name: originalName },
      data: { name: nextName, detail: nextDetail }
    });

    return NextResponse.json({ name: updated.name, detail: updated.detail, active: updated.active });
  } catch (error) {
    console.error("Product package update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PATCH(request: NextRequest) {
  const role = getRoleFromRequest(request);
  const denied = roleGuard(role, ALLOWED_ROLES_PRODUCT_WRITE);
  if (denied) return denied;

  let prisma;
  try {
    prisma = createPrismaClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const active = Boolean(body.active);

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const existing = await prisma.productPackage.findUnique({ where: { name } });
    if (!existing) {
      return NextResponse.json({ error: "Product package not found" }, { status: 404 });
    }

    const updated = await prisma.productPackage.update({
      where: { name },
      data: { active }
    });

    return NextResponse.json({ name: updated.name, detail: updated.detail, active: updated.active });
  } catch (error) {
    console.error("Product package toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
