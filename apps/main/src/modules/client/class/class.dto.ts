import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsInt, Min, Max, Length, Matches } from 'class-validator'

export class CreateClassDto {
  @ApiProperty({ description: '班级名称', required: true, example: '2024春季班' })
  @IsString({ message: '班级名称必须是字符串' })
  @Length(2, 50, { message: '班级名称长度必须在2-50个字符之间' })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9\s-]+$/, {
    message: '班级名称只能包含中文、英文、数字、空格和连字符',
  })
  name: string

  @ApiProperty({ description: '班级介绍', required: false })
  @IsOptional()
  @IsString({ message: '班级介绍必须是字符串' })
  @Length(0, 1000, { message: '班级介绍不能超过1000个字符' })
  introduction?: string

  @ApiProperty({ description: '班级头像', required: false })
  @IsOptional()
  @IsString({ message: '班级头像必须是字符串' })
  @Length(0, 255, { message: '班级头像URL不能超过255个字符' })
  // @Matches(/^(http|https):\/\/[^\s/$.?#].[^\s]*$/, {
  //   message: '班级头像必须是有效的URL地址',
  // })
  avatar?: string

  @ApiProperty({ description: '班级上限人员数', required: false, minimum: 1, maximum: 500, default: 100 })
  @IsOptional()
  @IsInt({ message: '班级上限人数必须是整数' })
  @Min(1, { message: '班级最少需要1人' })
  @Max(500, { message: '班级最多支持500人' })
  maxMembers?: number
}

export class UpdateClassDto extends CreateClassDto {}


export class JoinClassDto {
  @ApiProperty({ description: '班级ID', required: true })
  @IsInt({ message: '班级ID必须是整数' })
  @Min(1, { message: '班级ID必须大于0' })
  classId: number;
}

export class QueryClassListDto {
  @ApiProperty({ description: '班级名称', required: false })
  @IsOptional()
  @IsString({ message: '班级名称必须是字符串' })
  @Length(0, 50, { message: '班级名称不能超过50个字符' })
  name?: string;
}