import { Link } from 'react-router'
import { Meta } from '../seo'

export function NotFoundPage() {
  return (
    <section className="grid min-h-[80vh] place-items-center bg-graphite pt-16">
      <Meta title="Page not found" description="The page you were looking for could not be found." path="/404" noindex />
      <div className="container-x text-center">
        <p className="eyebrow">Error 404</p>
        <h1 className="display mt-6 text-[clamp(2.5rem,8vw,6rem)]">Page not found.</h1>
        <p className="mx-auto mt-6 max-w-md text-tech/65">The page may have moved. Try one of these instead.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn btn-primary">Home</Link>
          <Link to="/services" className="btn btn-ghost">Services</Link>
          <Link to="/contact" className="btn btn-ghost">Contact</Link>
        </div>
      </div>
    </section>
  )
}
