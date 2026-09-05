/**
 * Legacy in-memory service layer kept for screens still being migrated.
 * a real API later touches only this folder. Latency and failure are simulated
 * so loading and error states are genuinely exercised.
 */

const BASE_LATENCY = 240;

export async function delay<T>(value: T, ms = BASE_LATENCY): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return value;
}

export class MockApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MockApiError";
  }
}

/** Used by internal tooling that needs to surface the error state on purpose. */
export async function failWith(message: string, ms = BASE_LATENCY): Promise<never> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  throw new MockApiError(message);
}
