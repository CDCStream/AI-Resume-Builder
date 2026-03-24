export const CITIES: string[] = [
  // India
  "Mumbai, India", "Delhi, India", "Bangalore, India", "Hyderabad, India",
  "Chennai, India", "Kolkata, India", "Pune, India", "Ahmedabad, India",
  "Jaipur, India", "Lucknow, India", "Surat, India", "Kanpur, India",
  "Nagpur, India", "Indore, India", "Bhopal, India", "Visakhapatnam, India",
  "Coimbatore, India", "Kochi, India", "Thiruvananthapuram, India",
  "Chandigarh, India", "Noida, India", "Gurgaon, India", "Guwahati, India",
  "Mysore, India", "Vadodara, India", "Rajkot, India", "Varanasi, India",
  "Patna, India", "Ranchi, India", "Bhubaneswar, India", "Dehradun, India",

  // Pakistan
  "Karachi, Pakistan", "Lahore, Pakistan", "Islamabad, Pakistan",
  "Rawalpindi, Pakistan", "Faisalabad, Pakistan", "Multan, Pakistan",
  "Peshawar, Pakistan", "Quetta, Pakistan", "Sialkot, Pakistan",
  "Hyderabad, Pakistan", "Gujranwala, Pakistan",

  // Bangladesh
  "Dhaka, Bangladesh", "Chittagong, Bangladesh", "Sylhet, Bangladesh",
  "Rajshahi, Bangladesh", "Khulna, Bangladesh", "Comilla, Bangladesh",

  // Sri Lanka
  "Colombo, Sri Lanka", "Kandy, Sri Lanka", "Galle, Sri Lanka",

  // Nepal
  "Kathmandu, Nepal", "Pokhara, Nepal", "Lalitpur, Nepal",

  // Middle East
  "Dubai, UAE", "Abu Dhabi, UAE", "Sharjah, UAE", "Doha, Qatar",
  "Riyadh, Saudi Arabia", "Jeddah, Saudi Arabia", "Dammam, Saudi Arabia",
  "Mecca, Saudi Arabia", "Medina, Saudi Arabia", "Kuwait City, Kuwait",
  "Muscat, Oman", "Manama, Bahrain", "Amman, Jordan", "Beirut, Lebanon",
  "Baghdad, Iraq", "Erbil, Iraq",

  // Turkey
  "Istanbul, Turkey", "Ankara, Turkey", "Izmir, Turkey", "Antalya, Turkey",
  "Bursa, Turkey", "Adana, Turkey", "Gaziantep, Turkey", "Konya, Turkey",

  // Southeast Asia
  "Singapore", "Kuala Lumpur, Malaysia", "Jakarta, Indonesia",
  "Bangkok, Thailand", "Ho Chi Minh City, Vietnam", "Hanoi, Vietnam",
  "Manila, Philippines", "Cebu, Philippines",

  // East Asia
  "Tokyo, Japan", "Seoul, South Korea", "Taipei, Taiwan",
  "Hong Kong", "Shanghai, China", "Beijing, China", "Shenzhen, China",

  // Europe
  "London, UK", "Berlin, Germany", "Munich, Germany", "Frankfurt, Germany",
  "Paris, France", "Amsterdam, Netherlands", "Dublin, Ireland",
  "Zurich, Switzerland", "Stockholm, Sweden", "Copenhagen, Denmark",
  "Oslo, Norway", "Helsinki, Finland", "Vienna, Austria",
  "Barcelona, Spain", "Madrid, Spain", "Milan, Italy", "Rome, Italy",
  "Lisbon, Portugal", "Warsaw, Poland", "Prague, Czech Republic",
  "Budapest, Hungary", "Bucharest, Romania", "Brussels, Belgium",

  // North America
  "New York, USA", "San Francisco, USA", "Los Angeles, USA",
  "Chicago, USA", "Seattle, USA", "Austin, USA", "Boston, USA",
  "Denver, USA", "Miami, USA", "Dallas, USA", "Houston, USA",
  "Atlanta, USA", "Washington DC, USA", "Toronto, Canada",
  "Vancouver, Canada", "Montreal, Canada",

  // Australia & Oceania
  "Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia",
  "Auckland, New Zealand",

  // Africa
  "Lagos, Nigeria", "Nairobi, Kenya", "Cape Town, South Africa",
  "Johannesburg, South Africa", "Cairo, Egypt", "Accra, Ghana",
  "Casablanca, Morocco",

  // South America
  "São Paulo, Brazil", "Buenos Aires, Argentina", "Bogotá, Colombia",
  "Santiago, Chile", "Lima, Peru", "Mexico City, Mexico",

  // Remote
  "Remote",
];

export function fuzzySearchCities(query: string, limit = 8): string[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const exact: string[] = [];
  const startsWith: string[] = [];
  const includes: string[] = [];

  for (const city of CITIES) {
    const lower = city.toLowerCase();
    if (lower === q) {
      exact.push(city);
    } else if (lower.startsWith(q)) {
      startsWith.push(city);
    } else if (lower.includes(q)) {
      includes.push(city);
    }
  }

  return [...exact, ...startsWith, ...includes].slice(0, limit);
}
