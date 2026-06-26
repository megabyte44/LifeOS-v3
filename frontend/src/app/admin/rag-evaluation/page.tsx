'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { BarChart3, FlaskConical, Trash2, Plus, Play, RefreshCw } from 'lucide-react';
import {
  ragEvaluationService,
  type RagMetricsSummary,
  type RagEvaluationItem,
  type RagTestCase,
  type BenchmarkResult,
} from '@/services/rag-evaluation.service';

// ── Score helpers ─────────────────────────────────────────────────────────────

function scorePct(v?: number | null) {
  if (v == null) return '—';
  return `${(v * 100).toFixed(0)}%`;
}

function scoreColor(v?: number | null) {
  if (v == null) return 'bg-muted';
  if (v >= 0.8) return 'bg-green-500';
  if (v >= 0.6) return 'bg-yellow-400';
  return 'bg-red-400';
}

function ScoreBar({ value }: { value?: number | null }) {
  const pct = value != null ? Math.round(value * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-24">
      <div className="h-1.5 bg-muted rounded-full flex-1">
        <div
          className={`h-1.5 rounded-full transition-all ${scoreColor(value)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right text-muted-foreground">{scorePct(value)}</span>
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, description, color,
}: {
  label: string; value: number; description: string; color: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold">{pct}%</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-2 bg-muted rounded-full">
          <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RagEvaluationPage() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();

  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<RagMetricsSummary | null>(null);
  const [evaluations, setEvaluations] = useState<RagEvaluationItem[]>([]);
  const [testCases, setTestCases] = useState<RagTestCase[]>([]);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[] | null>(null);

  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingEvals, setLoadingEvals] = useState(false);
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);

  // New test case form
  const [newQuestion, setNewQuestion] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addingCase, setAddingCase] = useState(false);

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const data = await ragEvaluationService.getMetrics(days);
      setSummary(data);
    } catch { /* silent */ }
    finally { setLoadingMetrics(false); }
  }, [days]);

  const loadEvaluations = useCallback(async () => {
    setLoadingEvals(true);
    try {
      const data = await ragEvaluationService.getEvaluations(0, 25);
      setEvaluations(data);
    } catch { /* silent */ }
    finally { setLoadingEvals(false); }
  }, []);

  const loadTestCases = useCallback(async () => {
    try {
      const data = await ragEvaluationService.getTestCases();
      setTestCases(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadMetrics();
    loadEvaluations();
    loadTestCases();
  }, [isAdmin, loadMetrics, loadEvaluations, loadTestCases]);

  async function addTestCase() {
    if (!newQuestion.trim() || !newExpected.trim()) return;
    setAddingCase(true);
    try {
      const tc = await ragEvaluationService.createTestCase({
        question: newQuestion.trim(),
        expectedAnswer: newExpected.trim(),
        category: newCategory.trim() || undefined,
      });
      setTestCases(prev => [...prev, tc]);
      setNewQuestion('');
      setNewExpected('');
      setNewCategory('');
    } catch { /* silent */ }
    finally { setAddingCase(false); }
  }

  async function removeTestCase(id: string) {
    try {
      await ragEvaluationService.deleteTestCase(id);
      setTestCases(prev => prev.filter(tc => tc.id !== id));
    } catch { /* silent */ }
  }

  async function runBenchmark() {
    setBenchmarkRunning(true);
    setBenchmarkResults(null);
    try {
      const results = await ragEvaluationService.runBenchmark();
      setBenchmarkResults(results);
    } catch { /* silent */ }
    finally { setBenchmarkRunning(false); }
  }

  if (adminLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="container mx-auto p-4 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              RAG Evaluation
            </h1>
            <p className="text-muted-foreground mt-1">
              LLM-as-judge quality metrics for the AI pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Last</span>
            {[7, 14, 30].map(d => (
              <Button
                key={d}
                variant={days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d}d
              </Button>
            ))}
            <Button variant="ghost" size="icon" onClick={loadMetrics} disabled={loadingMetrics}>
              <RefreshCw className={`w-4 h-4 ${loadingMetrics ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Metric cards */}
        {summary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Faithfulness"
              value={summary.avgFaithfulness}
              description="Fraction of answer claims supported by retrieved context"
              color="bg-blue-500"
            />
            <MetricCard
              label="Answer Relevancy"
              value={summary.avgAnswerRelevancy}
              description="How well the answer addresses the original question"
              color="bg-purple-500"
            />
            <MetricCard
              label="Context Precision"
              value={summary.avgContextPrecision}
              description="Fraction of retrieved context that was actually useful"
              color="bg-emerald-500"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Faithfulness', 'Answer Relevancy', 'Context Precision'].map(m => (
              <Card key={m}>
                <CardHeader className="pb-2">
                  <CardDescription>{m}</CardDescription>
                  <CardTitle className="text-3xl text-muted-foreground">
                    {loadingMetrics ? '...' : '—'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-2 bg-muted rounded-full" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {summary === null && !loadingMetrics
                      ? 'Enable evaluation in AI Config to start collecting data'
                      : 'Loading...'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {summary && (
          <p className="text-sm text-muted-foreground">
            Based on <strong>{summary.count}</strong> evaluated interaction{summary.count !== 1 ? 's' : ''} over the last {summary.days} days
          </p>
        )}

        {/* Recent evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Evaluations</CardTitle>
            <CardDescription>Latest LLM-as-judge scored interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEvals ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : evaluations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No evaluations yet. Enable evaluation in AI Config and chat to collect data.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-48">Question</TableHead>
                      <TableHead>Faithfulness</TableHead>
                      <TableHead>Relevancy</TableHead>
                      <TableHead>Precision</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map(ev => (
                      <TableRow key={ev.id}>
                        <TableCell className="max-w-64">
                          <p className="truncate text-sm" title={ev.question}>{ev.question}</p>
                        </TableCell>
                        <TableCell><ScoreBar value={ev.faithfulness} /></TableCell>
                        <TableCell><ScoreBar value={ev.answerRelevancy} /></TableCell>
                        <TableCell><ScoreBar value={ev.contextPrecision} /></TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {ev.modelUsed?.split('/').pop() ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {ev.responseTimeMs != null ? `${(ev.responseTimeMs / 1000).toFixed(1)}s` : '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ev.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benchmark section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Test cases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Benchmark Test Cases
              </CardTitle>
              <CardDescription>
                Curated Q&A pairs for Context Recall evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testCases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No test cases yet. Add some below.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {testCases.map(tc => (
                    <div key={tc.id} className="flex items-start gap-2 p-2 rounded border text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{tc.question}</p>
                        <p className="text-muted-foreground truncate text-xs">{tc.expectedAnswer}</p>
                        {tc.category && (
                          <Badge variant="outline" className="mt-1 text-xs">{tc.category}</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeTestCase(tc.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 pt-2 border-t">
                <Input
                  placeholder="Question"
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                />
                <Input
                  placeholder="Expected answer"
                  value={newExpected}
                  onChange={e => setNewExpected(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Category (optional)"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={addingCase || !newQuestion.trim() || !newExpected.trim()}
                    onClick={addTestCase}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benchmark results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="w-4 h-4" />
                Context Recall Benchmark
              </CardTitle>
              <CardDescription>
                Measures if retrieved context contains facts from expected answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={runBenchmark}
                disabled={benchmarkRunning || testCases.length === 0}
                className="w-full"
              >
                {benchmarkRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Running benchmark...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Benchmark ({testCases.length} case{testCases.length !== 1 ? 's' : ''})
                  </>
                )}
              </Button>

              {benchmarkResults !== null && (
                benchmarkResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center">No results</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {benchmarkResults.map(r => (
                      <div key={r.testCaseId} className="p-3 rounded border space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate flex-1">{r.question}</p>
                          {r.category && (
                            <Badge variant="outline" className="text-xs shrink-0">{r.category}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24">Context Recall</span>
                          <ScoreBar value={r.contextRecall} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
