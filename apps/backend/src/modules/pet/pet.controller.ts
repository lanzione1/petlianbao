import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PetService } from './pet.service';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

class CreatePetDto {
  @IsString()
  name: string;

  @IsEnum(['dog', 'cat', 'other'])
  species: 'dog' | 'cat' | 'other';

  @IsString()
  breed: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  feeding?: string;

  @IsOptional()
  @IsString()
  allergy?: string;

  @IsOptional()
  @IsString()
  behavior?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  nextVaccineDate?: string;

  @IsOptional()
  @IsDateString()
  nextDewormDate?: string;
}

@Controller('pets')
@UseGuards(AuthGuard('jwt'))
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get('reminders')
  async getReminders(@Request() req, @Query('type') type: string, @Query('days') days: string) {
    const merchantId = req.user.merchantId;
    if (!merchantId) {
      return { code: 401, message: '未获取到商家信息', data: [] };
    }
    try {
      const result = await this.petService.getReminders(
        merchantId,
        type || 'all',
        parseInt(days) || 7,
      );
      return { code: 200, message: 'success', data: result };
    } catch (error) {
      console.error('getReminders error:', error);
      return { code: 500, message: '获取提醒失败', data: [] };
    }
  }

  @Get('reminders/templates')
  getTemplates(@Request() req) {
    const merchantId = req.user.merchantId || req.user.id;
    return this.petService.getTemplates(merchantId);
  }

  @Put('reminders/templates')
  updateTemplates(@Request() req, @Body() body: any) {
    const merchantId = req.user.merchantId || req.user.id;
    return this.petService.updateTemplates(merchantId, body);
  }

  @Post('reminders/send')
  sendReminders(@Request() req, @Body() body: { petIds: string[]; type: string; message: string }) {
    const merchantId = req.user.merchantId || req.user.id;
    return this.petService.sendReminders(merchantId, body.petIds, body.type, body.message);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.petService.findByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petService.findOne(id);
  }

  @Post()
  create(@Request() req, @Body() createPetDto: any) {
    const merchantId = req.user.merchantId || req.user.id;
    return this.petService.create(merchantId, createPetDto.customerId, createPetDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePetDto: any) {
    return this.petService.update(id, updatePetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petService.remove(id);
  }

  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'pets');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const photoUrl = `/uploads/pets/${file.filename}`;
    await this.petService.update(id, { photo: photoUrl } as any);
    return { url: photoUrl };
  }
}
