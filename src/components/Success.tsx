"use client";

import type { Result } from "@/types";

type SuccessProps = {
  result: Result;
  onNext: () => void;
};

export function Success({ result, onNext }: SuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="animate-scale-in text-center">
        <div className="text-success text-6xl mb-6">✓</div>
        
        <div className="text-4xl font-bold mb-2">
          {result.reactionMs}ms
        </div>
        
        <div className="text-muted-foreground text-sm mb-12">
          {result.reactionMs < 500 ? 'excellent' : 
           result.reactionMs < 1000 ? 'good' : 
           result.reactionMs < 2000 ? 'okay' : 'keep practicing'}
        </div>
        
        <button
          onClick={onNext}
          className="px-8 py-3 bg-accent text-accent-foreground font-medium 
                     hover:opacity-90 transition-opacity"
        >
          next
        </button>
        
        <div className="mt-4 text-xs text-muted-foreground">
          press any key to continue
        </div>
      </div>
    </div>
  );
}
