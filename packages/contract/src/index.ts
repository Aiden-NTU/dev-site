/** Shared vocabulary between hub and project Workers. Keep tiny. */

export type RiskLevel = "static" | "trusted" | "experimental";

export type ProjectRuntime = "ts" | "python" | "static";

export interface SubgroupMeta {
  id: string;
  title: string;
}

export interface GroupMeta {
  id: string;
  title: string;
  subgroups?: SubgroupMeta[];
}

export interface ProjectMeta {
  id: string;
  title: string;
  summary: string;
  group: string;
  subgroup: string;
  risk: RiskLevel;
  runtime: ProjectRuntime;
  host: string;
  url: string;
  released?: string;
  tags?: string[];
}

export interface HealthResponse {
  ok: true;
  service: string;
  risk: RiskLevel;
  time: string;
}

export interface ProgressEvent {
  userId: string;
  projectId: string;
  path: string;
  completed: boolean;
  at: string;
}

export interface RunRequest {
  source: string;
}

export interface RunResponse {
  ok: boolean;
  output: string;
}

export function projectHost(id: string, subgroup: string, group: string, root = "aidenhawkins.dev") {
  return `${id}.${subgroup}.${group}.${root}`;
}

export function projectUrl(meta: Pick<ProjectMeta, "host">) {
  return `https://${meta.host}/`;
}
