import { OpenAuthorize } from '@core/decorator/authorize'
import { ClientController } from '@core/decorator/controller'
import { Body, Get, HttpCode, HttpException, HttpStatus, Param, Post, Query, Req, Request, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ChangePasswordDto, JoinClassDto, QueryUserListDto, ResetPasswordDto, TokenGetUserDto, UpdateUserDto, UserLoginDto } from './mi.dto'
import { MiService } from './mi.service'
import { CurrentAdmin, CurrentPage, CurrentUser } from '@core/decorator/request'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileUploadDto } from '../../file/file.dto'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'
import { Express } from 'express'
import { FileService } from '@modules/file/file.service'
import { FileSizeValidationPipe } from '@core/pipe/fileSizeValidationPipe'
import { Pagination } from '@common/interface'

@ApiTags('我的')
@ApiBearerAuth()
@ClientController('mi')
export class MiController {
  constructor(private readonly service: MiService, private readonly fileService: FileService) {}

  @ApiOperation({ summary: '登录' })
  @OpenAuthorize()
  @Post('login')
  async postToken(@Body(new CensorParamPipe()) dto: UserLoginDto) {
    return await this.service.postToken(dto)
  }

  @ApiOperation({ summary: '根据token获取用户信息' })
  @OpenAuthorize()
  @Post('info')
  async getUserInfo(@Body(new CensorParamPipe()) dto: TokenGetUserDto) {
    return await this.service.tokenGetUser(dto)
  }

  @ApiOperation({ summary: '文件上传示例' })
  @OpenAuthorize()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    description: '文件上传',
    type: FileUploadDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('upload')
  async upload(@UploadedFile(new FileSizeValidationPipe(1024 * 100)) file: Express.Multer.File, @Req() req) {
    if (!file) throw new HttpException(null, 400014)
    file.originalname = req.headers['filename'] || file.originalname
    const result = await this.fileService.uploadFile(file)
    return result
  }

  @ApiOperation({ summary: '修改用户信息' })
  @Post('updateInfo')
  async updateUserInfo(@Body(new CensorParamPipe()) dto: UpdateUserDto, @CurrentUser() admin: any) {
    return await this.service.updateUserInfo(admin.id, dto)
  }

  @ApiOperation({ summary: '重置密码' })
  @HttpCode(HttpStatus.OK)
  @Post('resetPassword')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req) {
    const user = req.user
    return this.service.resetPassword(dto, user)
  }

  @ApiOperation({ summary: '获取用户列表' })
  @Get('users')
  async getUserList(@Param() param, @Query() query: QueryUserListDto, @CurrentPage() pagination: Pagination, @Req() req) {
    const user = req.user
    return await this.service.getUserList(query, pagination, user)
  }

  @ApiOperation({ summary: '修改密码' })
  @HttpCode(HttpStatus.OK)
  @Post('changePassword')
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: any) {
    return this.service.changePassword(dto, user)
  }
}
