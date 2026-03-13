import { fetchAllWords, fetchEmbedding, searchVector } from './api';

export interface CellData {
  x: number;
  y: number;
  word: string;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isExploded?: boolean;
}

const DISTANCE_WEIGHT_POWER = 2; // w = 1 / (d^p + 1)

export const generateGrid = async (size: number, mineCount: number, lang: string = 'en'): Promise<{ grid: CellData[][], mineWords: string[] }> => {
  const allWords = await fetchAllWords(lang);
  
  // 1. 地雷ワードの選定
  const shuffled = [...allWords].sort(() => 0.5 - Math.random());
  const selectedMineWords = shuffled.slice(0, mineCount);
  const mineEmbeddings = await Promise.all(selectedMineWords.map(word => fetchEmbedding(word)));

  // 2. 地雷の配置決定
  const minePositions: {x: number, y: number}[] = [];
  while (minePositions.length < mineCount) {
    const pos = {
      x: Math.floor(Math.random() * size),
      y: Math.floor(Math.random() * size)
    };
    if (!minePositions.some(p => p.x === pos.x && p.y === pos.y)) {
      minePositions.push(pos);
    }
  }

  // 3. 各マスのタスク定義
  interface CellTask {
    x: number;
    y: number;
    isMine: boolean;
    word?: string;
    targetVector?: number[];
  }

  const tasks: CellTask[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isMineIndex = minePositions.findIndex(p => p.x === x && p.y === y);
      const isMine = isMineIndex !== -1;
      
      if (isMine) {
        tasks.push({ x, y, isMine: true, word: selectedMineWords[isMineIndex] });
      } else {
        const targetVector = new Array(mineEmbeddings[0].length).fill(0);
        let totalWeight = 0;

        minePositions.forEach((mPos, idx) => {
          const dist = Math.sqrt(Math.pow(x - mPos.x, 2) + Math.pow(y - mPos.y, 2));
          const weight = 1 / (Math.pow(dist, DISTANCE_WEIGHT_POWER) + 0.1);
          
          const emb = mineEmbeddings[idx];
          for (let i = 0; i < targetVector.length; i++) {
            targetVector[i] += emb[i] * weight;
          }
          totalWeight += weight;
        });

        for (let i = 0; i < targetVector.length; i++) {
          targetVector[i] /= totalWeight;
        }
        tasks.push({ x, y, isMine: false, targetVector });
      }
    }
  }

  // 4. 非地雷マスの候補ワードを並列取得 (langを渡す)
  const nonMineTasks = tasks.filter(t => !t.isMine);
  const searchResults = await Promise.all(
    nonMineTasks.map(t => searchVector(t.targetVector!, lang, size * size))
  );

  // 5. 重複を避けて単語を順次割り当て
  const usedWords = new Set<string>(selectedMineWords);
  const finalCells: CellData[] = [];
  let searchResultIdx = 0;

  for (const task of tasks) {
    let word = "";
    if (task.isMine) {
      word = task.word!;
    } else {
      const candidates = searchResults[searchResultIdx++];
      const bestChoice = candidates.find(c => !usedWords.has(c.word));
      word = bestChoice ? bestChoice.word : `word-${task.x}-${task.y}`;
    }
    
    usedWords.add(word);
    finalCells.push({
      x: task.x,
      y: task.y,
      word,
      isMine: task.isMine,
      isRevealed: false,
      isFlagged: false
    });
  }

  const grid: CellData[][] = [];
  for (let y = 0; y < size; y++) {
    grid[y] = finalCells.slice(y * size, (y + 1) * size);
  }

  return { grid, mineWords: selectedMineWords };
};
