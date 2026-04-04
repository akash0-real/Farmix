const BUYERS = [
  {
    id: 'buyer-1',
    name: 'Sharma Agro Traders',
    district: 'Nashik',
    state: 'Maharashtra',
    crops: ['wheat', 'maize', 'soybean'],
    pricePerQuintal: 2620,
    distanceKm: 6,
    rating: 4.6,
    successfulPurchases: 182,
    lastActive: '2026-04-04T05:30:00.000Z',
    paymentMode: 'UPI / Bank Transfer',
    pickupWindow: 'Today, 4 PM - 7 PM',
    transportCostPerKm: 12,
  },
  {
    id: 'buyer-2',
    name: 'Green Mandi Link',
    district: 'Nashik',
    state: 'Maharashtra',
    crops: ['rice', 'wheat', 'pulses'],
    pricePerQuintal: 2550,
    distanceKm: 9,
    rating: 4.3,
    successfulPurchases: 129,
    lastActive: '2026-04-04T04:10:00.000Z',
    paymentMode: 'Cash + UPI',
    pickupWindow: 'Tomorrow, 9 AM - 1 PM',
    transportCostPerKm: 10,
  },
  {
    id: 'buyer-3',
    name: 'Kisan Direct Buyer Hub',
    district: 'Pune',
    state: 'Maharashtra',
    crops: ['vegetables', 'fruits', 'cotton'],
    pricePerQuintal: 2890,
    distanceKm: 18,
    rating: 4.8,
    successfulPurchases: 241,
    lastActive: '2026-04-04T06:00:00.000Z',
    paymentMode: 'Bank Transfer',
    pickupWindow: 'Today, 6 PM - 9 PM',
    transportCostPerKm: 15,
  },
  {
    id: 'buyer-4',
    name: 'District Crop Exchange',
    district: 'Raipur',
    state: 'Chhattisgarh',
    crops: ['rice', 'maize', 'groundnut'],
    pricePerQuintal: 2480,
    distanceKm: 7,
    rating: 4.2,
    successfulPurchases: 96,
    lastActive: '2026-04-03T16:50:00.000Z',
    paymentMode: 'UPI',
    pickupWindow: 'Tomorrow, 10 AM - 2 PM',
    transportCostPerKm: 9,
  },
  {
    id: 'buyer-5',
    name: 'Village Procurement Network',
    district: 'Ludhiana',
    state: 'Punjab',
    crops: ['wheat', 'rice', 'millets'],
    pricePerQuintal: 2710,
    distanceKm: 5,
    rating: 4.5,
    successfulPurchases: 154,
    lastActive: '2026-04-04T03:45:00.000Z',
    paymentMode: 'Cash / UPI',
    pickupWindow: 'Today, 3 PM - 6 PM',
    transportCostPerKm: 11,
  },
];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function getNearbyBuyers(user = {}) {
  const userDistrict = normalize(user.district);
  const userState = normalize(user.state);
  const cropSet = new Set((user.crops || []).map(normalize));

  const matched = BUYERS.filter(buyer => {
    const sameDistrict = userDistrict && normalize(buyer.district) === userDistrict;
    const sameState = userState && normalize(buyer.state) === userState;
    const cropMatch = (buyer.crops || []).some(crop => cropSet.has(normalize(crop)));
    return sameDistrict || sameState || cropMatch;
  });

  const result = matched.length > 0 ? matched : BUYERS;
  return [...result].sort((a, b) => b.pricePerQuintal - a.pricePerQuintal);
}

export function estimateEarnings({ quantityQuintal = 0, pricePerQuintal = 0, distanceKm = 0, transportCostPerKm = 0 }) {
  const quantity = Number(quantityQuintal) || 0;
  const price = Number(pricePerQuintal) || 0;
  const distance = Number(distanceKm) || 0;
  const transportRate = Number(transportCostPerKm) || 0;

  const gross = Math.round(quantity * price);
  const transport = Math.round(distance * transportRate);
  const net = Math.max(0, gross - transport);

  return { gross, transport, net };
}

export function formatLastActive(isoString) {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
