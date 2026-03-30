export type SubjectType = 'physics' | 'chemistry';

export interface Topic {
  id: string;
  title: string;
  description: string;
  subject: SubjectType;
  modelType: string;
  funFact: string;
  /** Optional subsections shown instead of a direct model viewer */
  subTopics?: SubTopic[];
}

export interface SubTopic {
  id: string;
  title: string;
  description: string;
  modelType: string;
  funFact: string;
  /** Whether this object is magnetic (used for magnetic/non-magnetic section) */
  isMagnetic?: boolean;
}

export interface SubjectData {
  title: string;
  description: string;
  topics: Topic[];
}
