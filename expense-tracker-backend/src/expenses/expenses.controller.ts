import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

/**
 * Toàn bộ route trong controller này yêu cầu đăng nhập (JwtAuthGuard).
 * request.user được JwtStrategy gắn vào — chứa { id, email, name }.
 */
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // POST /api/expenses -> 201 Created
  @Post()
  create(@Req() req, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.id, dto);
  }

  // GET /api/expenses?category=&month=&page=&limit=
  @Get()
  findAll(@Req() req, @Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(req.user.id, query);
  }

  // GET /api/expenses/summary?year=2026 (biểu đồ bonus)
  @Get('summary')
  summary(@Req() req, @Query('year') year?: string) {
    const y = Number(year ?? new Date().getFullYear());
    return this.expensesService.monthlySummary(req.user.id, y);
  }

  // GET /api/expenses/:id
  @Get(':id')
  findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.expensesService.findOne(req.user.id, id);
  }

  // PATCH /api/expenses/:id
  @Patch(':id')
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(req.user.id, id, dto);
  }

  // DELETE /api/expenses/:id -> 204 No Content
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    await this.expensesService.remove(req.user.id, id);
  }
}
