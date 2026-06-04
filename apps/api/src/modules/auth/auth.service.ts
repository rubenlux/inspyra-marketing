import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string) {
    const slug = dto.tenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existingTenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      throw new ConflictException('Tenant already exists');
    }

    const hash = await argon2.hash(dto.password);

    const tenant = await this.prisma.tenant.create({
      data: { name: dto.tenantName, slug },
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        password: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'ADMIN',
      },
    });

    return this.issueTokens(user, tenant.id, ipAddress);
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user, user.tenantId, ipAddress);
  }

  async refresh(dto: RefreshTokenDto) {
    const session = await this.prisma.userSession.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = session.user;

    // Rotate refresh token
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user, user.tenantId);
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.userSession.updateMany({
      where: { userId, refreshToken },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        tenant: { select: { id: true, name: true, slug: true, plan: true } },
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async issueTokens(
    user: { id: string; email: string; tenantId: string; role: string },
    tenantId: string,
    ipAddress?: string,
  ) {
    const payload = { sub: user.id, email: user.email, tenantId, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.secret'),
      expiresIn: this.config.get<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        ipAddress,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
