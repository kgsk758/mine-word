import { useState, useEffect, useCallback } from 'react'
import { generateGrid } from './gameLogic'
import type { CellData } from './gameLogic'
import Cell from './components/Cell'
import { Bomb, RotateCcw, HelpCircle } from 'lucide-react'

const GRID_SIZE = 8
const MINE_COUNT = 8

function App() {
  const [grid, setGrid] = useState<CellData[][]>([])
  const [mineWords, setMineWords] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [win, setWin] = useState(false)

  const initGame = useCallback(async () => {
    setLoading(true)
    setGameOver(false)
    setWin(false)
    try {
      const { grid, mineWords } = await generateGrid(GRID_SIZE, MINE_COUNT)
      setGrid(grid)
      setMineWords(mineWords)
    } catch (err) {
      console.error("Failed to load game:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  const handleCellClick = (x: number, y: number) => {
    if (gameOver || win || grid[y][x].isRevealed || grid[y][x].isFlagged) return

    const newGrid = [...grid.map(row => [...row])]
    const cell = newGrid[y][x]
    cell.isRevealed = true

    if (cell.isMine) {
      setGameOver(true)
    } else {
      // Check win condition
      const unrevealedNonMines = newGrid.flat().filter(c => !c.isMine && !c.isRevealed)
      if (unrevealedNonMines.length === 0) {
        setWin(true)
      }
    }
    setGrid(newGrid)
  }

  const handleContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault()
    if (gameOver || win || grid[y][x].isRevealed) return

    const newGrid = [...grid.map(row => [...row])]
    newGrid[y][x].isFlagged = !newGrid[y][x].isFlagged
    setGrid(newGrid)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Mine-Word
        </h1>
        <p className="text-slate-400">
          Infer mine positions based on word similarity.
        </p>
      </header>

      <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        <div className="flex flex-col items-center">
          {loading ? (
            <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
              <RotateCcw className="animate-spin mb-4" />
              <p>Generating Grid and Embeddings...</p>
            </div>
          ) : (
            <div 
              className="grid gap-1 bg-slate-700 p-1 rounded-sm shadow-2xl"
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
                  />
                ))
              )}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button 
              onClick={initGame}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-bold transition-colors"
            >
              <RotateCcw size={18} />
              Reset Game
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl self-start">
          <div className="flex items-center gap-2 mb-4 text-red-400">
            <Bomb size={24} />
            <h2 className="text-xl font-bold">Mine Words</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            These words are hidden in the grid. Words near them are semantically similar.
          </p>
          <div className="flex flex-wrap gap-2">
            {mineWords.map((word, i) => (
              <span key={i} className="px-3 py-1 bg-slate-700 rounded-lg text-sm border border-slate-600">
                {word}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <HelpCircle size={20} />
              <h3 className="font-bold">How to Play</h3>
            </div>
            <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
              <li>Click cells to reveal words.</li>
              <li>Revealed words are weighted towards the nearest mines.</li>
              <li>Right-click to flag potential mine locations.</li>
              <li>Avoid the mine words listed above!</li>
            </ul>
          </div>

          {(gameOver || win) && (
            <div className={`mt-8 p-4 rounded-lg text-center font-bold text-xl ${win ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {win ? 'YOU WIN!' : 'GAME OVER!'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
