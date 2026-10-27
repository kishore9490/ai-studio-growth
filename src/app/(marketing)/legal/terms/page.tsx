import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/site/prose";

export const metadata: Metadata = { title: "Terms of Service (draft)" };

const LAST_UPDATED = "27 October 2026";

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      summary="The agreement between you and LifeOS Digital for using the platform, buying digital products and holding a membership."
      lastUpdated={LAST_UPDATED}
      sections={[
        {
          id: "acceptance",
          title: "Accepting these terms",
          body: (
            <p>
              By creating an account or using LifeOS Digital you agree to these Terms, our{" "}
              <Link href="/legal/privacy">Privacy Policy</Link> and our <Link href="/legal/refund-policy">Refund Policy</Link>.
              You must be at least 18, or have the consent of a parent or guardian, to make purchases.
            </p>
          ),
        },
        {
          id: "accounts",
          title: "Your account",
          body: (
            <ul>
              <li>Accounts are free. You are responsible for keeping your password confidential.</li>
              <li>Provide accurate information and keep your email address up to date.</li>
              <li>We may suspend accounts involved in fraud, abuse of the affiliate programme, or breach of these Terms.</li>
            </ul>
          ),
        },
        {
          id: "digital-products",
          title: "Digital products and licences",
          body: (
            <>
              <p>
                Marketplace products are digital files and templates. Each product page states what is included and the licence
                that applies. Unless a product says otherwise:
              </p>
              <ul>
                <li>
                  <strong>Personal licence:</strong> use for yourself. You may not resell, share or redistribute the files.
                </li>
                <li>
                  <strong>Commercial licence:</strong> use within your own business and for your own clients. You may not resell or
                  redistribute the product itself.
                </li>
              </ul>
              <p>
                A one-time purchase gives you ongoing access to download the product from your library for as long as the platform
                operates, unless the purchase is refunded.
              </p>
            </>
          ),
        },
        {
          id: "membership",
          title: "Premium membership",
          body: (
            <>
              <p>
                Premium is optional. It gives access to premium tools, the expanded resource library and products marked
                &ldquo;Included with Premium&rdquo; while your membership is active. Premium-included products are not owned
                outright; access ends when the membership ends.
              </p>
              <p>
                Memberships renew at the end of each billing period at the price shown at the time of renewal, unless cancelled.
                You can cancel from the Membership page at any time; access continues until the end of the period you have paid
                for.
              </p>
            </>
          ),
        },
        {
          id: "payments",
          title: "Prices, tax and payments",
          body: (
            <p>
              Prices are shown in Indian Rupees (INR) and exclude applicable taxes, which are shown at checkout. Access is granted
              only after the payment provider confirms payment to our servers. [Tax treatment, GST registration and invoicing
              details to be confirmed before launch.]
            </p>
          ),
        },
        {
          id: "affiliate",
          title: "Affiliate programme",
          body: (
            <p>
              The affiliate programme is optional, free and governed by separate programme terms and our{" "}
              <Link href="/legal/affiliate-disclosure">Affiliate Disclosure</Link>. Participation is never required to use the
              platform, and no earnings are guaranteed.
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <ul>
              <li>Do not attempt to access other users&apos; accounts or data, or bypass access controls.</li>
              <li>Do not use the tools to create unlawful, deceptive or infringing content.</li>
              <li>Do not create multiple accounts to manipulate referrals or promotions.</li>
            </ul>
          ),
        },
        {
          id: "ai-output",
          title: "AI-assisted features",
          body: (
            <p>
              Output from AI-assisted tools may be inaccurate or incomplete. Review it before relying on it. You are responsible
              for how you use generated content.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Disclaimers and liability",
          body: (
            <p>
              Resources and templates are provided for general information and are not professional legal, financial, tax or
              career advice. To the extent permitted by law, our total liability for any claim is limited to the amount you paid us
              in the twelve months before the claim. Nothing in these Terms limits rights you have under consumer protection law.
            </p>
          ),
        },
        {
          id: "governing-law",
          title: "Governing law",
          body: <p>These Terms are governed by the laws of India. [Jurisdiction and dispute resolution to be confirmed during legal review.]</p>,
        },
      ]}
    />
  );
}
