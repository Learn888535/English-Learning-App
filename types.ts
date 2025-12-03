export enum AppScreen {
  HOME = 'HOME',
  ASSESSMENT = 'ASSESSMENT',
  DASHBOARD = 'DASHBOARD',
  ACTIVITY_STORY = 'ACTIVITY_STORY',
  ACTIVITY_SIMON = 'ACTIVITY_SIMON',
  ACTIVITY_VOCAB = 'ACTIVITY_VOCAB',
  ACTIVITY_ROLEPLAY = 'ACTIVITY_ROLEPLAY',
  PARENT_GUIDE = 'PARENT_GUIDE'
}

export enum EnglishLevel {
  BEGINNER = 'BEGINNER', // Silent Period (0-3)
  INTERMEDIATE = 'INTERMEDIATE', // Construction (4-7)
  ADVANCED = 'ADVANCED' // Refinement (8+)
}

export interface UserProfile {
  name: string;
  age: number;
  level: EnglishLevel;
  interests: string[];
}

export interface VocabularyCard {
  word: string;
  translation: string;
  emoji: string;
  sentence: string;
}

export interface StorySegment {
  text: string;
  translation: string;
  imageUrl?: string; // We will use placeholder images
}

export interface SimonCommand {
  action: string;
  translation: string; // Chinese translation
  bodyPart?: string;
  isSimon: boolean; // Trick question logic
}