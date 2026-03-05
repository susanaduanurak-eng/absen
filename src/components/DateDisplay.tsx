import React, { useState, useEffect } from 'react';

const DateDisplay = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000); // Update every minute is enough for date
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">
      {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
    </p>
  );
};

export default DateDisplay;
