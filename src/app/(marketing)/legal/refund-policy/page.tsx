import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/site/prose";

export const metadata: Metadata = { title: "Refund Policy (draft)" };

const LAST_UPDATED = "27 October 2026";

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund Policy"
      summary="When and how you can get a refund for a digital product or a Premium membership."
      lastUpdated={LAST_UPDATED}
      sections={[
        {
          id: "overview",
          title: "Overview",
          body: (
            <p>
              Because digital products can be downloaded immediately, refunds work a little differently from physical goods. We
              still want you to be happy with what you buy, so we offer a short, no-fuss window for most purchases.
            </p>
          ),
        },
        {
          id: "products",
          title: "One-time product purchases",
          body: (
            <ul>
              <li>You can request a refund within 7 days of purchase if the product is not what its listing described.</li>
              <li>
                Duplicate purchases, purchases that failed to deliver files, and files that are corrupted and cannot be replaced
                are always refunded.
              </li>
              <li>When a refund is issued, access to the product is removed from your library.</li>
            </ul>
          ),
        },
        {
          id: "membership",
          title: "Premium membership",
          body: (
            <ul>
              <li>
                You can cancel at any time from the <Link href="/app/membership">Membership</Link> page. Cancelling stops the next
                renewal; access continues until the end of the paid period.
              </li>
              <li>A new annual membership can be refunded in full within 7 days of the first payment.</li>
              <li>Partial-period refunds are not provided except where required by law.</li>
            </ul>
          ),
        },
        {
          id: "how",
          title: "How to request a refund",
          body: (
            <p>
              <Link href="/contact">Contact us</Link> with your order number (shown on your Orders page) and a short description.
              Approved refunds are returned to the original payment method; timing depends on your bank or payment provider.
            </p>
          ),
        },
        {
          id: "affiliate",
          title: "Effect on affiliate commissions",
          body: (
            <p>
              If a referred purchase is refunded, any commission connected to it is reversed. This is why commissions stay pending
              for a hold period before they can be approved.
            </p>
          ),
        },
        {
          id: "rights",
          title: "Your statutory rights",
          body: (
            <p>
              This policy does not affect any rights you have under the Consumer Protection Act, 2019 and related rules on
              e-commerce. [Final refund windows to be confirmed during legal review.]
            </p>
          ),
        },
      ]}
    />
  );
}
