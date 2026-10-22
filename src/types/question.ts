import type { DIFFICULTY } from '@/services/fetch-questions';

export interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  wrongAnswers: [string, string, string];
  difficulty: DIFFICULTY;
}
