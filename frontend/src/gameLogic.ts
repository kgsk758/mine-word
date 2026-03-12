import { fetchAllWords, fetchEmbedding, searchVector } from './api';

export interface CellData {
  x: number;
  y: number;
  word: string;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
}

const DISTANCE_WEIGHT_POWER = 2; // w = 1 / (d^p + 1)

export const generateGrid = async (size: number, mineCount: number): Promise<{ grid: CellData[][], mineWords: string[] }> => {
  const allWords = await fetchAllWords();
  
  // Randomly select mine words
  const shuffled = [...allWords].sort(() => 0.5 - Math.random());
  const selectedMineWords = shuffled.slice(0, mineCount);
  const mineEmbeddings = await Promise.all(selectedMineWords.map(word => fetchEmbedding(word)));

  // Randomly place mines on the grid
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

  const grid: CellData[][] = [];
  const cellPromises: Promise<CellData>[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isMineIndex = minePositions.findIndex(p => p.x === x && p.y === y);
      const isMine = isMineIndex !== -1;
      
      const promise = (async () => {
        let word = "";
        if (isMine) {
          word = selectedMineWords[isMineIndex];
        } else {
          // Calculate weighted vector
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

          // Normalize
          for (let i = 0; i < targetVector.length; i++) {
            targetVector[i] /= totalWeight;
          }

          // Search closest word
          const results = await searchVector(targetVector, 10);
          // Pick a word that is not one of the mine words
          const filteredResults = results.filter(r => !selectedMineWords.includes(r.word));
          word = filteredResults.length > 0 ? filteredResults[0].word : "unknown";
        }

        return {
          x, y, word, isMine, isRevealed: false, isFlagged: false
        };
      })();
      
      cellPromises.push(promise);
    }
  }

  const cells = await Promise.all(cellPromises);
  
  for (let y = 0; y < size; y++) {
    grid[y] = cells.slice(y * size, (y + 1) * size);
  }

  return { grid, mineWords: selectedMineWords };
};
