export const GRAVITY = 1.8;

/**
 * Calculates the score of a topic based on its net votes and age.
 * Formula: Score = (V - 1) / (T + 2)^G
 * V = points
 * T = time in hours since creation
 * G = gravity
 */
export function calculateRank(netScore: number, createdAt: Date): number {
  const points = netScore - 1; 
  // Treat 0 or negative scores as effectively 0 for the base, 
  // or handle them gracefully. BN algorithm usually assumes points > 0.
  // We can clamp points to a minimum or allow negative.
  // Standard HN: (p - 1) / (t + 2)^1.8
  
  const hoursAge = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const baseScore = Math.max(points, 0); // Ensure we don't break with negatives if undesired

  return baseScore / Math.pow(hoursAge + 2, GRAVITY);
}
