import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EXPENSE_CATEGORIES } from './create-expense.dto';

/**
 * Query DTO cho GET /api/expenses
 * Filter: ?category=food&month=2026-07&page=1&limit=20
 */
export class QueryExpenseDto {
  @IsOptional()
  @IsIn(EXPENSE_CATEGORIES, { message: 'Danh mục không hợp lệ' })
  category?: string;

  @IsOptional()
  @IsString()
  month?: string; // định dạng YYYY-MM

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
