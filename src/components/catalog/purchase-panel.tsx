"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Crown, Download, Gift, Loader2, ShoppingCart, Zap } from "lucide-react";
import { addToCart, buyNow, claimFreeProduct } from "@/actions/commerce";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatINR } from "@/lib/domain/money";

export type PurchaseState =
  | { kind: "guest" }
  | { kind: "owned" }
  | { kind: "premium-access" }
  | { kind: "in-cart" }
  | { kind: "available"; isPremium: boolean };

export function PurchasePanel({
  productId,
  slug,
  priceInPaise,
  includedWithPremium,
  state,
}: {
  productId: string;
  slug: string;
  priceInPaise: number;
  includedWithPremium: boolean;
  state: PurchaseState;
}) {
  const [pending, start] = useTransition();
  const appHref = `/app/marketplace/${slug}`;
  const free = priceInPaise === 0;

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string } | undefined>) =>
    start(async () => {
      const res = await fn();
      if (!res) return;
      if (res.ok) {
        if (res.message) toast.success(res.message);
      } else if (res.error) toast.error(res.error);
    });

  return (
    <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[30px] font-semibold tracking-[-0.035em] tabular-nums">{free ? "Free" : formatINR(priceInPaise)}</p>
        <p className="text-[12.5px] text-ink-3">{free ? "No payment needed" : "One-time purchase"}</p>
      </div>
      {!free && <p className="mt-1 text-[12.5px] text-ink-3">Prices exclude tax. Tax is shown at checkout.</p>}

      <div className="mt-5 flex flex-col gap-2">
        {state.kind === "owned" && (
          <>
            <div className="flex items-center gap-2 rounded-[10px] bg-success-soft px-3 py-2.5 text-[13.5px] font-medium text-success">
              <Check className="size-4" /> In your library
            </div>
            <ButtonLink href={`/app/library#${slug}`} size="lg">
              <Download /> Go to downloads
            </ButtonLink>
          </>
        )}
        {state.kind === "premium-access" && (
          <>
            <div className="flex items-center gap-2 rounded-[10px] bg-lavender px-3 py-2.5 text-[13.5px] font-medium text-accent-ink">
              <Crown className="size-4" /> Included with your Premium membership
            </div>
            <ButtonLink href={`/app/library#${slug}`} size="lg">
              <Download /> Open in library
            </ButtonLink>
            <p className="text-[12.5px] text-ink-3">Access lasts while your membership is active.</p>
          </>
        )}
        {state.kind === "in-cart" && (
          <ButtonLink href="/app/cart" size="lg">
            <ShoppingCart /> In your cart — view cart
          </ButtonLink>
        )}
        {(state.kind === "available" || state.kind === "guest") &&
          (free ? (
            <Button size="lg" disabled={pending} onClick={() => run(() => claimFreeProduct(productId, appHref))}>
              {pending ? <Loader2 className="animate-spin" /> : <Gift />} Add to library — free
            </Button>
          ) : (
            <>
              <Button size="lg" disabled={pending} onClick={() => run(() => buyNow(productId, appHref))}>
                {pending ? <Loader2 className="animate-spin" /> : <Zap />} Buy now
              </Button>
              <Button size="lg" variant="secondary" disabled={pending} onClick={() => run(() => addToCart(productId, appHref))}>
                <ShoppingCart /> Add to cart
              </Button>
            </>
          ))}
        {state.kind === "guest" && <p className="text-center text-[12.5px] text-ink-3">You&apos;ll be asked to sign in or create a free account.</p>}
      </div>

      {includedWithPremium && !free && state.kind !== "premium-access" && state.kind !== "owned" && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium">
            <Crown className="size-3.5 text-accent" /> Also included with Premium
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
            Premium members can access this product while their membership is active. Buying it outright means you keep it permanently.
          </p>
          <Link href={state.kind === "guest" ? "/membership" : "/app/membership"} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline">
            Compare plans <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
