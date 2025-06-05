import { Button } from "@/components/ui/button";

interface Tab {
  id: number;
  title: string;
  isIncognito?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  currentTabId: number;
  onSwitchTab: (id: number) => void;
  onCloseTab: (id: number) => void;
  onNewTab: () => void;
}

export const TabBar = ({
  tabs,
  currentTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
}: TabBarProps) => {
  return (
    <div className="flex items-center bg-gray-100 px-2 space-x-1 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center px-3 py-1 rounded-t ${
            tab.id === currentTabId ? "bg-white border-t border-l border-r" : ""
          }`}
        >
          <span
            className="mr-2 text-sm cursor-pointer"
            onClick={() => onSwitchTab(tab.id)}
          >
            {tab.isIncognito ? "🕵️ " : ""}
            {tab.title || "New Tab"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => onCloseTab(tab.id)}
          >
            ×
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="ml-2" onClick={onNewTab}>
        +
      </Button>
    </div>
  );
};
