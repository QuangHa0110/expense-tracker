import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Expense } from './expenses/expense.entity';
import { ExpensesModule } from './expenses/expenses.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Đọc biến môi trường từ .env, global cho mọi module
    ConfigModule.forRoot({ isGlobal: true }),

    // Kết nối database qua TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url:
          config.get<string>('DATABASE_URL') ??
          'postgres://postgres:postgres@localhost:5432/expense_tracker',
        entities: [User, Expense],
        // Tự tạo bảng khi dev (an toàn cho đồ án); production nên dùng migration
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    UsersModule,
    AuthModule,
    ExpensesModule,
  ],
})
export class AppModule {}
