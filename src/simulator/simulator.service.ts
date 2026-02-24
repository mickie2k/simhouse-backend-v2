import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSimulatorDto } from '../host/dto/create-simulator.dto';
import { UpdateSimulatorDto } from './dto/update-simulator.dto';

interface MulterFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createSimulatorDto: CreateSimulatorDto,
    files: { file1?: MulterFile[]; file2?: MulterFile[]; file3?: MulterFile[] },
    hostId: number
  ) {
    // Extract file names or use default
    const file1 = files?.file1?.[0]?.filename ?? 'noimage.jpg';
    const file2 = files?.file2?.[0]?.filename ?? 'noimage.jpg';
    const file3 = files?.file3?.[0]?.filename ?? 'noimage.jpg';

    try {
      // Create simulator with images
      const simulator = await this.prisma.simulator.create({
        data: {
          simListName: createSimulatorDto.simlistname,
          listDescription: createSimulatorDto.listdescription,
          pricePerHour: createSimulatorDto.priceperhour,
          modId: createSimulatorDto.modid,
          hostId,
          firstImage: file1,
          secondImage: file2,
          thirdImage: file3,
          addressDetail: createSimulatorDto.addressdetail,
          latitude: createSimulatorDto.latitude,
          longitude: createSimulatorDto.longitude,
        },
        select: {
          id: true
        }
      });

      const simTypeLinks = createSimulatorDto.simtypeid.map((typeId) => ({
        simId: simulator.id,
        simTypeId: typeId,
      }));

      await this.prisma.simulatorTypeList.createMany({
        data: simTypeLinks,
      });

      return { message: 'Upload Success', simid: simulator.id };
    } catch (error) {
      this.logger.error(`Failed to upload simulator for host ${hostId}`, error.stack);
      throw new BadRequestException('Failed to upload simulator');
    }
  }



  findAll() {
    const simulators = this.prisma.simulator.findMany();
    return simulators;
  }

  findOne(id: number) {
    const simulator = this.prisma.simulator.findUnique({
      where: { id },
    });
    return simulator;
  }

  findNearestLocation() {
    return `This action returns nearest simulator location`;
  }

  update(id: number, updateSimulatorDto: UpdateSimulatorDto) {
    return `This action updates a #${id} simulator`;
  }

  remove(id: number) {
    return `This action removes a #${id} simulator`;
  }
}
