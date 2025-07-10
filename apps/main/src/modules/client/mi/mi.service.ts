import { Injectable, HttpException } from '@nestjs/common'
import { ChangePasswordDto, QueryUserListDto, ResetPasswordDto, TokenGetUserDto, UpdateUserDto, UserLoginDto } from './mi.dto'
import { User } from '@model/user'
import { PLATFORM } from '@common/enum'
import { CryptoUtil, jwtDecode, jwtEncodeInExpire } from '@library/utils/crypt.util'
import { Aide } from '@library/utils/aide'
import { literal, Op, Sequelize } from 'sequelize'
import { Pagination } from '@common/interface'
import { FindPaginationOptions } from '@model/shared/interface'
import { Paging } from '@library/utils/paging'

@Injectable()
export class MiService {
  async postToken(dto: UserLoginDto) {
    // 登陆获取用户信息
    let user = await User.findOne({
      where: { phone: dto.phone },
      include: [
        {
          association: 'classes',
          attributes: ['id', 'name', 'avatar', 'introduction', 'maxMembers'],
          // through: { attributes: [] },
        },
      ],
    })
    dto.password = CryptoUtil.sm4Encryption(dto.password)
    if (user) {
      // 验证密码
      if (user.dataValues.password !== dto.password) throw new HttpException('密码错误', 400017)
    } else {
      // 注册
      if (dto.name && dto.avatar && dto.firmName && dto.position && dto.industry && dto.firmAvatar) {
        user = await User.create({
          phone: dto.phone,
          password: dto.password,
          name: dto.name,
          gender: dto.gender,
          firmName: dto.firmName,
          position: dto.position,
          industry: dto.industry,
          firmAvatar: dto.firmAvatar,
          avatar: dto.avatar,
        })
      } else {
        throw new HttpException('用户不存在，请提供完整注册信息', 404)
      }
    }

    const userJson = user.toJSON()
    delete userJson.password // 隐藏密码

    return {
      token: jwtEncodeInExpire({
        platform: PLATFORM.client,
        id: user.id,
      }),
      user: userJson,
    }
  }

  async tokenGetUser(dto: TokenGetUserDto) {
    let payload = jwtDecode(dto.token)
    if (!payload || !payload.id) {
      Aide.throwException(400008)
    }
    if (payload.platform != PLATFORM.client) Aide.throwException(400005)
    const user = await User.findOne({
      where: { id: payload.id },
      include: [
        {
          association: 'classes',
          attributes: ['id', 'name', 'avatar', 'introduction', 'maxMembers'],
          // through: { attributes: [] },
        },
      ],
    })

    delete user.password // 隐藏密码
    return {
      code: 200,
      message: '获取用户信息',
      data: user,
    }
  }

  async updateUserInfo(userId: number, dto: UpdateUserDto) {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new HttpException('用户不存在', 400013)
    }

    await user.update(dto)

    const userJson = user.toJSON()
    delete userJson.password
    return userJson
  }

  async getUserList(query: QueryUserListDto, pagination: Pagination, currentUser: User) {
    let where: any = {}
    let order: any = []
    let current_class = await User.findOne({
      where: { id: currentUser.id },
      include: [{ association: 'classes', attributes: ['id'], through: { attributes: [] } }],
    })
    where[Op.not] = { id: currentUser.id }

    if (query.firmName) {
      where[Op.and] = { firmName: { [Op.like]: `%${query.firmName}%` } }
    }

    // 如果提供了行业名称，添加查询条件
    if (query.industry) {
      where[Op.or] = []
      JSON.parse(query.industry).forEach((industry: string) => {
        const value = JSON.stringify([industry])
        where[Op.or].push(Sequelize.literal(`JSON_CONTAINS(CAST(User.industry AS JSON), '${value}')`))
      })
    }

    if (current_class.dataValues.classes.length > 0) {
      order = [
        [
          Sequelize.literal(`CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM user_class 
          WHERE user_class.userId = User.id AND user_class.classId = ${current_class.dataValues.classes[0].id}
        ) THEN 0 ELSE 1 END`),
          'ASC',
        ],
      ]
    }

    const options: FindPaginationOptions = {
      where, // 如果没有查询条件，使用空对象
      attributes: ['id', 'name', 'avatar', 'gender', 'firmName', 'position', 'industry', 'firmAvatar', 'phone', 'product'],
      include: [
        {
          association: 'classes',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
      order,
      pagination,
    }

    if (query.classId) {
      options.include[0].where = { id: query.classId }
    }

    const result = await Paging.diyPaging(User, pagination, options)

    return result
  }

  public async resetPassword(dto: ResetPasswordDto, currentUser: User) {
    currentUser = await User.findByPk(currentUser.id)
    if (currentUser.roleId !== 1) throw new HttpException('Forbidden，无权限', 403)
    const userToReset = await User.findOne({ where: { phone: dto.phone } })
    if (!userToReset) {
      throw new HttpException('用户不存在', 404)
    }

    if (userToReset.roleId === 1) {
      throw new HttpException('无权重置管理员密码', 403)
    }

    const newPassword = userToReset.phone.slice(-6) // 新密码为手机号后六位
    const hashedPassword = CryptoUtil.sm4Encryption(newPassword)
    await User.update({ password: hashedPassword }, { where: { phone: dto.phone } })
    return { message: '密码重置成功' }
  }

  public async changePassword(dto: ChangePasswordDto, currentUser: User) {
    const user = await User.findByPk(currentUser.id)
    if (!user) {
      throw new HttpException('用户不存在', 404)
    }

    // 验证原密码
    const oldPassword = CryptoUtil.sm4Encryption(dto.oldPassword)
    if (user.password !== oldPassword) {
      throw new HttpException('原密码错误', 400017)
    }

    // 更新新密码
    const newPassword = CryptoUtil.sm4Encryption(dto.newPassword)
    await user.update({ password: newPassword })

    return { message: '密码修改成功' }
  }
}
