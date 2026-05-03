import { Chrome } from 'lucide-react';
import { Button } from '../ui/Button';

interface GoogleAuthButtonProps {
  disabled: boolean;
  onClick: () => void | Promise<void>;
}

export function GoogleAuthButton({ disabled, onClick }: GoogleAuthButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full"
      aria-label="Continue with Google"
    >
      <Chrome size={16} className="mr-2" />
      Continue with Google
    </Button>
  );
}
