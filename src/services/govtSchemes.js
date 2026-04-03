/**
 * Government Schemes data for Indian farmers
 * Static list of major schemes with eligibility and benefits
 */

export const GOVT_SCHEMES = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN',
    fullName: 'Pradhan Mantri Kisan Samman Nidhi',
    icon: '💰',
    category: 'income',
    benefit: '₹6,000/year in 3 installments',
    eligibility: [
      'All landholding farmer families',
      'Valid Aadhaar card required',
      'Bank account linked to Aadhaar',
    ],
    documents: ['Aadhaar Card', 'Land Records', 'Bank Passbook'],
    applyUrl: 'https://pmkisan.gov.in',
    helpline: '155261',
  },
  {
    id: 'pm-fasal-bima',
    name: 'PM Fasal Bima',
    fullName: 'Pradhan Mantri Fasal Bima Yojana',
    icon: '🛡️',
    category: 'insurance',
    benefit: 'Crop insurance at 2% premium (Kharif), 1.5% (Rabi)',
    eligibility: [
      'All farmers growing notified crops',
      'Both loanee and non-loanee farmers',
      'Sharecroppers and tenant farmers included',
    ],
    documents: ['Land Records/Lease Agreement', 'Sowing Certificate', 'Bank Account'],
    applyUrl: 'https://pmfby.gov.in',
    helpline: '18001801551',
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card',
    fullName: 'Kisan Credit Card Scheme',
    icon: '💳',
    category: 'credit',
    benefit: 'Loan up to ₹3 lakh at 4% interest (with subsidy)',
    eligibility: [
      'All farmers - individual or joint',
      'Tenant farmers, sharecroppers',
      'Self Help Groups of farmers',
    ],
    documents: ['Land Records', 'Identity Proof', 'Passport Photo', 'Application Form'],
    applyUrl: 'https://www.pmkisan.gov.in/kcc',
    helpline: '1800-180-1551',
  },
  {
    id: 'soil-health-card',
    name: 'Soil Health Card',
    fullName: 'Soil Health Card Scheme',
    icon: '🌱',
    category: 'advisory',
    benefit: 'Free soil testing + fertilizer recommendations',
    eligibility: [
      'All farmers across India',
      'No minimum land requirement',
    ],
    documents: ['Aadhaar Card', 'Land Details'],
    applyUrl: 'https://soilhealth.dac.gov.in',
    helpline: '1800-180-1551',
  },
  {
    id: 'pmkmy',
    name: 'PM Kisan Maandhan',
    fullName: 'Pradhan Mantri Kisan Maandhan Yojana',
    icon: '👴',
    category: 'pension',
    benefit: '₹3,000/month pension after age 60',
    eligibility: [
      'Small & marginal farmers (land < 2 hectares)',
      'Age 18-40 years at enrollment',
      'Monthly contribution ₹55-200 based on age',
    ],
    documents: ['Aadhaar Card', 'Land Records', 'Bank Account'],
    applyUrl: 'https://maandhan.in',
    helpline: '1800-267-6888',
  },
  {
    id: 'pmksy',
    name: 'PM Krishi Sinchai',
    fullName: 'Pradhan Mantri Krishi Sinchayee Yojana',
    icon: '💧',
    category: 'irrigation',
    benefit: '55-75% subsidy on micro-irrigation (drip/sprinkler)',
    eligibility: [
      'All farmer categories',
      'Higher subsidy for small/marginal farmers',
      'Land should be cultivable',
    ],
    documents: ['Land Records', 'Aadhaar', 'Quotation from supplier'],
    applyUrl: 'https://pmksy.gov.in',
    helpline: '1800-180-1551',
  },
  {
    id: 'enam',
    name: 'e-NAM',
    fullName: 'National Agriculture Market',
    icon: '🏪',
    category: 'market',
    benefit: 'Sell crops online to buyers across India',
    eligibility: [
      'All farmers with produce to sell',
      'Registration at nearest e-NAM mandi',
    ],
    documents: ['Aadhaar', 'Bank Account', 'Mobile Number'],
    applyUrl: 'https://enam.gov.in',
    helpline: '1800-270-0224',
  },
  {
    id: 'agri-infra-fund',
    name: 'Agri Infra Fund',
    fullName: 'Agriculture Infrastructure Fund',
    icon: '🏗️',
    category: 'infrastructure',
    benefit: '3% interest subvention + ₹2 crore loan for infra',
    eligibility: [
      'Farmers, FPOs, Cooperatives',
      'For warehouses, cold storage, processing units',
    ],
    documents: ['Project Report', 'Land Documents', 'KYC'],
    applyUrl: 'https://agriinfra.dac.gov.in',
    helpline: '1800-180-1551',
  },
];

export const SCHEME_CATEGORIES = {
  income: { label: 'Income Support', color: '#7eff8a' },
  insurance: { label: 'Insurance', color: '#ff6b6b' },
  credit: { label: 'Credit/Loan', color: '#ffd966' },
  advisory: { label: 'Advisory', color: '#4dabf7' },
  pension: { label: 'Pension', color: '#da77f2' },
  irrigation: { label: 'Irrigation', color: '#4dabf7' },
  market: { label: 'Market Access', color: '#ffd966' },
  infrastructure: { label: 'Infrastructure', color: '#c4a35a' },
};

export function getSchemesByCategory(category) {
  return GOVT_SCHEMES.filter(s => s.category === category);
}

export function searchSchemes(query) {
  const q = query.toLowerCase();
  return GOVT_SCHEMES.filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.fullName.toLowerCase().includes(q) ||
    s.benefit.toLowerCase().includes(q)
  );
}
