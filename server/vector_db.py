import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os

class VectorDB:
    def __init__(self, model_name='intfloat/multilingual-e5-base'):
        print(f"Loading model {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.data = {
            'en': {'words': [], 'index': None, 'mean_vec': None},
            'ja': {'words': [], 'index': None, 'mean_vec': None}
        }
        
        self.load_language('en', 'words_en.txt')
        self.load_language('ja', 'words_ja.txt')

    def load_language(self, lang, file_path):
        server_dir = os.path.dirname(os.path.abspath(__file__))
        full_path = os.path.join(server_dir, file_path)
        
        if not os.path.exists(full_path):
            print(f"Warning: {full_path} not found. Skipping {lang}.")
            return

        with open(full_path, 'r', encoding='utf-8') as f:
            words = [line.strip() for line in f if line.strip()]
        
        if not words:
            return

        print(f"Building index for {lang} ({len(words)} words)...")
        # E5 model requires 'passage: ' prefix for symmetric/asymmetric tasks
        prefixed_words = [f"passage: {w}" for w in words]
        embeddings = self.model.encode(prefixed_words, show_progress_bar=True).astype('float32')
        
        # --- Centering (Hubness reduction) ---
        # Calculate mean vector and subtract it to highlight distinct features
        mean_vec = np.mean(embeddings, axis=0)
        embeddings = embeddings - mean_vec
        # -------------------------------------
        
        faiss.normalize_L2(embeddings)
        
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        
        self.data[lang] = {
            'words': words,
            'index': index,
            'mean_vec': mean_vec
        }
        print(f"Index for {lang} built.")

    def search(self, vector, lang='en', k=5, is_processed=False):
        if lang not in self.data or self.data[lang]['index'] is None:
            lang = 'en' if self.data['en']['index'] is not None else 'ja'
            
        index = self.data[lang]['index']
        words = self.data[lang]['words']
        mean_vec = self.data[lang]['mean_vec']
        
        if index is None:
            return []

        vector = np.array(vector).astype('float32').reshape(1, -1)
        
        if not is_processed:
            if mean_vec is not None:
                vector = vector - mean_vec
            faiss.normalize_L2(vector)
        else:
            # Even if pre-processed, ensure it is unit length after possible frontend operations
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

    def get_word_embedding(self, word, lang='en', processed=True):
        if not processed:
            return self.model.encode([f"passage: {word}"])[0].tolist()
        
        if lang in self.data and word in self.data[lang]['words']:
            raw_emb = self.model.encode([f"passage: {word}"])[0].astype('float32')
            mean_vec = self.data[lang]['mean_vec']
            if mean_vec is not None:
                raw_emb = raw_emb - mean_vec
            
            # Normalize
            norm = np.linalg.norm(raw_emb)
            if norm > 0:
                raw_emb = raw_emb / norm
            return raw_emb.tolist()
        
        # Fallback to standard encoding
        return self.model.encode([f"passage: {word}"])[0].tolist()

    def get_all_words(self, lang='en'):
        if lang in self.data and self.data[lang]['words']:
            return self.data[lang]['words']
        return self.data['en']['words'] if self.data['en']['words'] else self.data['ja']['words']
