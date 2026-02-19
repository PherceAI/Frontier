export interface RoomData {
    id: string | number;
    habitacion: string;
    huesped?: string;
    empresa?: string;
    adultos: number;
    ninos: number;
    checkIn?: string; // ISO Date YYYY-MM-DD
    checkOut?: string; // ISO Date YYYY-MM-DD
    estado: 'OCUPADA' | 'DISPONIBLE' | 'LIMPIEZA' | 'MANTENIMIENTO'; // Frontend derived state
    porcentajeOcupacion?: number;
    ingresosDiarios?: number;
    fecha?: string; // ISO Date YYYY-MM-DD
    roi?: number;
}

// Floor configuration for frontend logic
export const ROOM_FLOORS = [
    { floor: 1, range: '101-108', type: 'STANDARD' },
    { floor: 2, range: '201-225', type: 'STANDARD' },
    { floor: 3, range: '301-308', type: 'STANDARD' },
    { floor: 4, range: '401-408', type: 'EXECUTIVA' },
    { floor: 5, range: '501-508', type: 'EXECUTIVA' },
    { floor: 6, range: '602-608', type: 'EXECUTIVA' },
    { floor: 7, range: '701-708', type: 'PREMIUM' },
    { floor: 8, range: '801-808', type: 'PREMIUM' },
    { floor: 9, range: '901-908', type: 'PREMIUM' },
    { floor: 10, range: '1001-1008', type: 'PREMIUM' },
];

export const ROOM_LIST = {
    1: ['101', '102', '103', '104', '105', '106', '107', '108'],
    2: ['201', '202', '203', '204', '205', '206', '207', '208', '224', '225'],
    3: ['301', '302', '303', '304', '305', '306', '307', '308'],
    4: ['401', '402', '403', '404', '405', '406', '407', '408'],
    5: ['501', '502', '503', '504', '505', '506', '507', '508'],
    6: ['602', '603', '604', '605', '606', '607', '608'],
    7: ['701', '702', '703', '704', '705', '706', '707', '708'],
    8: ['801', '802', '803', '804', '805', '806', '807', '808'],
    9: ['901', '902', '903', '904', '905', '906', '907', '908'],
    10: ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008'],
};
