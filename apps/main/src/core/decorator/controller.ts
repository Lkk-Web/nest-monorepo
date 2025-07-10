import { PLATFORM } from '@common/enum'
import { AdminAuthGuard } from '@core/guards/admin.guard'
import {applyDecorators, Controller, HttpCode, UseGuards} from '@nestjs/common'
import { ClientAuthGuard } from '../guards/client.guard'
import {ApiResponse} from "@nestjs/swagger";

/**
 * 自动加入web/前缀路由的Controller注解守卫 UseGuards(WebAuthGuard)
 */
export function ClientController(prefix: string) {
  return applyDecorators(Controller(`${PLATFORM.client}/v1/${prefix}`), UseGuards(ClientAuthGuard))
}
export function AdminController(prefix: string) {
  return applyDecorators(Controller(`${PLATFORM.admin}/v1/${prefix}`), UseGuards(AdminAuthGuard))
}

export function ApiRes(statusCode:number,config?:{desc?:string,type?:any}) {
  config = config||{};
  return applyDecorators(HttpCode(statusCode),ApiResponse({status:statusCode,description:config.desc||"成功",type:config.type||Object}));
}
