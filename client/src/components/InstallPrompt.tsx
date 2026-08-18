import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('tsp-install-dismissed') === 'true') {
      setDismissed(true);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!installEvent || dismissed) return null;

  const install = async () => {
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === 'accepted') setInstallEvent(null);
  };

  const dismiss = () => {
    localStorage.setItem('tsp-install-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950 shadow-lg dark:border-blue-800 dark:bg-blue-950 dark:text-blue-50" role="status">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Install TSP Fund Tracker</p>
          <p className="mt-1 text-xs opacity-80">Keep the dashboard available from your home screen with offline app-shell support.</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" size="sm" onClick={() => void install()}>Install</Button>
        <Button type="button" size="icon" variant="ghost" onClick={dismiss} aria-label="Dismiss install prompt">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
