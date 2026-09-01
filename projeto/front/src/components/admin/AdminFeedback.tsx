import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminFeedbackMessage = {
  kind: "error" | "success";
  title: string;
  message: string;
};

type AdminFeedbackProps = {
  feedback: AdminFeedbackMessage;
  onDismiss: () => void;
};

export function AdminFeedback({ feedback, onDismiss }: AdminFeedbackProps) {
  const isError = feedback.kind === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-sm animate-in fade-in slide-in-from-top-2",
        isError
          ? "border-rose-200 bg-rose-50 text-rose-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isError ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{feedback.title}</p>
        <p className={cn("mt-0.5 text-sm", isError ? "text-rose-700" : "text-emerald-700")}>
          {feedback.message}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Fechar mensagem"
        onClick={onDismiss}
        className={cn(
          "-mr-2 -mt-1 h-8 w-8 shrink-0",
          isError ? "hover:bg-rose-100" : "hover:bg-emerald-100",
        )}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
