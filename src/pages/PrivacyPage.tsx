import { Link } from 'react-router'
import { hasEmail, mailHref, site } from '../config/site'
import { Meta } from '../seo'

export function PrivacyPage() {
  return (
    <section className="bg-paper pb-24 pt-32 text-ink lg:pt-40">
      <Meta title="Privacy" path="/privacy" description={`How ${site.name} handles the personal information you share through this website.`} />
      <div className="container-x max-w-3xl">
        <p className="eyebrow !text-ink/60">Privacy</p>
        <h1 className="display-tight mt-6 text-[clamp(2.2rem,5vw,3.75rem)] uppercase">How we handle your information</h1>
        <div className="mt-10 space-y-6 leading-relaxed text-ink/75 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
          <p>This website collects personal information only when you choose to send an enquiry or booking request.</p>
          <h2>What we collect</h2>
          <p>
            Your name, company (optional), phone number, email address (optional), the service you are interested in, your city or service location, a preferred
            date or time window, equipment quantities and any notes you add.
          </p>
          <h2>Why we collect it</h2>
          <p>To respond to your enquiry, arrange a visit or prepare a quotation. We do not sell your information or use it for unrelated marketing.</p>
          <h2>Where it goes</h2>
          <p>
            Form submissions are delivered to our team through a third-party form delivery service, which processes the data on our behalf. If you contact us
            by phone, WhatsApp or email instead, those services’ own terms also apply.
          </p>
          <h2>Cookies and analytics</h2>
          <p>This website does not currently use advertising cookies or third-party analytics. If that changes, this page will be updated and consent will be requested where required.</p>
          <h2>Your rights</h2>
          <p>
            Under India’s Digital Personal Data Protection Act, 2023 you may ask us to access, correct or erase the personal information you have shared, or
            withdraw your consent.{' '}
            {hasEmail() ? (
              <>
                Email <a className="underline underline-offset-4" href={mailHref('Privacy request')}>{site.contact.email}</a>.
              </>
            ) : (
              <>
                Use the <Link className="underline underline-offset-4" to="/contact">contact page</Link> to reach us.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
