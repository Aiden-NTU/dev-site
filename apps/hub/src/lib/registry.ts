import type { GroupMeta, ProjectMeta } from "@ah/contract";
import registryJson from "../../../../registry/projects.json";

export type Registry = {
  groups: GroupMeta[];
  projects: ProjectMeta[];
};

export function getRegistry(): Registry {
  return registryJson as Registry;
}

export function listProjects(opts?: { group?: string; subgroup?: string; q?: string }) {
  let projects = getRegistry().projects;
  if (opts?.group) projects = projects.filter((p) => p.group === opts.group);
  if (opts?.subgroup) projects = projects.filter((p) => p.subgroup === opts.subgroup);
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

export function getProject(id: string) {
  return getRegistry().projects.find((p) => p.id === id);
}

export function projectsByReleased(limit = 8) {
  return [...getRegistry().projects]
    .sort((a, b) => String(b.released ?? "").localeCompare(String(a.released ?? "")))
    .slice(0, limit);
}

export function navTree() {
  const { groups, projects } = getRegistry();
  return groups.map((g) => {
    const subgroups =
      g.subgroups && g.subgroups.length > 0
        ? g.subgroups
        : [...new Set(projects.filter((p) => p.group === g.id).map((p) => p.subgroup))].map((id) => ({
            id,
            title: id,
          }));
    return {
      ...g,
      subgroups: subgroups.map((sg) => ({
        ...sg,
        projects: projects.filter((p) => p.group === g.id && p.subgroup === sg.id),
      })),
    };
  });
}
