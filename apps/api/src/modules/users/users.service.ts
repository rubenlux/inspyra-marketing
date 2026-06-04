import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { paginate, buildMeta } from '../../common/dto/pagination.dto';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  tenantId: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 20) {
    const { skip, take } = paginate(page, limit);
    const where = { tenantId, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: USER_SELECT, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: buildMeta(total, page, limit) };
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) throw new ConflictException('Email already in use');

    const hash = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        password: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || 'MEMBER',
      },
      select: USER_SELECT,
    });
  }

  async deactivate(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }
}
