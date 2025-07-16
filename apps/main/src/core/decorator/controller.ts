import { PLATFORM } from '@common/enum'
import { applyDecorators, Controller, HttpCode, UseGuards } from '@nestjs/common'
import { MicroserviceAuthGuard } from '@core/guards/Auth.guard'
import { ApiResponse } from '@nestjs/swagger'

/**
 * 微服务鉴权
 */
export function ClientAuth(prefix: string) {
  return applyDecorators(Controller(`${PLATFORM.client}/v1/${prefix}`), UseGuards(MicroserviceAuthGuard))
}
export function AdminAuth(prefix: string) {
  return applyDecorators(Controller(`${PLATFORM.admin}/v1/${prefix}`), UseGuards(MicroserviceAuthGuard))
}

export function ApiRes(statusCode: number, config?: { desc?: string; type?: any }) {
  config = config || {}
  return applyDecorators(HttpCode(statusCode), ApiResponse({ status: statusCode, description: config.desc || '成功', type: config.type || Object }))
}
