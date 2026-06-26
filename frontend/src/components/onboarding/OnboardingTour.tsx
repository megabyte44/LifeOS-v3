'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  LayoutDashboard,
  Droplets,
  CalendarCheck,
  ListChecks,
  User,
  Settings,
  LogOut,
  MessageSquare,
  Shield,
  X
} from 'lucide-react';

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightSelector?: string;
  position?: 'center' | 'top' | 'bottom';
};

interface OnboardingTourProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip: () => void;
  show: boolean;
}

export function OnboardingTour({ steps, onComplete, onSkip, show }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(show);

  useEffect(() => {
    setOpen(show);
  }, [show]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      setOpen(false);
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setOpen(false);
    onSkip();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleSkip();
      }
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {currentStepData.icon}
              </div>
              <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>
            </div>
            <Badge variant="outline">
              {currentStep + 1} / {steps.length}
            </Badge>
          </div>
          <DialogDescription className="text-base pt-4">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 py-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex flex-row justify-between items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Skip Tour
          </Button>
          
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex items-center gap-1"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Predefined tour steps
export const dashboardTourSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to SmartLifeOS! 🎉',
    description: 'Let\'s take a quick tour to help you get started. This will only take a minute, and you can skip anytime.',
    icon: <Sparkles className="h-5 w-5 text-primary" />,
    position: 'center'
  },
  {
    id: 'dashboard-overview',
    title: 'Your Dashboard',
    description: 'This is your command center. All your important information is organized into widgets that update in real-time. You can customize which widgets appear in Settings.',
    icon: <LayoutDashboard className="h-5 w-5 text-primary" />,
    position: 'center'
  },
  {
    id: 'water-intake',
    title: 'Water Intake Tracker',
    description: 'Stay hydrated! Track your daily water consumption with a simple click. The widget shows your progress with visual indicators and helps you maintain healthy hydration habits.',
    icon: <Droplets className="h-5 w-5 text-blue-500" />,
    position: 'center'
  },
  {
    id: 'todays-plan',
    title: 'Today\'s Schedule',
    description: 'Your daily planner at a glance. See your upcoming tasks and events organized by time. Click to view more details or navigate to the full Planner page.',
    icon: <CalendarCheck className="h-5 w-5 text-purple-500" />,
    position: 'center'
  },
  {
    id: 'todo-list',
    title: 'Quick Todo List',
    description: 'Your most important tasks, front and center. Mark items complete, add new tasks, or navigate to the full Todo page for detailed task management.',
    icon: <ListChecks className="h-5 w-5 text-orange-500" />,
    position: 'center'
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Your intelligent companion! Click the AI Chat button in the sidebar to start a conversation. The AI understands your context and can help with planning, insights, and productivity tips.',
    icon: <MessageSquare className="h-5 w-5 text-primary" />,
    position: 'center'
  },
  {
    id: 'profile-menu',
    title: 'Profile & Settings',
    description: 'Click your profile icon in the top-right corner to access your profile, settings, notifications, and more. This is where you customize SmartLifeOS to fit your needs.',
    icon: <User className="h-5 w-5 text-primary" />,
    position: 'top'
  }
];

export const profileMenuTourSteps: OnboardingStep[] = [
  {
    id: 'profile-overview',
    title: 'Profile Menu Overview',
    description: 'Your profile menu gives you quick access to important actions and settings. Let\'s explore what each option does.',
    icon: <User className="h-5 w-5 text-primary" />,
    position: 'top'
  },
  {
    id: 'profile-page',
    title: 'Profile Page',
    description: 'View and edit your personal information, including your name, email, and avatar. Keep your profile up to date!',
    icon: <User className="h-5 w-5 text-blue-500" />,
    position: 'top'
  },
  {
    id: 'settings-page',
    title: 'Settings',
    description: 'Customize SmartLifeOS to match your preferences. Choose your theme, enable/disable widgets, configure notifications, and adjust other app settings.',
    icon: <Settings className="h-5 w-5 text-purple-500" />,
    position: 'top'
  },
  {
    id: 'admin-page',
    title: 'Admin Panel (If Available)',
    description: 'If you have admin privileges, you\'ll see an Admin option to manage system-wide settings, users, and configurations.',
    icon: <Shield className="h-5 w-5 text-orange-500" />,
    position: 'top'
  },
  {
    id: 'logout',
    title: 'Logout',
    description: 'When you\'re done, click Logout to securely sign out of your account. Your data is always saved and synced across devices.',
    icon: <LogOut className="h-5 w-5 text-red-500" />,
    position: 'top'
  }
];
