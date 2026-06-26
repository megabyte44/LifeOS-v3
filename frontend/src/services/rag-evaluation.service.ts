import { apiClient } from '@/lib/api-client';

export interface RagEvaluationItem {
  id: string;
  question: string;
  answer: string;
  personality?: string;
  modelUsed?: string;
  faithfulness?: number;
  answerRelevancy?: number;
  contextPrecision?: number;
  contextTokenCount?: number;
  responseTimeMs?: number;
  createdAt: string;
}

export interface RagDailyPoint {
  date: string;
  faithfulness: number;
  answerRelevancy: number;
  contextPrecision: number;
  count: number;
}

export interface RagMetricsSummary {
  avgFaithfulness: number;
  avgAnswerRelevancy: number;
  avgContextPrecision: number;
  count: number;
  days: number;
  history: RagDailyPoint[];
}

export interface RagTestCase {
  id: string;
  question: string;
  expectedAnswer: string;
  category?: string;
  createdBy?: string;
  createdAt: string;
}

export interface RagTestCaseRequest {
  question: string;
  expectedAnswer: string;
  category?: string;
}

export interface BenchmarkResult {
  testCaseId: string;
  question: string;
  category?: string;
  contextRecall: number;
  contextSample?: string;
}

export const ragEvaluationService = {
  async getMetrics(days = 7): Promise<RagMetricsSummary> {
    return apiClient.get<RagMetricsSummary>(`/admin/rag/metrics?days=${days}`);
  },

  async getEvaluations(page = 0, size = 20): Promise<RagEvaluationItem[]> {
    return apiClient.get<RagEvaluationItem[]>(`/admin/rag/evaluations?page=${page}&size=${size}`);
  },

  async getEvaluation(id: string): Promise<RagEvaluationItem> {
    return apiClient.get<RagEvaluationItem>(`/admin/rag/evaluations/${id}`);
  },

  async getTestCases(): Promise<RagTestCase[]> {
    return apiClient.get<RagTestCase[]>('/admin/rag/test-cases');
  },

  async createTestCase(req: RagTestCaseRequest): Promise<RagTestCase> {
    return apiClient.post<RagTestCase>('/admin/rag/test-cases', req);
  },

  async deleteTestCase(id: string): Promise<void> {
    return apiClient.delete<void>(`/admin/rag/test-cases/${id}`);
  },

  async runBenchmark(): Promise<BenchmarkResult[]> {
    return apiClient.post<BenchmarkResult[]>('/admin/rag/benchmark', {});
  },
};
