import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Globe2, RefreshCw, Save, ShieldBan, ShieldCheck } from "lucide-react";

import {
  getAgentDnsPolicy,
  updateAgentDnsPolicy,
  type DnsMode,
} from "@/api/agents";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DnsPolicyEditorProps {
  agentUuid: string;
}

function domainsToText(domains: string[]) {
  return domains.join("\n");
}

function textToDomains(value: string) {
  return value
    .split(/[\n,]/)
    .map((domain) => domain.trim())
    .filter(Boolean);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function DnsPolicyEditor({ agentUuid }: DnsPolicyEditorProps) {
  const [mode, setMode] = useState<DnsMode>("blocklist");
  const [blockedDomains, setBlockedDomains] = useState("");
  const [allowedDomains, setAllowedDomains] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPolicy = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const policy = await getAgentDnsPolicy(agentUuid);
      setMode(policy.mode);
      setBlockedDomains(domainsToText(policy.blockedDomains));
      setAllowedDomains(domainsToText(policy.allowedDomains));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível carregar a política DNS."));
    } finally {
      setLoading(false);
    }
  }, [agentUuid]);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const policy = await updateAgentDnsPolicy(agentUuid, {
        mode,
        blockedDomains: textToDomains(blockedDomains),
        allowedDomains: textToDomains(allowedDomains),
      });

      setMode(policy.mode);
      setBlockedDomains(domainsToText(policy.blockedDomains));
      setAllowedDomains(domainsToText(policy.allowedDomains));
      setSuccess("Política DNS salva. Ela será aplicada na próxima sincronização do agente.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível salvar a política DNS."));
    } finally {
      setSaving(false);
    }
  };

  const modeDescription = mode === "blocklist"
    ? "Os domínios bloqueados e seus subdomínios não serão resolvidos."
    : "Somente os domínios permitidos e seus subdomínios serão resolvidos.";

  return (
    <section className="space-y-4 border-t border-slate-100 pt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center text-sm font-semibold text-slate-900">
            <Globe2 className="mr-2 h-4 w-4 text-blue-600" />
            Controle DNS
          </h3>
          <p className="mt-1 text-xs text-slate-500">{modeDescription}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void loadPolicy()} disabled={loading || saving}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm italic text-slate-500">Carregando política DNS...</p>
      ) : (
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor={`dns-mode-${agentUuid}`}>Modo de filtragem</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as DnsMode)} disabled={saving}>
              <SelectTrigger id={`dns-mode-${agentUuid}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blocklist">Bloquear domínios definidos</SelectItem>
                <SelectItem value="allowlist">Permitir apenas domínios definidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`blocked-domains-${agentUuid}`} className="flex items-center gap-1.5">
                <ShieldBan className="h-4 w-4 text-red-600" />
                Domínios bloqueados
              </Label>
              <Textarea
                id={`blocked-domains-${agentUuid}`}
                value={blockedDomains}
                onChange={(event) => setBlockedDomains(event.target.value)}
                placeholder={"youtube.com\nfacebook.com"}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`allowed-domains-${agentUuid}`} className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Domínios permitidos
              </Label>
              <Textarea
                id={`allowed-domains-${agentUuid}`}
                value={allowedDomains}
                onChange={(event) => setAllowedDomains(event.target.value)}
                placeholder={"wikipedia.org\nportal.educacao.gov.br"}
                disabled={saving}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">Use uma linha ou vírgula para cada domínio.</p>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {success && <p role="status" className="text-sm text-green-700">{success}</p>}

          <Button type="submit" disabled={saving}>
            <Save />
            {saving ? "Salvando..." : "Salvar política DNS"}
          </Button>
        </form>
      )}
    </section>
  );
}
