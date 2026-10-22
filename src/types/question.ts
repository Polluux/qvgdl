import type { DIFFICULTY } from '@/services/fetch-questions';

export interface Question {
  id: string;
  text: string;
  answers: {
    label: string;
    correct: boolean;
  }[];
  note: string;
  difficulty: DIFFICULTY;
}
