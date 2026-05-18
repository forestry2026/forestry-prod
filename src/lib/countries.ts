export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string; // emoji flag
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  // Middle East
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', dialCode: '+962' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', dialCode: '+961' },
  { code: 'AQ', name: 'Iraq', flag: '🇮🇶', dialCode: '+964' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', dialCode: '+963' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', dialCode: '+967' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', dialCode: '+970' },

  // North Africa
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', dialCode: '+218' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },

  // Europe
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7' },

  // Americas
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', dialCode: '+591' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', dialCode: '+53' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', dialCode: '+1' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', dialCode: '+1' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', dialCode: '+1' },

  // South Asia
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', dialCode: '+975' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93' },

  // Southeast Asia
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', dialCode: '+855' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', dialCode: '+673' },
  { code: 'TL', name: 'East Timor', flag: '🇹🇱', dialCode: '+670' },

  // East Asia
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', dialCode: '+850' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴', dialCode: '+853' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', dialCode: '+976' },

  // Oceania
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', dialCode: '+679' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', dialCode: '+677' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', dialCode: '+678' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', dialCode: '+676' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', dialCode: '+675' },

  // Sub-Saharan Africa
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
  { code: 'CD', name: 'Democratic Republic of Congo', flag: '🇨🇩', dialCode: '+243' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '+242' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', dialCode: '+225' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', dialCode: '+229' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', dialCode: '+228' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', dialCode: '+264' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', dialCode: '+220' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', dialCode: '+245' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '+224' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', dialCode: '+227' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', dialCode: '+235' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', dialCode: '+249' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', dialCode: '+291' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', dialCode: '+252' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', dialCode: '+248' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', dialCode: '+230' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', dialCode: '+269' },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code === code);
};

export const getCountryByName = (name: string): Country | undefined => {
  return COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase());
};

// Simple IP geolocation mapping (would use real API in production)
const IP_COUNTRY_MAP: Record<string, string> = {
  'ae': 'AE',
  'sa': 'SA',
  'kw': 'KW',
  'qa': 'QA',
  'bh': 'BH',
  'om': 'OM',
};

export const detectCountryFromIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    const countryCode = data.country_code || 'AE';
    return countryCode;
  } catch {
    return 'AE'; // Default to UAE
  }
};
