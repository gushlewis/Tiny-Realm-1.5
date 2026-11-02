/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFunticoService } from "./IFunticoService";
import { MockFunticoService } from "./MockFunticoService";
import { FunticoService } from "./FunticoService";

export * from "./types";
export * from "./IFunticoService";
export * from "./MockFunticoService";
export * from "./FunticoService";

let funticoServiceInstance: IFunticoService | null = null;

/**
 * Returns the singleton IFunticoService instance.
 * Automatically chooses between FunticoService and MockFunticoService based on:
 * 1. URL search params: ?mock=1 forces MockFunticoService.
 * 2. URL search params: ?token=... or ?userToken=... loads real FunticoService.
 * 3. Default (no token provided): falls back to MockFunticoService for local standalone testing.
 */
export function getFunticoService(): IFunticoService {
  if (funticoServiceInstance) {
    return funticoServiceInstance;
  }

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const forceMock = params.get("mock") === "1" || params.get("mock") === "true";
  const token = params.get("token") || params.get("userToken");

  if (!forceMock && token) {
    console.log("[Funtico] Initializing real Funtico platform service with userToken:", token.slice(0, 8) + "...");
    funticoServiceInstance = new FunticoService();
  } else {
    console.log("[Funtico] Running in Standalone Mock mode for local testing. Pass ?token=YOUR_TOKEN to connect to Funtico platform.");
    funticoServiceInstance = new MockFunticoService();
  }

  return funticoServiceInstance;
}

export const funtico = getFunticoService();
