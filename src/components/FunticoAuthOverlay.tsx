/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Shield, AlertTriangle, RefreshCw, Play, Coins, X } from "lucide-react";
import { FunticoServiceState, FUNTICO_TIER_COLORS } from "../funtico/types";

interface FunticoAuthOverlayProps {
  state: FunticoServiceState;
  errorMessage: string | null;
  isMock: boolean;
  onRetry: () => void;
  onContinueOffline: () => void;
}

export const FunticoAuthOverlay: React.FC<FunticoAuthOverlayProps> = ({
  state,
  errorMessage,
  isMock,
  onRetry,
  onContinueOffline,
}) => {
  if (state === "ready" || state === "uninitialized") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md p-6 bg-gradient-to-b from-[#1c1218] via-[#0d070b] to-[#050305] border-2 border-amber-500/70 rounded-3xl shadow-[0_0_50px_rgba(217,173,63,0.35)] text-[#cdc3ac] text-center animate-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          {state === "authenticating" ? (
            <div className="relative w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <Shield className="w-8 h-8 text-amber-400 animate-pulse" />
              <div className="absolute -inset-1 rounded-2xl border border-amber-400/30 animate-ping pointer-events-none" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border-2 border-rose-500/70 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)]">
              <AlertTriangle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif font-black text-xl md:text-2xl text-amber-300 tracking-wider uppercase mb-1">
          {state === "authenticating" ? "Funtico Realm Connection" : "Connection Alert"}
        </h3>

        {/* Platform Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-200/80 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isMock ? "Funtico Sandbox (Mock)" : "Funtico Network"}</span>
        </div>

        {/* Body Description */}
        {state === "authenticating" ? (
          <div className="space-y-3 mb-6">
            <p className="text-xs md:text-sm text-[#cdc3ac]/80 leading-relaxed font-mono">
              Synchronizing player profile, $TICO treasury and competitive room standings...
            </p>
            <div className="w-48 h-1.5 mx-auto bg-black/60 rounded-full overflow-hidden border border-amber-500/30">
              <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 w-full animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <p className="text-xs md:text-sm text-rose-300/90 leading-relaxed font-mono bg-rose-950/30 p-3 rounded-xl border border-rose-900/50">
              {errorMessage || "Unable to establish verified session with Funtico platform."}
            </p>
            <p className="text-[11px] text-[#a8926a] font-mono">
              You can retry connecting or continue in offline standalone practice mode.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {state === "error" && (
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-2">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-bold font-mono text-xs shadow active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
              <span>Retry Connection</span>
            </button>
            <button
              onClick={onContinueOffline}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black/50 hover:bg-white/10 border border-[#5c4a30] text-amber-200 font-mono text-xs active:scale-95 transition-all"
            >
              <Play size={14} />
              <span>Play Offline (Practice)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
