import * as React from 'react';
import { 
  TabList, 
  Tab, 
  makeStyles,
  tokens 
} from '@fluentui/react-components';

export interface FluentTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    disabled?: boolean;
  }>;
}

const useStyles = makeStyles({
  tabList: {
    marginBottom: tokens.spacingVerticalL
  },
  tab: {
    fontWeight: tokens.fontWeightSemibold,
    minWidth: '120px'
  }
});

export const FluentTabs: React.FC<FluentTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  tabs 
}) => {
  const styles = useStyles();

  return (
    <TabList 
      selectedValue={activeTab}
      onTabSelect={(_, data) => onTabChange(data.value as string)}
      className={styles.tabList}
    >
      {tabs.map((tab) => (
        <Tab 
          key={tab.id}
          value={tab.id}
          disabled={tab.disabled || false}
          className={styles.tab}
        >
          {tab.label}
        </Tab>
      ))}
    </TabList>
  );
};
