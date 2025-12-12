export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
}

export interface JiraIssueType {
  id: string;
  name: string;
  subtask: boolean;
}

export interface JiraStatus {
  id: string;
  name: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
  };
}

export interface JiraPriority {
  id: string;
  name: string;
}

export interface JiraIssueFields {
  summary: string;
  assignee: JiraUser | null;
  status: JiraStatus;
  issuetype: JiraIssueType;
  created: string;
  updated: string;
  resolutiondate?: string;
  priority: JiraPriority;
  labels: string[];
  customfield_10016?: number; // Story points (common custom field)
  [key: string]: unknown; // Allow other custom fields
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraIssueFields;
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
  originBoardId: number;
}

export interface JiraSprintsResponse {
  values: JiraSprint[];
  isLast: boolean;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
}

export interface JiraField {
  id: string;
  name: string;
  custom: boolean;
  schema?: {
    type: string;
    custom?: string;
  };
}

export interface JiraSprintIssuesResponse {
  issues: JiraIssue[];
}
