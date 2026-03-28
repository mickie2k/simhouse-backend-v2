import { Controller, Get, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('location')
@Controller('location')
export class LocationController {
    constructor(private readonly locationService: LocationService) {}

    @Get('countries')
    @ApiOperation({ summary: 'Get all countries' })
    async getCountries() {
        return this.locationService.getCountries();
    }

    @Get('states')
    @ApiOperation({ summary: 'Get states by country ID' })
    @ApiQuery({ name: 'countryId', required: true, type: String })
    async getStates(@Query('countryId') countryId: string) {
        return this.locationService.getStates(countryId);
    }

    @Get('cities')
    @ApiOperation({ summary: 'Get cities by country ID and state code' })
    @ApiQuery({ name: 'countryId', required: true, type: String })
    @ApiQuery({ name: 'stateCode', required: true, type: String })
    async getCities(
        @Query('countryId') countryId: string,
        @Query('stateCode') stateCode: string,
    ) {
        return this.locationService.getCities(countryId, stateCode);
    }
}
