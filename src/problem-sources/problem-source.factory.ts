import type { ProblemSource } from './problem-source.interface';
import { AlfaLeetCodeSource } from './alfa-leetcode.source';

class ProblemSourceFactory {
  private sources: Map<string, ProblemSource> = new Map();
  private primarySourceId: string = 'alfa-leetcode';

  constructor() {
    this.register(new AlfaLeetCodeSource());
  }

  register(source: ProblemSource): void {
    this.sources.set(source.sourceId, source);
  }

  setPrimary(sourceId: string): void {
    if (!this.sources.has(sourceId)) {
      throw new Error(`Problem source "${sourceId}" not registered`);
    }
    this.primarySourceId = sourceId;
  }

  async getActiveSource(): Promise<ProblemSource> {
    const primary = this.sources.get(this.primarySourceId);
    if (!primary) {
      throw new Error(`Primary source "${this.primarySourceId}" not found`);
    }

    const healthy = await primary.isHealthy();
    if (healthy) return primary;

    for (const [id, source] of this.sources) {
      if (id === this.primarySourceId) continue;
      const fallbackHealthy = await source.isHealthy();
      if (fallbackHealthy) return source;
    }

    return primary;
  }

  getSource(sourceId: string): ProblemSource | undefined {
    return this.sources.get(sourceId);
  }
}

export const problemSourceFactory = new ProblemSourceFactory();
