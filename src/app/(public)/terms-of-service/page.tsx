import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Forestry UAE',
  robots: { index: false, follow: false },
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-cream pt-36 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-4">Terms of Service</h1>
        <p className="text-charcoal/50 text-sm mb-10">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none text-charcoal-700 space-y-8">
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">1. B2B Trade Only</h2>
            <p className="leading-relaxed">The Forestry vendor portal and all services at theforestry.me are available exclusively to registered B2B trade clients. A valid UAE or GCC trade licence is required for account approval. Consumer (retail) purchases are not available through this platform.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">2. Account Responsibility</h2>
            <p className="leading-relaxed">Approved vendors are responsible for maintaining the confidentiality of their login credentials and for all activity conducted under their account. Notify us immediately at info@theforestry.me if you suspect unauthorised access.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">3. RFP and Quotation Process</h2>
            <p className="leading-relaxed">Submitting an RFP constitutes a request for a formal quotation, not a purchase order. A binding order is only created upon written acceptance of a formal quotation issued by Forestry. Quotations are valid for 30 days from the date of issue unless otherwise stated.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">4. Custom Manufacturing</h2>
            <p className="leading-relaxed">All products are manufactured to client specification. Once production has commenced, orders cannot be cancelled or modified. Clients are responsible for the accuracy of dimensions, colour references, and specifications provided in their RFP.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">5. Intellectual Property</h2>
            <p className="leading-relaxed">All content on theforestry.me — including product images, descriptions, and catalogue data — is the property of Forestry Manufacturing LLC. Reproduction or commercial use without written permission is prohibited.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">6. Limitation of Liability</h2>
            <p className="leading-relaxed">Forestry's liability for any claim arising from an order is limited to the value of that order. We are not liable for indirect, consequential, or project delay losses.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">7. Governing Law</h2>
            <p className="leading-relaxed">These terms are governed by the laws of the United Arab Emirates. Any disputes shall be subject to the jurisdiction of UAE courts.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">8. Contact</h2>
            <p className="leading-relaxed">For terms enquiries: <a href="mailto:info@theforestry.me" className="text-terracotta hover:underline">info@theforestry.me</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
