import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me/profile')
  updateMyProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, updateUserDto);
  }

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

  @Get('profile/:userId')
  getUserProfile(@Param('userId') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get('me/profile')
  getMyProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @Get('me/stats')
  getMyStats(@Request() req: AuthenticatedRequest) {
    return this.usersService.getMyStats(req.user.userId);
  }

  @Get(':userId/stats')
  getUserStats(@Param('userId') userId: string) {
    return this.usersService.getMyStats(userId);
  }
}
