import type { TourConfig } from '../types'

export const adminTour: TourConfig = {
  key:   'adminTour',
  title: 'Admin Portal — first run',
  steps: [
    {
      code:     'ON-01',
      anchorId: null,
      headline: 'Hi {name}.',
      body:     'The whole pipeline lives here — vendors, products, RFPs, production. Two minutes top to bottom.',
      cta:      'Continue',
    },
    {
      code:       'ON-02',
      anchorId:   'admin.nav.vendors',
      headline:   'Approve vendors first.',
      body:       'Nothing else works without an approved vendor in the system.',
      cta:        'Show me',
      navigateTo: '/admin/vendors',
    },
    {
      code:     'ON-03',
      anchorId: 'admin.nav.products',
      headline: 'Build the catalogue.',
      body:     'You add the products. Vendors quote on what you publish.',
      cta:      'Continue',
    },
    {
      code:       'ON-04',
      anchorId:   'admin.nav.rfps',
      headline:   'Where vendor RFPs land.',
      body:       'Review incoming requests from vendors, or create a manual RFP yourself.',
      cta:        'Continue',
    },
    {
      code:     'ON-05',
      anchorId: 'admin.nav.users',
      headline: 'Add your team.',
      body:     'Managers, production staff. Role-based access already configured.',
      cta:      'Finish',
    },
  ],
  finale: {
    headline: 'You are ready.',
    body:     'Start with vendors — everything else builds on that.',
    cta:      'Start',
  },
}
