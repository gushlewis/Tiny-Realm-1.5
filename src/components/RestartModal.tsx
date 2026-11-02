/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { t } from "../game/i18n";
import { Language } from "../types/game";
import { AlertTriangle } from "lucide-react";

interface RestartModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  lang: Language;
}

export const RestartModal: React.FC<RestartModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#1e1014] to-[#0f070a] border-2 border-[#7a1421] outline outline-1 outline-[#d9ad3f]/50 rounded-2xl p-5 shadow-2xl text-center text-[#cdc3ac]">
        <div className="w-12 h-12 mx-auto mb-3 bg-red-950/80 border border-red-500/50 rounded-full flex items-center justify-center text-red-400">
          <AlertTriangle size={24} />
        </div>

        <h3 className="font-serif font-bold text-base md:text-lg text-red-300 mb-2">
          {t("restartConfirmTitle", lang)}
        </h3>

        <p className="text-xs text-[#cdc3ac]/80 mb-5">
          {t("restartConfirmText", lang)}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-[#2a1419] border border-[#5c4a30] hover:border-[#d9ad3f] text-[#cdc3ac] font-bold text-xs rounded-xl transition-all active:scale-95"
          >
            {t("cancel", lang)}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-[#7a1421] hover:bg-red-700 border border-red-500 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow"
          >
            {t("confirmRestart", lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
