"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import api from "@/lib/api"
import { Room } from "../../../../types/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { User, Users, Briefcase, Calendar, Clock } from "lucide-react"

// --- Components ---

interface RoomCardProps {
    room: Room
    onClick: (room: Room) => void
}

function RoomCard({ room, onClick }: RoomCardProps) {
    const isOccupied = room.status === "OCCUPIED"

    return (
        <Card
            onClick={() => onClick(room)}
            className={`
        cursor-pointer transition-all duration-200 hover:shadow-md border-l-4
        ${isOccupied
                    ? "border-l-red-500 bg-red-50/30 hover:bg-red-50/50"
                    : "border-l-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/50"
                }
      `}
        >
            <CardContent className="p-3 flex flex-col gap-1.5">
                <div className="flex flex-col items-start gap-0.5">
                    <span className="text-xl font-bold text-gray-800">{room.number}</span>
                    <Badge variant={isOccupied ? "destructive" : "default"} className={`${isOccupied ? "bg-red-500" : "bg-emerald-500"} self-start text-[10px] px-1.5 py-0.5 h-5`}>
                        {isOccupied ? "Ocupada" : "Libre"}
                    </Badge>
                </div>

                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                    {room.type}
                </div>

            </CardContent>
        </Card>
    )
}

interface RoomDetailModalProps {
    room: Room | null
    isOpen: boolean
    onClose: () => void
}

function RoomDetailModal({ room, isOpen, onClose }: RoomDetailModalProps) {
    if (!room) return null

    const isOccupied = room.status === "OCCUPIED"

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        Habitación {room.number}
                        <Badge variant="outline">{room.type}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className={`p-4 rounded-lg flex items-center justify-between ${isOccupied ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        <span className="font-medium">Estado Actual</span>
                        <span className="font-bold uppercase">{isOccupied ? "Ocupada" : "Disponible"}</span>
                    </div>

                    {isOccupied && room.guest ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <User className="w-3 h-3" /> Huésped Principal
                                    </span>
                                    <p className="font-medium">{room.guest.name || "No registrado"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> Empresa
                                    </span>
                                    <p className="font-medium">{room.guest.company || "-"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Ocupantes
                                    </span>
                                    <p className="font-medium">
                                        {room.guest.adults || 0} Adultos, {room.guest.children || 0} Niños
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Última Act.
                                    </span>
                                    <p className="font-medium text-xs">
                                        {room.guest.last_updated ? format(new Date(room.guest.last_updated), "dd/MM HH:mm") : "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Check In</span>
                                    <p className="font-medium">
                                        {room.guest.check_in ? format(new Date(room.guest.check_in), "dd MMM yyyy, HH:mm", { locale: es }) : "-"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Check Out</span>
                                    <p className="font-medium">
                                        {room.guest.check_out ? format(new Date(room.guest.check_out), "dd MMM yyyy, HH:mm", { locale: es }) : "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Esta habitación está lista para recibir nuevos huéspedes.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function RoomFloorSection({ floor, rooms, onRoomClick }: { floor: number, rooms: Room[], onRoomClick: (r: Room) => void }) {
    if (rooms.length === 0) return null
    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                Piso {floor}
                <div className="h-px bg-gray-200 flex-1 ml-2"></div>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {rooms.map(room => (
                    <RoomCard key={room.id} room={room} onClick={onRoomClick} />
                ))}
            </div>
        </div>
    )
}

// --- Main Page ---

export default function RoomsPage() {
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

    const { data: rooms, isLoading, isError } = useQuery({
        queryKey: ['rooms'],
        queryFn: api.rooms.list,
        refetchInterval: 30000 // Refresh every 30s
    })

    // Group by floor
    const roomsByFloor = rooms ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(floor => ({
        floor,
        rooms: rooms.filter((r: Room) => r.floor === floor)
    })) : []

    // Stats
    const totalRooms = rooms?.length || 0
    const occupiedRooms = rooms?.filter((r: Room) => r.status === "OCCUPIED").length || 0
    const freeRooms = totalRooms - occupiedRooms
    const occupationRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestión de Habitaciones</h1>
                    <p className="text-muted-foreground">Monitoreo en tiempo real del estado de ocupación.</p>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-white rounded-lg border shadow-sm">
                        <div className="text-2xl font-bold text-emerald-600">{freeRooms}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase">Libres</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-white rounded-lg border shadow-sm">
                        <div className="text-2xl font-bold text-red-600">{occupiedRooms}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase">Ocupadas</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">{occupationRate}%</div>
                        <div className="text-xs text-blue-600/80 font-medium uppercase">Ocupación</div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : isError ? (
                <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">
                    Error al cargar el estado de las habitaciones.
                </div>
            ) : (
                <div className="space-y-2">
                    {roomsByFloor.map(({ floor, rooms }) => (
                        <RoomFloorSection
                            key={floor}
                            floor={floor}
                            rooms={rooms}
                            onRoomClick={setSelectedRoom}
                        />
                    ))}
                </div>
            )}

            <RoomDetailModal
                room={selectedRoom}
                isOpen={!!selectedRoom}
                onClose={() => setSelectedRoom(null)}
            />
        </div>
    )
}
