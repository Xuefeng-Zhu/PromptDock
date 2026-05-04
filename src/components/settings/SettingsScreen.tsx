import { useEffect, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  AboutSettingsCard,
  AccountSettingsCard,
  AppearanceSettingsCard,
  DefaultBehaviorSettingsCard,
  HotkeySettingsCard,
  ImportExportSettingsCard,
} from './SettingsCards';
import { SettingsNav } from './SettingsNav';
import { SettingsSkeleton } from './SettingsSkeleton';
import { useSettingsActions } from '../../hooks/use-settings-actions';
import { useSettingsScrollSpy } from '../../hooks/use-settings-scroll-spy';
import type { IAuthService } from '../../services/interfaces';
import type { SettingsSectionId } from './settings-data';

export interface SettingsScreenProps {
  onBack: () => void;
  authService?: IAuthService;
  loading?: boolean;
}

interface SettingsSectionProps {
  ariaLabel: string;
  children: ReactNode;
  domId: string;
  id: SettingsSectionId;
  setSectionRef: (id: SettingsSectionId) => (el: HTMLElement | null) => void;
}

function SettingsSection({
  ariaLabel,
  children,
  domId,
  id,
  setSectionRef,
}: SettingsSectionProps) {
  return (
    <section
      ref={setSectionRef(id)}
      id={domId}
      aria-label={ariaLabel}
      className="scroll-mt-6"
    >
      {children}
    </section>
  );
}

export function SettingsScreen({
  onBack,
  authService,
  loading = false,
}: SettingsScreenProps) {
  const {
    canUseGlobalHotkeys,
    canUsePasteAction,
    density,
    handleDefaultActionChange,
    handleHotkeyChange,
    handleThemeChange,
    hotkeyError,
    setDensity,
    settings,
    settingsError,
    visibleNavItems,
  } = useSettingsActions();

  const {
    activeSection,
    contentScrollRef,
    scrollToSection,
    setSectionRef,
  } = useSettingsScrollSpy(visibleNavItems, 'account-sync');

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="mr-1.5" />
          Back
        </Button>
        <h1 className="text-lg font-bold text-[var(--color-text-main)]">
          Settings
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SettingsNav
          activeSection={activeSection}
          items={visibleNavItems}
          onSelectSection={scrollToSection}
        />

        <div
          ref={contentScrollRef}
          className="min-h-0 flex-1 overflow-y-scroll p-6"
          data-testid="settings-scroll-pane"
        >
          {loading ? (
            <SettingsSkeleton />
          ) : (
            <div className="mx-auto max-w-2xl space-y-6">
              {settingsError && (
                <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <p className="text-xs text-red-600">{settingsError}</p>
                </div>
              )}

              <SettingsSection
                id="account-sync"
                domId="settings-account-sync"
                ariaLabel="Account and Sync settings"
                setSectionRef={setSectionRef}
              >
                <AccountSettingsCard authService={authService} />
              </SettingsSection>

              <SettingsSection
                id="appearance"
                domId="settings-appearance"
                ariaLabel="Appearance settings"
                setSectionRef={setSectionRef}
              >
                <AppearanceSettingsCard
                  theme={settings.theme}
                  onThemeChange={handleThemeChange}
                  density={density}
                  onDensityChange={setDensity}
                />
              </SettingsSection>

              {canUseGlobalHotkeys && (
                <SettingsSection
                  id="hotkey"
                  domId="settings-hotkey"
                  ariaLabel="Hotkey settings"
                  setSectionRef={setSectionRef}
                >
                  <HotkeySettingsCard
                    hotkey={settings.hotkeyCombo}
                    onHotkeyChange={handleHotkeyChange}
                    error={hotkeyError}
                  />
                </SettingsSection>
              )}

              <SettingsSection
                id="default-behavior"
                domId="settings-default-behavior"
                ariaLabel="Default behavior settings"
                setSectionRef={setSectionRef}
              >
                <DefaultBehaviorSettingsCard
                  canUsePasteAction={canUsePasteAction}
                  defaultAction={settings.defaultAction}
                  onDefaultActionChange={handleDefaultActionChange}
                />
              </SettingsSection>

              <SettingsSection
                id="import-export"
                domId="settings-import-export"
                ariaLabel="Import and export settings"
                setSectionRef={setSectionRef}
              >
                <ImportExportSettingsCard />
              </SettingsSection>

              <SettingsSection
                id="about"
                domId="settings-about"
                ariaLabel="About PromptDock"
                setSectionRef={setSectionRef}
              >
                <AboutSettingsCard />
              </SettingsSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
