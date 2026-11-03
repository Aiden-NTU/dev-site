import type { ProjectMeta } from "@ah/contract";
import registryJson from "../../../../registry/projects.json";

export type Group = { id: string; title: string; summary: string };

export type Registry = {
  groups: Group[];
  projects: ProjectMeta[];
};

export function getRegistry(): Registry {
  return registryJson as Registry;
}

export function listProjects(opts?: { group?: string; q?: string }) {
  let projects = getRegistry().projects;
  if (opts?.group) projects = projects.filter((p) => p.group === opts.group);
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    projects = projects.filter((p) =>
      [p.id, p.title, p.summary, p.group, p.subgroup, ...(p.tags ?? [])].join(" ").toLowerCase().includes(q),
    );
  }
  return projects;
}

export function getGroup(id: string) {
  return getRegistry().groups.find((g) => g.id === id);
}
