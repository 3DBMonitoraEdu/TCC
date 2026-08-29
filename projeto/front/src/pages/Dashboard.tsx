import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getAgentProcesses, sendAgentCommand } from "@/api/agents";
import { createRoom, deleteRoom, getRoomAgents, getRooms } from "@/api/rooms";
import { AgentDetails } from "@/components/dashboard/AgentDetails";
import { AgentList } from "@/components/dashboard/AgentList";
import { CreateRoomDialog } from "@/components/dashboard/CreateRoomDialog";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RoomList } from "@/components/dashboard/RoomList";
import { authClient } from "@/lib/auth-client";
import type { Agent, Process, Room } from "@/types";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data } = authClient.useSession();
  const session = data as unknown as { user?: { name?: string | null } } | null;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);

  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [executingCommand, setExecutingCommand] = useState<string | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selectedRoomId = selectedRoom?.id;
  const selectedAgentUuid = selectedAgent?.agent_uuid;

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    setError("");

    try {
      setRooms(await getRooms());
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível carregar as salas."));
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const loadAgents = useCallback(async () => {
    if (selectedRoomId == null) return;

    setLoadingAgents(true);
    setError("");

    try {
      const data = await getRoomAgents(selectedRoomId);
      setAgents(data.agents);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível carregar os agentes."));
    } finally {
      setLoadingAgents(false);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    if (selectedRoomId == null) return;

    void loadAgents();
    const intervalId = window.setInterval(() => void loadAgents(), 30_000);

    return () => window.clearInterval(intervalId);
  }, [selectedRoomId, loadAgents]);

  useEffect(() => {
    setSelectedAgent((currentAgent) => {
      if (!currentAgent) return currentAgent;
      return agents.find((agent) => agent.agent_uuid === currentAgent.agent_uuid) ?? currentAgent;
    });
  }, [agents]);

  const loadProcesses = useCallback(async () => {
    if (!selectedAgentUuid) return;

    setLoadingProcesses(true);
    setError("");

    try {
      setProcesses(await getAgentProcesses(selectedAgentUuid));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível carregar os processos."));
    } finally {
      setLoadingProcesses(false);
    }
  }, [selectedAgentUuid]);

  useEffect(() => {
    if (!selectedAgentUuid) {
      setProcesses([]);
      return;
    }

    void loadProcesses();
  }, [selectedAgentUuid, loadProcesses]);

  const handleEnterRoom = (room: Room) => {
    setSelectedRoom(room);
    setSelectedAgent(null);
    setAgents([]);
    setProcesses([]);
    setError("");
    setMessage("");
  };

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setProcesses([]);
    setError("");
    setMessage("");
  };

  const handleBack = () => {
    setError("");
    setMessage("");

    if (selectedAgent) {
      setSelectedAgent(null);
      setProcesses([]);
      return;
    }

    setSelectedRoom(null);
    setAgents([]);
  };

  const handleCreateRoom = async (name: string) => {
    setCreatingRoom(true);
    setError("");

    try {
      const room = await createRoom(name);
      setRooms((currentRooms) => [...currentRooms, room]);
      setIsCreateRoomOpen(false);
      setMessage(`Sala ${room.name} criada com sucesso.`);
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível criar a sala."));
      return false;
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    const confirmed = window.confirm(`Deseja realmente remover a sala “${room.name}”?`);
    if (!confirmed) return;

    setError("");

    try {
      await deleteRoom(room.id);
      setRooms((currentRooms) => currentRooms.filter((item) => item.id !== room.id));

      if (selectedRoom?.id === room.id) {
        setSelectedAgent(null);
        setSelectedRoom(null);
        setAgents([]);
        setProcesses([]);
      }

      setMessage(`Sala ${room.name} removida.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível remover a sala."));
    }
  };

  const handleSendCommand = async (command: string) => {
    if (!selectedAgent) return;

    setExecutingCommand(command);
    setError("");
    setMessage("");

    try {
      await sendAgentCommand(selectedAgent.agent_uuid, command);
      setMessage(`Comando enviado para ${selectedAgent.hostname}.`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Não foi possível enviar o comando."));
    } finally {
      setExecutingCommand(null);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut({});
    navigate("/login", { replace: true });
  };

  const title = selectedAgent
    ? selectedAgent.hostname
    : selectedRoom?.name ?? "Gerenciamento de Salas";
  const subtitle = selectedAgent
    ? "Detalhes, processos e controles do computador"
    : selectedRoom
      ? "Computadores conectados à sala"
      : `Bem-vindo${session?.user.name ? `, ${session.user.name}` : ""}`;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <DashboardHeader
          title={title}
          subtitle={subtitle}
          onBack={selectedRoom ? handleBack : undefined}
          onRefresh={selectedAgent ? loadProcesses : selectedRoom ? loadAgents : loadRooms}
          refreshing={selectedAgent ? loadingProcesses : selectedRoom ? loadingAgents : loadingRooms}
          onLogout={handleLogout}
        />

        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {!selectedRoom && (
          <RoomList
            rooms={rooms}
            loading={loadingRooms}
            onAddRoom={() => setIsCreateRoomOpen(true)}
            onEnterRoom={handleEnterRoom}
            onDeleteRoom={handleDeleteRoom}
          />
        )}

        {selectedRoom && !selectedAgent && (
          <AgentList
            room={selectedRoom}
            agents={agents}
            loading={loadingAgents}
            onSelectAgent={handleSelectAgent}
            onDeleteRoom={() => void handleDeleteRoom(selectedRoom)}
          />
        )}

        {selectedAgent && (
          <AgentDetails
            agent={selectedAgent}
            processes={processes}
            loadingProcesses={loadingProcesses}
            executingCommand={executingCommand}
            onRefreshProcesses={() => void loadProcesses()}
            onSendCommand={(command) => void handleSendCommand(command)}
          />
        )}
      </div>

      <CreateRoomDialog
        open={isCreateRoomOpen}
        submitting={creatingRoom}
        onOpenChange={setIsCreateRoomOpen}
        onCreate={handleCreateRoom}
      />
    </main>
  );
}
