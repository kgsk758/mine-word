# Mine-Word

A semantic Minesweeper-like game where you infer mine positions based on word embeddings.

## Project Structure
- `server/`: Python FastAPI server for vector search.
- `frontend/`: React + TypeScript frontend.

## Setup & Running

### 1. Server Setup
```bash
cd server
pip install -r requirements.txt
python prepare_words.py  # Download word list
python main.py           # Start server on http://localhost:8000
```
Note: The first run will download the HuggingFace model (~100MB-500MB).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev              # Start frontend on http://localhost:5173
```

## How to Play
- An 8x8 grid contains 8 hidden "Mine Words".
- The mine words are displayed on the right sidebar.
- Every other cell contains a word that is semantically similar to the nearest mine words (weighted by distance).
- Click a cell to reveal its word.
- If you reveal a mine word, the game is over.
- Flag cells (Right-click) that you believe are mines.
- Win by revealing all non-mine cells!
