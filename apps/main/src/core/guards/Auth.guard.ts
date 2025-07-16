import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AUTHORIZE_KEY_METADATA } from '@core/decorator/authorize'
import { ClientProxy } from '@nestjs/microservices'
import { firstValueFrom, timeout, catchError } from 'rxjs'
import { of } from 'rxjs'

@Injectable()
export class MicroserviceAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否跳过授权验证
    const skipAuth = this.reflector.getAllAndOverride<boolean>(AUTHORIZE_KEY_METADATA, [context.getHandler(), context.getClass()])

    if (skipAuth) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      throw new UnauthorizedException('缺少Authorization token')
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      throw new UnauthorizedException('Token格式错误')
    }

    // 从请求路径中提取平台信息
    const path = request.route?.path || request.url
    let platform = 'client' // 默认平台

    if (path.includes('/admin/')) {
      platform = 'admin'
    } else if (path.includes('/client/')) {
      platform = 'client'
    }

    try {
      // 发送微服务消息到Auth服务
      const result = await firstValueFrom(
        this.authClient
          .send('auth.verify.token', {
            token,
            platform,
            serviceId: 'main-service',
          })
          .pipe(
            timeout(5000), // 5秒超时
            catchError(error => {
              console.error('[MicroserviceAuthGuard] 微服务调用失败:', error.message)
              return of({ valid: false, message: error.message })
            })
          )
      )

      if (result.valid) {
        // 将用户信息附加到请求对象
        request.user = result.user
        console.log('[MicroserviceAuthGuard] 用户验证成功:', result.user.id, '平台:', platform)
        return true
      } else {
        throw new UnauthorizedException(result.message || 'Token验证失败')
      }
    } catch (error) {
      throw new UnauthorizedException('Token验证失败')
    }
  }
}
