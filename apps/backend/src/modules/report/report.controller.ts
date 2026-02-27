import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('daily')
  getDailyReport(@Request() req, @Query('date') date?: string) {
    return this.reportService.getDailyReport(req.user.merchantId, date);
  }

  @Get('monthly')
  getMonthlyReport(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    return this.reportService.getMonthlyReport(
      req.user.merchantId,
      Number(year) || now.getFullYear(),
      Number(month) || now.getMonth() + 1,
    );
  }

  @Get('customers')
  getCustomerReport(@Request() req) {
    return this.reportService.getCustomerReport(req.user.merchantId);
  }

  @Get('services')
  getServiceReport(@Request() req) {
    return this.reportService.getServiceReport(req.user.merchantId);
  }
}
