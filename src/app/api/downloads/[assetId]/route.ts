import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/core/audit";
import { db } from "@/lib/core/db";
import { productAccess } from "@/lib/core/membership";
import { signDownloadToken } from "@/lib/domain/signing";
import { getCurrentUser } from "@/lib/server/auth";
import { env } from "@/lib/server/env";

const TOKEN_TTL_SECONDS = 5 * 60;

// Step 1 of a download: check the session and entitlement, then redirect to a
// short-lived signed link. The link itself is useless after five minutes.
export async function GET(request: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/sign-in?next=/app/library`, request.url));

  const asset = await db.productAsset.findUnique({ where: { id: assetId }, select: { id: true, productId: true, fileName: true } });
  if (!asset) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const access = await productAccess(user.id, asset.productId);
  if (!access.allowed) return NextResponse.json({ error: "You don't have access to this file." }, { status: 403 });

  const token = signDownloadToken(env.downloadSigningSecret, {
    assetId: asset.id,
    userId: user.id,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });
  await audit({ actorId: user.id, action: "asset.download_link_issued", entityType: "ProductAsset", entityId: asset.id, metadata: { via: access.via } });
  return NextResponse.redirect(new URL(`/api/files?token=${encodeURIComponent(token)}`, request.url));
}
