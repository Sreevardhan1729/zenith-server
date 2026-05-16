import type { LeetCodeProblem, LeetCodeSubmission, LeetCodeUserProfile } from '../types/leetcode.types';
import type { Difficulty } from '../types';

export interface FetchProblemsOptions {
  difficulty?: Difficulty;
  limit?: number;
  skip?: number;
  tags?: string[];
}

export interface ProblemSource {
  readonly sourceId: string;

  fetchProblems(options: FetchProblemsOptions): Promise<LeetCodeProblem[]>;
  fetchProblemBySlug(titleSlug: string): Promise<LeetCodeProblem | null>;
  checkUserProfile(username: string): Promise<LeetCodeUserProfile>;
  getRecentSubmissions(username: string, limit?: number): Promise<LeetCodeSubmission[]>;
  isHealthy(): Promise<boolean>;
}
