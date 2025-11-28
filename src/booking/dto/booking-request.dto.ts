
import {IsArray, IsNotEmpty, IsNumber} from "class-validator";

export class BookingRequestDto {
  @IsNotEmpty()
  @IsNumber()
  simId: number;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  scheduleId: number[];
}