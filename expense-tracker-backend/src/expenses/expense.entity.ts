import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

/**
 * Entity Expense — bảng chi tiêu của người dùng.
 * Cột userId là FOREIGN KEY trỏ tới users.id:
 *   - đảm bảo mỗi khoản chi tiêu gắn với đúng 1 user
 *   - ON DELETE CASCADE: xóa user thì chi tiêu của họ cũng bị xóa
 */
@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: string; // dùng string để tránh mất số thập phân (đặc thù decimal trong JS)

  @Column({ length: 50 })
  category: string; // trường phân loại — yêu cầu bắt buộc của đề

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ length: 20, default: 'cash' })
  paymentMethod: string; // cash | card | bank_transfer

  // KHÔNG có @Column — đây là cột FK thật trong DB
  @Index()
  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
