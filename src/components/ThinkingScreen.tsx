"use client";

import { useEffect, useState } from "react";

interface Props {
  steps: string[];
}

export function ThinkingScreen({ steps }: Props) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setI((prev) => Math.min(prev + 1, steps.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [steps]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse-dot" />
        <span
          className="h-2 w-2 rounded-full bg-violet-500 animate-pulse-dot"
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className="h-2 w-2 rounded-full bg-violet-500 animate-pulse-dot"
          style={{ animationDelay: "0.3s" }}
        />
      </div>
      <p className="mt-4 text-slate-600 text-sm font-medium animate-fade-in-up" key={i}>
        {steps[i]}
      </p>
    </div>
  );
}
