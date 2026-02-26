'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dumbbell, Heart, X } from 'lucide-react';

interface GymPreferencesDialogProps {
  show: boolean;
  userId: string;
  onComplete: (isGymFreak: boolean) => void;
  onSkip: () => void;
}

export function GymPreferencesDialog({ show, userId, onComplete, onSkip }: GymPreferencesDialogProps) {
  const [open, setOpen] = useState(show);
  const [loading, setLoading] = useState(false);

  const handleSelection = async (isGymFreak: boolean) => {
    setLoading(true);
    try {
      console.log('Saving gym preferences:', { gymTracking: isGymFreak });
      
      setOpen(false);
      onComplete(isGymFreak);
    } catch (error) {
      console.error('Error saving gym preferences:', error);
      // Still complete, but log the error
      setOpen(false);
      onComplete(isGymFreak);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setOpen(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleSkip();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">One Quick Question!</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            SmartLifeOS includes fitness tracking features like gym workouts, protein intake, and supplement logs.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-lg font-medium mb-4 text-center">
            Are you into fitness and gym workouts?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Yes - Gym Freak */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary hover:bg-accent transition-all group"
              onClick={() => !loading && handleSelection(true)}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Dumbbell className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Yes, I'm a Gym Freak! 💪</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable gym tracker, protein intake, and supplement logs
                  </p>
                </div>
              </div>
            </Card>

            {/* No - Not into gym */}
            <Card 
              className="p-6 cursor-pointer hover:border-primary hover:bg-accent transition-all group"
              onClick={() => !loading && handleSelection(false)}
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Heart className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No, Not Really</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Hide gym-related widgets and focus on other productivity features
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Don't worry! You can always change this later in Settings.
          </p>
        </div>

        <DialogFooter className="flex justify-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Skip for Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
