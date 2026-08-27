import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
  Monitor,
  Cpu,
  HardDrive,
  Database,
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
  Activity,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext.jsx";

import {
  getRooms,
  deleteRoom,
  getRoomAgents,
} from "@/api/rooms.ts";

import type { Room, Agent, Process } from "@/types/index.ts";
import { getAgentStatus } from "@/types/index.ts";

import { getAgentProcesses } from "@/api/agents.ts";
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


export default function InDashboard(){
  const navigate = useNavigate();
  const { roomId } = useParams<{roomId:string}>();
  const { logout } = useAuth();
  const numericRoomId = Number(roomId);
  const [room,setRoom] = useState<Room|null>(null);
  const [agents,setAgents] = useState<Agent[]>([]);
  const [selectedAgent,setSelectedAgent] = useState<Agent|null>(null);
  const [agentProcesses,setAgentProcesses] = useState<Process[]>([]);
  const [loadingProcesses,setLoadingProcesses] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [executingCommand,setExecutingCommand] = useState<string|null>(null);

  useEffect(()=>{

    const fetchRoom = async()=>{

      if(!Number.isInteger(numericRoomId)||numericRoomId<=0){
        setError("ID da sala inválido.");
        return;
      }
      try{
        const rooms = await getRooms();
        const found = rooms.find(
          r=>r.id===numericRoomId
        );
        if(!found){
          setError("Sala não encontrada.");
          return;
        }
        setRoom(found);
      }catch(err:any){
        setError(err.message);
      }
    };
    fetchRoom();
  },[numericRoomId]);
  const fetchAgents = useCallback(async()=>{
    if(!Number.isInteger(numericRoomId)||numericRoomId<=0)
      return;
    setLoading(true);
    setError("");
    try{
      const data = await getRoomAgents(numericRoomId);
      setAgents(data.agents);
    }catch(err:any){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  },[numericRoomId]);
  useEffect(()=>{
    if(!Number.isInteger(numericRoomId)||numericRoomId<=0)
      return;
    fetchAgents();
    const interval = setInterval(
      fetchAgents,
      30000
    );
    return ()=>clearInterval(interval);
  },[
    numericRoomId,
    fetchAgents
  ]);
  useEffect(()=>{
    if(!selectedAgent)
      return;
    const updated = agents.find(
      a=>a.agent_uuid===selectedAgent.agent_uuid
    );
    if(updated)
      setSelectedAgent(updated);
  },[
    agents,
    selectedAgent?.agent_uuid
  ]);
  useEffect(()=>{
    if(!selectedAgent){
      setAgentProcesses([]);
      return;
    }
    const loadProcesses = async()=>{
      setLoadingProcesses(true);

      try{
        const data = await getAgentProcesses(
          selectedAgent.agent_uuid
        );
        setAgentProcesses(data);
      }catch(err:any){
        console.error(
          "Erro ao buscar processos:",
          err
        );
      }finally{
        setLoadingProcesses(false);
      }
    };
    loadProcesses();

  },[
    selectedAgent?.agent_uuid
  ]);
  const handleSendCommand = async(
    agentUuid:string,
    command:string
  )=>{

    setExecutingCommand(command);

    try{

      await api.post(
        "/command/createcommand",
        {
          agent_uuid:agentUuid,
          command
        }
      );

    }catch(err:any){

      setError(err.message);

    }finally{

      setExecutingCommand(null);
    }
  };
  const handleDeleteRoom = async()=>{

    if(!Number.isInteger(numericRoomId))
      return;
    try{
      await deleteRoom(numericRoomId);
      navigate("/dashboard");
    }catch(err:any){
      setError(err.message);
    }

  };
  const handleBack = ()=>{
    if(selectedAgent){
      setSelectedAgent(null);
      return;
    }
    navigate("/dashboard");
  };
  const handleLogout = async()=>{
    await logout();
    navigate("/login");
  };
return (
  <div className="min-h-screen bg-slate-50 p-6">
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5"/>
          </Button>
          <img
            src="/iconepaginas.png"
            alt="Monitoramento Escolar"
            className="h-14 w-auto object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {selectedAgent
                ? selectedAgent.hostname
                : room?.name ?? "Carregando..."}
            </h1>
            <p className="text-slate-600 mt-1">
              {selectedAgent
                ? "Detalhes do computador"
                : "Computadores na sala"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!selectedAgent && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAgents}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Atualizar
            </Button>

          )}
          <Button
            variant="outline"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4"/>
            Sair
          </Button>
        </div>
      </header>
      {error && (

        <div className="
          text-sm
          text-red-600
          bg-red-50
          border
          border-red-200
          rounded-md
          p-3
        ">
          {error}
        </div>

      )}
      {!selectedAgent && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">

              Computadores em{" "}
              {room?.name ?? "..."}

            </h2>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteRoom}
            >

              <Trash2 className="mr-2 h-4 w-4"/>

              Remover Sala

            </Button>
          </div>
          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-3
            gap-6
          ">
            {loading && (

              <p className="
                col-span-full
                text-center
                text-slate-500
                py-12
              ">

                Carregando computadores...

              </p>
            )}
            {!loading && agents.length===0 && (

              <div className="
                col-span-full
                text-center
                py-12
                text-slate-500
                bg-white
                rounded-lg
                border
                border-slate-200
              ">

                Nenhum computador registrado nesta sala.

              </div>

            )}
            {agents.map(agent=>{

              const status=getAgentStatus(agent);
              return (
                <Card
                  key={agent.id}
                  className="
                    border-slate-200
                    shadow-sm
                    hover:shadow-md
                    transition-shadow
                    cursor-pointer
                  "
                  onClick={()=>setSelectedAgent(agent)}
                >
                  <CardHeader
                    className="
                      flex
                      flex-row
                      items-center
                      justify-between
                      space-y-0
                      pb-2
                    "
                  >
                    <div className="flex items-center space-x-3">
                      <div className="
                        p-2
                        bg-blue-50
                        rounded-lg
                      ">
                        <Monitor className="
                          h-5
                          w-5
                          text-blue-600
                        "/>
                      </div>
                      <div>
                        <CardTitle className="
                          text-base
                          font-semibold
                          text-slate-900
                        ">

                          {agent.hostname}

                        </CardTitle>
                        <div className="
                          flex
                          items-center
                          mt-1
                        ">
                          <span
                            className={`
                              w-2
                              h-2
                              rounded-full
                              ${STATUS_COLOR[status]}
                              mr-2
                            `}
                          />
                          <span className="
                            text-xs
                            font-medium
                            text-slate-500
                          ">

                            {STATUS_TEXT[status]}

                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="
                        flex
                        justify-between
                        text-xs
                        text-slate-600
                      ">
                        <span className="flex items-center">

                          <Cpu className="
                            h-3
                            w-3
                            mr-1
                          "/>

                          CPU

                        </span>
                        <span>
                          {agent.cpu_percent?.toFixed(1) ?? "—"}%
                        </span>
                      </div>
                      <Progress
                        value={agent.cpu_percent ?? 0}
                        className="h-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="
                        flex
                        justify-between
                        text-xs
                        text-slate-600
                      ">
                        <span className="flex items-center">

                          <Database className="
                            h-3
                            w-3
                            mr-1
                          "/>

                          RAM

                        </span>
                        <span>
                          {agent.mem_percent?.toFixed(1) ?? "—"}%
                        </span>
                      </div>
                      <Progress
                        value={agent.mem_percent ?? 0}
                        className="h-1.5"
                      />
                    </div>
                    <div className="
                      flex
                      justify-between
                      text-xs
                      text-slate-600
                      pt-1
                    ">
                      <span className="
                        flex
                        items-center
                        text-slate-500
                      ">
                        <Activity className="
                          h-3
                          w-3
                          mr-1
                          text-slate-400
                        "/>
                        Último processo
                      </span>
                      <span
                        className="
                          font-medium
                          text-slate-700
                          truncate
                          max-w-[160px]
                        "
                        title={
                          agent.last_active_process ?? "Nenhum"
                        }
                      >
                        {agent.last_active_process ?? "—"}
                      </span>
                    </div>
                    <div className="
                      flex
                      items-center
                      text-blue-600
                      text-sm
                      font-medium
                      pt-2
                      border-t
                      border-slate-100
                    ">
                      Ver detalhes
                      <ChevronRight className="
                        h-4
                        w-4
                        ml-1
                      "/>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
        {selectedAgent && (() => {
          const status = getAgentStatus(selectedAgent);
          const processes = agentProcesses;
          return (
            <Card className="border-slate-200 shadow-sm max-w-3xl mx-auto">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Monitor className="h-8 w-8 text-blue-600"/>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      {selectedAgent.hostname}
                    </CardTitle>
                    <div className="flex items-center mt-1">
                      <span
                        className={`
                          w-2.5
                          h-2.5
                          rounded-full
                          ${STATUS_COLOR[status]}
                          mr-2
                        `}
                      />
                      <span className="text-sm font-medium text-slate-600">
                        {STATUS_TEXT[status]}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="
                  grid
                  grid-cols-1
                  md:grid-cols-3
                  gap-6
                ">
                  {[
                    {
                      label:"CPU",
                      icon:Cpu,
                      value:selectedAgent.cpu_percent
                    },
                    {
                      label:"RAM",
                      icon:Database,
                      value:selectedAgent.mem_percent
                    },
                    {
                      label:"Disco",
                      icon:HardDrive,
                      value:selectedAgent.disk_percent
                    },
                  ].map(({label,icon:Icon,value})=>(

                    <div
                      key={label}
                      className="space-y-2"
                    >
                      <div className="
                        flex
                        items-center
                        justify-between
                        text-sm
                      ">
                        <div className="
                          flex
                          items-center
                          text-slate-600
                        ">

                          <Icon className="
                            h-4
                            w-4
                            mr-2
                          "/>

                          {label}
                        </div>
                        <span className="
                          font-medium
                          text-slate-900
                        ">
                          {value?.toFixed(1) ?? "—"}%
                        </span>
                      </div>
                      <Progress
                        value={value ?? 0}
                        className="h-2"
                      />
                    </div>

                  ))}
                </div>
                <div className="
                  pt-4
                  border-t
                  border-slate-100
                ">
                  <h3 className="
                    text-sm
                    font-semibold
                    text-slate-900
                    mb-3
                    flex
                    items-center
                    justify-between
                  ">
                    <span className="flex items-center">
                      <Monitor className="
                        h-4
                        w-4
                        mr-2
                        text-blue-600
                      "/>
                      Processos em execução ({processes.length})
                    </span>
                    {loadingProcesses && (

                      <RefreshCw className="
                        h-3.5
                        w-3.5
                        animate-spin
                        text-blue-500
                      "/>

                    )}
                  </h3>
                  {loadingProcesses && processes.length===0 ? (

                    <p className="
                      text-sm
                      text-slate-500
                      italic
                      flex
                      items-center
                    ">

                      <RefreshCw className="
                        h-4
                        w-4
                        mr-2
                        animate-spin
                        text-blue-600
                      "/>

                      Carregando processos...
                    </p>
                  ) : processes.length===0 ? (

                    <p className="
                      text-sm
                      text-slate-500
                      italic
                    ">
                      Nenhum processo disponível.
                    </p>
                  ) : (
                    <ul className="
                      space-y-1
                      max-h-64
                      overflow-y-auto
                    ">
                      {processes.map((proc:any,index:number)=>{

                        const active=index===0;
                        return (

                          <li
                            key={proc.pid ?? index}
                            className={`
                              flex
                              items-center
                              justify-between
                              text-sm
                              p-2
                              rounded-md
                              border
                              ${
                                active
                                ?
                                "text-blue-900 bg-blue-50 border-blue-200 font-medium"
                                :
                                "text-slate-700 bg-slate-50 border-slate-100"
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <span className="
                                flex
                                items-center
                                gap-2
                              ">
                                <span
                                  className={`
                                    w-2
                                    h-2
                                    rounded-full
                                    ${
                                      active
                                      ?
                                      "bg-blue-600 animate-pulse"
                                      :
                                      "bg-green-500"
                                    }
                                  `}
                                />
                                <span>
                                  {proc.name}
                                </span>
                                {proc.pid != null && (

                                  <span className="
                                    text-[11px]
                                    font-mono
                                    bg-slate-200
                                    text-slate-700
                                    px-1.5
                                    py-0.5
                                    rounded
                                  ">

                                    PID: {proc.pid}

                                  </span>

                                )}
                                {active && (

                                  <span className="
                                    text-[10px]
                                    bg-blue-100
                                    text-blue-700
                                    px-1.5
                                    py-0.5
                                    rounded
                                    font-semibold
                                  ">

                                    Último Ativo

                                  </span>

                                )}
                              </span>
                            </div>
                            <div className="
                              flex
                              items-center
                              gap-3
                            ">
                              <span className="
                                text-xs
                                text-slate-400
                              ">
                                {
                                  proc.mem_mb != null
                                  ?
                                  `${proc.mem_mb.toFixed(1)} MB`
                                  :
                                  "—"
                                }
                              </span>
                              {proc.pid != null && (

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="
                                    h-7
                                    px-2
                                    text-xs
                                    text-red-600
                                    hover:text-red-700
                                    hover:bg-red-100
                                  "
                                  onClick={() =>
                                    handleSendCommand(
                                      selectedAgent.agent_uuid,
                                      `command=kill_pid&pid=${proc.pid}`
                                    )
                                  }
                                  disabled={
                                    executingCommand ===
                                    `command=kill_pid&pid=${proc.pid}`
                                  }
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1"/>

                                  {
                                    executingCommand ===
                                    `command=kill_pid&pid=${proc.pid}`
                                    ?
                                    "Matando..."
                                    :
                                    "Matar"
                                  }
                                </Button>
                              )}
                            </div>
                          </li>

                        );

                      })}
                    </ul>
                  )}
                </div>
                <div className="
                  text-xs
                  text-slate-400
                  flex
                  items-center
                  gap-1
                  pt-2
                ">
                  <Clock className="h-3 w-3"/>
                  Última atualização:
                  {" "}

                  {
                    selectedAgent.collected_at
                    ?
                    new Date(
                      selectedAgent.collected_at
                    ).toLocaleString("pt-BR")
                    :
                    "nunca"
                  }
                </div>
                <div className="
                  pt-4
                  border-t
                  border-slate-100
                  space-y-4
                ">
                  <h3 className="
                    text-sm
                    font-semibold
                    text-slate-900
                    flex
                    items-center
                  ">
                    <Lock className="
                      h-4
                      w-4
                      mr-2
                      text-blue-600
                    "/>
                    Ações de Controle
                  </h3>
                  <div className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    gap-4
                  ">
                    <div className="
                      bg-slate-50
                      p-3
                      rounded-lg
                      border
                      border-slate-150
                      space-y-2
                    ">
                      <span className="
                        text-xs
                        font-semibold
                        text-slate-500
                        flex
                        items-center
                        gap-1
                      ">
                        <Keyboard className="h-3.5 w-3.5"/>
                        <MousePointer className="h-3.5 w-3.5"/>
                        Teclado / Mouse
                      </span>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 text-xs"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleSendCommand(
                              selectedAgent.agent_uuid,
                              "command=lock_mouseAndKeyboard"
                            )
                          }
                        >
                          Bloquear

                        </Button>
                        <Button
                          className="flex-1 text-xs"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSendCommand(
                              selectedAgent.agent_uuid,
                              "command=unlock_mouseAndKeyboard"
                            )
                          }
                        >
                          <Unlock className="mr-1 h-3 w-3"/>
                          Desbloquear
                        </Button>
                      </div>
                    </div>
                    <div className=" bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2">
                      <span className=" text-xs font-semibold text-slate-500 flex  items-center gap-1 ">
                        <MonitorOff className="h-3.5 w-3.5"/>
                        Monitor / Tela
                      </span>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 text-xs"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleSendCommand(
                              selectedAgent.agent_uuid,
                              "command=lock_monitor"
                            )
                          }
                        >
                          Apagar Tela
                        </Button>
                        <Button
                          className="flex-1 text-xs"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSendCommand(
                              selectedAgent.agent_uuid,
                              "command=unlock_monitor"
                            )
                          }
                        >
                          <Unlock className="mr-1 h-3 w-3"/>
                          Ligar Tela
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
    </div>
  );

}
