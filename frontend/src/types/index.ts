export type PlannerItem = {
  id: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  title: string;
  tag?: string;
  colorLabel?: string; // hex color accent on the card
  repeat?: {
    type: 'none' | 'daily' | 'weekdays' | 'custom' | 'interval';
    days?: string[]; // for type=custom, e.g. ['Monday','Wednesday']
    intervalDays?: number; // for type=interval
  };
  reminder?: {
    enabled: boolean;
    offsetMinutes: number; // how many minutes before to fire push notification
  };
};

export type TodoItem = {
  id:string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  postponed?: boolean;
};

export type Transaction = {
  id: string;
  date: string; // ISO string 'yyyy-MM-dd'
  description: string;
  category: string;
  amount: number; // Stored in cents to avoid floating point issues
  type: 'income' | 'expense' | 'fee';
};

export type Habit = {
  id: string;
  name: string;
  icon: string;
  target?: number;
  completions: Record<string, boolean | number>; // e.g. { '2024-07-21': true, '2024-07-22': 4 }
  habitType?: 'repetitive' | 'sprint'; // repetitive = ongoing, sprint = time-limited challenge
  sprintDuration?: number; // Number of days for sprint (e.g., 30-day challenge)
  sprintEndDate?: string; // ISO string 'yyyy-MM-dd' - alternative to duration
  sprintStartDate?: string; // ISO string 'yyyy-MM-dd' - when the sprint started
  context?: string; // e.g. 'gym' — used to scope habits to a feature area
};

export type Note = {
  id: string;
  title: string;
  content: string | { text: string; completed: boolean }[] | { code: string; input?: string; output?: string; language?: string };
  type: 'text' | 'checklist' | 'markdown' | 'snippet';
  createdAt: string;
  updatedAt?: string; // ISO string — set by backend @UpdateTimestamp
};

export type Credential = {
  id: string;
  name: string;
  category: 'Website' | 'Banking' | 'Social Media' | 'Other';
  lastUpdated: string;
  // Generic fields
  username?: string;
  password?: string;
  website?: string;
  // Banking fields
  accountNumber?: string;
  ifscCode?: string;
  upiPin?: string;
  netbankingId?: string;
  mpin?: string;
  netbankingPassword?: string;
  transactionPassword?: string;
};


// New types for Gym Tracker
export type ExerciseSession = {
  weight: number;
  reps: number;
  date?: string; // ISO date string 'yyyy-MM-dd'
  // Calculated fields for internal use
  score?: number;
  scoreDelta?: number;
};

export type Exercise = {
  id: string;
  name: string;
  sets: string;
  // For progressive overload tracker
  kValue?: number;
  baselineWeight?: number;
  baselineReps?: number;
  targetWeight?: number;
  targetReps?: number;
  sessionHistory?: ExerciseSession[];
};


export type WorkoutDay = {
  title: string;
  exercises: Exercise[];
};

export type CyclicalWorkoutSplit = Record<string, WorkoutDay>;

export type CycleConfig = {
  startDate: string; // ISO Date string
  startDayKey: string;
};

export type ProteinIntake = {
  id: string;
  amount: number;
  timestamp: string; // ISO string
};

export type LoggedFoodItem = {
    id:string;
    name: string;
    timestamp: string; // ISO string
};

export type CompletedWorkouts = Record<string, boolean>; // date key: 'yyyy-MM-dd'

export type Notification = {
  id: string;
  title: string;
  date: string; // ISO string 'yyyy-MM-dd'
  message: string;
  read: boolean;
};

export type UserPreferences = {
  features: {
    waterIntake: boolean;
    todaysPlan: boolean;
    financialSnapshot: boolean;
    todoList: boolean;
    habitStreaks: boolean;
    gymTracker: boolean;
    proteinIntake: boolean;
    foodSupplements: boolean;
    // Gym sub-features (controlled by gymTracker master switch)
    overloadTracker: boolean;
    gymProteinIntake: boolean;
    gymFoodSupplements: boolean;
    // Dashboard widgets
    proteinIntakeWidget: boolean;
    supplementIntakeWidget: boolean;
  };
  onboarding?: {
    completedDashboardTour: boolean;
    completedProfileTour: boolean;
    completedGymPreferences: boolean;
    skippedTours: boolean;
  };
};

// ===================================
// ADMIN PANEL TYPES
// ===================================

export type AiConfiguration = {
  systemInstructions: {
    casualBuddy: string;
    professionalAssistant: string;
  };
  defaultPersonality: 'casual' | 'professional';
  modelConfig: {
    provider: 'openrouter' | 'gemini' | 'openai';
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  apiKeys?: {
    openrouter?: string;
    gemini?: string;
    openai?: string;
  };
  ragEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type SystemSettings = {
  features: {
    aiChat: boolean;
    pushNotifications: boolean;
    waterTracker: boolean;
    gymTracker: boolean;
    passwordManager: boolean;
    budgetTracker: boolean;
    habitTracker: boolean;
    planner: boolean;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  limits: {
    maxNotesPerUser: number;
    maxTodosPerUser: number;
    maxAiMessagesPerDay: number;
  };
  updatedAt: string;
  updatedBy: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'update';
  version?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  createdBy: string;
};

export type AboutPageContent = {
  title: string;
  description: string;
  version: string;
  markdownContent?: string;
  features: {
    icon: string;
    title: string;
    description: string;
  }[];
  contact: {
    email: string;
    phone?: string;
    website?: string;
    github?: string;
    twitter?: string;
  };
  updatedAt: string;
  updatedBy: string;
};

export type UserStats = {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastLoginAt: string;
  notesCount: number;
  todosCount: number;
  habitsCount: number;
  transactionsCount: number;
  aiMessagesCount: number;
};

// ===================================
// GOAL TRACKING SYSTEM TYPES
// ===================================

export type GoalCategory = 
  | 'Career' 
  | 'Health & Fitness' 
  | 'Personal Development' 
  | 'Education' 
  | 'Finance' 
  | 'Relationships' 
  | 'Creativity' 
  | 'Lifestyle' 
  | 'Other';

export type ProgressTrackerType = 
  | 'percentage'       // 0-100% bar
  | 'fraction'         // e.g., "3/10 completed"
  | 'dotChain'         // ○○○●●●●● visual
  | 'checkboxList'     // For sub-tasks
  | 'numberCounter'    // Custom metric
  | 'starRating'       // ⭐⭐⭐⭐☆
  | 'colorStatus';     // Red/Yellow/Green

export type ColorStatus = 'not-started' | 'in-progress' | 'almost-there' | 'completed';

export type ProgressTracker = {
  id: string;
  type: ProgressTrackerType;
  label: string;
  // For percentage, fraction, numberCounter
  current?: number;
  target?: number;
  // For starRating
  stars?: number; // 1-5
  maxStars?: number;
  // For colorStatus
  status?: ColorStatus;
  // For dotChain
  totalDots?: number;
  filledDots?: number;
  // Display order
  order: number;
};

export type SubGoal = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string; // ISO string
  order: number;
  children?: SubGoal[]; // For hierarchy goals - nested sub-goals
  parentId?: string; // Reference to parent sub-goal (for hierarchy)
  level?: number; // Depth level in hierarchy (0 = top level, 1 = child, etc.)
};

export type GoalNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  order: number;
};

export type GoalResourceType = 'link' | 'book' | 'video' | 'article' | 'course' | 'other';

export type GoalResource = {
  id: string;
  type: GoalResourceType;
  title: string;
  url?: string;
  description?: string;
  order: number;
};

export type LinkedHabitRef = {
  habitId: string;
  linkedAt: string; // ISO string
};

export type Goal = {
  id: string;
  title: string;
  category: GoalCategory;
  goalType?: 'step-by-step' | 'hierarchy' | 'milestone'; // Type of goal structure
  motive: string; // The "why" behind the goal
  description: string;
  
  // Progress tracking tools (flexible - user adds what they need)
  progressTrackers: ProgressTracker[];
  
  // Sub-goals/Milestones
  subGoals: SubGoal[];
  
  // Notes & Ideas (expandable accordion style)
  notes: GoalNote[];
  
  // Resources (books, links, videos)
  resources: GoalResource[];
  
  // Linked habits (many-to-many relationship)
  linkedHabitIds: string[]; // Array of habit IDs
  
  // Dates
  startDate?: string; // ISO string
  targetDate?: string; // ISO string
  completedAt?: string; // ISO string
  
  // Metadata
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  
  // Archive/Active status
  archived: boolean;
};

// Helper type for displaying goal progress summary
export type GoalProgressSummary = {
  overallProgress: number; // 0-100
  completedSubGoals: number;
  totalSubGoals: number;
  linkedHabitsStreak: number; // Combined streak from linked habits
  lastActivityDate?: string;
};

