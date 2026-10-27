import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/core/db";
import { normaliseReferralCode } from "@/lib/domain/referrals";

// Referral links: /r/CODE → remembers the code for the attribution window and
// sends the visitor to sign-up. Attribution itself happens server-side at
// registration, where self-referrals and unknown codes are rejected.
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = normaliseReferralCode(raw);
  const target = new URL("/sign-up", request.url);
  if (!code) return NextResponse.redirect(target);

  const [settings, referrer] = await Promise.all([
    db.affiliateSettings.findUnique({ where: { id: 1 } }),
    db.user.findUnique({ where: { referralCode: code }, select: { status: true } }),
  ]);
  if (!settings?.programEnabled || !referrer || referrer.status !== "ACTIVE") return NextResponse.redirect(target);

  target.searchParams.set("ref", code);
  const res = NextResponse.redirect(target);
  res.cookies.set("lifeos_ref", code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: settings.attributionWindowDays * 24 * 60 * 60,
  });
  return res;
}
