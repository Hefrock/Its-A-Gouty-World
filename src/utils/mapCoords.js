// Geometry helpers for the abstract hub-and-spoke SVG map of Magic Kingdom.
// All coordinates live in a 1000x1000 viewBox. Venue marker positions are
// already stored in pixel space in venues.json (map_coords).

export const MAP_VIEWBOX = '0 0 1000 1000';

export const HUB = { cx: 500, cy: 500, r: 110 };

export const MAP_RADIUS = 470;

const WEDGE_SPAN = 60;

// Land wedges, ordered with Main Street at the bottom (90deg in a coordinate
// system where 0deg = right and 90deg = down), then clockwise.
export const LANDS = {
  main_street: { name: 'Main Street, U.S.A.', angle: 90, color: '#fde68a' },
  tomorrowland: { name: 'Tomorrowland', angle: 150, color: '#bfdbfe' },
  fantasyland: { name: 'Fantasyland', angle: 210, color: '#fbcfe8' },
  liberty_square: { name: 'Liberty Square', angle: 270, color: '#bbf7d0' },
  frontierland: { name: 'Frontierland', angle: 330, color: '#fed7aa' },
  adventureland: { name: 'Adventureland', angle: 30, color: '#d9f99d' },
};

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = toRadians(angleDeg);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// Returns an SVG path describing the annular wedge for a land.
export function getLandWedgePath(landKey) {
  const land = LANDS[landKey];
  if (!land) return '';

  const startAngle = land.angle - WEDGE_SPAN / 2;
  const endAngle = land.angle + WEDGE_SPAN / 2;

  const innerStart = polarToCartesian(HUB.cx, HUB.cy, HUB.r, startAngle);
  const outerStart = polarToCartesian(HUB.cx, HUB.cy, MAP_RADIUS, startAngle);
  const outerEnd = polarToCartesian(HUB.cx, HUB.cy, MAP_RADIUS, endAngle);
  const innerEnd = polarToCartesian(HUB.cx, HUB.cy, HUB.r, endAngle);

  return [
    `M ${innerStart.x} ${innerStart.y}`,
    `L ${outerStart.x} ${outerStart.y}`,
    `A ${MAP_RADIUS} ${MAP_RADIUS} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${HUB.r} ${HUB.r} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

// Returns a position for the land's text label, near the outer edge of the wedge.
export function getLandLabelPos(landKey) {
  const land = LANDS[landKey];
  if (!land) return { x: HUB.cx, y: HUB.cy };
  return polarToCartesian(HUB.cx, HUB.cy, MAP_RADIUS - 40, land.angle);
}

// Venue marker coordinates are pre-computed and stored directly on the venue.
export function getVenueCoords(venue) {
  return venue.map_coords;
}
