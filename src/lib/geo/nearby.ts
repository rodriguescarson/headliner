/**
 * Routing alternatives: for a weak market, which nearby metro to compare against.
 * A small, explicit table. It is a routing convention, not data about demand.
 */
const NEARBY: Record<string, string> = {
  "austin, tx": "Dallas, TX",
  "dallas, tx": "Austin, TX",
  "houston, tx": "Austin, TX",
  "denver, co": "Salt Lake City, UT",
  "salt lake city, ut": "Denver, CO",
  "chicago, il": "Milwaukee, WI",
  "milwaukee, wi": "Chicago, IL",
  "atlanta, ga": "Nashville, TN",
  "nashville, tn": "Atlanta, GA",
  "los angeles, ca": "San Diego, CA",
  "san diego, ca": "Los Angeles, CA",
  "san francisco, ca": "Oakland, CA",
  "seattle, wa": "Portland, OR",
  "portland, or": "Seattle, WA",
  "new york, ny": "Philadelphia, PA",
  "philadelphia, pa": "New York, NY",
  "boston, ma": "Providence, RI",
  "minneapolis, mn": "Madison, WI",
  "phoenix, az": "Tucson, AZ",
  "tucson, az": "Phoenix, AZ",
  "detroit, mi": "Cleveland, OH",
  "cleveland, oh": "Pittsburgh, PA",
  "miami, fl": "Orlando, FL",
  "orlando, fl": "Tampa, FL",
  "washington, dc": "Baltimore, MD",
  "london, uk": "Manchester, UK",
  "manchester, uk": "Leeds, UK",
  "toronto, on": "Montreal, QC",
};

export function nearbyCity(city: string): string | undefined {
  return NEARBY[city.trim().toLowerCase()];
}
