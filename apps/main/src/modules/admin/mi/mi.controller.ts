import { Post, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { MiService } from './mi.service'
import { FileService } from '@modules/file/file.service'
import { AdminAuth } from '@core/decorator/controller'
import { CurrentUser } from '@core/decorator/request'

@ApiTags('我的')
@ApiBearerAuth()
@AdminAuth('mi')
export class MiController {
  constructor(private readonly service: MiService, private readonly fileService: FileService) {}

  @ApiOperation({ summary: 'API health check' })
  @Post('health')
  async postAutoToken(@Request() req, @CurrentUser() user: any) {
    return { message: 'success', code: 200, data: { user } }
  }
}
