import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NavBarProps {
  currentURL: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
}

export function Navbar({ currentURL, onNavigate, onBack, onForward, onReload }: NavBarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <Button variant="ghost" size="icon" onClick={onBack}>←</Button>
      <Button variant="ghost" size="icon" onClick={onForward}>→</Button>
      <Button variant="ghost" size="icon" onClick={onReload}>↻</Button>
      <Input
        value={currentURL}
        onChange={(e) => onNavigate(e.target.value)}
        className="flex-1"
      />
    </div>
  );
}
