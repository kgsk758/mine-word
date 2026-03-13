import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os

class VectorDB:
    def __init__(self, model_name='paraphrase-multilingual-MiniLM-L12-v2'):
        print(f"Loading model {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.data = {
            'en': {'words': [], 'index': None},
            'ja': {'words': [], 'index': None}
        }
        
        self.load_language('en', 'words_en.txt')
        self.load_language('ja', 'words_ja.txt')

    def load_language(self, lang, file_path):
        if not os.path.exists(file_path):
            print(f"Warning: {file_path} not found. Skipping {lang}.")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            words = [line.strip() for line in f if line.strip()]
        
        if not words:
            return

        print(f"Building index for {lang} ({len(words)} words)...")
        embeddings = self.model.encode(words, show_progress_bar=False).astype('float32')
        faiss.normalize_L2(embeddings)
        
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        
        self.data[lang] = {
            'words': words,
            'index': index
        }
        print(f"Index for {lang} built.")

    def search(self, vector, lang='en', k=5):
        if lang not in self.data or self.data[lang]['index'] is None:
            # フォールバック
            lang = 'en' if self.data['en']['index'] is not None else 'ja'
            
        index = self.data[lang]['index']
        words = self.data[lang]['words']
        
        if index is None:
            return []

        vector = np.array(vector).astype('float32').reshape(1, -1)
        faiss.normalize_L2(vector)
        distances, indices = index.search(vector, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if 0 <= idx < len(words):
                results.append({
                    "word": words[idx],
                    "score": float(dist)
                })
        return results

    def get_word_embedding(self, word):
        return self.model.encode([word])[0].tolist()

    def get_all_words(self, lang='en'):
        if lang in self.data and self.data[lang]['words']:
            return self.data[lang]['words']
        return self.data['en']['words'] if self.data['en']['words'] else self.data['ja']['words']
