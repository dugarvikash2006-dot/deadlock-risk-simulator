/**
 * Identifier generation. Deliberately not seeded — process/resource/
 * request ids are object identity, not reproducible simulation state, so
 * they don't need seededRandom()'s determinism guarantee (see random.ts).
 */

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

function randomToken(length: number): string {
  let token = ''
  for (let i = 0; i < length; i += 1) {
    token += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)]
  }
  return token
}

/** A short, opaque identifier for a domain entity (process, resource, request, etc.). */
export function generateId(): string {
  return randomToken(12)
}

/** A prefixed identifier for a full simulation run, visually distinguishable from a domain-entity id. */
export function generateSimulationId(): string {
  return `sim_${randomToken(12)}`
}
