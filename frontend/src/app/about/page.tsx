'use client';

import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Target, 
  Brain, 
  Shield, 
  Zap, 
  Users, 
  Code2,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  Github,
  Linkedin,
  MessageCircle,
  Mail
} from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="space-y-4">
            <Badge className="w-fit bg-primary/10 text-primary border-primary/20 mx-auto">
              <TrendingUp className="h-3 w-3 mr-1" />
              About SmartLifeOS
            </Badge>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold font-headline leading-tight">
              Built by Someone Who
              <br />
              <span className="text-primary">Lived the Problem</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              SmartLifeOS isn't just another productivity app. It's the solution I needed when I was drowning in digital chaos—and couldn't find it anywhere.
            </p>
          </div>

          {/* Social Media Links Section */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <div className="text-lg text-muted-foreground">
              <span className="font-medium text-foreground">by Punith Naidu</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Connect:</span>
              <div className="flex gap-1">
                {/* GitHub */}
                <a 
                  href="https://github.com/megabyte44" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-accent transition-colors group"
                  title="GitHub Profile"
                >
                  <Github className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
                
                {/* LinkedIn */}
                <a 
                  href="https://www.linkedin.com/in/punith-medaramitta-473b3b340" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-accent transition-colors group"
                  title="LinkedIn Profile"
                >
                  <Linkedin className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                </a>
                
                {/* WhatsApp */}
                <a 
                  href="https://wa.me/916304893370" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-accent transition-colors group"
                  title="WhatsApp: +91 6304893370"
                >
                  <MessageCircle className="h-5 w-5 text-muted-foreground group-hover:text-green-500 transition-colors" />
                </a>
                
                {/* Email */}
                <a 
                  href="mailto:punithmedaramitta@gmail.com" 
                  className="p-2 rounded-lg hover:bg-accent transition-colors group"
                  title="Email: punithmedaramitta@gmail.com"
                >
                  <Mail className="h-5 w-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto space-y-12">
          {/* The Problem Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">The Problem I Faced</h2>
              <p className="text-lg text-muted-foreground">
                As a student juggling academics, projects, personal goals, and life, I found myself using a dozen different apps. 
                One for tasks. Another for notes. Another for budgeting. Another for goal tracking.
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                <p className="text-lg font-semibold text-destructive mb-2">The result? Digital chaos.</p>
                <p className="text-muted-foreground">
                  I spent more time managing my tools than actually making progress. Context switching between apps 
                  drained my focus. Important connections between my goals and daily actions were invisible. 
                  My productivity system was working against me, not for me.
                </p>
              </div>
              <p className="text-lg">
                I searched for a solution—a single platform that could bring everything together with intelligence and context. 
                <span className="font-semibold"> It didn't exist.</span>
              </p>
              <p className="text-lg font-medium text-primary">So I decided to build it.</p>
            </div>
          </Card>

          {/* The Journey Section */}
          <Card className="p-8">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold">From Idea to Reality</h2>
              <p className="text-lg text-muted-foreground">
                SmartLifeOS evolved through three major iterations:
              </p>
              
              <div className="space-y-6">
                <div className="border-l-4 border-primary/30 pl-6">
                  <h3 className="text-xl font-semibold mb-2">Memoria (v1.0) - Learning the Fundamentals</h3>
                  <p className="text-muted-foreground">
                    The first version was simple: a clean interface with local storage. No cloud, no authentication—just the core features. 
                    This is where I learned the craft of building user interfaces and the basics of web development. 
                    Every padding issue, every button glitch, every layout problem taught me something.
                  </p>
                </div>

                <div className="border-l-4 border-primary/60 pl-6">
                  <h3 className="text-xl font-semibold mb-2">LifeOS (v2.0) - Adding the Infrastructure</h3>
                  <p className="text-muted-foreground">
                    The second iteration brought the platform to life. I added Firebase authentication, cloud storage, and multi-device synchronization. 
                    Suddenly, your data could follow you everywhere. This version taught me about backends, APIs, environment variables, 
                    deployment challenges, and the complexity of making systems actually work in production.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-6">
                  <h3 className="text-xl font-semibold mb-2">SmartLifeOS (v3.0) - Adding Intelligence</h3>
                  <p className="text-muted-foreground">
                    The current version represents my vision fully realized: a modern, intelligent companion for your life. 
                    With a refined UI, notification support, and an AI assistant that actually knows you, 
                    SmartLifeOS is what I originally imagined—and more.
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <p className="text-lg font-medium text-primary">
                  Each version wasn't just about adding features. It was about leveling up my understanding of what it takes to build something meaningful.
                </p>
              </div>
            </div>
          </Card>

          {/* Philosophy Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">What Makes SmartLifeOS Different</h2>
              <p className="text-lg text-muted-foreground">
                Most productivity tools are isolated. They do one thing well but exist in a vacuum. 
                SmartLifeOS is built on a different philosophy:
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Everything in One Place</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Your tasks, goals, finances, and notes aren't separate—they're different views of the same journey. 
                    SmartLifeOS brings them together so you can see your life holistically.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Intelligence with Context</h3>
                  </div>
                  <p className="text-muted-foreground">
                    SmartLifeOS's AI companion has access to your goals, patterns, struggles, and wins. 
                    It understands your journey—making it feel like a personal mentor.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Built for Real People</h3>
                  </div>
                  <p className="text-muted-foreground">
                    This isn't enterprise software adapted for personal use. It's purpose-built for individuals 
                    who want to achieve meaningful things without drowning in complexity.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Privacy & Ownership</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Your data is yours. We don't sell it. We don't mine it. We protect it with industry-standard security.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Technology Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="h-6 w-6 text-primary" />
                <h2 className="text-3xl font-bold">Built with Modern Technology</h2>
              </div>
              
              <p className="text-lg text-muted-foreground">
                SmartLifeOS is a Progressive Web App built on a professional-grade stack:
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span><strong>Frontend:</strong> Next.js 15 with TypeScript</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span><strong>Backend:</strong> Firebase & Cloud Functions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span><strong>AI:</strong> Advanced models via OpenRouter</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span><strong>Architecture:</strong> Serverless-first design</span>
                </div>
              </div>

              <p className="text-muted-foreground">
                Every technology choice was deliberate—focused on creating a fast, secure, and maintainable platform that can grow with you.
              </p>
            </div>
          </Card>

          {/* Vision Section */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
                <h2 className="text-3xl font-bold">Where We're Heading</h2>
              </div>

              <p className="text-lg font-medium">
                SmartLifeOS is still evolving. The current version solves the core problem: bringing your life data together in one accessible place. 
                But the vision goes further.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Deep Data Interconnection</h4>
                    <p className="text-muted-foreground text-sm">
                      Tasks automatically linked to goals, finances tied to project timelines, insights drawn from patterns across all your data.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Proactive Intelligence</h4>
                    <p className="text-muted-foreground text-sm">
                      An AI that doesn't just respond but anticipates—noticing patterns, suggesting optimizations, and helping you course-correct.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Community Features</h4>
                    <p className="text-muted-foreground text-sm">
                      Anonymous insights from collective patterns—what works for people with similar goals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <p className="text-lg font-medium text-primary">
                  The goal isn't to replace your brain—it's to augment it. To give you a second mind that remembers everything, 
                  connects the dots, and helps you become the person you want to be.
                </p>
              </div>
            </div>
          </Card>

          {/* Call to Action */}
          <Card className="p-8 text-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Ready to Organize Your Life?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Whether you're a student managing academics and ambitions, a professional balancing work and personal growth, 
                or anyone who wants to live more deliberately, SmartLifeOS is built for you.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push('/dashboard')} size="lg" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard')} size="lg">
                  Explore Features
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}