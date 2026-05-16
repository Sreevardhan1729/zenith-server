export interface LeetCodeProblem {
  leetcodeId: number;
  titleSlug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topicTags: string[];
  acRate: number;
  isPaidOnly: boolean;
  content?: string;
}

export interface LeetCodeSubmission {
  titleSlug: string;
  timestamp: number;
  statusDisplay: string;
  language: string;
  title: string;
}

export interface LeetCodeUserProfile {
  username: string;
  exists: boolean;
  isPublic: boolean;
  solvedCount?: number;
}

export interface AlfaLeetCodeProblemResponse {
  problemsetQuestionList: {
    total: number;
    questions: Array<{
      acRate: number;
      difficulty: string;
      frontendQuestionId: string;
      isFavor: boolean;
      paidOnly: boolean;
      status: string | null;
      title: string;
      titleSlug: string;
      topicTags: Array<{ name: string; id: string; slug: string }>;
      hasSolution: boolean;
      hasVideoSolution: boolean;
    }>;
  };
}

export interface AlfaLeetCodeSubmissionResponse {
  submission: Array<{
    title: string;
    titleSlug: string;
    timestamp: string;
    statusDisplay: string;
    lang: string;
  }>;
}

export interface AlfaLeetCodeProfileResponse {
  username: string;
  name: string;
  birthday: string | null;
  avatar: string;
  ranking: number;
  reputation: number;
  gitHub: string | null;
  twitter: string | null;
  linkedIN: string | null;
  website: string[];
  country: string | null;
  company: string | null;
  school: string | null;
  skillTags: string[];
  about: string;
}
