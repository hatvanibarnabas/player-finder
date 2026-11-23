"use client";

import { Check } from "@/lib/icons";
import { GAMES, gameIcon } from "./games";

type GamePickerProps = {
  selectedId: string | null;
  onSelect: (gameId: string) => void;
};

export default function GamePicker({ selectedId, onSelect }: GamePickerProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-300 mb-4">
        Válassz játékot:
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GAMES.map((game) => {
          const Icon = gameIcon(game.id);
          const selected = selectedId === game.id;

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => onSelect(game.id)}
              className={`
                bg-gradient-to-br ${game.color} border-2 ${game.border} ${game.hover}
                rounded-xl p-6 text-left transition-all duration-200
                ${selected ? "ring-2 ring-white scale-105" : "opacity-80 hover:opacity-100"}
              `}
            >
              <Icon className="size-10 mb-3" aria-hidden />
              <div className="font-bold text-lg">{game.name}</div>
              {selected && (
                <div className="text-xs mt-2 text-white/70 flex items-center gap-1.5">
                  <Check className="size-3.5" aria-hidden />
                  Kiválasztva
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
