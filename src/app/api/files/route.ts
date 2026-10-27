import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/core/db";
import { productAccess } from "@/lib/core/membership";
import { verifyDownloadToken } from "@/lib/domain/signing";
import { env } from "@/lib/server/env";
import { resolveStoragePath } from "@/lib/server/storage";

// Step 2 of a download: verify the signed, expiring token, re-check access
// (an entitlement may have been revoked by a refund since the link was issued),
// then stream the file from private storage.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const verified = verifyDownloadToken(env.downloadSigningSecret, token);
  if (!verified.ok) {
    const message = verified.reason === "expired" ? "This download link has expired. Start the download again from your library." : "Invalid download link.";
    return NextResponse.json({ error: message }, { status: verified.reason === "expired" ? 410 : 403 });
  }
  const { assetId, userId } = verified.claims;
  const asset = await db.productAsset.findUnique({ where: { id: assetId } });
  if (!asset) return NextResponse.json({ error: "File not found" }, { status: 404 });
  const access = await productAccess(userId, asset.productId);
  if (!access.allowed) return NextResponse.json({ error: "Access to this file has ended." }, { status: 403 });

  let body: Buffer;
  try {
    body = await readFile(resolveStoragePath(asset.storageKey));
  } catch {
    return NextResponse.json({ error: "File is temporarily unavailable." }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": `${asset.mimeType}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${asset.fileName.replace(/[^\w.\-]/g, "_")}"`,
      "Content-Length": String(body.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
