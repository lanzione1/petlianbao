import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { H5PetService } from './h5-pet.service';
import { H5CustomerGuard } from '../auth/guards/h5-customer.guard';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';

class CreatePetDto {
  @IsString()
  name: string;

  @IsEnum(['dog', 'cat', 'other'])
  species: 'dog' | 'cat' | 'other';

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(['male', 'female', 'unknown'])
  @IsOptional()
  gender?: 'male' | 'female' | 'unknown';

  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

@Controller('h5/pets')
@UseGuards(H5CustomerGuard)
export class H5PetController {
  constructor(private petService: H5PetService) {}

  @Get()
  async findAll(@Request() req) {
    const customerId = req.user.customerId;
    const pets = await this.petService.findAll(customerId);
    return { success: true, data: pets };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const customerId = req.user.customerId;
    const pet = await this.petService.findOne(id, customerId);
    return { success: true, data: pet };
  }

  @Post()
  async create(@Request() req, @Body() dto: CreatePetDto) {
    const customerId = req.user.customerId;
    const petData = {
      ...dto,
      birthday: dto.birthday ? new Date(dto.birthday) : undefined,
    };
    const pet = await this.petService.create(customerId, petData);
    return { success: true, data: pet };
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: Partial<CreatePetDto>) {
    const customerId = req.user.customerId;
    const petData = {
      ...dto,
      birthday: dto.birthday ? new Date(dto.birthday) : dto.birthday === null ? null : undefined,
    };
    const pet = await this.petService.update(id, customerId, petData);
    return { success: true, data: pet };
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const customerId = req.user.customerId;
    await this.petService.delete(id, customerId);
    return { success: true, message: 'Pet deleted' };
  }
}
