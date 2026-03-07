import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSimulatorDto {
    @ApiProperty({
        description: 'Simulator listing name',
        example: 'Logitech G29 Racing Setup',
    })
    @IsNotEmpty()
    @IsString()
    simlistname: string;

    @ApiProperty({
        description: 'Detailed description of the simulator',
        example:
            'Professional racing simulator with force feedback wheel and pedals',
    })
    @IsNotEmpty()
    @IsString()
    listdescription: string;

    @ApiProperty({
        description: 'Simulator type ID',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber({}, { each: true })
    simtypeid: number[];

    @ApiProperty({
        description: 'Price per hour in the local currency',
        example: 200,
    })
    @IsNotEmpty()
    @IsNumber()
    priceperhour: number;

    @ApiProperty({
        description: 'Simulator model ID',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    modid: number;

    @ApiProperty({
        description: 'Address detail of the simulator location',
        example: '123 Racing St, Speed City',
    })
    @IsNotEmpty()
    @IsString()
    addressdetail: string;

    @ApiProperty({
        description: 'Latitude of the simulator location',
        example: 37.7749,
    })
    @IsNotEmpty()
    @IsNumber()
    latitude: number;

    @ApiProperty({
        description: 'Longitude of the simulator location',
        example: -122.4194,
    })
    @IsNotEmpty()
    @IsNumber()
    longitude: number;

    @ApiProperty({
        description: 'City ID from the cities list',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    cityId: number;
}
