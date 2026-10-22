import Papa from 'papaparse';
import type { Question } from '@/types/question';
import { v4 as uuid } from 'uuid';

export enum DIFFICULTY {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
  EXTREME = 4
}

const DIFFICULTY_MAP: Record<string, DIFFICULTY> = {
  facile: DIFFICULTY.EASY,
  moyen: DIFFICULTY.MEDIUM,
  difficile: DIFFICULTY.HARD,
  expert: DIFFICULTY.EXTREME
};

function parseDifficulty(raw: string): DIFFICULTY {
  const value = raw.trim().toLowerCase();
  if (value in DIFFICULTY_MAP) return DIFFICULTY_MAP[value]!;

  // An unknown difficulty is set as easy, even if it should not happen
  return DIFFICULTY.EASY;
}

function rowToQuestion(row: string[]): Question | null {
  const [text, correct, w1, w2, w3, diffRaw] = row.map((cell) => (cell ?? '').trim());
  const difficulty = parseDifficulty(diffRaw ?? '');
  if (!text || !correct || !w1 || !w2 || !w3 || !difficulty) {
    return null;
  }

  return {
    id: uuid(),
    text,
    correctAnswer: correct,
    wrongAnswers: [w1, w2, w3],
    difficulty
  };
}

export async function fetchQuestions(): Promise<Question[]> {
  const url = import.meta.env.VITE_SHEET_CSV_URL;
  if (!url) {
    throw new Error('Undefined var env VITE_SHEET_CSV_URL');
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load questions (HTTP ${response.status})`);
  }

  const csv = await response.text();
  const { data } = Papa.parse<string[]>(csv, {
    header: false,
    skipEmptyLines: true
  });

  return data
    .slice(1) // Skip header
    .map(rowToQuestion)
    .filter((q): q is Question => q !== null);
}
