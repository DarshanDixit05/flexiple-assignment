"use client";

import { useEffect, useRef } from "react";
import type { ChatTurn } from "@/lib/types";

interface Props {
  chat: ChatTurn[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  disabled: boolean;
}

export function ChatPanel({ chat, draft, onDraftChange, onSend, loading, disabled }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900">Refine</p>
        <p className="text-xs text-slate-400">
          Tell us what&apos;s wrong or right — &quot;1 is too junior, 2 and 4 are right&quot;
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-72 min-h-[6rem]">
        {chat.length === 0 && !loading && (
          <p className="text-sm text-slate-400 italic">
            No feedback yet. React to the results above whenever you&apos;re ready.
          </p>
        )}
        {chat.map((turn, i) => (
          <div
            key={i}
            className={`flex ${turn.role === "recruiter" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                turn.role === "recruiter"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {turn.message}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-slate-100 text-slate-400 italic">
              Updating filters and rubric…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-100 p-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (draft.trim() && !disabled) onSend();
            }
          }}
          placeholder="Type your feedback..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:bg-slate-50"
        />
        <button
          onClick={onSend}
          disabled={disabled || !draft.trim()}
          className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
