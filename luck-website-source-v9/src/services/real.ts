/**
 * Real integration boundary. Implement LuckService here and select it in index.ts.
 * Validate chain ID, token decimals and deployed addresses before enabling approve,
 * submit or claim. Contract / API is authoritative for randomness, settlement,
 * idempotency and refunds. Never fall back to mock after a real request fails.
 */
export { realAdapter } from "./index";
