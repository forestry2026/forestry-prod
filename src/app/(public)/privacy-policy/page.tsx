import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Forestry UAE',
  robots: { index: false, follow: false },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-cream pt-36 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-charcoal-900 mb-4">Privacy Policy</h1>
        <p className="text-charcoal/50 text-sm mb-10">Last updated: June 2026</p>

        <div className="prose prose-sm max-w-none text-charcoal-700 space-y-8">
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">1. Who We Are</h2>
            <p className="leading-relaxed">Forestry Manufacturing LLC operates theforestry.me, a B2B trade portal for custom planter procurement in the UAE. Our contact address is info@theforestry.me.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">2. Data We Collect</h2>
            <p className="leading-relaxed">We collect business contact information (name, company, email, phone, trade licence number) submitted during vendor account applications and RFP submissions. We also collect technical data (IP address, browser type, page visits) for site operation and security.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">3. How We Use Your Data</h2>
            <p className="leading-relaxed">Data is used to process vendor account applications, manage RFP submissions and quotations, send transactional emails related to your orders, and maintain the security and performance of the platform. We do not sell or share personal data with third parties for marketing purposes.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">4. Data Retention</h2>
            <p className="leading-relaxed">Account and transaction data is retained for the duration of the business relationship and for a period of 5 years thereafter for legal and accounting compliance. You may request deletion of your personal data at any time by contacting info@theforestry.me.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">5. Your Rights</h2>
            <p className="leading-relaxed">You have the right to access, correct, or delete personal data we hold about you. Contact info@theforestry.me with your request. We will respond within 30 days.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">6. Cookies</h2>
            <p className="leading-relaxed">We use session cookies for authentication and basic analytics. No third-party advertising cookies are used.</p>
          </section>
          <section>
            <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-3">7. Contact</h2>
            <p className="leading-relaxed">For privacy enquiries: <a href="mailto:info@theforestry.me" className="text-terracotta hover:underline">info@theforestry.me</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
