/** Simulated realistic random latency (300–900ms) so loading states are exercised. */
export function randomDelay(min = 300, max = 900): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check for the error-simulation query param / flag. */
export function shouldSimulateError(): boolean {
  return false; // toggled via Zustand dev store in a real scenario
}
