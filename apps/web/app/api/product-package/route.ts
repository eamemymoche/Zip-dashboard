import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ROLES_PRODUCT_WRITE } from "../../../lib/auth/role-guards";
import { auditData, requireRole } from "../../../lib/auth/server-session";
import { createPrismaClient } from "../../../lib/prisma";

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_PRODUCT_WRITE);
  if ("response" in auth) return auth.response;

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

    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "ProductPackage",
        entityId: created.id,
        action: "product.created",
        afterJson: JSON.stringify({ name: created.name, active: created.active })
      })
    });

    return NextResponse.json(
      { name: created.name, detail: created.detail, active: created.active },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product package create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_PRODUCT_WRITE);
  if ("response" in auth) return auth.response;

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

    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "ProductPackage",
        entityId: updated.id,
        action: "product.updated",
        beforeJson: JSON.stringify({ name: existing.name, detail: existing.detail, active: existing.active }),
        afterJson: JSON.stringify({ name: updated.name, detail: updated.detail, active: updated.active })
      })
    });

    return NextResponse.json({ name: updated.name, detail: updated.detail, active: updated.active });
  } catch (error) {
    console.error("Product package update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, ALLOWED_ROLES_PRODUCT_WRITE);
  if ("response" in auth) return auth.response;

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

    await prisma.auditLog.create({
      data: auditData(auth.userId, {
        entityType: "ProductPackage",
        entityId: updated.id,
        action: "product.toggled",
        beforeJson: JSON.stringify({ name: existing.name, active: existing.active }),
        afterJson: JSON.stringify({ name: updated.name, active: updated.active })
      })
    });

    return NextResponse.json({ name: updated.name, detail: updated.detail, active: updated.active });
  } catch (error) {
    console.error("Product package toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
