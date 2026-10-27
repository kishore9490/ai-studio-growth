import { Badge, type BadgeTone } from "@/components/ui/misc";

const ORDER: Record<string, { tone: BadgeTone; label: string }> = {
  PENDING: { tone: "warning", label: "Awaiting payment" },
  PAID: { tone: "success", label: "Paid" },
  FAILED: { tone: "danger", label: "Payment failed" },
  CANCELLED: { tone: "neutral", label: "Cancelled" },
  REFUNDED: { tone: "neutral", label: "Refunded" },
};

const COMMISSION: Record<string, { tone: BadgeTone; label: string }> = {
  PENDING: { tone: "warning", label: "Pending" },
  APPROVED: { tone: "success", label: "Approved" },
  REVERSED: { tone: "danger", label: "Reversed" },
  PAID: { tone: "dark", label: "Paid" },
};

const PAYOUT: Record<string, { tone: BadgeTone; label: string }> = {
  REQUESTED: { tone: "warning", label: "Under review" },
  APPROVED: { tone: "success", label: "Approved (test)" },
  REJECTED: { tone: "danger", label: "Declined" },
  PAID: { tone: "dark", label: "Paid" },
};

const PRODUCT: Record<string, { tone: BadgeTone; label: string }> = {
  DRAFT: { tone: "neutral", label: "Draft" },
  PUBLISHED: { tone: "success", label: "Published" },
  ARCHIVED: { tone: "outline", label: "Archived" },
};

function make(map: Record<string, { tone: BadgeTone; label: string }>) {
  return function StatusBadge({ status }: { status: string }) {
    const s = map[status] ?? { tone: "neutral" as const, label: status };
    return <Badge tone={s.tone}>{s.label}</Badge>;
  };
}

export const OrderStatusBadge = make(ORDER);
export const CommissionStatusBadge = make(COMMISSION);
export const PayoutStatusBadge = make(PAYOUT);
export const ProductStatusBadge = make(PRODUCT);
