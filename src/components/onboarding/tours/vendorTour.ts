import type { TourConfig } from '../types'

export const vendorTour: TourConfig = {
  key:   'vendorTour',
  title: 'Vendor Portal — first run',
  steps: [
    {
      code:     'ON-01',
      anchorId: null,
      headline: 'Hi {name}.',
      body:     'Three things live here — the Forestry catalogue, custom design briefs, and your order history. Two minutes to walk through.',
      cta:      'Continue',
    },
    {
      code:       'ON-02',
      anchorId:   'vendor.nav.products',
      headline:   'Browse the catalogue.',
      body:       'Curated by Forestry. Pick what you want to order.',
      cta:        'Take me there',
      navigateTo: '/portal/products',
    },
    {
      code:       'ON-03',
      anchorId:   'vendor.nav.customDesign',
      headline:   'Need something off-catalogue?',
      body:       'Submit a custom design brief — our team will produce it to your spec.',
      cta:        'Continue',
    },
    {
      code:     'ON-04',
      anchorId: 'vendor.nav.rfp',
      headline: 'Track your RFPs.',
      body:     'Every request you send to our team appears here, from quote to delivery.',
      cta:      'Continue',
    },
    {
      code:       'ON-05',
      anchorId:   'vendor.nav.profile',
      headline:   'Two minutes well spent.',
      body:       'Complete your company profile so Forestry can verify, deliver, and invoice you faster.',
      cta:        'Open my profile',
      navigateTo: '/portal/profile',
    },
  ],
  finale: {
    headline: 'You are set.',
    body:     'Start with the catalogue. Custom briefs are one click away when you need them.',
    cta:      'Start browsing',
  },
}
