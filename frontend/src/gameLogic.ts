import { fetchAllWords, fetchEmbedding, searchVector } from './api';

export interface CellData {
  x: number;
  y: number;
  word: string;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  isExploded?: boolean;
  score: number; // 類似度スコア
}

const DISTANCE_WEIGHT_POWER = 2;
const DISTANCE_TILT_LIMIT = (Math.PI/1.5);
const DISTANCE_TILT_WEIGHT = 1;

export const generateGrid = async (size: number, mineCount: number, lang: string = 'en'): Promise<{ grid: CellData[][], mineWords: string[] }> => {
  const allWords = await fetchAllWords(lang);
  
  // 1. 地雷ワードの選定
  /*
  const shuffled = [...allWords].sort(() => 0.5 - Math.random());
  const selectedMineWords = shuffled.slice(0, mineCount);
  */
  const selectedMineWords = [
    allWords[0],allWords[10],allWords[200],allWords[300],
    allWords[4000],allWords[500],allWords[600],allWords[700]
  ];
  const mineEmbeddings = await Promise.all(selectedMineWords.map(word => fetchEmbedding(word)));

  const mineEmbSample = mineEmbeddings[2];
  let count = 0;
  mineEmbSample.forEach((value)=>count += value ** 2);
  console.log("vector size ="+count);

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
          let dist = Math.sqrt(Math.pow(x - mPos.x, 2) + Math.pow(y - mPos.y, 2));
          if(dist === 0) {
            console.log('dist = 0');
            dist = 0.0001;
          }

          const weight = 1 / (Math.pow(dist, DISTANCE_WEIGHT_POWER));
          
          const emb = mineEmbeddings[idx];

          const offsetDist = dist - 1;

          if(offsetDist < 0) console.log("offsetDist < 0");

          const angle = DISTANCE_TILT_LIMIT*((offsetDist)/(offsetDist+DISTANCE_TILT_WEIGHT));

          const titledEmb = getTiltedVector(emb, angle);
          for (let i = 0; i < targetVector.length; i++) {
            targetVector[i] += titledEmb[i] * weight;
          }
          totalWeight += weight;
        });

        if (totalWeight > 0) {
          for (let i = 0; i < targetVector.length; i++) {
            targetVector[i] /= totalWeight;
          }
        }
        tasks.push({ x, y, isMine: false, targetVector });
      }
    }
  }

  // 4. 非地雷マスの候補ワードを並列取得
  const nonMineTasks = tasks.filter(t => !t.isMine);
  const searchResults = await Promise.all(
    nonMineTasks.map(t => searchVector(t.targetVector!, lang, 10))
  );

  // 5. 単語の割り当て（重複を許可し、スコアを保持する）
  const mineWordsSet = new Set(selectedMineWords);
  const finalCells: CellData[] = [];
  let searchResultIdx = 0;

  for (const task of tasks) {
    let word = "";
    let score = 0;

    if (task.isMine) {
      word = task.word!;
      score = 1.0;
    } else {
      const candidates = searchResults[searchResultIdx++];
      const bestChoice = candidates.find(c => !mineWordsSet.has(c.word)) || candidates[0];
      word = bestChoice.word;
      score = bestChoice.score;
      console.log(`word:${word},score:${score}`)
    }
    
    finalCells.push({
      x: task.x,
      y: task.y,
      word,
      isMine: task.isMine,
      isRevealed: false,
      isFlagged: false,
      score: score
    });
  }

  const grid: CellData[][] = [];
  for (let y = 0; y < size; y++) {
    grid[y] = finalCells.slice(y * size, (y + 1) * size);
  }

  return { grid, mineWords: selectedMineWords };
};

const getTiltedVector = (vector: number[], angleRad: number): number[] => {
  const mag = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (mag === 0) return vector;

  // 1. 現在のベクトルに垂直なランダムなベクトルを作る
  // まず、完全なランダムベクトルを作成
  let randomVec = vector.map(() => Math.random() * 2 - 1);

  // グラム・シュミットの直交化を用いて、元のベクトル成分を除去する
  // (垂直成分 = randomVec - projection of randomVec onto vector)
  const dot = vector.reduce((sum, v, i) => sum + v * randomVec[i], 0);
  const orthoVec = randomVec.map((rv, i) => rv - (dot / (mag * mag)) * vector[i]);

  // 2. 垂直ベクトルの長さを調整（単位ベクトル化）
  const orthoMag = Math.sqrt(orthoVec.reduce((sum, v) => sum + v * v, 0));
  if (orthoMag === 0) return getTiltedVector(vector, angleRad); // 万が一ゼロになったら再試行
  
  const u = orthoVec.map(v => v / orthoMag); // 垂直な単位ベクトル

  // 3. 回転の合成
  // 公式: V_new = V_old * cos(θ) + mag * U * sin(θ)
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return vector.map((v, i) => v * cos + (mag * u[i]) * sin);
}
