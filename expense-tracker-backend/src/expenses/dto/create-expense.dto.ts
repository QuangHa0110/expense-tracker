import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Danh sách category hợp lệ — client gửi category khác sẽ bị 400
export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'housing',
  'entertainment',
  'health',
  'education',
  'shopping',
  'other',
] as const;

export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer'] as const;

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(200, { message: 'Tiêu đề tối đa 200 ký tự' })
  title: string;

  @IsNumber({}, { message: 'Số tiền phải là số' })
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  amount: number;

  @IsIn(EXPENSE_CATEGORIES, { message: 'Danh mục không hợp lệ' })
  category: string;

  @IsDateString({}, { message: 'Ngày không đúng định dạng YYYY-MM-DD' })
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Ghi chú tối đa 1000 ký tự' })
  note?: string;

  @IsOptional()
  @IsIn(PAYMENT_METHODS, { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod?: string;
}
