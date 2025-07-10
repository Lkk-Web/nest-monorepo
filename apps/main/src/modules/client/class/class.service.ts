import { Injectable, HttpException } from '@nestjs/common'
import { CreateClassDto, QueryClassListDto, UpdateClassDto } from './class.dto'
import { Class } from '@model/class'
import { User } from '@model/user'
import { UserClass } from '@model/userClass'
import { Op } from 'sequelize'

@Injectable()
export class ClassService {
  async createClass(userId: number, dto: CreateClassDto) {
    // 检查用户创建的班级数量是否超过限制
    const userClassCount = await Class.count({
      where: { creatorId: userId },
    })

    if (userClassCount >= 1) {
      throw new HttpException('每个用户最多只能创建1个班级', 400020)
    }

    // 检查班级名称是否已存在
    const existingClass = await Class.findOne({
      where: { name: dto.name },
    })

    if (existingClass) {
      throw new HttpException('班级名称已存在', 400021)
    }

    // 设置默认值
    const classData = {
      ...dto,
      creatorId: userId,
      maxMembers: dto.maxMembers || 100, // 如果未指定，默认100人
    }

    const newClass = await Class.create(classData)
    // 创建用户-班级关联
    await UserClass.create({ userId, classId: newClass.id })
    return newClass
  }

  async updateClass(classId: number, userId: number, dto: UpdateClassDto) {
    const targetClass = await Class.findByPk(classId)
    if (!targetClass) {
      throw new HttpException('班级不存在', 400015)
    }

    if (targetClass.creatorId !== userId) {
      throw new HttpException('只有创建者可以修改班级信息', 400018)
    }

    await targetClass.update(dto)
    return targetClass
  }

  async deleteClass(classId: number, userId: number) {
    const targetClass = await Class.findByPk(classId)
    if (!targetClass) {
      throw new HttpException('班级不存在', 400015)
    }

    if (targetClass.creatorId !== userId) {
      throw new HttpException('只有创建者可以删除班级', 400019)
    }

    // 删除班级成员关联
    await UserClass.destroy({
      where: { classId },
    })

    // 删除班级
    await targetClass.destroy()

    return {
      message: '删除班级成功',
    }
  }

  async getClassDetail(classId: number) {
    const targetClass = await Class.findByPk(classId, {
      include: [
        { association: 'creator', attributes: ['id', 'name', 'phone'] },
        {
          association: 'users',
          attributes: ['id', 'name', 'avatar', 'phone', 'firmName', 'position', 'industry', 'firmAvatar', 'product'],
          through: { attributes: [] },
        },
      ],
    })

    if (!targetClass) {
      throw new HttpException('班级不存在', 400015)
    }

    // 获取班级成员数量
    const memberCount = await UserClass.count({
      where: { classId },
    })

    return {
      ...targetClass.toJSON(),
      memberCount,
    }
  }

  async getClassList(query: QueryClassListDto) {
    const where: any = {}

    // 如果提供了班级名称，添加模糊查询条件
    if (query.name) {
      where.name = {
        [Op.like]: `%${query.name}%`,
      }
    }

    const classes = await Class.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'avatar'],
        },
      ],
    })

    // 获取每个班级的成员数量
    const classesWithMemberCount = await Promise.all(
      classes.map(async cls => {
        const memberCount = await UserClass.count({
          where: { classId: cls.id },
        })
        return {
          ...cls.toJSON(),
          memberCount,
        }
      })
    )

    return classesWithMemberCount
  }

  async joinClass(userId: number, classId: number) {
    // 检查班级是否存在
    const targetClass = await Class.findByPk(classId)
    if (!targetClass) {
      throw new HttpException('班级不存在', 400015)
    }

    // 检查用户是否已经在班级中
    const existingMembership = await UserClass.findOne({
      where: {
        userId,
        classId,
      },
    })

    if (existingMembership) {
      throw new HttpException('您已经是班级成员', 400016)
    }

    // 检查班级人数是否已达上限
    const currentMembers = await UserClass.count({
      where: { classId },
    })

    if (currentMembers >= targetClass.maxMembers) {
      throw new HttpException('班级人数已达上限', 400017)
    }

    // 创建用户-班级关联
    await UserClass.create({ userId, classId })

    return {
      message: '加入班级成功',
    }
  }

  async quitClass(userId: number, classId: number) {
    const targetClass = await Class.findByPk(classId)
    if (!targetClass) {
      throw new HttpException('班级不存在', 400015)
    }

    // 检查是否是班级创建者
    if (targetClass.creatorId === userId) {
      throw new HttpException('班级创建者不能退出班级', 400022)
    }

    // 检查用户是否在班级中
    const userClass = await UserClass.findOne({
      where: { userId, classId },
    })

    if (!userClass) {
      throw new HttpException('您不是该班级的成员', 400023)
    }

    // 删除用户-班级关联
    await userClass.destroy()

    return {
      message: '退出班级成功',
    }
  }
}
