import { tokenizeProjectText } from '@/shared/constants/design';
import type { DashboardItem, RepoProject } from '@/shared/types/domain';

export class ProjectService {
  // Calculate match score between an item and a project
  static calculateMatchScore(item: DashboardItem, project: RepoProject): number {
    const text = [
      item.title,
      item.priorityReason,
      item.type,
      item.state,
      ...(item.labels ?? []),
      ...item.recommendedLabels.map((rec) => rec.label),
      ...item.recommendedLabels.map((rec) => rec.reason),
    ]
      .join(' ')
      .toLowerCase();

    const projectName = project.name.trim().toLowerCase();
    const phraseHit = projectName.length >= 2 && text.includes(projectName);
    const tokens = tokenizeProjectText(`${project.name} ${project.description}`);

    if (tokens.length === 0) {
      return phraseHit ? 1 : 0;
    }

    let matched = 0;
    for (const token of tokens) {
      if (text.includes(token)) matched += 1;
    }

    const tokenScore = matched / tokens.length;
    return phraseHit ? Math.max(tokenScore, 0.95) : tokenScore;
  }

  // Filter items matching a project
  static filterByProject(items: DashboardItem[], project: RepoProject | null): DashboardItem[] {
    if (!project) return items;
    return items.filter((item) => this.calculateMatchScore(item, project) > 0);
  }

  // Load projects from localStorage
  static loadProjectsFromStorage(): RepoProject[] {
    const cachedProjects = window.localStorage.getItem('tidyx:projects');
    if (!cachedProjects) return [];

    try {
      const parsed = JSON.parse(cachedProjects) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (project): project is RepoProject =>
            typeof project === 'object' &&
            project !== null &&
            typeof (project as any).id === 'string' &&
            typeof (project as any).repoId === 'number' &&
            typeof (project as any).name === 'string' &&
            typeof (project as any).description === 'string',
        );
      }
    } catch {
      // noop
    }

    return [];
  }

  // Save projects to localStorage
  static saveProjectsToStorage(projects: RepoProject[]): void {
    window.localStorage.setItem('tidyx:projects', JSON.stringify(projects));
  }

  // Create new project
  static createProject(
    repoId: number,
    name: string,
    description: string,
  ): RepoProject {
    return {
      id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      repoId,
      name,
      description,
      createdAt: new Date().toISOString(),
    };
  }
}
