import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateSimulatorDto } from './create-simulator.dto';

export class UpdateSimulatorDto extends PartialType(CreateSimulatorDto) {
    @ApiPropertyOptional({
        description: 'S3 object key for the first simulator image',
        example: 'simulators/sim/1/1700000000000-acde1234.jpg',
    })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    firstImageKey?: string;

    @ApiPropertyOptional({
        description: 'S3 object key for the second simulator image',
        example: 'simulators/sim/1/1700000000000-acde5678.jpg',
    })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    secondImageKey?: string;

    @ApiPropertyOptional({
        description: 'S3 object key for the third simulator image',
        example: 'simulators/sim/1/1700000000000-acde9012.jpg',
    })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    thirdImageKey?: string;
}
