export interface DestinationData {
  city: string;
  flights: { airline: string; route: string; price: number; duration: string }[];
  hotels: { name: string; area: string; pricePerNight: number; stars: number }[];
  restaurants: { name: string; type: string; avgCost: number }[];
  activities: { name: string; area: string; cost: number }[];
}

const DESTINATIONS: Record<string, DestinationData> = {
  tokyo: {
    city: 'Tokyo',
    flights: [
      { airline: 'ANA', route: 'LAX → NRT', price: 1240, duration: '11h 30m' },
      { airline: 'Japan Airlines', route: 'JFK → NRT', price: 1380, duration: '14h 00m' },
    ],
    hotels: [
      { name: 'Shinjuku Granbell Hotel', area: 'Shinjuku', pricePerNight: 136, stars: 4 },
      { name: 'Park Hyatt Tokyo', area: 'Shinjuku', pricePerNight: 520, stars: 5 },
    ],
    restaurants: [
      { name: 'Tsukiji Outer Market', type: 'Seafood breakfast', avgCost: 18 },
      { name: 'Ichiran Ramen', type: 'Solo ramen booths', avgCost: 14 },
      { name: 'Uobei Shibuya', type: 'Conveyor belt sushi', avgCost: 20 },
      { name: 'Gonpachi Nishi-Azabu', type: 'Izakaya', avgCost: 40 },
    ],
    activities: [
      { name: 'Senso-ji Temple', area: 'Asakusa', cost: 0 },
      { name: 'teamLab Borderless', area: 'Odaiba', cost: 32 },
      { name: 'Shibuya Crossing & Sky', area: 'Shibuya', cost: 18 },
      { name: 'Harajuku & Meiji Shrine', area: 'Harajuku', cost: 0 },
      { name: 'Tokyo DisneySea', area: 'Urayasu', cost: 85 },
    ],
  },
  paris: {
    city: 'Paris',
    flights: [
      { airline: 'Air France', route: 'JFK → CDG', price: 980, duration: '7h 20m' },
      { airline: 'Delta', route: 'LAX → CDG', price: 1100, duration: '10h 45m' },
    ],
    hotels: [
      { name: 'Hotel Le Marais', area: 'Le Marais', pricePerNight: 180, stars: 4 },
      { name: 'Le Bristol Paris', area: '8th arr.', pricePerNight: 890, stars: 5 },
    ],
    restaurants: [
      { name: 'Café de Flore', type: 'Classic Parisian café', avgCost: 25 },
      { name: "L'As du Fallafel", type: 'Street food falafel', avgCost: 8 },
      { name: 'Septime', type: 'Modern French bistro', avgCost: 95 },
      { name: 'Bouillon Chartier', type: 'Traditional brasserie', avgCost: 20 },
    ],
    activities: [
      { name: 'Eiffel Tower', area: 'Champ de Mars', cost: 29 },
      { name: 'Louvre Museum', area: '1st arr.', cost: 22 },
      { name: 'Montmartre & Sacré-Cœur', area: 'Montmartre', cost: 0 },
      { name: 'Versailles Day Trip', area: 'Versailles', cost: 35 },
      { name: 'Seine River Cruise', area: 'City centre', cost: 18 },
    ],
  },
  bali: {
    city: 'Bali',
    flights: [
      { airline: 'Singapore Airlines', route: 'LAX → DPS (via SIN)', price: 1050, duration: '20h 30m' },
      { airline: 'Cathay Pacific', route: 'JFK → DPS (via HKG)', price: 1180, duration: '24h 00m' },
    ],
    hotels: [
      { name: 'Alaya Resort Ubud', area: 'Ubud', pricePerNight: 95, stars: 4 },
      { name: 'COMO Uma Canggu', area: 'Canggu', pricePerNight: 310, stars: 5 },
    ],
    restaurants: [
      { name: 'Locavore', type: 'Modern Indonesian tasting', avgCost: 65 },
      { name: 'Warung Babi Guling Ibu Oka', type: 'Traditional roast pig', avgCost: 8 },
      { name: 'La Favela', type: 'Eclectic bar-restaurant', avgCost: 30 },
      { name: 'Swept Away', type: 'Riverside fine dining', avgCost: 80 },
    ],
    activities: [
      { name: 'Tegallalang Rice Terraces', area: 'Ubud', cost: 5 },
      { name: 'Mount Batur Sunrise Trek', area: 'Kintamani', cost: 45 },
      { name: 'Uluwatu Temple & Kecak Fire Dance', area: 'Uluwatu', cost: 15 },
      { name: 'Seminyak Beach & Surf Lesson', area: 'Seminyak', cost: 35 },
      { name: 'Tirta Empul Water Temple', area: 'Tampaksiring', cost: 5 },
    ],
  },
};

export function getDestinationData(input: string): DestinationData {
  const lower = input.toLowerCase();
  if (lower.includes('tokyo') || lower.includes('japan')) return DESTINATIONS.tokyo;
  if (lower.includes('paris') || lower.includes('france')) return DESTINATIONS.paris;
  if (lower.includes('bali') || lower.includes('indonesia')) return DESTINATIONS.bali;
  return DESTINATIONS.tokyo;
}

export function formatItinerary(dest: DestinationData): string {
  const flight = dest.flights[0];
  const hotel = dest.hotels[0];
  const lines = [
    `✈  FLIGHT`,
    `   ${flight.airline} · ${flight.route}`,
    `   Duration: ${flight.duration} · $${flight.price}/person`,
    ``,
    `🏨  HOTEL`,
    `   ${hotel.name} (${hotel.stars}★) · ${hotel.area}`,
    `   $${hotel.pricePerNight}/night`,
    ``,
    `🗓  5-DAY ITINERARY`,
  ];
  dest.activities.slice(0, 5).forEach((act, i) => {
    const rest = dest.restaurants[i % dest.restaurants.length];
    lines.push(`   Day ${i + 1}: ${act.name}`);
    lines.push(`           Dinner: ${rest.name} (~$${rest.avgCost})`);
  });
  const totalFlights = flight.price * 2;
  const totalHotel = hotel.pricePerNight * 5;
  const totalActivities = dest.activities.slice(0, 5).reduce((s, a) => s + a.cost, 0);
  const totalFood = dest.restaurants.slice(0, 5).reduce((s, r) => s + r.avgCost * 2, 0) * 5;
  lines.push(``, `💰  TOTAL ESTIMATE (2 people, 5 days)`);
  lines.push(`   Flights:    $${totalFlights}`);
  lines.push(`   Hotel:      $${totalHotel}`);
  lines.push(`   Activities: $${totalActivities}`);
  lines.push(`   Food:       ~$${totalFood}`);
  lines.push(`   ─────────────────────`);
  lines.push(`   TOTAL:      ~$${totalFlights + totalHotel + totalActivities + totalFood}`);
  return lines.join('\n');
}
