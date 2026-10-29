import Link from 'next/link';
import { fontVariables } from './fonts';

// Fallback for requests outside any locale (rare: the proxy redirects most paths).
export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body className="surface-midnight flex min-h-screen items-center">
        <main className="container-x py-24">
          <p className="eyebrow">404</p>
          <h1 className="display-lg mt-6">This page could not be found.</h1>
          <p className="mt-6">
            <Link href="/en" className="btn btn-primary">
              Return to the home page
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
