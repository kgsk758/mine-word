import { useState, useEffect, useCallback, useRef } from 'react'
import { generateGrid } from './gameLogic'
import type { CellData } from './gameLogic'
import Cell from './components/Cell'
import { Bomb, RotateCcw, HelpCircle, Languages } from 'lucide-react'

const GRID_SIZE = 8
const MINE_COUNT = 8
const INITIAL_REVEAL_COUNT = 4

type Language = 'en' | 'ja'

const translations = {
  en: {
    title: "Mine Word",
    subtitle: "Infer mine positions based on word similarity.",
    reset: "Reset Game",
    mines: "Mine Words",
    mineDesc: "These words are hidden in the grid. Words near them are semantically similar.",
    howTo: "How to Play",
    rules: [
      "Click cells to reveal words.",
      "Revealed words are weighted towards the nearest mines.",
      "Click a revealed word to see it clearly.",
      "Avoid the mine words listed above!"
    ],
    win: "YOU WIN!",
    gameOver: "GAME OVER!",
    generating: "Generating Grid..."
  },
  ja: {
    title: "Mine Word",
    subtitle: "単語の意味の近さから地雷の位置を推測してください",
    reset: "リセット",
    mines: "地雷ワード",
    mineDesc: "これらが盤面に隠されています。近くのマスには意味の近い単語が現れます。",
    howTo: "遊び方",
    rules: [
      "マスをクリックして単語を表示します。",
      "表示される単語は、近くにある地雷の意味を反映しています。",
      "表示された単語をクリックすると大きく表示されます。",
      "上の「地雷ワード」を踏まないように全て開ければクリア"
    ],
    win: "クリア",
    gameOver: "ゲームオーバー",
    generating: "盤面生成中..."
  }
}

function App() {
  const [lang, setLang] = useState<Language>('en')
  const [grid, setGrid] = useState<CellData[][]>([])
  const [mineWords, setMineWords] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [win, setWin] = useState(false)
  const [enlargedCell, setEnlargedCell] = useState<{x: number, y: number} | null>(null)

  const lastRequestId = useRef(0);
  const t = translations[lang]

  const initGame = useCallback(async () => {
    const requestId = ++lastRequestId.current;
    
    setLoading(true)
    setGameOver(false)
    setWin(false)
    setEnlargedCell(null)
    
    try {
      const result = await generateGrid(GRID_SIZE, MINE_COUNT, lang)
      
      if (requestId !== lastRequestId.current) return;

      const { grid, mineWords } = result;
      
      const nonMineCells: CellData[] = grid.flat().filter(c => !c.isMine)
      const shuffled = nonMineCells.sort(() => 0.5 - Math.random())
      const toReveal = shuffled.slice(0, INITIAL_REVEAL_COUNT)
      
      toReveal.forEach(cell => {
        cell.isRevealed = true
      })

      setGrid(grid)
      setMineWords(mineWords)
      setLoading(false)
    } catch (err) {
      if (requestId === lastRequestId.current) {
        console.error("Failed to load game:", err)
        setLoading(false)
      }
    }
  }, [lang])

  useEffect(() => {
    initGame()
  }, [initGame])

  const handleCellClick = (x: number, y: number) => {
    if (enlargedCell) {
      setEnlargedCell(null)
      return
    }

    if (gameOver || win || grid[y][x].isFlagged) return

    if (grid[y][x].isRevealed) {
      setEnlargedCell({ x, y })
      return
    }

    const newGrid = [...grid.map(row => [...row])]
    const cell = newGrid[y][x]
    cell.isRevealed = true

    if (cell.isMine) {
      cell.isExploded = true
      newGrid.forEach(row => row.forEach(c => c.isRevealed = true))
      setGameOver(true)
    } else {
      const unrevealedNonMines = newGrid.flat().filter(c => !c.isMine && !c.isRevealed)
      if (unrevealedNonMines.length === 0) {
        setWin(true)
      }
    }
    setGrid(newGrid)
  }

  const handleContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault()
    if (enlargedCell) {
      setEnlargedCell(null)
      return
    }
    if (gameOver || win || grid[y][x].isRevealed) return

    const newGrid = [...grid.map(row => [...row])]
    newGrid[y][x].isFlagged = !newGrid[y][x].isFlagged
    setGrid(newGrid)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col items-center">
      {enlargedCell && (
        <div 
          className="fixed inset-0 z-40 cursor-pointer"
          onClick={() => setEnlargedCell(null)}
        />
      )}

      <header className="mb-4 text-center relative w-full">
        <div className="absolute right-0 top-0">
          <button 
            onClick={() => setLang(l => l === 'en' ? 'ja' : 'en')}
            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-xs border border-slate-700 transition-colors"
          >
            <Languages size={14} />
            {lang === 'en' ? '日本語' : 'English'}
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-1 text-purple-500">
          {t.title}
        </h1>
        <p className="text-slate-400 text-sm">
          {t.subtitle}
        </p>
      </header>

      <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col items-center w-full">
          {loading ? (
            <div className="w-full max-w-[500px] aspect-square flex flex-col items-center justify-center bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
              <RotateCcw className="animate-spin mb-4" />
              <p>{t.generating}</p>
            </div>
          ) : (
            <div 
              className="w-full grid gap-1 bg-slate-700 p-1 rounded-sm shadow-2xl max-w-[500px] relative"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
            >
              {grid.map((row, y) => 
                row.map((cell, x) => (
                  <Cell 
                    key={`${x}-${y}`} 
                    data={cell} 
                    onClick={() => handleCellClick(x, y)}
                    onContextMenu={(e) => handleContextMenu(e, x, y)}
                    isGameOver={gameOver}
                    isEnlarged={enlargedCell?.x === x && enlargedCell?.y === y}
                    lang={lang}
                  />
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-xl self-start space-y-6 z-10">
          <div>
            <button 
              onClick={initGame}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all shadow-lg active:scale-95"
            >
              <RotateCcw size={18} />
              {t.reset}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3 text-red-400">
              <Bomb size={20} />
              <h2 className="text-lg font-bold">{t.mines}</h2>
            </div>
            <p className="text-[10px] text-slate-500 mb-3 leading-tight">{t.mineDesc}</p>
            <div className="flex flex-wrap gap-2">
              {mineWords.map((word, i) => (
                <span key={i} className="px-3 py-1 bg-slate-700 rounded-lg text-xs border border-slate-600">
                  {word}
                </span>
              ))}
            </div>
          </div>

          {(gameOver || win) && (
            <div className={`p-2 rounded-lg text-center font-bold text-xl ${win ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {win ? t.win : t.gameOver}
            </div>
          )}

          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <HelpCircle size={18} />
              <h3 className="font-bold text-sm">{t.howTo}</h3>
            </div>
            <ul className="text-[11px] leading-relaxed text-slate-400 space-y-1.5 list-disc pl-4">
              {t.rules.map((rule, i) => <li key={i}>{rule}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
