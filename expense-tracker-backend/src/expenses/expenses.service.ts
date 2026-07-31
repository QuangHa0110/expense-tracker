import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Expense } from './expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
  ) {}

  /** Tạo khoản chi mới — userId LUÔN lấy từ token, không phải từ body */
  create(userId: number, dto: CreateExpenseDto) {
    const expense = this.expensesRepository.create({
      ...dto,
      // amount: number từ DTO -> string cho cột decimal của Postgres
      amount: String(dto.amount),
      userId,
    });
    return this.expensesRepository.save(expense);
  }

  /**
   * Lấy danh sách chi tiêu của MỘT user, có filter theo category/tháng + phân trang.
   * Điểm mấu chốt: WHERE userId = :userId — user chỉ thấy dữ liệu của mình.
   */
  async findAll(userId: number, query: QueryExpenseDto) {
    const { category, month, page = 1, limit = 20 } = query;

    const where: FindOptionsWhere<Expense> = { userId };

    if (category) {
      where.category = category;
    }

    if (month) {
      // month = '2026-07' -> lọc theo khoảng ngày [2026-07-01, 2026-07-31]
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(Date.UTC(year, mon - 1, 1));
      const end = new Date(Date.UTC(year, mon, 1));
      where.date = Between(
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
      );
    }

    const [items, total] = await this.expensesRepository.findAndCount({
      where,
      order: { date: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  /**
   * Tìm 1 khoản chi — PHẢI khớp cả id VÀ userId.
   * Nếu không thuộc về user, trả 404 (không phải 403) để
   * không tiết lộ rằng khoản chi đó tồn tại.
   */
  async findOne(userId: number, id: number) {
    const expense = await this.expensesRepository.findOne({
      where: { id, userId },
    });
    if (!expense) {
      throw new NotFoundException('Không tìm thấy khoản chi');
    }
    return expense;
  }

  async update(userId: number, id: number, dto: UpdateExpenseDto) {
    const expense = await this.findOne(userId, id); // check ownership trước
    Object.assign(expense, dto);
    return this.expensesRepository.save(expense);
  }

  async remove(userId: number, id: number) {
    const expense = await this.findOne(userId, id); // check ownership trước
    await this.expensesRepository.remove(expense);
    return { deleted: true, id };
  }

  /** Tổng chi tiêu theo tháng — dùng cho biểu đồ bonus */
  async monthlySummary(userId: number, year: number) {
    const rows = await this.expensesRepository
      .createQueryBuilder('expense')
      .select("TO_CHAR(expense.date, 'YYYY-MM')", 'month')
      .addSelect('SUM(expense.amount::numeric)', 'total')
      .where('expense.userId = :userId', { userId })
      .andWhere('expense.date >= :start', { start: `${year}-01-01` })
      .andWhere('expense.date <= :end', { end: `${year}-12-31` })
      .groupBy("TO_CHAR(expense.date, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return rows.map((r) => ({ month: r.month, total: Number(r.total) }));
  }
}
