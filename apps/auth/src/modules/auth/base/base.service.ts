import { Injectable, HttpException } from '@nestjs/common'
import { TokenGetUserDto, UserLoginDto, UserRegisterDto, MicroserviceTokenVerifyDto, RefreshTokenDto, LogoutDto } from './base.dto'
import { User } from '@model/user'
import { PLATFORM } from '@common/enum'
import { CryptoUtil, jwtDecode, jwtEncodeInExpire } from '@library/utils/crypt.util'
import { Aide } from '@library/utils/aide'
import { literal, Op, Sequelize } from 'sequelize'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'
import * as crypto from 'crypto'
import { TokenInfo } from '@model/tokenInfo'
import { DtoPipe } from '@core/pipe'

@Injectable()
export class MiService {
  async register(dto: UserRegisterDto) {
    // 检查手机号是否已存在
    const existingUser = await User.findOne({
      where: { phone: dto.phone },
    })

    if (existingUser) {
      throw new HttpException('手机号已被注册', 400018)
    }

    // 加密密码
    const encryptedPassword = CryptoUtil.sm4Encryption(dto.password)

    // 创建用户
    const user = await User.create({
      name: dto.name,
      phone: dto.phone,
      password: encryptedPassword,
    })

    const userJson = user.toJSON()
    delete userJson.password // 隐藏密码

    return {
      user: userJson,
      message: '注册成功，请登录',
    }
  }

  async postToken(dto: UserLoginDto, ipAddress?: string, userAgent?: string) {
    // 登陆获取用户信息
    let user = await User.findOne({
      where: { phone: dto.username },
    })
    dto.password = CryptoUtil.sm4Encryption(dto.password)
    if (user) {
      // 验证密码
      if (user.dataValues.password !== dto.password) throw new HttpException('密码错误', 400017)
    }

    // 生成访问token和刷新token
    const accessToken = jwtEncodeInExpire({
      platform: dto.platform,
      id: user.id,
    })

    const refreshToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2小时
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天

    // 检查是否已存在相同平台和设备的token
    const existingToken = await TokenInfo.findOne({
      where: {
        userId: user.id,
        platform: dto.platform,
        deviceId: dto.deviceId || null,
        isActive: true,
      },
    })

    if (existingToken) {
      // 更新现有token
      await existingToken.update({
        token: accessToken,
        refreshToken: refreshToken,
        expiresAt: expiresAt,
        refreshExpiresAt: refreshExpiresAt,
        ipAddress: ipAddress,
        userAgent: userAgent,
        lastUsedAt: new Date(),
      })
    } else {
      // 创建新token记录
      await TokenInfo.create({
        userId: user.id,
        token: accessToken,
        platform: dto.platform,
        deviceId: dto.deviceId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        expiresAt: expiresAt,
        refreshToken: refreshToken,
        refreshExpiresAt: refreshExpiresAt,
        lastUsedAt: new Date(),
        isActive: true,
      })
    }

    const userJson = user.toJSON()
    delete userJson.password // 隐藏密码

    return {
      accessToken,
      refreshToken,
      expiresIn: 7200, // 2小时
      user: userJson,
    }
  }

  async tokenGetUser(dto: TokenGetUserDto) {
    // 解码 JWT token
    let payload = jwtDecode(dto.token)
    console.log('payload', payload)
    if (!payload || !payload.id) {
      throw new HttpException('无效的token', 401)
    }

    // 验证 token 是否在数据库中存在且有效
    const tokenRecord = await TokenInfo.findOne({
      where: {
        token: dto.token,
        isActive: true,
        userId: payload.id,
      },
    })

    if (!tokenRecord) {
      throw new HttpException('token不存在或已失效', 401)
    }

    // 检查 token 是否过期
    if (new Date() > tokenRecord.expiresAt) {
      await tokenRecord.update({ isActive: false })
      throw new HttpException('token已过期', 401)
    }

    // 获取用户信息
    const user = await User.findOne({
      where: { id: payload.id },
      include: {
        association: 'tokenInfo',
        attributes: ['platform', 'refreshToken', 'expiresAt', 'refreshExpiresAt', 'lastUsedAt', 'isActive'],
        where: {
          token: dto.token,
        },
      },
    })

    if (!user) {
      throw new HttpException('用户不存在', 404)
    }

    // 更新 token 最后使用时间
    await tokenRecord.update({ lastUsedAt: new Date() })

    // 隐藏敏感信息
    const userJson = user.toJSON()
    delete userJson.password

    return {
      code: 200,
      message: '获取用户信息成功',
      data: {
        user: userJson,
      },
    }
  }

  async refreshToken(dto: RefreshTokenDto, clientInfo?: any) {
    const tokenRecord = await TokenInfo.findOne({
      where: {
        refreshToken: dto.refreshToken,
        isActive: true,
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    })

    if (!tokenRecord) {
      throw new HttpException('无效的刷新token', 401)
    }

    if (new Date() > tokenRecord.refreshExpiresAt) {
      await tokenRecord.update({ isActive: false })
      throw new HttpException('刷新token已过期', 401)
    }

    // 生成新的访问token
    const newAccessToken = jwtEncodeInExpire({
      platform: tokenRecord.platform,
      id: tokenRecord.userId,
    })

    const newRefreshToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2小时
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天

    await tokenRecord.update({
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAt,
      refreshExpiresAt: refreshExpiresAt,
      lastUsedAt: new Date(),
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 7200,
    }
  }

  async logout(dto: LogoutDto, currentUser: User) {
    const where: any = {
      userId: currentUser.id,
      isActive: true,
    }

    if (dto.platform) {
      where.platform = dto.platform
    }

    if (dto.deviceId) {
      where.deviceId = dto.deviceId
    }

    await TokenInfo.update({ isActive: false }, { where })

    return { message: '退出登录成功' }
  }

  async verifyMicroserviceToken(dto: MicroserviceTokenVerifyDto, clientInfo?: any) {
    const payload = jwtDecode(dto.token)
    if (!payload || !payload.id) {
      throw new HttpException('无效的token', 401)
    }

    const tokenRecord = await TokenInfo.findOne({
      where: {
        token: dto.token,
        isActive: true,
      },
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    })

    if (!tokenRecord) {
      throw new HttpException('token不存在或已失效', 401)
    }

    if (new Date() > tokenRecord.expiresAt) {
      await tokenRecord.update({ isActive: false })
      throw new HttpException('token已过期', 401)
    }

    // 更新最后使用时间
    await tokenRecord.update({ lastUsedAt: new Date() })

    return {
      valid: true,
      user: {
        id: tokenRecord.dataValues.user.id,
        phone: tokenRecord.dataValues.user.phone,
        name: tokenRecord.dataValues.user.name,
        platform: tokenRecord.dataValues.platform,
      },
    }
  }

  async getUserTokens(userId: number, platform?: string) {
    const where: any = {
      userId: userId,
      isActive: true,
    }

    if (platform) {
      where.platform = platform
    }

    const tokens = await TokenInfo.findAll({
      where,
      attributes: ['id', 'platform', 'deviceId', 'ipAddress', 'userAgent', 'lastUsedAt', 'expiresAt'],
      order: [['lastUsedAt', 'DESC']],
    })

    return { tokens }
  }

  async revokeToken(tokenId: number, userId: number) {
    const token = await TokenInfo.findOne({
      where: {
        id: tokenId,
        userId: userId,
        isActive: true,
      },
    })

    if (!token) {
      throw new HttpException('Token不存在或无权限操作', 404)
    }

    await token.update({ isActive: false })

    return { message: 'Token已成功撤销' }
  }
}
