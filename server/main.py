from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from vector_db import VectorDB
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector database
db = VectorDB()

class SearchRequest(BaseModel):
    vector: List[float]
    k: int = 5
    lang: str = "en"

@app.get("/api/words")
def get_words(lang: str = Query("en")):
    return db.get_all_words(lang)

@app.get("/api/embedding/{word}")
def get_embedding(word: str):
    try:
        return {"word": word, "embedding": db.get_word_embedding(word)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
def search_vector(request: SearchRequest):
    try:
        results = db.search(request.vector, request.lang, request.k)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
