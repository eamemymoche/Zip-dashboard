import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createPrismaClient } from "../../../../lib/prisma";

const SESSION_COOKIE = "zcc_session";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";

function parseSessionToken(token: string): { userId: string; role: string; ts: number } | null {
  try {
    const [payload, sig] = token.split(".");
    const expectedSig = createHash("sha256").update(payload + SESSION_SECRET).digest("hex").slice(0, 16);
    if (sig !== expectedSig) return null;
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [userId, role, ts] = decoded.split(":");
    return { userId, role, ts: Number(ts) };
  } catch {
    return null;
  }
}

function hashPassword(password: string) {
  return createHash("sha256").update(password + SESSION_SECRET).digest("hex");
}

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = parseSessionToken(token);
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
      if (!user.passwordHash || hashPassword(currentPassword) !== user.passwordHash) {
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
        email: true,
        displayName: true,
        role: true
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entityType: "User",
        entityId: user.id,
        action: "user.updated",
        beforeJson: JSON.stringify({ displayName: user.displayName }),
        afterJson: JSON.stringify({ displayName: updated.displayName, passwordChanged: Boolean(updateData.passwordHash) })
      }
    });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
