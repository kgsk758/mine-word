import React from 'react';
import { Flag, Bomb } from 'lucide-react';
import type { CellData } from '../gameLogic';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CellProps {
  data: CellData;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isGameOver: boolean;
}

const Cell: React.FC<CellProps> = ({ data, onClick, onContextMenu, isGameOver }) => {
  const showWord = data.isRevealed || (isGameOver && data.isMine);
  
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "w-full aspect-square flex items-center justify-center p-1 border border-slate-700 cursor-pointer text-xs sm:text-sm font-medium transition-all duration-200",
        data.isRevealed ? "bg-slate-800 text-slate-100" : "bg-slate-700 hover:bg-slate-600",
        data.isRevealed && data.isMine && "bg-red-600 text-white",
        isGameOver && data.isMine && !data.isRevealed && "bg-red-900/50 text-red-200"
      )}
    >
      {showWord ? (
        <div className="text-center break-words">
          {data.isMine && <Bomb size={12} className="mx-auto mb-1" />}
          {data.word}
        </div>
      ) : (
        data.isFlagged && <Flag size={16} className="text-red-500" />
      )}
    </div>
  );
};

export default Cell;
