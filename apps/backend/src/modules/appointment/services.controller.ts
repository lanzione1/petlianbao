import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';
import { IsString, IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';

class CreateServiceDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyLimit?: number;
}

class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  dailyLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Request() req, @Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(req.user.merchantId, createServiceDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.servicesService.findAll(req.user.merchantId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(req.user.merchantId, id);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.user.merchantId, id, updateServiceDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(req.user.merchantId, id);
  }
}
