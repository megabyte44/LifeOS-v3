// @ts-nocheck
// Legacy placeholder data - no longer used in production pages (all pages now use real API)

import type { TodoItem, Transaction, Habit, Note, Credential, Notification, Goal } from '@/types';

// Demo data - Only shown to guest users
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 7);

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const P_TODO_ITEMS: TodoItem[] = [
  { id: 'todo-1', text: 'Review pull requests', priority: 'high', completed: false, createdAt: new Date().toISOString() },
  { id: 'todo-2', text: 'Call mom', priority: 'medium', completed: true, createdAt: yesterday.toISOString() },
  { id: 'todo-3', text: 'Buy groceries', priority: 'medium', completed: false, createdAt: new Date().toISOString() },
  { id: 'todo-4', text: 'Complete project proposal', priority: 'high', completed: false, createdAt: new Date().toISOString() },
  { id: 'todo-5', text: 'Book dentist appointment', priority: 'low', completed: false, createdAt: yesterday.toISOString() },
  { id: 'todo-6', text: 'Read for 30 minutes', priority: 'medium', completed: true, createdAt: today.toISOString() },
];

export const P_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', date: formatDate(today), description: 'Coffee at Starbucks', amount: -5.50, category: 'Food & Dining', type: 'expense' },
  { id: 'tx-2', date: formatDate(today), description: 'Freelance project payment', amount: 850.00, category: 'Income', type: 'income' },
  { id: 'tx-3', date: formatDate(yesterday), description: 'Grocery shopping', amount: -127.30, category: 'Groceries', type: 'expense' },
  { id: 'tx-4', date: formatDate(yesterday), description: 'Gym membership', amount: -45.00, category: 'Health & Fitness', type: 'expense' },
  { id: 'tx-5', date: formatDate(twoDaysAgo), description: 'Monthly salary', amount: 4500.00, category: 'Salary', type: 'income' },
  { id: 'tx-6', date: formatDate(twoDaysAgo), description: 'Netflix subscription', amount: -15.99, category: 'Entertainment', type: 'expense' },
  { id: 'tx-7', date: formatDate(twoDaysAgo), description: 'Gas station', amount: -50.00, category: 'Transportation', type: 'expense' },
  { id: 'tx-8', date: formatDate(lastWeek), description: 'Book: Clean Code', amount: -35.00, category: 'Education', type: 'expense' },
  { id: 'tx-9', date: formatDate(lastWeek), description: 'Restaurant dinner', amount: -68.50, category: 'Food & Dining', type: 'expense' },
  { id: 'tx-10', date: formatDate(lastWeek), description: 'Online course refund', amount: 99.00, category: 'Income', type: 'income' },
];

export const P_HABITS: Habit[] = [
  { 
    id: 'habit-1', 
    name: 'Morning Workout', 
    icon: 'Sunrise', 
    completions: {
      [formatDate(today)]: true,
      [formatDate(yesterday)]: true,
      [formatDate(twoDaysAgo)]: true,
      [formatDate(lastWeek)]: true,
    }
  },
  { 
    id: 'habit-2', 
    name: 'Drink Water', 
    icon: 'GlassWater', 
    target: 8, 
    completions: {
      [formatDate(today)]: true,
      [formatDate(yesterday)]: true,
      [formatDate(twoDaysAgo)]: true,
    }
  },
  { 
    id: 'habit-3', 
    name: 'Read 30 Minutes', 
    icon: 'BookOpen', 
    completions: {
      [formatDate(today)]: true,
      [formatDate(yesterday)]: false,
      [formatDate(twoDaysAgo)]: true,
    }
  },
  { 
    id: 'habit-4', 
    name: 'Code Practice', 
    icon: 'Code', 
    completions: {
      [formatDate(today)]: true,
      [formatDate(yesterday)]: true,
      [formatDate(twoDaysAgo)]: true,
      [formatDate(lastWeek)]: true,
    }
  },
  { 
    id: 'habit-5', 
    name: 'Meditation', 
    icon: 'Moon', 
    completions: {
      [formatDate(today)]: false,
      [formatDate(yesterday)]: true,
      [formatDate(twoDaysAgo)]: true,
    }
  },
];

export const P_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Project Ideas',
    content: '# Upcoming Projects\n\n## 1. Personal Finance Tracker\n- Budget management\n- Expense categorization\n- Investment tracking\n- Financial goals\n\n## 2. Habit Building App\n- Daily check-ins\n- Streak tracking\n- Analytics dashboard\n\n## 3. Learning Management System\n- Course creation\n- Progress tracking\n- Quiz system',
    type: 'markdown',
    tags: ['projects', 'ideas', 'development'],
    createdAt: twoDaysAgo.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: 'note-2',
    title: 'Meeting Notes - Team Sync',
    content: '**Date:** ' + formatDate(yesterday) + '\n\n**Attendees:** John, Sarah, Mike, Alex\n\n**Key Points:**\n- Q4 roadmap finalized\n- New feature: Real-time collaboration\n- Performance optimization needed\n- Code review process improvements\n\n**Action Items:**\n- [ ] John: Setup CI/CD pipeline\n- [x] Sarah: Design mockups\n- [ ] Mike: Database migration plan\n- [x] Alex: Security audit',
    type: 'markdown',
    tags: ['work', 'meetings'],
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: 'note-3',
    title: 'Books to Read',
    content: 'Reading List 2025:\n\n1. Atomic Habits - James Clear ✅\n2. Deep Work - Cal Newport 📚\n3. The Pragmatic Programmer - Hunt & Thomas\n4. Designing Data-Intensive Applications\n5. Clean Architecture - Robert Martin\n6. You Don\'t Know JS series\n\nCurrently reading: Deep Work (Chapter 3)',
    type: 'text',
    tags: ['books', 'learning', 'personal'],
    createdAt: lastWeek.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 'note-4',
    title: 'Recipe: Healthy Buddha Bowl',
    content: '## Ingredients:\n- Quinoa (1 cup)\n- Chickpeas (roasted)\n- Sweet potato (cubed)\n- Kale or spinach\n- Avocado\n- Tahini dressing\n\n## Instructions:\n1. Cook quinoa according to package\n2. Roast chickpeas & sweet potato at 400°F for 25 min\n3. Massage kale with lemon juice\n4. Assemble bowl and drizzle with tahini\n\n**Nutrition:** High protein, fiber, healthy fats\n**Prep time:** 15 min | **Cook time:** 25 min',
    type: 'markdown',
    tags: ['recipes', 'health', 'food'],
    createdAt: lastWeek.toISOString(),
    updatedAt: lastWeek.toISOString(),
  },
];

export const P_PASSWORDS: Credential[] = [
  {
    id: 'pwd-1',
    website: 'GitHub',
    url: 'https://github.com',
    username: 'demo_user',
    password: '••••••••',
    category: 'Development',
    notes: 'Personal GitHub account',
    createdAt: lastWeek.toISOString(),
    updatedAt: lastWeek.toISOString(),
  },
  {
    id: 'pwd-2',
    website: 'Gmail',
    url: 'https://mail.google.com',
    username: 'demo@example.com',
    password: '••••••••',
    category: 'Email',
    notes: 'Primary email account',
    createdAt: lastWeek.toISOString(),
    updatedAt: yesterday.toISOString(),
  },
  {
    id: 'pwd-3',
    website: 'AWS Console',
    url: 'https://aws.amazon.com',
    username: 'demo_developer',
    password: '••••••••',
    category: 'Cloud Services',
    notes: 'Production environment access',
    createdAt: lastWeek.toISOString(),
    updatedAt: lastWeek.toISOString(),
  },
];

export const P_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    title: 'Habit Streak!',
    message: '🔥 7 day streak on Morning Workout! Keep it up!',
    read: false,
    date: formatDate(today),
  },
  {
    id: 'notif-2',
    title: 'Budget Alert',
    message: 'You\'ve spent 80% of your monthly dining budget',
    read: false,
    date: formatDate(yesterday),
  },
  {
    id: 'notif-3',
    title: 'Task Due Soon',
    message: 'Complete project proposal is due tomorrow',
    read: true,
    date: formatDate(yesterday),
  },
];

export const P_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'Become a Senior Developer',
    category: 'Career',
    motive: 'I want to lead impactful projects, mentor others, and have the technical expertise to solve complex problems. This role represents my growth as an engineer and opens doors to better opportunities.',
    description: 'Achieve senior-level technical expertise in full-stack development, system design, and leadership. Focus on building scalable applications, contributing to open source, and developing mentorship skills.',
    progressTrackers: [
      {
        id: 'pt-1',
        type: 'percentage',
        label: 'Overall Progress',
        current: 65,
        target: 100,
        order: 1
      },
      {
        id: 'pt-2',
        type: 'fraction',
        label: 'Key Milestones',
        current: 4,
        target: 7,
        order: 2
      },
      {
        id: 'pt-3',
        type: 'starRating',
        label: 'Confidence Level',
        stars: 4,
        maxStars: 5,
        order: 3
      }
    ],
    subGoals: [
      { id: 'sg-1', title: 'Master System Design Principles', description: 'Study distributed systems, scalability patterns, and microservices', completed: true, completedAt: '2025-08-15T10:00:00Z', order: 1 },
      { id: 'sg-2', title: 'Build 3 Portfolio Projects', description: 'Create production-grade applications showcasing advanced skills', completed: true, completedAt: '2025-09-20T14:30:00Z', order: 2 },
      { id: 'sg-3', title: 'Contribute to Open Source', description: 'Make meaningful contributions to 2-3 major projects', completed: true, completedAt: '2025-10-01T09:15:00Z', order: 3 },
      { id: 'sg-4', title: 'Master AWS/Cloud Architecture', description: 'Get hands-on with deployment, CI/CD, and cloud services', completed: true, completedAt: '2025-10-10T16:45:00Z', order: 4 },
      { id: 'sg-5', title: 'Get AWS Certification', description: 'Complete AWS Solutions Architect certification', completed: false, order: 5 },
      { id: 'sg-6', title: 'Lead a Team Project', description: 'Mentor junior developers and lead a project end-to-end', completed: false, order: 6 },
      { id: 'sg-7', title: 'Interview at Target Companies', description: 'Apply and interview at 5 top tech companies', completed: false, order: 7 }
    ],
    notes: [
      { id: 'note-1', title: 'Skills to Master', content: '• Advanced TypeScript patterns\n• GraphQL & REST API design\n• Docker & Kubernetes\n• Performance optimization\n• Security best practices', createdAt: '2025-07-01T08:00:00Z', updatedAt: '2025-10-15T12:00:00Z', order: 1 },
      { id: 'note-2', title: 'Interview Prep Checklist', content: '• Review system design questions\n• Practice coding challenges daily\n• Prepare behavioral stories (STAR method)\n• Mock interviews with peers\n• Research company tech stacks', createdAt: '2025-09-01T10:00:00Z', updatedAt: '2025-10-12T15:30:00Z', order: 2 },
      { id: 'note-3', title: 'Projects Showcase', content: '✅ Real-time Collaboration Tool (Next.js, WebSockets)\n✅ E-commerce Platform (Microservices, Redis)\n✅ AI-Powered Analytics Dashboard\n🔄 Open Source Contributions (React ecosystem)', createdAt: '2025-08-10T14:00:00Z', updatedAt: '2025-10-14T11:20:00Z', order: 3 }
    ],
    resources: [
      { id: 'res-1', type: 'book', title: 'Clean Code by Robert Martin', description: 'Essential reading for software craftsmanship', order: 1 },
      { id: 'res-2', type: 'link', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', description: 'Comprehensive guide to system design', order: 2 },
      { id: 'res-3', type: 'course', title: 'AWS Solutions Architect Course', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate/', description: 'Preparation for AWS certification', order: 3 },
      { id: 'res-4', type: 'video', title: 'Tech Interview Handbook', url: 'https://www.techinterviewhandbook.org/', description: 'Curated interview preparation resources', order: 4 }
    ],
    linkedHabitIds: [], // Will be linked to "Code Daily" habit
    startDate: '2025-06-01T00:00:00Z',
    targetDate: '2026-03-01T00:00:00Z',
    createdAt: '2025-06-01T08:00:00Z',
    updatedAt: '2025-10-17T10:30:00Z',
    archived: false
  },
  {
    id: 'goal-2',
    title: 'Complete First Marathon',
    category: 'Health & Fitness',
    motive: 'Running a marathon has always been a dream. It represents pushing my physical and mental limits, proving to myself that consistency and dedication can achieve what once seemed impossible.',
    description: 'Train systematically to complete a full marathon (42.2 km) within 9 months. Focus on building endurance gradually, preventing injuries, and maintaining proper nutrition and recovery.',
    progressTrackers: [
      {
        id: 'pt-4',
        type: 'dotChain',
        label: 'Training Weeks',
        totalDots: 36,
        filledDots: 18,
        order: 1
      },
      {
        id: 'pt-5',
        type: 'numberCounter',
        label: 'Long Runs Completed',
        current: 12,
        target: 24,
        order: 2
      },
      {
        id: 'pt-6',
        type: 'colorStatus',
        label: 'Training Status',
        status: 'in-progress',
        order: 3
      }
    ],
    subGoals: [
      { id: 'sg-8', title: 'Run 5K Comfortably', completed: true, completedAt: '2025-06-15T07:30:00Z', order: 1 },
      { id: 'sg-9', title: 'Complete 10K Run', completed: true, completedAt: '2025-07-20T08:00:00Z', order: 2 },
      { id: 'sg-10', title: 'Finish Half Marathon', completed: true, completedAt: '2025-09-10T09:30:00Z', order: 3 },
      { id: 'sg-11', title: 'Run 30K Long Run', completed: false, order: 4 },
      { id: 'sg-12', title: 'Complete Marathon Race', completed: false, order: 5 }
    ],
    notes: [
      { id: 'note-4', title: 'Training Schedule', content: '• Monday: Easy 5K recovery run\n• Tuesday: Speed intervals (6x800m)\n• Wednesday: Rest or cross-training\n• Thursday: Tempo run (8K)\n• Friday: Rest\n• Saturday: Long run (progressive distance)\n• Sunday: Easy 5K + stretching', createdAt: '2025-05-15T06:00:00Z', updatedAt: '2025-10-16T07:00:00Z', order: 1 },
      { id: 'note-5', title: 'Nutrition Plan', content: '• Pre-run: Banana + water (30 mins before)\n• During long runs: Energy gels every 45 mins\n• Post-run: Protein shake + carbs within 30 mins\n• Daily: 2.5L water, high protein, complex carbs\n• Race day: Light breakfast 2-3 hours before', createdAt: '2025-06-01T08:30:00Z', updatedAt: '2025-10-15T19:00:00Z', order: 2 }
    ],
    resources: [
      { id: 'res-5', type: 'book', title: 'Born to Run by Christopher McDougall', description: 'Inspirational running book', order: 1 },
      { id: 'res-6', type: 'link', title: 'Hal Higdon Marathon Training Plan', url: 'https://www.halhigdon.com/training-programs/marathon-training/novice-1-marathon/', order: 2 },
      { id: 'res-7', type: 'article', title: 'Injury Prevention for Runners', description: 'Essential tips for staying healthy while training', order: 3 }
    ],
    linkedHabitIds: ['3'], // Linked to "Workout" habit
    startDate: '2025-05-01T00:00:00Z',
    targetDate: '2026-02-15T00:00:00Z',
    createdAt: '2025-05-01T10:00:00Z',
    updatedAt: '2025-10-17T08:15:00Z',
    archived: false
  },
  {
    id: 'goal-3',
    title: 'Build Financial Independence',
    category: 'Finance',
    motive: 'I want to achieve financial security so I can make life choices without money being the primary constraint. Building wealth early will give me freedom to pursue passion projects and help my family.',
    description: 'Create multiple income streams, invest wisely, and build an emergency fund. Focus on learning personal finance, stock market investing, and developing passive income sources.',
    progressTrackers: [
      {
        id: 'pt-7',
        type: 'percentage',
        label: 'Emergency Fund Progress',
        current: 40,
        target: 100,
        order: 1
      },
      {
        id: 'pt-8',
        type: 'numberCounter',
        label: 'Investment Portfolio Value',
        current: 15000,
        target: 50000,
        order: 2
      }
    ],
    subGoals: [
      { id: 'sg-13', title: 'Build 3-Month Emergency Fund', completed: false, order: 1 },
      { id: 'sg-14', title: 'Start Index Fund Investing', completed: true, completedAt: '2025-07-01T00:00:00Z', order: 2 },
      { id: 'sg-15', title: 'Learn Technical Analysis', completed: false, order: 3 },
      { id: 'sg-16', title: 'Launch Side Business', completed: false, order: 4 }
    ],
    notes: [
      { id: 'note-6', title: 'Investment Strategy', content: '• 50% Index Funds (S&P 500, Total Market)\n• 30% Growth Stocks (Tech sector)\n• 15% Bonds (Stability)\n• 5% Crypto (High risk/reward)\n\nRebalance quarterly', createdAt: '2025-06-15T14:00:00Z', updatedAt: '2025-10-10T16:30:00Z', order: 1 }
    ],
    resources: [
      { id: 'res-8', type: 'book', title: 'The Intelligent Investor by Benjamin Graham', order: 1 },
      { id: 'res-9', type: 'link', title: 'Personal Finance Subreddit', url: 'https://www.reddit.com/r/personalfinance/', order: 2 }
    ],
    linkedHabitIds: [],
    startDate: '2025-06-01T00:00:00Z',
    targetDate: '2027-06-01T00:00:00Z',
    createdAt: '2025-06-01T12:00:00Z',
    updatedAt: '2025-10-17T09:45:00Z',
    archived: false
  }
];

