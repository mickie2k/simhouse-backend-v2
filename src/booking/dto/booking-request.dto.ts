import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookingRequestDto {
    @ApiProperty({
        description: 'Simulator ID to book',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    simId: number;

    @ApiProperty({
        description: 'Array of schedule IDs to book',
        example: [1, 2, 3],
        type: [Number],
    })
    @IsNotEmpty()
    @IsArray()
    @IsNumber({}, { each: true })
    scheduleId: number[];
}
