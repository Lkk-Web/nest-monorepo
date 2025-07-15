import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { MiService } from '../base/base.service'
import { MicroserviceTokenVerifyDto } from '../base/base.dto'

@Controller()
export class MicroserviceAuthController {
  constructor(private readonly miService: MiService) {}

  @MessagePattern('auth.verify.token')
  async verifyToken(@Payload() data: { token: string; platform: string; serviceId: string }) {
    try {
      console.log('[MicroserviceAuthController] 收到token验证请求:', data)

      const dto: MicroserviceTokenVerifyDto = {
        token: data.token,
        platform: data.platform as any,
      }

      const result = await this.miService.verifyMicroserviceToken(dto)

      console.log('[MicroserviceAuthController] token验证成功:', result)
      return result
    } catch (error) {
      console.error('[MicroserviceAuthController] token验证失败:', error.message)
      return {
        valid: false,
        message: error.message || 'Token验证失败',
      }
    }
  }

  @MessagePattern('auth.health.check')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth',
    }
  }
}
