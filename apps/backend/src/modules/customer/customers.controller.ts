import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

class CreateCustomerDto {
  @IsString()
  petName: string;

  @IsOptional()
  @IsString()
  petBreed?: string;

  @IsOptional()
  petBirthday?: Date;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  petName?: string;

  @IsOptional()
  @IsString()
  petBreed?: string;

  @IsOptional()
  petBirthday?: Date;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Request() req: any, @Body() createCustomerDto: CreateCustomerDto) {
    const staffInfo = {
      staffId: req.user.staffId || req.user.merchantId,
      staffName: req.user.nickname || '店主',
    };
    return this.customersService.create(req.user.merchantId, createCustomerDto as any, staffInfo);
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('inactive') inactive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.findAll(req.user.merchantId, {
      search,
      tag,
      inactive: inactive === 'true',
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Get('inactive')
  getInactive(@Request() req: any) {
    return this.customersService.getInactive(req.user.merchantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(req.user.merchantId, id);
  }

  @Get(':id/history')
  getHistory(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getHistory(req.user.merchantId, id);
  }

  @Put(':id')
  update(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(req.user.merchantId, id, updateCustomerDto as any);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(req.user.merchantId, id);
  }
}
