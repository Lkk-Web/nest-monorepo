import { IsJSON, IsNotEmpty, IsString, ValidateIf } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UserLoginDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  @ApiProperty({ name: 'phone', required: true, description: '手机', type: String })
  phone: string

  @ApiProperty({ name: 'password', required: true, description: '密码', type: String })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string

  @ApiProperty({ name: 'name', required: false, description: '姓名', type: String })
  name?: string

  @ApiProperty({ name: 'gender', required: false, description: '性别(0:未知,1:男,2:女)', type: Number })
  gender?: number

  @ApiProperty({ name: 'firmName', required: false, description: '企业名称', type: String })
  firmName?: string

  @ApiProperty({ name: 'position', required: false, description: '职务', type: String })
  position?: string

  @ApiProperty({
    name: 'industry',
    required: false,
    description: '所属行业，必须是 JSON 字符串数组格式，例如：["机械制造","汽车及零部件"]',
    type: String,
  })
  @ValidateIf(o => o.industry !== undefined && o.industry !== null && o.industry !== '')
  @IsJSON({ message: '行业必须是有效的 JSON 字符串' })
  industry?: string

  @ApiProperty({ name: 'firmAvatar', required: false, description: '企业头像', type: String })
  firmAvatar?: string

  @ApiProperty({ name: 'product', required: false, description: '产品图片', type: String })
  product?: string

  @ApiProperty({ name: 'avatar', required: false, description: '用户头像', type: String })
  avatar?: string
}

export class UpdateUserDto {
  @ApiProperty({ name: 'name', required: false, description: '姓名', type: String })
  name?: string

  @ApiProperty({ name: 'gender', required: false, description: '性别(0:未知,1:男,2:女)', type: Number })
  gender?: number

  @ApiProperty({ name: 'firmName', required: false, description: '企业名称', type: String })
  firmName?: string

  @ApiProperty({ name: 'position', required: false, description: '职务', type: String })
  position?: string

  @ApiProperty({
    name: 'industry',
    required: false,
    description: '所属行业，必须是 JSON 字符串数组格式，例如：["机械制造","汽车及零部件"]',
    type: String,
  })
  @IsJSON({ message: '行业必须是有效的 JSON 字符串' })
  @ValidateIf(o => o.industry !== undefined && o.industry !== null && o.industry !== '')
  industry?: string

  @ApiProperty({ name: 'product', required: false, description: '产品图片', type: String })
  product?: string

  @ApiProperty({ name: 'firmAvatar', required: false, description: '企业头像', type: String })
  firmAvatar?: string

  @ApiProperty({ name: 'avatar', required: false, description: '用户头像', type: String })
  avatar?: string
}

export class JoinClassDto {
  @IsNotEmpty({ message: '班级ID不能为空' })
  @ApiProperty({ name: 'classId', required: true, description: '班级ID', type: Number })
  classId: number
}

export class TokenGetUserDto {
  @ApiProperty({ description: 'token' })
  @IsNotEmpty()
  @IsString()
  token: string
}

export class QueryUserListDto {
  @ApiProperty({
    description: '所属行业数组，JSON字符串格式，例如：["互联网", "教育"]',
    required: false,
  })
  @IsJSON({ message: '行业数组必须是JSON字符串' })
  @ValidateIf(o => o.industry !== undefined && o.industry !== null && o.industry !== '')
  industry?: string

  @ApiProperty({ name: 'firmName', required: false, description: '企业名称', type: String })
  firmName: string

  @ApiProperty({ name: 'classId', required: false, description: '班级ID', type: Number })
  classId: number

  @ApiProperty({ name: 'current', type: String, required: false, description: 'current' })
  current?: string

  @ApiProperty({ name: 'pageSize', type: String, required: false, description: 'pageSize' })
  pageSize?: string
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: '手机号不能为空' })
  @ApiProperty({ name: 'phone', required: true, description: '手机', type: String })
  phone: string
}

export class ChangePasswordDto {
  @IsNotEmpty({ message: '原密码不能为空' })
  @ApiProperty({ name: 'oldPassword', required: true, description: '原密码', type: String })
  oldPassword: string

  @IsNotEmpty({ message: '新密码不能为空' })
  @ApiProperty({ name: 'newPassword', required: true, description: '新密码', type: String })
  newPassword: string
}
