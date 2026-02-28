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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { IsString, IsOptional } from 'class-validator';

class AdminLoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}

class CreateAdminDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  role?: string;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  @Post('init')
  async initSuperAdmin() {
    await this.adminService.initSuperAdmin();
    return { success: true, message: 'Super admin initialized' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('merchants')
  async getMerchants(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getMerchants({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      search,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('merchants/stats')
  async getMerchantStats() {
    return this.adminService.getMerchantStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('merchants/:id')
  async getMerchantDetail(@Param('id') id: string) {
    return this.adminService.getMerchantDetail(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('merchants/:id/approve')
  async approveMerchant(@Param('id') id: string) {
    return this.adminService.approveMerchant(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('merchants/:id/ban')
  async banMerchant(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.banMerchant(id, reason);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('merchants/:id/unban')
  async unbanMerchant(@Param('id') id: string) {
    return this.adminService.unbanMerchant(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('merchants/:id/plan')
  async updateMerchantPlan(
    @Param('id') id: string,
    @Body('planType') planType: string,
    @Body('expiredAt') expiredAt?: string,
  ) {
    return this.adminService.updateMerchantPlan(id, planType, expiredAt);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admins')
  async createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('platform/stats')
  async getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('platform/trend')
  async getPlatformTrend(@Query('days') days?: string) {
    return this.adminService.getPlatformTrend(Number(days) || 7);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('revenue/stats')
  async getRevenueStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getRevenueStats(startDate, endDate);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('ranking')
  async getMerchantRanking(@Query('type') type?: string, @Query('limit') limit?: string) {
    return this.adminService.getMerchantRanking(type || 'revenue', Number(limit) || 20);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('logs')
  async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
  ) {
    return this.adminService.getLogs({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      adminId,
      action,
      targetType,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('media')
  async getMediaList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('merchantId') merchantId?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.getMediaList({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      merchantId,
      type,
      category,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('media/stats')
  async getMediaStats() {
    return this.adminService.getMediaStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('media/:id')
  async deleteMedia(@Param('id') id: string) {
    return this.adminService.deleteMedia(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('withdrawals')
  async getWithdrawalList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.adminService.getWithdrawalList({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      merchantId,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('withdrawals/stats')
  async getWithdrawalStats() {
    return this.adminService.getWithdrawalStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('withdrawals/:id/process')
  async processWithdrawal(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('transactionNo') transactionNo: string,
    @Body('remark') remark: string,
    @Request() req,
  ) {
    return this.adminService.processWithdrawal(
      id,
      status as any,
      transactionNo,
      remark,
      req.user.adminId,
    );
  }

  // Package Management
  @UseGuards(AuthGuard('jwt'))
  @Get('packages')
  async getPackages() {
    return this.adminService.getPackages();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('packages/:id')
  async getPackage(@Param('id') id: string) {
    return this.adminService.getPackage(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('packages')
  async createPackage(
    @Body()
    dto: {
      name: string;
      type: string;
      price: number;
      description?: string;
      features?: string[];
    },
  ) {
    return this.adminService.createPackage(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('packages/:id')
  async updatePackage(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      type?: string;
      price?: number;
      description?: string;
      features?: string[];
      status?: string;
    },
  ) {
    return this.adminService.updatePackage(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('packages/:id')
  async deletePackage(@Param('id') id: string) {
    return this.adminService.deletePackage(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('packages/:id/status')
  async updatePackageStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updatePackageStatus(id, status);
  }
}
