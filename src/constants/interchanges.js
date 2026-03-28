/**
 * Major TTC / regional interchange stops (substring match on stop_name, uppercased).
 * Expand as needed for demo accuracy.
 */
export const INTERCHANGE_NAME_FRAGMENTS = [
  "UNION STATION",
  "BLOOR-YONGE",
  "ST GEORGE",
  "SPADINA STATION",
  "ST ANDREW",
  "OSGOODE",
  "QUEEN'S PARK",
  "QUEENS PARK",
  "KING",
  "KENNEDY",
  "KIPLING",
  "ISLINGTON",
  "ROYAL YORK",
  "OLD MILL",
  "JANE",
  "FINCH",
  "FINCH WEST",
  "VAUGHAN",
  "HIGHWAY 407",
  "PIONEER VILLAGE",
  "YORK UNIVERSITY",
  "DOWNSVIEW PARK",
  "SHEPPARD-YONGE",
  "NORTH YORK CENTRE",
  "EGLINTON",
  "LAWRENCE",
  "YORK MILLS",
  "DUNDAS",
  "COLLEGE",
  "ST PATRICK",
  "QUEEN",
  "DUNDAS WEST",
  "BROADVIEW",
  "MAIN STREET",
  "VICTORIA PARK",
  "WARDEN",
  "SCARBOROUGH CENTRE",
  "MCCOWAN",
  "MIMICO",
  "LONG BRANCH",
];

export function isNearMajorInterchange(stopName) {
  if (!stopName) return false;
  const u = stopName.toUpperCase();
  return INTERCHANGE_NAME_FRAGMENTS.some((frag) => u.includes(frag));
}
