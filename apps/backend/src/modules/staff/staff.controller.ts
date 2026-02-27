import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffService } from './staff.service';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class CreateStaffDto {
  @IsString()
  openid: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

class UpdateStatusDto {
  @IsEnum(['active', 'disabled'])
  status: 'active' | 'disabled';
}

@Controller('staffs')
@UseGuards(AuthGuard('jwt'))
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Request() req) {
    return this.staffService.findAll(req.user.merchantId);
  }

  @Get('me')
  getMe(@Request() req) {
    return this.staffService.findOne(req.user.staffId);
  }

  @Post()
  create(@Request() req, @Body() createStaffDto: CreateStaffDto) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以添加店员');
    }
    return this.staffService.create(req.user.merchantId, createStaffDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以删除店员');
    }
    return this.staffService.remove(id, req.user.merchantId);
  }

  @Put(':id/status')
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以修改店员状态');
    }
    return this.staffService.updateStatus(id, updateStatusDto.status, req.user.merchantId);
  }
}
