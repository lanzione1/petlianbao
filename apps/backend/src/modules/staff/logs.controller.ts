import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffService } from './staff.service';

class QueryLogsDto {
  staffId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

@Controller('logs')
@UseGuards(AuthGuard('jwt'))
export class LogsController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Request() req, @Query() query: QueryLogsDto) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以查看操作日志');
    }
    return this.staffService.findLogs(req.user.merchantId, {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }
}
