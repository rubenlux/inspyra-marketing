import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List team members' })
  findAll(@CurrentUser() user: JwtPayload, @Query() q: PaginationDto) {
    return this.service.findAll(user.tenantId, q.page, q.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Invite a new team member' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a team member' })
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.deactivate(id, user.tenantId);
  }
}
