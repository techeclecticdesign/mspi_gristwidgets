"use client";

import { useState, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useRouter, usePathname } from 'next/navigation';

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const paths = ['/navigation/data', '/navigation/reports', '/navigation/administration'];
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
    router.push(paths[newValue]);
  };

  useEffect(() => {
    const currentTab = paths.indexOf(pathname);
    setActiveTab(currentTab !== -1 ? currentTab : 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-3/4 h-[40px] rounded-3xl m-auto mt-2 overflow-hidden text-white border border-emerald-500 shadow-xl">
        <Tabs
          value={activeTab}
          onChange={handleChange}
          variant="fullWidth"
          textColor="inherit"
          TabIndicatorProps={{
            children: <span className="MuiTabs-indicatorSpan" />,
          }}
          sx={{
            backgroundColor: '#059669',
            '& .MuiTab-root': {
              fontSize: '1.10rem',
              fontWeight: 'bold',
              textTransform: 'none',
              pt: '4px'
            },
            '& .MuiTab-root:not(:last-child)::after': {
              content: '""',
              display: 'block',
              width: '1px',
              height: '60%',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              position: 'absolute',
              right: 0,
              top: '20%',
            },
          }}
        >
          <Tab label="Data" />
          <Tab label="Reports" />
          <Tab label="Administration" />
        </Tabs>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}