import { ApiProperty } from '@nestjs/swagger'
import { Table, Column, DataType, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript'
import { BaseDate } from "@model/shared/baseDate";
import { Role } from "./role";
import { UserClass } from './userClass';
import { Class } from './class';

@Table({ tableName: 'user', freezeTableName: true, timestamps: true })
export class User extends BaseDate<User> {
  @ApiProperty({ name: 'name', type: String, description: '姓名', required: false })
  @Column({
    comment: '姓名',
    type: DataType.STRING(50),
  })
  declare name: string

  @ApiProperty({ name: 'gender', type: Number, description: '性别(0:未知,1:男,2:女)', required: false })
  @Column({
    comment: '性别(0:未知,1:男,2:女)',
    type: DataType.TINYINT,
    defaultValue: 0,
  })
  declare gender: number

  @ApiProperty({ name: 'phone', type: String, description: '手机号', required: true })
  @Column({
    comment: '手机号',
    type: DataType.STRING(11),
    unique: true,
    allowNull: false,
  })
  declare phone: string

  @ApiProperty({ name: 'password', type: String, description: '密码', required: true })
  @Column({
    comment: '密码',
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare password: string

  @ApiProperty({ name: 'firmName', type: String, description: '企业名称', required: false })
  @Column({
    comment: '企业名称',
    type: DataType.STRING(100),
  })
  declare firmName: string

  @ApiProperty({ name: 'position', type: String, description: '职务', required: false })
  @Column({
    comment: '职务',
    type: DataType.STRING(50),
  })
  declare position: string

  @ApiProperty({ name: 'industry', type: String, description: '所属行业', required: false })
  @Column({
    comment: '所属行业',
    type: DataType.STRING(50),
  })
  declare industry: string

  @ApiProperty({ name: 'product', type: String, description: '产品图片', required: false })
  @Column({
    comment: '产品图片',
    type: DataType.STRING(255),
  })
  declare product: string

  @ApiProperty({ name: 'firmAvatar', type: String, description: '企业头像', required: false })
  @Column({
    comment: '企业头像',
    type: DataType.STRING(255),
  })
  declare firmAvatar: string

  @ApiProperty({ name: 'avatar', type: String, description: '用户头像', required: false })
  @Column({
    comment: '用户头像',
    type: DataType.STRING(255),
  })
  declare avatar: string

  @ApiProperty({ name: 'roleId', type: Number, description: '角色ID', required: false })
  @ForeignKey(() => Role)
  @Column({
    comment: '角色ID',
    type: DataType.INTEGER,
  })
  declare roleId: number

  @BelongsTo(() => Role, 'roleId')
  declare role: Role

  // @Column({
  //   comment: '最后登陆ip',
  //   type: DataType.STRING(20),
  // })
  // declare ip: string;
  @BelongsToMany(() => Class, {
    through: () => UserClass,
    foreignKey: 'userId',
    otherKey: 'classId',
  })
  classes: Class[]
}
