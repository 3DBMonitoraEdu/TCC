import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Monitor,
  Cpu,
  HardDrive,
  Database,
  Plus,
  ArrowLeft,
  ChevronRight,
  Trash2,
  LogOut,
  Clock,
  RefreshCw,
  Lock,
  Unlock,
  Keyboard,
  MousePointer,
  MonitorOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { getRooms, createRoom, deleteRoom, getRoomAgents } from "@/api/rooms.ts";
import { Room, Agent, getAgentStatus } from "@/types/index.ts";
import { api } from "@/api/client.js";

const STATUS_COLOR = {
  online: "bg-green-500",
  warning: "bg-yellow-500",
  offline: "bg-slate-400",
};

const STATUS_TEXT = {
  online: "Online",
  warning: "Aviso",
  offline: "Offline",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, teacher } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);

  const handleSendCommand = async (agentUuid: string, command: string) => {
    console.log(`Enviando comando "${command}" para o PC com UUID:`, agentUuid);
    setExecutingCommand(command);
    try {
      await api.post("/command/createcommand", { agent_uuid: agentUuid, command: command });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecutingCommand(null);
    }
  };

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [addingRoom, setAddingRoom] = useState(false);

  // Carrega salas do professor
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRooms();
      console.log(data);
      setRooms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega agentes da sala selecionada
  const fetchAgents = useCallback(async (roomId: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getRoomAgents(roomId);
      setAgents(data.agents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms, addingRoom]);

  // Polling: atualiza agentes a cada 30s quando uma sala está selecionada
  useEffect(() => {
    if (!selectedRoom) return;
    fetchAgents(selectedRoom.id);

    const interval = setInterval(() => fetchAgents(selectedRoom.id), 30_000);
    return () => clearInterval(interval);
  }, [selectedRoom, fetchAgents]);

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    setAddingRoom(true);
    try {
      const room = await createRoom(newRoomName.trim());
      setRooms((prev) => [room, ...prev]);
      setNewRoomName("");
      setIsAddRoomOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await deleteRoom(roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        setAgents([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleBack = () => {
    if (selectedAgent) {
      setSelectedAgent(null);
    } else if (selectedRoom) {
      setSelectedRoom(null);
      setAgents([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {(selectedRoom || selectedAgent) && (
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {selectedAgent
                  ? selectedAgent.hostname
                  : selectedRoom
                    ? selectedRoom.name
                    : "Gerenciamento de Salas"}
              </h1>
              <p className="text-slate-600 mt-1">
                {selectedAgent
                  ? "Detalhes do computador"
                  : selectedRoom
                    ? "Computadores na sala"
                    : `Bem-vindo, ${teacher?.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!selectedRoom && !selectedAgent && (
              <Button
                onClick={() => setIsAddRoomOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Sala
              </Button>
            )}
            {selectedRoom && !selectedAgent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAgents(selectedRoom.id)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </header>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Lista de salas */}
        {!selectedRoom && !selectedAgent && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <p className="col-span-full text-center text-slate-500 py-12">Carregando salas...</p>
            )}
            {!loading && rooms.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
                Nenhuma sala criada ainda.
              </div>
            )}
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative"
                onClick={() => setSelectedRoom(room)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 z-10"
                  onClick={(e) => handleDeleteRoom(room.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-10">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    {room.name}
                  </CardTitle>
                  <Monitor className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-400 font-mono mt-1">Código: {room.join_code}</p>
                  <div className="flex items-center mt-4 text-blue-600 text-sm font-medium">
                    Ver computadores <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lista de agentes da sala */}
        {selectedRoom && !selectedAgent && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">
                Computadores em {selectedRoom.name}
              </h2>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRoom(selectedRoom.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remover Sala
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && (
                <p className="col-span-full text-center text-slate-500 py-12">
                  Carregando computadores...
                </p>
              )}
              {!loading && agents.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
                  Nenhum computador registrado nesta sala.
                </div>
              )}
              {agents.map((agent) => {
                const status = getAgentStatus(agent);
                return (
                  <Card
                    key={agent.id}
                    className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Monitor className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-slate-900">
                            {agent.hostname}
                          </CardTitle>
                          <div className="flex items-center mt-1">
                            <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[status]} mr-2`} />
                            <span className="text-xs font-medium text-slate-500">
                              {STATUS_TEXT[status]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="flex items-center">
                            <Cpu className="h-3 w-3 mr-1" /> CPU
                          </span>
                          <span>{agent.cpu_percent?.toFixed(1) ?? "—"}%</span>
                        </div>
                        <Progress value={agent.cpu_percent ?? 0} className="h-1.5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="flex items-center">
                            <Database className="h-3 w-3 mr-1" /> RAM
                          </span>
                          <span>{agent.mem_percent?.toFixed(1) ?? "—"}%</span>
                        </div>
                        <Progress value={agent.mem_percent ?? 0} className="h-1.5" />
                      </div>
                      <div className="flex items-center text-blue-600 text-sm font-medium pt-2 border-t border-slate-100">
                        Ver detalhes <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Detalhe do agente */}
        {selectedAgent &&
          (() => {
            const status = getAgentStatus(selectedAgent);
            const processes = selectedAgent.processes ?? [];
            return (
              <Card className="border-slate-200 shadow-sm max-w-3xl mx-auto">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Monitor className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        {selectedAgent.hostname}
                      </CardTitle>
                      <div className="flex items-center mt-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLOR[status]} mr-2`} />
                        <span className="text-sm font-medium text-slate-600">
                          {STATUS_TEXT[status]}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: "CPU", icon: Cpu, value: selectedAgent.cpu_percent },
                      { label: "RAM", icon: Database, value: selectedAgent.mem_percent },
                      { label: "Disco", icon: HardDrive, value: selectedAgent.disk_percent },
                    ].map(({ label, icon: Icon, value }) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-600">
                            <Icon className="h-4 w-4 mr-2" />
                            <span>{label}</span>
                          </div>
                          <span className="font-medium text-slate-900">
                            {value?.toFixed(1) ?? "—"}%
                          </span>
                        </div>
                        <Progress value={value ?? 0} className="h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                      <Monitor className="h-4 w-4 mr-2 text-blue-600" />
                      Processos em execução ({processes.length})
                    </h3>
                    {processes.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">Nenhum processo disponível.</p>
                    ) : (
                      <ul className="space-y-1 max-h-64 overflow-y-auto">
                        {processes.map((proc: any, index: number) => (
                          <li
                            key={index}
                            className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100"
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              {proc.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {proc.mem_mb?.toFixed(1)} MB
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1 pt-2">
                    <Clock className="h-3 w-3" />
                    Última atualização:{" "}
                    {selectedAgent.collected_at
                      ? new Date(selectedAgent.collected_at).toLocaleString("pt-BR")
                      : "nunca"}
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-blue-600" />
                      Ações de Controle
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Teclado */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Keyboard className="h-3.5 w-3.5" /> Teclado
                        </span>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 text-xs"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSendCommand(selectedAgent.agent_uuid, "block_keyboard")}
                            disabled={executingCommand !== null}
                          >
                            {executingCommand === "block_keyboard" ? "Bloqueando..." : "Bloquear"}
                          </Button>
                          <Button
                            className="flex-1 text-xs"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendCommand(selectedAgent.agent_uuid, "unblock_keyboard")}
                            disabled={executingCommand !== null}
                          >
                            <Unlock className="mr-1 h-3 w-3" />
                            {executingCommand === "unblock_keyboard" ? "Desbloqueando..." : "Desbloquear"}
                          </Button>
                        </div>
                      </div>

                      {/* Mouse */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <MousePointer className="h-3.5 w-3.5" /> Mouse
                        </span>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 text-xs"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSendCommand(selectedAgent.agent_uuid, "block_mouse")}
                            disabled={executingCommand !== null}
                          >
                            {executingCommand === "block_mouse" ? "Bloqueando..." : "Bloquear"}
                          </Button>
                          <Button
                            className="flex-1 text-xs"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendCommand(selectedAgent.agent_uuid, "unblock_mouse")}
                            disabled={executingCommand !== null}
                          >
                            <Unlock className="mr-1 h-3 w-3" />
                            {executingCommand === "unblock_mouse" ? "Desbloqueando..." : "Desbloquear"}
                          </Button>
                        </div>
                      </div>

                      {/* Monitor / Tela */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2 sm:col-span-2">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <MonitorOff className="h-3.5 w-3.5" /> Monitor / Tela
                        </span>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 text-xs"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleSendCommand(selectedAgent.agent_uuid, "block_monitor")}
                            disabled={executingCommand !== null}
                          >
                            {executingCommand === "block_monitor" ? "Desativando..." : "Apagar Tela"}
                          </Button>
                          <Button
                            className="flex-1 text-xs"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendCommand(selectedAgent.agent_uuid, "unblock_monitor")}
                            disabled={executingCommand !== null}
                          >
                            <Unlock className="mr-1 h-3 w-3" />
                            {executingCommand === "unblock_monitor" ? "Reativando..." : "Ligar Tela"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
      </div>

      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Sala</DialogTitle>
            <DialogDescription>
              Insira o nome da nova sala. O código de pareamento será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: Laboratório de Informática 02"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddRoom()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddRoomOpen(false);
                setNewRoomName("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddRoom} disabled={!newRoomName.trim() || addingRoom}>
              {addingRoom ? "Criando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
