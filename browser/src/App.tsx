import { useState } from 'react';
import { Navbar } from './renderer/components/NavBar';
import { TabBar } from './renderer/components/TabBar';
import './App.css';

function App() {
  const [tabs, setTabs] = useState([
    { id: 1, title: 'https://example.com' },
  ]);
  const [currentTabId, setCurrentTabId] = useState(1);

  const handleNavigate = (url: string) => {
    console.log("Navigate to:", url);
    setTabs(tabs.map(tab => tab.id === currentTabId ? { ...tab, title: url } : tab));
  };

  const handleBack = () => console.log("Go Back");
  const handleForward = () => console.log("Go Forward");
  const handleReload = () => console.log("Reload");

  const handleNewTab = () => {
    const newId = tabs.length ? Math.max(...tabs.map(t => t.id)) + 1 : 1;
    const newTab = { id: newId, title: 'about:blank' };
    setTabs([...tabs, newTab]);
    setCurrentTabId(newId);
  };

  const handleCloseTab = (id: number) => {
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (currentTabId === id && newTabs.length) {
      setCurrentTabId(newTabs[newTabs.length - 1].id);
    } else if (newTabs.length === 0) {
      handleNewTab();
    }
  };

  const handleSwitchTab = (id: number) => {
    setCurrentTabId(id);
  };

  const currentURL = tabs.find(t => t.id === currentTabId)?.title || '';

  return (
    <div className="w-full h-screen flex flex-col">
      <Navbar
        currentURL={currentURL}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
      />
      <TabBar
        tabs={tabs}
        currentTabId={currentTabId}
        onSwitchTab={handleSwitchTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />
      <div className="flex-1 bg-white">
        {/* WebContentsView content will be rendered here by the main process */}
      </div>
    </div>
  );
}

export default App;
