import type { AgentStatus } from "@/types";

const STATUS_COLOR: Record<AgentStatus, string> = {
  online: "bg-green-500",
  warning: "bg-yellow-500",
  offline: "bg-slate-400",
};

const STATUS_TEXT: Record<AgentStatus, string> = {
  online: "Online",
  warning: "Aviso",
  offline: "Offline",
};

interface AgentStatusBadgeProps {
  status: AgentStatus;
  size?: "sm" | "md";
}

export function AgentStatusBadge({ status, size = "sm" }: AgentStatusBadgeProps) {
  return (
    <div className="mt-1 flex items-center">
      <span
        className={`${size === "md" ? "h-2.5 w-2.5" : "h-2 w-2"} mr-2 rounded-full ${STATUS_COLOR[status]}`}
      />
      <span className={`${size === "md" ? "text-sm" : "text-xs"} font-medium text-slate-500`}>
        {STATUS_TEXT[status]}
      </span>
    </div>
  );
}
