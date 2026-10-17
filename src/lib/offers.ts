/**
 * Pre-seeded offers for live mode. Acts and cities are real. The offer terms (capacity, price,
 * guarantee, room cost) are illustrative deal shapes a promoter would recognise; they are inputs, not claims.
 * At least a third are built to fail as written and some are built to abstain.
 */
export const LIVE_OFFERS: { label: string; line: string }[] = [
  {
    label: "Comedy headliner, mid-size theatre",
    line: "Cedric the Entertainer · Atlanta, GA · 1,200 cap · $55 ticket · $25,000 guarantee + $6,000 room",
  },
  {
    label: "Indie band, club show",
    line: "Japanese Breakfast · Austin, TX · 600 cap · $32 ticket · $9,000 guarantee + $2,500 room",
  },
  {
    label: "Instrumental trio, soft-seat room",
    line: "Khruangbin · Denver, CO · 2,000 cap · $48 ticket · $45,000 guarantee + $9,000 room",
  },
  {
    label: "Comedian, club weekend",
    line: "Nate Bargatze · Chicago, IL · 1,500 cap · $65 ticket · $60,000 guarantee + $8,000 room",
  },
  {
    label: "Hardcore band, tight money",
    line: "Turnstile · Milwaukee, WI · 800 cap · $30 ticket · $14,000 guarantee + $3,000 room",
  },
  {
    label: "Dream-pop duo, overpaid",
    line: "Men I Trust · Phoenix, AZ · 500 cap · $28 ticket · $12,000 guarantee + $2,000 room",
  },
  {
    label: "Comic podcaster, first visit",
    line: "Hannah Berner · Nashville, TN · 700 cap · $40 ticket · $15,000 guarantee + $3,500 room",
  },
  {
    label: "Soul singer, big guarantee",
    line: "Leon Bridges · Salt Lake City, UT · 1,800 cap · $50 ticket · $70,000 guarantee + $10,000 room",
  },
  {
    label: "Punk band, small room, sellout loses",
    line: "Mannequin Pussy · Tucson, AZ · 250 cap · $22 ticket · $6,000 guarantee + $1,200 room",
  },
  {
    label: "UK electronic, routed through Texas",
    line: "Sampha · Dallas, TX · 1,000 cap · $42 ticket · $30,000 guarantee + $5,000 room",
  },
  {
    label: "Unknown local act (abstain)",
    line: "The Tuesday Night Basement Trio · Austin, TX · 150 cap · $15 ticket · $800 guarantee + $400 room",
  },
  {
    label: "Unindexed DJ (abstain)",
    line: "DJ Kettle Corn · Portland, OR · 300 cap · $20 ticket · $1,500 guarantee + $900 room",
  },
];
