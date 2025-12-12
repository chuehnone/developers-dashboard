import { getConfig } from '../../config';

export interface JQLQueryOptions {
  assignee?: string;
  projectKey?: string;
  sprint?: string | number;
  issueType?: string[];
  status?: string[];
  updatedSince?: Date;
  labels?: string[];
}

export class JQLBuilder {
  private conditions: string[] = [];

  project(key: string): this {
    this.conditions.push(`project = "${key}"`);
    return this;
  }

  assignee(email: string): this {
    this.conditions.push(`assignee = "${email}"`);
    return this;
  }

  sprint(sprintId: number): this {
    this.conditions.push(`sprint = ${sprintId}`);
    return this;
  }

  issueType(types: string[]): this {
    const typeList = types.map((t) => `"${t}"`).join(', ');
    this.conditions.push(`issuetype IN (${typeList})`);
    return this;
  }

  status(statuses: string[]): this {
    const statusList = statuses.map((s) => `"${s}"`).join(', ');
    this.conditions.push(`status IN (${statusList})`);
    return this;
  }

  updatedSince(date: Date): this {
    const dateStr = date.toISOString().split('T')[0];
    this.conditions.push(`updated >= "${dateStr}"`);
    return this;
  }

  labels(labels: string[]): this {
    const labelList = labels.map((l) => `"${l}"`).join(', ');
    this.conditions.push(`labels IN (${labelList})`);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'DESC'): this {
    this.conditions.push(`ORDER BY ${field} ${direction}`);
    return this;
  }

  build(): string {
    return this.conditions.join(' AND ');
  }
}

export function buildDeveloperIssuesQuery(assigneeEmail: string, daysBack: number = 14): string {
  const config = getConfig();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysBack);

  return new JQLBuilder()
    .project(config.jira.projectKey)
    .assignee(assigneeEmail)
    .updatedSince(sinceDate)
    .orderBy('updated')
    .build();
}

export function buildSprintIssuesQuery(sprintId: number): string {
  const config = getConfig();

  return new JQLBuilder()
    .project(config.jira.projectKey)
    .sprint(sprintId)
    .orderBy('created')
    .build();
}

export function buildActiveTicketsQuery(assigneeEmail?: string): string {
  const config = getConfig();
  const builder = new JQLBuilder()
    .project(config.jira.projectKey)
    .status(['To Do', 'In Progress', 'Review']);

  if (assigneeEmail) {
    builder.assignee(assigneeEmail);
  }

  return builder.orderBy('priority').build();
}

export function buildBugTicketsQuery(daysBack: number = 30): string {
  const config = getConfig();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysBack);

  return new JQLBuilder()
    .project(config.jira.projectKey)
    .issueType(['Bug'])
    .updatedSince(sinceDate)
    .orderBy('created')
    .build();
}

export function buildCompletedTicketsQuery(sprintId?: number, daysBack?: number): string {
  const config = getConfig();
  const builder = new JQLBuilder().project(config.jira.projectKey).status(['Done']);

  if (sprintId) {
    builder.sprint(sprintId);
  } else if (daysBack) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);
    builder.updatedSince(sinceDate);
  }

  return builder.orderBy('resolutiondate').build();
}

export function buildTechDebtQuery(daysBack: number = 90): string {
  const config = getConfig();
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - daysBack);

  // Tech debt can be identified by issue type or label
  return `project = "${config.jira.projectKey}" AND (issuetype = "Technical Debt" OR labels IN ("tech-debt", "technical-debt")) AND updated >= "${sinceDate.toISOString().split('T')[0]}" ORDER BY created DESC`;
}

export function buildStuckTicketsQuery(daysInStatus: number = 3): string {
  const config = getConfig();
  const stuckDate = new Date();
  stuckDate.setDate(stuckDate.getDate() - daysInStatus);

  return new JQLBuilder()
    .project(config.jira.projectKey)
    .status(['In Progress', 'Review'])
    .build() + ` AND statusCategoryChangedDate <= "${stuckDate.toISOString().split('T')[0]}"`;
}

export const STANDARD_FIELDS = [
  'summary',
  'assignee',
  'status',
  'issuetype',
  'created',
  'updated',
  'priority',
  'labels',
  'customfield_10016', // Story points (common field)
  'resolutiondate',
];
