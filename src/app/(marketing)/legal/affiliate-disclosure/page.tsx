import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/site/prose";

export const metadata: Metadata = { title: "Affiliate Disclosure (draft)" };

const LAST_UPDATED = "27 October 2026";

export default function AffiliateDisclosurePage() {
  return (
    <LegalDocument
      title="Affiliate Disclosure"
      summary="How the LifeOS affiliate programme works, what it pays for, and what it never pays for."
      lastUpdated={LAST_UPDATED}
      sections={[
        {
          id: "status",
          title: "Current status: test mode",
          body: (
            <p>
              The affiliate programme is in a <strong>test phase</strong>. Commission records are calculated for testing only. No
              commissions are paid out and no payouts can be processed until the compensation structure has received legal and
              financial approval. Any balances you see are illustrative.
            </p>
          ),
        },
        {
          id: "what-it-is",
          title: "What the programme is",
          body: (
            <p>
              The Referral Centre lets members share a personal link to LifeOS. Joining is free and optional, and no purchase or
              membership is required to participate or to use any part of the platform.
            </p>
          ),
        },
        {
          id: "what-earns",
          title: "What can earn a commission",
          body: (
            <>
              <p>
                Commissions may only arise from <strong>verified, eligible product sales</strong>: a paid, non-refunded marketplace
                product purchase by a customer who was referred. The programme supports up to three referral levels, each with a
                configurable rate that the business can change or disable.
              </p>
              <p>Commission is calculated on the product price before tax and is reversed if the sale is refunded.</p>
            </>
          ),
        },
        {
          id: "what-never-earns",
          title: "What never earns a commission",
          body: (
            <ul>
              <li>Someone registering an account.</li>
              <li>Recruiting members or building a team.</li>
              <li>Purchasing or referring a Premium membership.</li>
              <li>Your own purchases (self-referrals are blocked).</li>
              <li>Free products.</li>
            </ul>
          ),
        },
        {
          id: "no-income-claims",
          title: "No income claims",
          body: (
            <p>
              LifeOS makes no promise or guarantee of income. Most participants should expect to earn little or nothing. Do not
              join, spend money or make financial decisions based on expected affiliate earnings.
            </p>
          ),
        },
        {
          id: "disclosure-duty",
          title: "Your disclosure obligations",
          body: (
            <p>
              If you share your referral link, you must clearly disclose that you may receive a commission, in line with the
              Advertising Standards Council of India guidelines for influencer advertising and any applicable law. Do not make
              misleading claims about LifeOS or about earnings.
            </p>
          ),
        },
        {
          id: "more",
          title: "More information",
          body: (
            <p>
              See the <Link href="/affiliate-programme">Affiliate Programme</Link> overview, or{" "}
              <Link href="/contact">contact us</Link> with questions.
            </p>
          ),
        },
      ]}
    />
  );
}
