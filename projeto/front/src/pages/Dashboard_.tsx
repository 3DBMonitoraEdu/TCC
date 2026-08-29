import {
  useState,
  useEffect,
  useCallback,
  type MouseEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  Plus,
  ChevronRight,
  Trash2,
  LogOut,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext.jsx";

import {
  getRooms,
  createRoom,
  deleteRoom,
} from "@/api/rooms.ts";

import type { Room } from "@/types/index.ts";

export default function Dashboard() {
  const navigate = useNavigate();

  const { logout, teacher } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

  const [newRoomName, setNewRoomName] = useState("");

  const [addingRoom, setAddingRoom] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getRooms();

      setRooms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) {
      return;
    }

    setAddingRoom(true);

    try {

      await createRoom(newRoomName.trim());

      const updatedRooms = await getRooms();

      setRooms(updatedRooms);

      setNewRoomName("");

      setIsAddRoomOpen(false);

    } catch (err: any) {

      setError(err.message);

    } finally {

      setAddingRoom(false);

    }
  };

  const handleDeleteRoom = async (
    roomId: number,
    e?: MouseEvent
  ) => {

    e?.stopPropagation();

    try {
      await deleteRoom(roomId);

      setRooms((prev) =>
        prev.filter(
          (room) => room.id !== roomId
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };
  const handleLogout = async () => {
    await logout();

    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between mb-8">

          <div className="flex items-center gap-4">

            <img
              src="/iconepaginas.png"
              alt="Monitoramento Escolar"
              className="h-14 w-auto object-contain"
            />

            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Gerenciamento de Salas
              </h1>

              <p className="text-slate-600 mt-1">
                Bem-vindo, {teacher?.name}
              </p>
            </div>

          </div>

          <div className="flex items-center gap-3">

            <Button
              onClick={() =>
                setIsAddRoomOpen(true)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />

              Adicionar Sala
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />

              Sair
            </Button>

          </div>

        </header>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">

          {loading && (
            <p className="col-span-full text-center text-slate-500 py-12">
              Carregando salas...
            </p>
          )}

          {!loading &&
            rooms.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
                Nenhuma sala criada ainda.
              </div>
            )}

          {rooms.map((room) => (

            <Card
              key={room.id}
              className=" border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden py-0 gap-0"
              onClick={() =>
                navigate(
                  `/inDashboard/${room.id}`
                )
              }
            >
              <div
                className=" flex items-center justify-between bg-slate-50 border-b border-slate-200 px-5 py-2.5 cursor-default"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <span className="text-xs font-medium text-slate-500">
                  Código da sala
                </span>

                <span className=" text-xs font-mono font-semibold text-blue-600 select-text cursor-text ">
                  {room.join_code}
                </span>

              </div>
              <CardHeader
                className=" flex flex-row items-center justify-between space-y-0 px-5 pt-4 pb-3"
              >

                <CardTitle className="text-lg font-semibold text-slate-900">
                  {room.name}
                </CardTitle>

                <div className="flex items-center gap-2">

                  <Monitor className="h-5 w-5 text-blue-600" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="  h-8 w-8 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 transition-opacity "
                    onClick={(e) =>
                      handleDeleteRoom(
                        room.id,
                        e
                      )
                    }
                    title="Excluir sala"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                </div>

              </CardHeader>
              <CardContent className="px-5 pb-5">

                <div className=" flex items-center text-blue-600 text-sm font-medium">
                  Ver computadores
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>

              </CardContent>

            </Card>

          ))}

        </div>

      </div>

      <Dialog
        open={isAddRoomOpen}
        onOpenChange={
          setIsAddRoomOpen
        }
      >

        <DialogContent>

          <DialogHeader>

            <DialogTitle>
              Adicionar Nova Sala
            </DialogTitle>

            <DialogDescription>
              Insira o nome da nova sala.
              O código de pareamento será
              gerado automaticamente.
            </DialogDescription>

          </DialogHeader>

          <div className="py-4">

            <Input
              placeholder="Ex: Laboratório de Informática 02"
              value={newRoomName}
              onChange={(e) =>
                setNewRoomName(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  handleAddRoom();
                }
              }}
              autoFocus
            />

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() => {
                setIsAddRoomOpen(
                  false
                );

                setNewRoomName("");
              }}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleAddRoom}
              disabled={
                !newRoomName.trim() ||
                addingRoom
              }
            >
              {addingRoom
                ? "Criando..."
                : "Salvar"}
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}