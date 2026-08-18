import { Check, Download, Moon, Sun, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type SettingsPanelProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onExportCsv: () => void;
  exportDisabled: boolean;
  isSaving: boolean;
  hasOfficialData: boolean;
};

export default function SettingsPanel({
  theme,
  onToggleTheme,
  onExportCsv,
  exportDisabled,
  isSaving,
  hasOfficialData,
}: SettingsPanelProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-slate-500" />
          <CardTitle className="text-lg">Settings & tools</CardTitle>
        </div>
        <CardDescription>
          Personalize the tracker and export the currently selected fund’s official history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={exportDisabled}
              aria-label="Export selected fund history to CSV"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500" role="status" aria-live="polite">
            {isSaving ? <span className="animate-pulse">Saving preference…</span> : <Check className="h-3.5 w-3.5 text-emerald-600" />}
            {hasOfficialData ? 'Official TSP baseline loaded' : 'Waiting for official TSP baseline'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
