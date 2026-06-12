import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Monitor, Cpu, HardDrive, Database, Plus, ArrowLeft, ChevronRight, Trash2, LogOut, Clock } from "lucide-react";
import { initialRooms, Room, Computer } from "@/mocks/classroomData";

const getStatusColor = (status: Computer["status"]) => {
  switch (status) {
    case "online": return "bg-green-500";
    case "warning": return "bg-yellow-500";
    case "offline": return "bg-slate-400";
    default: return "bg-slate-400";
  }
};

const getStatusText = (status: Computer["status"]) => {
  switch (status) {
    case "online": return "Online";
    case "warning": return "Aviso";
    case "offline": return "Offline";
    default: return "Desconhecido";
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const handleAddRoom = () => {
    if (newRoomName.trim()) {
      const newRoom: Room = {
        id: Date.now().toString(),
        name: newRoomName.trim(),
        computers: []
      };
      setRooms([...rooms, newRoom]);
      setNewRoomName("");
      setIsAddRoomOpen(false);
    }
  };

  const handleDeleteRoom = (roomId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRooms(rooms.filter(r => r.id !== roomId));
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null);
      setSelectedComputer(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {(selectedRoom || selectedComputer) && (
              <Button variant="ghost" size="icon" onClick={() => {
                if (selectedComputer) {
                  setSelectedComputer(null);
                } else if (selectedRoom) {
                  setSelectedRoom(null);
                }
              }}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {selectedComputer ? selectedComputer.name : selectedRoom ? selectedRoom.name : "Gerenciamento de Salas"}
              </h1>
              <p className="text-slate-600 mt-1">
                {selectedComputer ? "Detalhes do computador" : selectedRoom ? "Computadores na sala" : "Selecione uma sala para monitorar"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!selectedRoom && !selectedComputer && (
              <Button onClick={() => setIsAddRoomOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Sala
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/login")}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </header>

        {!selectedRoom && !selectedComputer && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <CardTitle className="text-lg font-semibold text-slate-900">{room.name}</CardTitle>
                  <Monitor className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{room.computers.length} computadores</p>
                  <div className="flex items-center mt-4 text-blue-600 text-sm font-medium">
                    Ver computadores <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedRoom && !selectedComputer && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">Computadores em {selectedRoom.name}</h2>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteRoom(selectedRoom.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Remover Sala
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedRoom.computers.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
                  Nenhum computador nesta sala.
                </div>
              ) : (
                selectedRoom.computers.map((computer) => (
                  <Card 
                    key={computer.id} 
                    className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedComputer(computer)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Monitor className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-slate-900">{computer.name}</CardTitle>
                          <div className="flex items-center mt-1">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor(computer.status)} mr-2`}></span>
                            <span className="text-xs font-medium text-slate-500">{getStatusText(computer.status)}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="flex items-center"><Cpu className="h-3 w-3 mr-1" /> CPU</span>
                          <span>{computer.cpuUsage}%</span>
                        </div>
                        <Progress value={computer.cpuUsage} className="h-1.5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="flex items-center"><Database className="h-3 w-3 mr-1" /> RAM</span>
                          <span>{computer.ramUsage}%</span>
                        </div>
                        <Progress value={computer.ramUsage} className="h-1.5" />
                      </div>
                      <div className="flex items-center text-blue-600 text-sm font-medium pt-2 border-t border-slate-100">
                        Ver detalhes <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {selectedComputer && (
          <Card className="border-slate-200 shadow-sm max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Monitor className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">{selectedComputer.name}</CardTitle>
                    <div className="flex items-center mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(selectedComputer.status)} mr-2`}></span>
                      <span className="text-sm font-medium text-slate-600">{getStatusText(selectedComputer.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-slate-600">
                      <Cpu className="h-4 w-4 mr-2" />
                      <span>Uso de CPU</span>
                    </div>
                    <span className="font-medium text-slate-900">{selectedComputer.cpuUsage}%</span>
                  </div>
                  <Progress value={selectedComputer.cpuUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-slate-600">
                      <Database className="h-4 w-4 mr-2" />
                      <span>Uso de RAM</span>
                    </div>
                    <span className="font-medium text-slate-900">{selectedComputer.ramUsage}%</span>
                  </div>
                  <Progress value={selectedComputer.ramUsage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-slate-600">
                      <HardDrive className="h-4 w-4 mr-2" />
                      <span>Armazenamento</span>
                    </div>
                    <span className="font-medium text-slate-900">{selectedComputer.storageUsage}%</span>
                  </div>
                  <Progress value={selectedComputer.storageUsage} className="h-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                    <Monitor className="h-4 w-4 mr-2 text-blue-600" />
                    Aplicativos Abertos Agora
                  </h3>
                  {selectedComputer.openApps.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Nenhum aplicativo aberto.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedComputer.openApps.map((app, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          {app}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    Usados Recentemente
                  </h3>
                  {selectedComputer.recentApps.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Nenhum registro recente.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedComputer.recentApps.map((app, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
                          <span className="w-2 h-2 rounded-full bg-slate-400 mr-2"></span>
                          {app}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Sala</DialogTitle>
            <DialogDescription>
              Insira o nome da nova sala de aula para adicioná-la ao sistema.
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
            <Button variant="outline" onClick={() => { setIsAddRoomOpen(false); setNewRoomName(""); }}>
              Cancelar
            </Button>
            <Button onClick={handleAddRoom} disabled={!newRoomName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
