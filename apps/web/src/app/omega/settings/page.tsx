'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';
import { useSession } from '~/lib/auth-client';
import { parseEnvString } from '~/lib/utils/env-parser';

interface EnvVar {
  id: string;
  keyName: string;
  keyHint: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Omega Settings Page
 * Manage API keys and environment variables for tool execution
 */
export default function OmegaSettingsPage(): React.ReactElement {
  const { data: session, isPending: isSessionLoading } = useSession();
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New env var form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  // Paste .env modal state
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');

  const isAuthenticated = !!session?.user;

  // Fetch env vars
  const fetchEnvVars = useCallback(async () => {
    try {
      const response = await fetch('/api/omega/settings/env-vars');
      if (!response.ok) {
        if (response.status === 401) {
          setEnvVars([]);
          return;
        }
        throw new Error('Failed to fetch env vars');
      }
      const data = await response.json();
      setEnvVars(data.data || []);
    } catch (err) {
      console.error('Failed to fetch env vars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch env vars');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEnvVars();
    } else if (!isSessionLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, isSessionLoading, fetchEnvVars]);

  // Add new env var
  const handleAddEnvVar = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/omega/settings/env-vars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyName: newKeyName.trim().toUpperCase(),
          keyValue: newKeyValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save env var');
      }

      setNewKeyName('');
      setNewKeyValue('');
      setSuccess(`Added ${newKeyName.trim().toUpperCase()}`);
      await fetchEnvVars();
    } catch (err) {
      console.error('Failed to add env var:', err);
      setError(err instanceof Error ? err.message : 'Failed to add env var');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete env var
  const handleDeleteEnvVar = async (keyName: string) => {
    if (!confirm(`Delete ${keyName}?`)) return;

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/omega/settings/env-vars/${encodeURIComponent(keyName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete env var');
      }

      setSuccess(`Deleted ${keyName}`);
      await fetchEnvVars();
    } catch (err) {
      console.error('Failed to delete env var:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete env var');
    }
  };

  // Parse pasted content preview
  const parsedPreview = useMemo(() => {
    if (!pasteContent.trim()) return [];
    return parseEnvString(pasteContent);
  }, [pasteContent]);

  // Handle pasting .env content
  const handlePasteEnv = async () => {
    const parsed = parseEnvString(pasteContent);
    if (parsed.length === 0) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Add each env var
      for (const { key, value } of parsed) {
        const response = await fetch('/api/omega/settings/env-vars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyName: key, keyValue: value }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to save ${key}`);
        }
      }

      setPasteContent('');
      setShowPasteModal(false);
      setSuccess(`Added ${parsed.length} variable${parsed.length !== 1 ? 's' : ''}`);
      await fetchEnvVars();
    } catch (err) {
      console.error('Failed to import env vars:', err);
      setError(err instanceof Error ? err.message : 'Failed to import env vars');
    } finally {
      setIsSaving(false);
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Icon icon="loader" size="lg" className="animate-spin text-foreground-secondary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Icon icon="key" size="lg" className="mx-auto text-foreground-secondary mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Sign In Required</h2>
            <p className="text-foreground-secondary mb-4">
              Please sign in to manage your Omega settings.
            </p>
            <Link href="/sign-in?returnTo=/omega/settings">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/omega"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <Icon icon="arrowLeft" size="sm" className="text-foreground-secondary" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Omega Settings</h1>
              <p className="text-foreground-secondary">Configure API keys for tool execution</p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center gap-2 text-success">
                <Icon icon="check" size="sm" />
                <span>{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/30">
              <div className="flex items-center gap-2 text-error">
                <Icon icon="alertCircle" size="sm" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* API Keys Section */}
          <div className="bg-surface border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  API Keys & Environment Variables
                </h2>
                <p className="text-sm text-foreground-tertiary mt-1">
                  Store API keys that tools need to execute. These are encrypted and only used
                  during tool execution.
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPasteModal(!showPasteModal)}
                disabled={isSaving}
              >
                <Icon icon="copy" size="xs" className="mr-1" />
                Paste .env
              </Button>
            </div>

            {/* Paste .env modal */}
            {showPasteModal && (
              <div className="mb-6 p-4 bg-surface-secondary rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Paste .env snippet</span>
                  <Button size="sm" variant="ghost" onClick={() => setShowPasteModal(false)}>
                    <Icon icon="x" size="xs" />
                  </Button>
                </div>
                <Textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={`# Paste your .env content here\nOPENAI_API_KEY=sk-...\nANTHROPIC_API_KEY=sk-ant-...\n`}
                  className="h-32 text-xs font-mono"
                  resize="none"
                  disabled={isSaving}
                />
                {parsedPreview.length > 0 && (
                  <div className="mt-2 text-xs text-foreground-secondary">
                    <span className="font-medium">Preview:</span> {parsedPreview.length} variable
                    {parsedPreview.length !== 1 ? 's' : ''} found
                    <span className="text-foreground-tertiary ml-1">
                      ({parsedPreview.map((e) => e.key).join(', ')})
                    </span>
                  </div>
                )}
                <div className="flex justify-end mt-3">
                  <Button
                    size="sm"
                    onClick={handlePasteEnv}
                    disabled={parsedPreview.length === 0 || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Icon icon="loader" size="xs" className="mr-1 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Icon icon="plus" size="xs" className="mr-1" />
                        Add {parsedPreview.length} Variable{parsedPreview.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Existing env vars */}
            {envVars.length > 0 && (
              <div className="mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider py-2">
                        Key Name
                      </th>
                      <th className="text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider py-2">
                        Hint
                      </th>
                      <th className="text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider py-2">
                        Added
                      </th>
                      <th className="text-right text-xs font-medium text-foreground-tertiary uppercase tracking-wider py-2">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {envVars.map((envVar) => (
                      <tr key={envVar.id} className="group">
                        <td className="py-3">
                          <code className="text-sm font-mono text-foreground">
                            {envVar.keyName}
                          </code>
                        </td>
                        <td className="py-3">
                          <span className="text-sm text-foreground-secondary font-mono">
                            ****{envVar.keyHint || '****'}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="text-sm text-foreground-tertiary">
                            {new Date(envVar.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEnvVar(envVar.keyName)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icon icon="trash" size="xs" className="text-error" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty state */}
            {envVars.length === 0 && (
              <div className="mb-6 p-6 rounded-lg border border-dashed border-border text-center">
                <Icon icon="key" size="lg" className="mx-auto text-foreground-tertiary mb-3" />
                <p className="text-foreground-secondary">No API keys configured yet</p>
                <p className="text-sm text-foreground-tertiary mt-1">
                  Add API keys that tools need for execution
                </p>
              </div>
            )}

            {/* Add new env var form */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value.toUpperCase())}
                placeholder="KEY_NAME"
                size="sm"
                className="flex-1 font-mono"
                disabled={isSaving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newKeyName.trim() && newKeyValue.trim()) {
                    handleAddEnvVar();
                  }
                }}
              />
              <Input
                type="password"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder="Value"
                size="sm"
                className="flex-1"
                disabled={isSaving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newKeyName.trim() && newKeyValue.trim()) {
                    handleAddEnvVar();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleAddEnvVar}
                disabled={!newKeyName.trim() || !newKeyValue.trim() || isSaving}
              >
                {isSaving ? (
                  <Icon icon="loader" size="xs" className="animate-spin" />
                ) : (
                  <>
                    <Icon icon="plus" size="xs" className="mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Common API Keys Section */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Common API Keys</h2>
            <p className="text-sm text-foreground-tertiary mb-4">
              Here are some common API keys that tools might need:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                <code className="text-xs font-mono text-foreground flex-1">OPENAI_API_KEY</code>
                <span className="text-xs text-foreground-tertiary">OpenAI API tools</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                <code className="text-xs font-mono text-foreground flex-1">ANTHROPIC_API_KEY</code>
                <span className="text-xs text-foreground-tertiary">Anthropic Claude tools</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                <code className="text-xs font-mono text-foreground flex-1">SERPAPI_API_KEY</code>
                <span className="text-xs text-foreground-tertiary">Search tools</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary">
                <code className="text-xs font-mono text-foreground flex-1">HLLM_API_KEY</code>
                <span className="text-xs text-foreground-tertiary">HLLM tools</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
