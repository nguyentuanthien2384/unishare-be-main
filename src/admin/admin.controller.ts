import {
  Controller,
  Post,
  Param,
  UseGuards,
  Patch,
  Body,
  Delete,
  Get,
  Query,
  Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { GetDocumentsQueryDto } from '../documents/dto/get-documents-query.dto';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('users/:id/reset-password')
  resetPassword(
    @Param('id') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.resetPassword(userId, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('users/:id/block')
  blockUser(
    @Param('id') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.blockUser(userId, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('users/:id/unblock')
  unblockUser(
    @Param('id') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.unblockUser(userId, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('documents/:id/block')
  blockDocument(
    @Param('id') docId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.blockDocument(docId, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('documents/:id/unblock')
  unblockDocument(
    @Param('id') docId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.unblockDocument(docId, req.user.userId);
  }

  @Roles(UserRole.ADMIN)
  @Delete('users/:id')
  deleteUser(
    @Param('id') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.deleteUser(userId, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Get('documents')
  getDocumentsAdmin(@Query() queryDto: GetDocumentsQueryDto) {
    return this.adminService.getDocumentsAdmin(queryDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('documents/:id')
  deleteDocument(
    @Param('id') docId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.deleteDocument(docId, req.user.userId);
  }

  @Roles(UserRole.ADMIN)
  @Patch('users/:id/role')
  setUserRole(
    @Param('id') userId: string,
    @Body('role') role: UserRole,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.setUserRole(userId, role, req.user.userId);
  }

  @Roles(UserRole.ADMIN)
  @Post('delegate-admin/:id')
  delegateAdmin(
    @Param('id') targetUserId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adminService.delegateAdmin(targetUserId, req.user.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Get('users')
  getUsers(@Query() queryDto: GetUsersQueryDto) {
    return this.adminService.getUsers(queryDto);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('subjects')
  createSubject(@Body() createSubjectDto: CreateSubjectDto) {
    return this.adminService.createSubject(createSubjectDto);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Get('subjects')
  findAllSubjects() {
    return this.adminService.findAllSubjects();
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Patch('subjects/:id')
  updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.adminService.updateSubject(id, updateSubjectDto);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Delete('subjects/:id')
  removeSubject(@Param('id') id: string) {
    return this.adminService.removeSubject(id);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Post('majors')
  createMajor(@Body() createMajorDto: CreateMajorDto) {
    return this.adminService.createMajor(createMajorDto);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Get('majors')
  findAllMajors() {
    return this.adminService.findAllMajors();
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Patch('majors/:id')
  updateMajor(
    @Param('id') id: string,
    @Body() updateMajorDto: UpdateMajorDto,
  ) {
    return this.adminService.updateMajor(id, updateMajorDto);
  }

  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Delete('majors/:id')
  removeMajor(@Param('id') id: string) {
    return this.adminService.removeMajor(id);
  }
}
