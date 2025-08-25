import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, RegisterWithAvatarDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto, RequestOtpDto, VerifyOtpDto, LoginWithOtpDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-with-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a new user with avatar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullname: { type: 'string', example: 'John Doe' },
        age: { type: 'number', example: 25 },
        gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
        email: { type: 'string', example: 'john@example.com' },
        password: { type: 'string', example: 'Test123!' },
        avatar: { type: 'string', format: 'binary', description: 'Avatar image file (JPG/PNG, max 5MB)' },
      },
      required: ['fullname', 'age', 'gender', 'email', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully with avatar' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  async registerWithAvatar(
    @Body() registerDto: RegisterWithAvatarDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.authService.registerWithAvatar(registerDto, file);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@CurrentUser() user: any, @Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(user.id, refreshTokenDto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logout from all devices successful' })
  async logoutAll(@CurrentUser() user: any) {
    return this.authService.logoutAll(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if email exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('login-with-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/password and receive OTP for 2FA' })
  @ApiResponse({ status: 200, description: 'Credentials validated, OTP sent for verification' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginWithOtp(@Body() loginWithOtpDto: LoginWithOtpDto) {
    return this.authService.loginWithOtp(loginWithOtpDto);
  }

  @Post('verify-otp-complete-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and complete login (works for both 2FA and direct OTP)' })
  @ApiResponse({ status: 200, description: 'Login successful with valid OTP' })
  @ApiResponse({ status: 401, description: 'Invalid OTP, session, or credentials' })
  async verifyOtpCompleteLogin(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtpAndCompleteLogin(verifyOtpDto);
  }

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for direct login (alternative to password)' })
  @ApiResponse({ status: 200, description: 'OTP sent if email exists and is active' })
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for direct login (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'Login successful with valid OTP' })
  @ApiResponse({ status: 401, description: 'Invalid OTP or credentials' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtpAndLogin(verifyOtpDto);
  }
}
