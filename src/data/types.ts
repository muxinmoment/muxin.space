import type { NoteCategory } from "./noteTaxonomy";

export type Profile = {
  badge: string;
  name: string;
  avatar: string;
  headline: string;
  description: string;
};

export type Principle = {
  title: string;
  description: string;
};

export type Project = {
  name: string;
  status: string;
  summary: string;
  stack: string[];
  highlights: string[];
  liveUrl?: string;
  liveLabel?: string;
};

export type SkillGroup = {
  title: string;
  items: string[];
};

export type TimelineItem = {
  period: string;
  title: string;
  description: string;
};

export type { NoteCategory };
