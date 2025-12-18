// GitHub Copilot API Response Types
// https://docs.github.com/en/rest/copilot/copilot-user-management

export interface CopilotSeatAssignee {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  type: 'User' | 'Organization';
  site_admin: boolean;
  url: string;
  html_url: string;
}

export interface CopilotSeat {
  created_at: string; // ISO 8601 - when seat was granted
  updated_at: string | null; // ISO 8601 - deprecated
  pending_cancellation_date: string | null; // YYYY-MM-DD format
  last_activity_at: string | null; // ISO 8601 - last Copilot activity (requires telemetry)
  last_activity_editor: string | null; // e.g., "vscode", "jetbrains", "neovim"
  assignee: CopilotSeatAssignee;
  assigning_team?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export interface CopilotSeatsResponse {
  total_seats: number;
  seats: CopilotSeat[];
}
