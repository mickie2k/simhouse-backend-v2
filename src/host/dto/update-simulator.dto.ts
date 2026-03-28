import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { CreateSimulatorDto } from './create-simulator.dto';

export class UpdateSimulatorDto extends PartialType(CreateSimulatorDto) {
    @ApiPropertyOptional({
        description: 'Simulator model ID',
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    modId?: number;

    @ApiPropertyOptional({
        description: 'Platform ID',
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    platformId?: number;

    @ApiPropertyOptional({
        description: 'Pedal model ID',
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    pedalId?: number;

    @ApiPropertyOptional({
        description: 'Screen setup ID',
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    screenSetupId?: number;

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
