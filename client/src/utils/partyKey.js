/**
 * Splits a party dropdown value into its type and id.
 * Clients and jobbers are numbered separately (there can be a client #5 and a jobber #5),
 * so dropdowns that list both use "CLIENT-5" / "JOBBER-5" as the value.
 *
 *   "CLIENT-5" -> { partyType: 'CLIENT', partyId: '5' }
 *   "all"      -> { partyType: 'all',    partyId: 'all' }
 *   "5"        -> { partyType: 'all',    partyId: '5' }   (older bookmarked links)
 *
 * @param {string|number} key - Dropdown value
 * @returns {{partyType: string, partyId: string}}
 */
export const parsePartyKey = (key) => {
  const text = String(key ?? '');
  const match = /^(CLIENT|JOBBER)-(\d+)$/.exec(text);
  if (match) return { partyType: match[1], partyId: match[2] };
  if (/^\d+$/.test(text)) return { partyType: 'all', partyId: text };
  return { partyType: 'all', partyId: 'all' };
};
