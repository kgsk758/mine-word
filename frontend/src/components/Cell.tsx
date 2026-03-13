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
  lang: 'en' | 'ja';
}

const Cell: React.FC<CellProps> = ({ data, onClick, onContextMenu, isGameOver, isEnlarged, lang }) => {
  const showWord = data.isRevealed || (isGameOver && data.isMine);
  const isJa = lang === 'ja';

  const getBaseFontSize = (text: string) => {
    const len = text.length;
    if (isJa) {
      if (len <= 3) return '0.85rem';
      if (len <= 5) return '0.75rem';
      return '0.65rem';
    } else {
      if (len <= 5) return '0.8rem';
      if (len <= 8) return '0.7rem';
      return '0.65rem';
    }
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "relative w-full aspect-square flex items-center justify-center border border-slate-700 cursor-pointer transition-all duration-200 select-none",
        // 背景色のロジック
        !data.isMine && data.isRevealed && "bg-slate-800 text-slate-100",
        !data.isRevealed && !isGameOver && "bg-slate-700 hover:bg-slate-600",
        
        // 地雷の背景色（踏んだか、それ以外か）
        data.isMine && data.isExploded && "bg-red-600 text-white",
        data.isMine && !data.isExploded && isGameOver && "bg-red-900/40 text-red-200/70",
        
        isEnlarged ? "z-[100]" : "z-0",
        !isEnlarged && "overflow-hidden"
      )}
    >
      {showWord ? (
        <div 
          className={cn(
            "w-full text-center px-0.5 font-bold",
            isEnlarged 
              ? "absolute min-w-max bg-slate-900 px-5 py-4 rounded-xl border-2 border-blue-400 scale-125 z-[110] leading-tight" 
              : cn(isJa ? "break-all line-clamp-2" : "truncate", "leading-[1.3] pb-0.5")
          )}
          style={{ 
            fontSize: isEnlarged ? '1.1rem' : getBaseFontSize(data.word) 
          }}
        >
          {data.isMine && <Bomb size={isEnlarged ? 16 : 10} className="mx-auto mb-0.5" />}
          {data.word}
        </div>
      ) : (
        data.isFlagged && <Flag size={14} className="text-red-500" />
      )}
    </div>
  );
};

export default Cell;
