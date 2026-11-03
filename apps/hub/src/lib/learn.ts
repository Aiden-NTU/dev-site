/** Curated starter notes mirrored from the University vault (subset). */

export type LearnDoc = {
  id: string;
  title: string;
  group: string;
  path: string;
};

export const LEARN_INDEX: LearnDoc[] = [
  {
    id: "number-sense",
    title: "Counting and Number Sense",
    group: "maths",
    path: "maths/1.1-counting-and-number-sense.md",
  },
  {
    id: "place-value",
    title: "Place Value and Number Lines",
    group: "maths",
    path: "maths/1.2-place-value-and-number-lines.md",
  },
  {
    id: "hardware-states",
    title: "Computation requires distinguishable physical states",
    group: "cs",
    path: "cs/1.1-computation-requires-distinguishable-physical-states.md",
  },
  {
    id: "how-to-use",
    title: "How To Use This Course",
    group: "maths",
    path: "maths/how-to-use-this-course.md",
  },
];

export function getLearnDoc(id: string) {
  return LEARN_INDEX.find((d) => d.id === id);
}
