
import React from 'react';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | null>(null);

export const Tabs: React.FC<{ value: string; onValueChange: (value: string) => void; children: React.ReactNode }> = ({ value, onValueChange, children }) => {
  return <TabsContext.Provider value={{ value, onValueChange }}>{children}</TabsContext.Provider>;
};

export const TabsList: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  return <div className={`bg-zinc-900 rounded-xl mb-2 shadow flex gap-2 p-2 border border-zinc-800 ${className}`}>{children}</div>;
};

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within a Tabs component');
  
  const isActive = context.value === value;

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${isActive ? 'bg-fuchsia-700 text-white shadow' : 'text-zinc-300 hover:bg-zinc-800/60'}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within a Tabs component');

  return context.value === value ? <div className="fade-in">{children}</div> : null;
};
