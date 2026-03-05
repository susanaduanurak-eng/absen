import React, { useState, useEffect } from 'react';

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center md:items-end">
      <span className="text-4xl md:text-6xl font-black text-zinc-900 tracking-tighter tabular-nums">
        {time.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="text-blue-600 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
        Waktu Realtime
      </span>
    </div>
  );
};

export default DigitalClock;
