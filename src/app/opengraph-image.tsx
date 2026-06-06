import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'Forestry — Custom Planters & Bespoke Pots Manufacturer UAE'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: '#F5F0E8',
          position:        'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position:        'absolute',
            top:             0,
            left:            0,
            right:           0,
            height:          6,
            backgroundColor: '#3A4921',
          }}
        />

        {/* Logo wordmark */}
        <div
          style={{
            fontFamily:    'Georgia, serif',
            fontSize:      140,
            fontWeight:    400,
            color:         '#3A4921',
            letterSpacing: '-2px',
            lineHeight:    1,
            marginBottom:  24,
          }}
        >
          Forestry
        </div>

        {/* Divider */}
        <div
          style={{
            width:           80,
            height:          2,
            backgroundColor: '#3A4921',
            marginBottom:    28,
            opacity:         0.4,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontFamily:    'Georgia, serif',
            fontSize:      28,
            fontWeight:    400,
            color:         '#3A4921',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            opacity:       0.7,
          }}
        >
          Custom Planters · Manufactured to Specification · UAE
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position:        'absolute',
            bottom:          0,
            left:            0,
            right:           0,
            height:          6,
            backgroundColor: '#3A4921',
          }}
        />

        {/* Corner URL */}
        <div
          style={{
            position:   'absolute',
            bottom:     24,
            right:      40,
            fontFamily: 'Georgia, serif',
            fontSize:   18,
            color:      '#3A4921',
            opacity:    0.5,
          }}
        >
          forestry.ae
        </div>
      </div>
    ),
    { ...size },
  )
}
