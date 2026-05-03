import { AppShellView } from './AppShellView';
import { useAppShellController } from '../../hooks/use-app-shell-controller';
import type { AppShellProps, Screen } from './types';

export type { AppShellProps, Screen };
export type { FilterType } from '../../utils/prompt-filters';
export { filterPrompts } from '../../utils/library-filtering';

export function AppShell(props: AppShellProps) {
  const controller = useAppShellController(props);
  return <AppShellView controller={controller} />;
}
