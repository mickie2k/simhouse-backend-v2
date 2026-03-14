import {
    Host,
    SimulatorMod,
    SimulatorTypeList,
} from 'src/generated/prisma/client';

export class SimulatorResponseDTO {
    id: number;
    simListName: string;
    pricePerHour: number | string;
    listDescription: string | null;
    addressDetail: string;
    cityId: number;
    latitude: number | string;
    longitude: number | string;
    firstImage: string;
    secondImage: string;
    thirdImage: string;
    hostId: number;
    modId: number;
    mod?: SimulatorMod;
    host?: Host;
    typeList?: SimulatorTypeList;
    city: string;
    province?: string;
    country: string;
}
