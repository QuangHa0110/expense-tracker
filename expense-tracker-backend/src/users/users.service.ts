import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(email: string, name: string, passwordHash: string): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      // 409 Conflict: email đã được đăng ký
      throw new ConflictException('Email này đã được đăng ký');
    }
    const user = this.usersRepository.create({ email, name, password: passwordHash });
    return this.usersRepository.save(user);
  }
}
