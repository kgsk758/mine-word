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
  isEnlarged: boolean;
}

const Cell: React.FC<CellProps> = ({ data, onClick, onContextMenu, isGameOver, isEnlarged }) => {
  const showWord = data.isRevealed || (isGameOver && data.isMine);

  // 通常表示時のフォントサイズ
  const getBaseFontSize = (text: string) => {
    const len = text.length;
    if (len <= 5) return '0.8rem';
    if (len <= 8) return '0.7rem';
    return '0.65rem';
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "relative w-full aspect-square flex items-center justify-center border border-slate-700 cursor-pointer transition-all duration-200 select-none",
        data.isRevealed ? "bg-slate-800 text-slate-100" : "bg-slate-700 hover:bg-slate-600",
        data.isRevealed && data.isMine && "bg-red-600 text-white",
        isGameOver && data.isMine && !data.isRevealed && "bg-red-900/50 text-red-200",
        isEnlarged && "z-50" // 拡大時はオーバーレイ(z-40)より上のz-50にする
      )}
    >
      {showWord ? (
        <div 
          className={cn(
            "w-full text-center px-0.5 font-bold", // transition-all を削除
            isEnlarged 
              ? "absolute min-w-max bg-slate-900 px-4 py-3 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] border-2 border-blue-500 scale-125 z-[60]" 
              : "truncate"
          )}
          style={{ 
            fontSize: isEnlarged ? '1rem' : getBaseFontSize(data.word) 
          }}
        >
          {data.isMine && <Bomb size={isEnlarged ? 14 : 10} className="mx-auto mb-0.5" />}
          {data.word}
        </div>
      ) : (
        data.isFlagged && <Flag size={14} className="text-red-500" />
      )}
    </div>
  );
};

export default Cell;
