import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os
import pickle

class VectorDB:
    def __init__(self, model_name='paraphrase-multilingual-MiniLM-L12-v2', word_list_path='words.txt'):
        self.model = SentenceTransformer(model_name)
        self.word_list = []
        self.index = None
        self.embeddings = None
        
        # Load or create words
        if os.path.exists(word_list_path):
            with open(word_list_path, 'r', encoding='utf-8') as f:
                self.word_list = [line.strip() for line in f if line.strip()]
        else:
            # Default word list for demonstration
            self.word_list = [
                "apple", "banana", "cat", "dog", "elephant", "flower", "grape", "house", "ice", "juice",
                "りんご", "バナナ", "猫", "犬", "象", "花", "葡萄", "家", "氷", "ジュース",
                "mountain", "ocean", "river", "sun", "moon", "star", "forest", "desert", "cloud", "rain",
                "山", "海", "川", "太陽", "月", "星", "森", "砂漠", "雲", "雨",
                "car", "train", "plane", "bicycle", "ship", "book", "pen", "computer", "phone", "television",
                "車", "電車", "飛行機", "自転車", "船", "本", "ペン", "コンピュータ", "電話", "テレビ"
            ]
            with open(word_list_path, 'w', encoding='utf-8') as f:
                for w in self.word_list:
                    f.write(f"{w}\n")

        self.build_index()

    def build_index(self):
        print("Building index...")
        self.embeddings = self.model.encode(self.word_list, show_progress_bar=True)
        self.embeddings = self.embeddings.astype('float32')
        
        # Normalize for cosine similarity
        faiss.normalize_L2(self.embeddings)
        
        dimension = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner Product (Cosine similarity when normalized)
        self.index.add(self.embeddings)
        print(f"Index built with {len(self.word_list)} words.")

    def search(self, vector, k=5):
        vector = np.array(vector).astype('float32').reshape(1, -1)
        faiss.normalize_L2(vector)
        distances, indices = self.index.search(vector, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.word_list):
                results.append({
                    "word": self.word_list[idx],
                    "score": float(dist)
                })
        return results

    def get_word_embedding(self, word):
        emb = self.model.encode([word])[0]
        return emb.tolist()

    def get_all_words(self):
        return self.word_list

if __name__ == "__main__":
    db = VectorDB()
    # Test search
    test_vec = db.get_word_embedding("fruit")
    print("Search results for 'fruit':", db.search(test_vec))
