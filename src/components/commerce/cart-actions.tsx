"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Trash2 } from "lucide-react";
import { checkoutCart, removeFromCart } from "@/actions/commerce";
import { Button } from "@/components/ui/button";

export function RemoveFromCartButton({ productId, name }: { productId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Remove ${name} from cart`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await removeFromCart(productId);
          toast.success(`${name} removed from your cart.`);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}

export function CheckoutButton({ disabled }: { disabled?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      className="w-full"
      disabled={pending || disabled}
      onClick={() =>
        start(async () => {
          const res = await checkoutCart();
          if (res && !res.ok) toast.error(res.error);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : null}
      Continue to checkout <ArrowRight />
    </Button>
  );
}
