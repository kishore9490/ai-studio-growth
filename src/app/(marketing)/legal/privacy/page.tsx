import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/site/prose";

export const metadata: Metadata = { title: "Privacy Policy (draft)" };

const LAST_UPDATED = "27 October 2026";

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      summary="How LifeOS Digital collects, uses and protects personal data when you use our website, tools, marketplace and membership."
      lastUpdated={LAST_UPDATED}
      sections={[
        {
          id: "who-we-are",
          title: "Who we are",
          body: (
            <p>
              LifeOS Digital (&ldquo;LifeOS&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a platform of digital tools,
              downloadable products, a resource library, an optional membership and an optional affiliate programme. For the
              purposes of applicable data protection law, including India&apos;s Digital Personal Data Protection Act, 2023, we
              act as the data fiduciary for the personal data described here. [Legal entity name, registered address and
              grievance officer details to be added before launch.]
            </p>
          ),
        },
        {
          id: "data-we-collect",
          title: "Data we collect",
          body: (
            <>
              <ul>
                <li>
                  <strong>Account data:</strong> name, email address, a salted hash of your password (we never store the password
                  itself), and the referral code assigned to you.
                </li>
                <li>
                  <strong>Profile and preferences:</strong> optional headline and bio, the interests and dashboard sections you
                  choose, and email preferences.
                </li>
                <li>
                  <strong>Transactions:</strong> orders, the products and plans purchased, amounts, tax, and payment status. Card or
                  UPI details are handled by our payment provider and are not stored by us.
                </li>
                <li>
                  <strong>Affiliate data:</strong> if you join the affiliate programme, who referred whom, attribution dates,
                  qualifying orders and commission records.
                </li>
                <li>
                  <strong>Usage data:</strong> items you recently viewed (to show &ldquo;recently viewed&rdquo; on your dashboard),
                  sign-in sessions including browser user agent, and security logs.
                </li>
              </ul>
              <p>
                Content you type into tools such as the Resume Builder, Proposal Builder, Budget Planner and Content Planner is
                stored in your own browser and is not sent to our servers. Text you submit to the AI Writing Workspace is sent to
                our server and, where an AI provider is configured, to that provider to generate a response.
              </p>
            </>
          ),
        },
        {
          id: "how-we-use",
          title: "How we use data",
          body: (
            <ul>
              <li>To create and secure your account and keep you signed in.</li>
              <li>To process purchases, grant access to products you have paid for, and handle refunds.</li>
              <li>To run the optional affiliate programme, including fraud prevention such as blocking self-referrals.</li>
              <li>To personalise recommendations on your dashboard based on the interests you select.</li>
              <li>To send essential service messages, and product updates only if you have opted in.</li>
              <li>To meet legal, tax and accounting obligations.</li>
            </ul>
          ),
        },
        {
          id: "sharing",
          title: "Sharing and processors",
          body: (
            <>
              <p>
                We do not sell personal data. We share it only with service providers who process it on our behalf, such as
                hosting, payment processing, email delivery and (for the writing tool) AI model providers, under contracts that
                restrict their use of it.
              </p>
              <p>We may disclose data where required by law or to protect the rights and safety of users and the platform.</p>
            </>
          ),
        },
        {
          id: "retention",
          title: "Retention",
          body: (
            <p>
              We keep account data while your account is active. Transaction and commission records are retained for the period
              required by tax and accounting law. Expired sessions and password reset tokens are deleted or invalidated. [Specific
              retention periods to be confirmed during legal review.]
            </p>
          ),
        },
        {
          id: "your-rights",
          title: "Your rights",
          body: (
            <p>
              Subject to applicable law, you may request access to, correction of, or erasure of your personal data, withdraw
              consent where processing relies on it, and nominate another person to exercise your rights. You can update most
              profile information in <Link href="/app/settings">Settings</Link>. For other requests, including account deletion,
              please <Link href="/contact">contact us</Link>.
            </p>
          ),
        },
        {
          id: "security",
          title: "Security",
          body: (
            <p>
              Passwords are hashed with a memory-hard algorithm, sessions use random tokens stored only as hashes, paid files are
              kept in private storage and served through short-lived signed links, and financial actions are recorded in an audit
              log. No system is perfectly secure; we will notify affected users and authorities of breaches as required by law.
            </p>
          ),
        },
        {
          id: "cookies",
          title: "Cookies and local storage",
          body: (
            <p>
              We use a strictly necessary session cookie to keep you signed in and, if you follow a referral link, a cookie that
              remembers the referral code for the attribution window. Tools store your work in your browser&apos;s local storage.
              We do not currently use advertising cookies.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes",
          body: <p>We will post updates to this policy on this page and, for material changes, notify account holders by email.</p>,
        },
      ]}
    />
  );
}
