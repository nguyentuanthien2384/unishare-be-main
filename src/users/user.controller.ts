import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Post,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/profile')
  updateMyProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/change-password')
  changeMyPassword(
    @Request() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.userId,
      changePasswordDto,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me/account')
  deleteMyAccount(
    @Request() req: AuthenticatedRequest,
    @Body('password') password: string,
  ) {
    return this.usersService.deleteOwnAccount(req.user.userId, password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/profile')
  getMyProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/stats')
  getMyStats(@Request() req: AuthenticatedRequest) {
    return this.usersService.getMyStats(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/upload-stats')
  getMyUploadStats(
    @Request() req: AuthenticatedRequest,
    @Query('period') period?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.usersService.getMyUploadStats(
      req.user.userId,
      period,
      fromDate,
      toDate,
    );
  }

  @Get('profile/:userId')
  getUserProfile(@Param('userId') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get(':userId/stats')
  getUserStats(@Param('userId') userId: string) {
    return this.usersService.getMyStats(userId);
  }

  @Get(':userId/profile')
  getUserProfileAlt(@Param('userId') userId: string) {
    return this.usersService.findById(userId);
  }
}
