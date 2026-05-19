import { NextRequest, NextResponse } from "next/server";
import { createPrismaClient } from "../../../../lib/prisma";
import { auditData, hashPassword, originGuard, parseSignedSessionToken, verifyPassword } from "../../../../lib/auth/server-session";

const SESSION_COOKIE = "zcc_session";

export async function PATCH(request: NextRequest) {
  const originDenied = originGuard(request);
  if (originDenied) return originDenied;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = parseSignedSessionToken(token, request.headers.get("user-agent"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const nextDisplayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  const prisma = await createPrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        passwordHash: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found in database" }, { status: 404 });
    }

    const updateData: { displayName?: string; passwordHash?: string } = {};

    if (nextDisplayName && nextDisplayName !== user.displayName) {
      updateData.displayName = nextDisplayName;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      if (!verifyPassword(currentPassword, user.passwordHash)) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }
      updateData.passwordHash = hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        }
      });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true
      }
    });

    await prisma.auditLog.create({
      data: auditData(user.id, {
        entityType: "User",
        entityId: user.id,
        action: "user.updated",
        beforeJson: JSON.stringify({ displayName: user.displayName }),
        afterJson: JSON.stringify({ displayName: updated.displayName, passwordChanged: Boolean(updateData.passwordHash) })
      })
    });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
