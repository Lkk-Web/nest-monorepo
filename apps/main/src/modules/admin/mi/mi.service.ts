import {Injectable} from '@nestjs/common'

@Injectable()
export class MiService {
 /* async create(createAdminDto: Admin) {
    /!*------------------ 条件判断 ------------------*!/
    /!*------------------ 业务执行（写入） ------------------*!/
    let { name, phone, password } = createAdminDto
    let vo = await Admin.create({
      name,
      phone,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
    })
    /!*------------------ 返回结果（读取） ------------------*!/
    return await Admin.findByPk(vo.id)
  }

    async postToken(dto: LoginDto) {
        let admin: Admin = await Admin.findOne({where: {phone: dto.phone}})
        /!*------------------ 条件判断 ------------------*!/
        if (!admin) {
            Aide.throwException(400003)
        } else if (CryptoUtil.sm4Encryption(dto.password) !== admin.password) {
            Aide.throwException(400002)
        }

        /!*------------------ 业务执行（写入） ------------------*!/
        /!*------------------ 返回结果（读取） ------------------*!/
        admin = admin.toJSON()
        delete admin.password // 隐藏密码
        return {
            token: jwtEncodeInExpire({
                platform: PLATFORM.admin,
                id: admin.id,
            }),
            admin,
        }
    }

  async updateToken(req: Request, admin: Admin) {
    let payload = jwtDecode(req.headers['authorization'])
    if (!payload || !payload.adminID) {
      return {
        token: null,
      }
    } else {
      let admin = await Admin.findByPk(payload.adminID)
      return {
        token: jwtEncodeInExpire({
          platform: PLATFORM.client,
          adminID: admin.id,
        }),
        admin,
      }
    }
  }*/
}
