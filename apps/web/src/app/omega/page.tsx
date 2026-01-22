'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface SamplePrompt {
  title: string;
  description: string;
  prompt: string;
  icon: 'globe' | 'search' | 'terminal' | 'box' | 'star' | 'folder';
}

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    title: 'Web Scraping',
    description: 'Extract content from any website',
    prompt: 'Scrape https://news.ycombinator.com and summarize the top 5 stories',
    icon: 'globe',
  },
  {
    title: 'Search & Research',
    description: 'Search the web for information',
    prompt: 'Search for the latest news about AI agents and summarize the key developments',
    icon: 'search',
  },
  {
    title: 'Code Generation',
    description: 'Generate code for various tasks',
    prompt: 'Find a tool that can generate QR codes and create one for https://tpmjs.com',
    icon: 'terminal',
  },
  {
    title: 'Image Processing',
    description: 'Work with images and files',
    prompt: 'Find image processing tools and tell me what they can do',
    icon: 'box',
  },
  {
    title: 'Data Analysis',
    description: 'Analyze and transform data',
    prompt: 'Search for data processing tools that can help me analyze JSON data',
    icon: 'folder',
  },
  {
    title: 'Creative Tasks',
    description: 'Generate content and ideas',
    prompt: 'Find a blog post creation tool and write a short post about the future of AI',
    icon: 'star',
  },
];

/**
 * Omega Landing Page
 * Shows sample prompts and starts new conversations
 */
export default function OmegaLandingPage(): React.ReactElement {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConversation = useCallback(
    async (initialPrompt?: string) => {
      setIsCreating(true);
      setError(null);

      try {
        const response = await fetch('/api/omega/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create conversation');
        }

        const data = await response.json();
        const conversationId = data.data.id;

        // Navigate to chat, optionally with initial prompt
        if (initialPrompt) {
          sessionStorage.setItem(`omega_prompt_${conversationId}`, initialPrompt);
        }
        router.push(`/omega/${conversationId}`);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to create conversation');
        setIsCreating(false);
      }
    },
    [router]
  );

  // Check for auth on mount
  useEffect(() => {
    // Pre-warm the API by checking auth status
    fetch('/api/auth/session').catch(() => {
      // Silently fail - we'll handle auth errors when creating conversation
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-6">
              <Icon icon="star" size="lg" className="text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Meet Omega</h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              An AI assistant with access to over 1 million tools. Just describe what you need, and
              Omega will find and use the right tools to help you.
            </p>
          </div>

          {/* Start New Conversation */}
          <div className="flex justify-center mb-12">
            <Button
              size="lg"
              onClick={() => createConversation()}
              disabled={isCreating}
              className="px-8"
            >
              {isCreating ? (
                <>
                  <Icon icon="loader" size="sm" className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Icon icon="plus" size="sm" className="mr-2" />
                  Start New Conversation
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center mb-8">
              <p className="text-sm text-error">{error}</p>
              <p className="text-xs text-foreground-tertiary mt-1">
                Make sure you&apos;re signed in to use Omega
              </p>
            </div>
          )}

          {/* Sample Prompts */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-foreground-tertiary text-center mb-6">
              Or try one of these examples
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.title}
                  type="button"
                  onClick={() => createConversation(prompt.prompt)}
                  disabled={isCreating}
                  className="p-4 bg-surface border border-border rounded-lg hover:border-foreground/20 hover:bg-surface-secondary/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                      <Icon icon={prompt.icon} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground mb-1">{prompt.title}</h3>
                      <p className="text-sm text-foreground-secondary line-clamp-2">
                        {prompt.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 pt-8 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-4">
                  <Icon icon="search" size="sm" className="text-success" />
                </div>
                <h3 className="font-medium text-foreground mb-2">Dynamic Discovery</h3>
                <p className="text-sm text-foreground-secondary">
                  Omega searches the entire TPMJS registry to find the perfect tools for your task
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-info/10 mb-4">
                  <Icon icon="box" size="sm" className="text-info" />
                </div>
                <h3 className="font-medium text-foreground mb-2">Sandboxed Execution</h3>
                <p className="text-sm text-foreground-secondary">
                  All tools run in a secure sandbox environment for safe execution
                </p>
              </div>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-warning/10 mb-4">
                  <Icon icon="star" size="sm" className="text-warning" />
                </div>
                <h3 className="font-medium text-foreground mb-2">Intelligent Synthesis</h3>
                <p className="text-sm text-foreground-secondary">
                  Results are combined and presented in a clear, helpful response
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
