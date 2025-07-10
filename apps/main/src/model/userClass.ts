import { Table, Column, DataType, ForeignKey } from 'sequelize-typescript'
import { BaseDate } from '@model/shared/baseDate'
import { User } from './user'
import { Class } from './class'

@Table({ tableName: 'user_class', freezeTableName: true, timestamps: true })
export class UserClass extends BaseDate<UserClass> {
  @ForeignKey(() => User)
  @Column({
    comment: '用户ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number

  @ForeignKey(() => Class)
  @Column({
    comment: '班级ID',
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare classId: number
}
