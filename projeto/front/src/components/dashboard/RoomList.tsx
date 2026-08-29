import type { MouseEvent } from "react";
import { ChevronRight, Monitor, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Room } from "@/types";

interface RoomListProps {
  rooms: Room[];
  loading: boolean;
  onAddRoom: () => void;
  onEnterRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
}

export function RoomList({
  rooms,
  loading,
  onAddRoom,
  onEnterRoom,
  onDeleteRoom,
}: RoomListProps) {
  const handleDelete = (event: MouseEvent, room: Room) => {
    event.stopPropagation();
    onDeleteRoom(room);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Suas salas</h2>
          <p className="mt-1 text-sm text-slate-500">
            Entre em uma sala para visualizar os computadores conectados.
          </p>
        </div>

        <Button onClick={onAddRoom} className="bg-blue-600 hover:bg-blue-700">
          <Plus />
          Adicionar Sala
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading && rooms.length === 0 && (
          <p className="col-span-full py-12 text-center text-slate-500">Carregando salas...</p>
        )}

        {!loading && rooms.length === 0 && (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white py-12 text-center text-slate-500">
            Nenhuma sala criada ainda.
          </div>
        )}

        {rooms.map((room) => (
          <Card
            key={room.id}
            className="group cursor-pointer gap-0 overflow-hidden border-slate-200 py-0 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => onEnterRoom(room)}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-2.5">
              <span className="text-xs font-medium text-slate-500">Código da sala</span>
              <span className="select-text font-mono text-xs font-semibold text-blue-600">
                {room.join_code}
              </span>
            </div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-3 pt-4">
              <CardTitle className="text-lg font-semibold text-slate-900">{room.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 transition-opacity hover:bg-red-50 hover:text-red-700 sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
                  onClick={(event) => handleDelete(event, room)}
                  aria-label={`Excluir sala ${room.name}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="px-5 pb-5">
              <div className="flex items-center text-sm font-medium text-blue-600">
                Entrar na sala
                <ChevronRight className="ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
