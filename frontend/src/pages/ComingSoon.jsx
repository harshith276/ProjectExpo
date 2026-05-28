import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function ComingSoon() {
  const location = useLocation();
  const formatPath = (path) => {
     const clean = path.replace('/', '').replace('-', ' ');
     return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
       <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700">
         <Construction className="w-12 h-12 text-yellow-500" />
       </div>
       <h1 className="text-4xl font-bold mb-4">{formatPath(location.pathname)}</h1>
       <p className="text-slate-400 text-lg mb-2">🚧 Under Construction</p>
       <p className="text-slate-500 max-w-md">Our engineers are working hard to integrate this module. Check back soon for the official release!</p>
    </div>
  );
}
