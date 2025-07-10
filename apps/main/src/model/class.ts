import { ApiProperty } from '@nestjs/swagger'
import { Table, Column, DataType, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from './user'
import { UserClass } from './userClass'

@Table({ tableName: 'class', freezeTableName: true, timestamps: true })
export class Class extends BaseDate<Class> {
  @ApiProperty({ name: 'name', type: String, description: '班级名称', required: true })
  @Column({
    comment: '班级名称',
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string

  @ApiProperty({ name: 'introduction', type: String, description: '班级介绍', required: false })
  @Column({
    comment: '班级介绍',
    type: DataType.TEXT,
  })
  declare introduction: string

  @ApiProperty({ name: 'avatar', type: String, description: '班级头像', required: false })
  @Column({
    comment: '班级头像',
    type: DataType.STRING(255),
  })
  declare avatar: string

  @ApiProperty({ name: 'creatorId', type: Number, description: '创建人ID', required: true })
  @ForeignKey(() => User)
  @Column({
    comment: '创建人ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare creatorId: number

  @BelongsTo(() => User, 'creatorId')
  declare creator: User

  @ApiProperty({ name: 'maxMembers', type: Number, description: '班级上限人员数', required: false })
  @Column({
    comment: '班级上限人员数',
    type: DataType.INTEGER,
    defaultValue: 100,
  })
  declare maxMembers: number

  @BelongsToMany(() => User, {
    through: () => UserClass,
    foreignKey: 'classId',
    otherKey: 'userId',
  })
  users: User[];
}
