import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import type { ProblemSource, FetchProblemsOptions } from './problem-source.interface';
import type {
  LeetCodeProblem,
  LeetCodeSubmission,
  LeetCodeUserProfile,
  AlfaLeetCodeSubmissionResponse,
  AlfaLeetCodeProfileResponse,
} from '../types/leetcode.types';

export class AlfaLeetCodeSource implements ProblemSource {
  readonly sourceId = 'alfa-leetcode';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.leetcode.baseUrl,
      timeout: 15000,
    });
  }

  async fetchProblems(options: FetchProblemsOptions): Promise<LeetCodeProblem[]> {
    const params: Record<string, string | number> = {};
    if (options.difficulty) params.difficulty = options.difficulty.toUpperCase();
    if (options.limit) params.limit = options.limit;
    if (options.skip) params.skip = options.skip;
    if (options.tags && options.tags.length > 0) params.tags = options.tags.join('+');

    const response = await this.client.get('/problems', { params });
    const data = response.data;

    const questions = data.problemsetQuestionList?.questions || data.questions || [];

    return questions.map((q: any) => ({
      leetcodeId: parseInt(q.frontendQuestionId, 10),
      titleSlug: q.titleSlug,
      title: q.title,
      difficulty: this.normalizeDifficulty(q.difficulty),
      topicTags: (q.topicTags || []).map((t: any) => t.name || t),
      acRate: q.acRate || 0,
      isPaidOnly: q.paidOnly || false,
    }));
  }

  async fetchProblemBySlug(titleSlug: string): Promise<LeetCodeProblem | null> {
    try {
      const response = await this.client.get('/select', {
        params: { titleSlug },
      });

      const q = response.data;
      if (!q || !q.titleSlug) return null;

      return {
        leetcodeId: parseInt(q.questionFrontendId || q.questionId || '0', 10),
        titleSlug: q.titleSlug,
        title: q.questionTitle || q.title || titleSlug,
        difficulty: this.normalizeDifficulty(q.difficulty),
        topicTags: (q.topicTags || []).map((t: any) => t.name || t),
        acRate: parseFloat(q.acRate) || 0,
        isPaidOnly: q.isPaidOnly || false,
        content: q.question || undefined,
      };
    } catch {
      return null;
    }
  }

  async checkUserProfile(username: string): Promise<LeetCodeUserProfile> {
    try {
      const response = await this.client.get<AlfaLeetCodeProfileResponse>(`/${username}`);
      const data = response.data;

      return {
        username,
        exists: true,
        isPublic: !!data.username,
        solvedCount: undefined,
      };
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        return { username, exists: false, isPublic: false };
      }
      throw error;
    }
  }

  async getRecentSubmissions(username: string, limit = 20): Promise<LeetCodeSubmission[]> {
    try {
      const response = await this.client.get<AlfaLeetCodeSubmissionResponse>(
        `/${username}/acSubmission`,
        { params: { limit } }
      );

      const submissions = response.data.submission || [];

      return submissions.map((s) => ({
        titleSlug: s.titleSlug,
        timestamp: parseInt(s.timestamp, 10),
        statusDisplay: s.statusDisplay,
        language: s.lang,
        title: s.title,
      }));
    } catch {
      return [];
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/problems', {
        params: { limit: 1 },
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private normalizeDifficulty(difficulty: string): 'Easy' | 'Medium' | 'Hard' {
    const d = difficulty.toLowerCase();
    if (d === 'easy') return 'Easy';
    if (d === 'medium') return 'Medium';
    return 'Hard';
  }
}
