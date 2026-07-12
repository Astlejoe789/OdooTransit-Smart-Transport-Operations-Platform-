import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { askFleetAssistant } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/assistant")({
  component: AssistantPage,
});

interface Turn {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Which vehicles are available right now?",
  "What did we spend on fuel recently?",
  "Are any driver licenses expiring soon?",
  "Summarize the status of all active trips.",
];

function AssistantPage() {
  const ask = useServerFn(askFleetAssistant);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);

  const mutation = useMutation({
    mutationFn: (q: string) => ask({ data: { question: q } }),
    onSuccess: (res) => setTurns((t) => [...t, { role: "assistant", text: res.answer }]),
    onError: (err) => toast.error(err instanceof Error ? err.message : "The assistant failed."),
  });

  function submit(q: string) {
    const text = q.trim();
    if (!text || mutation.isPending) return;
    setTurns((t) => [...t, { role: "user", text }]);
    setQuestion("");
    mutation.mutate(text);
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col space-y-6">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Sparkles className="h-5.5 w-5.5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">Fleet Copilot</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions about your fleet in plain language. Answers use your live data.
          </p>
        </div>
      </header>

      {turns.length === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => submit(s)}
              className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-4">
        {turns.map((turn, i) => (
          <div key={i} className={`flex gap-3 ${turn.role === "user" ? "justify-end" : ""}`}>
            {turn.role === "assistant" && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
            )}
            <Card className={turn.role === "user" ? "bg-primary/10" : ""}>
              <CardContent className="p-3.5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{turn.text}</p>
              </CardContent>
            </Card>
            {turn.role === "user" && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <UserIcon className="h-4 w-4" />
              </span>
            )}
          </div>
        ))}
        {mutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(question);
        }}
        className="sticky bottom-0 flex gap-2 bg-background/80 py-2 backdrop-blur"
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about vehicles, trips, fuel, expenses…"
          maxLength={500}
        />
        <Button type="submit" disabled={mutation.isPending || !question.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
