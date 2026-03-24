export type SubjectType = 'physics' | 'chemistry';

export interface Topic {
  id: string;
  title: string;
  description: string;
  subject: SubjectType;
  modelType: string;
  funFact: string;
}

export interface SubjectData {
  title: string;
  description: string;
  topics: Topic[];
}
