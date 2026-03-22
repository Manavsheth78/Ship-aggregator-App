import { useState, forwardRef, Children, isValidElement } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = forwardRef(({ tabs, defaultValue, onValueChange, children, ...props }, ref) => {
  const [activeTab, setActiveTab] = useState(defaultValue || tabs[0].value);

  const handleTabChange = (value) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <div ref={ref} {...props}>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'border-b-2 border-[#1B5E20] text-[#1B5E20]'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {Children.map(children, (child) => {
          if (isValidElement(child) && child.props.value === activeTab) return child;
          return null;
        })}
      </div>
    </div>
  );
});
Tabs.displayName = 'Tabs';

export const TabsContent = forwardRef(({ value, ...props }, ref) => (
  <div ref={ref} {...props} />
));
TabsContent.displayName = 'TabsContent';
