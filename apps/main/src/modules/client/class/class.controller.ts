import { Body, Param, Post, Get, Put, Delete, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ClientController } from '@core/decorator/controller'
import { CurrentAdmin, CurrentUser } from '@core/decorator/request'
import { CensorParamPipe } from '@core/pipe/censorParam.pipe'
import { ClassService } from './class.service'
import { CreateClassDto, QueryClassListDto, UpdateClassDto } from './class.dto'

@ApiTags('班级')
@ApiBearerAuth()
@ClientController('classes') // 使用复数形式
export class ClassController {
  constructor(private readonly service: ClassService) {}

  @ApiOperation({ summary: '创建班级' })
  @Post('create')
  async createClass(@Body(new CensorParamPipe()) dto: CreateClassDto, @CurrentUser() user: any) {
    return await this.service.createClass(user.id, dto)
  }

  @ApiOperation({ summary: '更新班级信息' })
  @Put(':id')
  async updateClass(@Param('id') id: number, @Body(new CensorParamPipe()) dto: UpdateClassDto, @CurrentUser() user: any) {
    return await this.service.updateClass(id, user.id, dto)
  }

  @ApiOperation({ summary: '删除班级' })
  @Delete(':id')
  async deleteClass(@Param('id') id: number, @CurrentUser() user: any) {
    return await this.service.deleteClass(id, user.id)
  }

  @ApiOperation({ summary: '获取班级详情' })
  @Get(':id')
  async getClassDetail(@Param('id') id: number) {
    return await this.service.getClassDetail(id)
  }

  @ApiOperation({ summary: '获取班级列表' })
  @Get()
  async getClassList(@Param() param, @Query() query: QueryClassListDto) {
    return await this.service.getClassList(query)
  }

  @ApiOperation({ summary: '加入班级' })
  @Post(':id/join')
  async joinClass(@Param('id') id: number, @CurrentUser() user: any) {
    return await this.service.joinClass(user.id, id)
  }

  @ApiOperation({ summary: '退出班级' })
  @Post(':id/quit')
  async quitClass(@Param('id') id: number, @CurrentUser() user: any) {
    return await this.service.quitClass(user.id, id)
  }
}
