import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';

// PartialType: tất cả field của CreateExpenseDto đều trở thành OPTIONAL
// => khi update chỉ cần gửi field muốn sửa
export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
