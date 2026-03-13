import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const fetchAllWords = async (lang: string = 'en'): Promise<string[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/words?lang=${lang}`);
  return response.data;
};

export const fetchEmbedding = async (word: string): Promise<number[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/embedding/${word}`);
  return response.data.embedding;
};

export const searchVector = async (vector: number[], lang: string = 'en', k: number = 5): Promise<{ word: string; score: number }[]> => {
  const response = await axios.post(`${API_BASE_URL}/api/search`, { vector, lang, k });
  return response.data.results;
};
