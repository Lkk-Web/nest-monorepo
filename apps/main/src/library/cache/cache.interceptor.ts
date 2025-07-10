import {catchError, Observable, of, throwError} from 'rxjs'
import {map} from 'rxjs/operators'
import {REQ} from '@common/type'
import {ResponseBody} from '@common/interface'
import {EventEmitter} from 'events'
import {CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor} from '@nestjs/common'
import {EventStatus} from "@library/cache/cache.common";
import {Reflector} from '@nestjs/core/services'
import {CacheConfig, CACHING_MECHANISMS} from "@library/cache/cache";
import {CryptoUtil} from "@library/utils/crypt.util";

/**
 * 缓存拦截器
 * 缓存拦截器的作用是在请求到达控制器之前，先从缓存中获取数据，如果缓存中有数据，则直接返回缓存中的数据，如果没有数据，则将请求转发到控制器中，控制器处理完请求之后，将数据存入缓存中
 * 注：目前支持内存缓存 缺陷就是重启服务缓存就会丢失，数据量大的时候不建议使用
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {
        this.events = new EventEmitter();
        //设置最大监听数
        this.events.setMaxListeners(1000);
    }

    private eventList: EventAdmin[] = []
    private events: EventEmitter;

    public async intercept(ctx: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        //从反射器中获取缓存配置
        const cacheConfig = this.reflector.get<CacheConfig>(CACHING_MECHANISMS, ctx.getHandler())
        if (!cacheConfig) {
            return next.handle();
        }
        const request: REQ = ctx.switchToHttp().getRequest()
        // const response: RES = ctx.switchToHttp().getResponse()
        const {originalUrl, body, query, method, headers} = request
        let outKey = '';
        if(cacheConfig.isQuery){
            if(cacheConfig.isQuery instanceof Function){
                outKey += cacheConfig.isQuery(query) || "";
            }else{
                outKey += query?JSON.stringify(query):"";
            }
        }
        if(cacheConfig.isBody){
            if(cacheConfig.isBody instanceof Function){
                outKey += cacheConfig.isBody(body) || "";
            }else{
                outKey += body?JSON.stringify(body):"";
            }
        }
        if(cacheConfig.isUser){
            if(cacheConfig.isUser instanceof Function){
                outKey += cacheConfig.isUser(request['user']) || "";
            }else{
                outKey += request['user']?JSON.stringify(request['user']):"";
            }
        }
        if(cacheConfig.req){
            outKey += cacheConfig.req(request) || "";
        }
        if(outKey.length>0){
            outKey = CryptoUtil.hashing(outKey)
        }

        let event = this.eventList.find(e => e.key === cacheConfig.key && e.outKey===outKey)

        if (!event) {
            event = new EventAdmin();
            event.key = cacheConfig.key;
            event.outKey = outKey;
            this.eventList.push(event);
        }
        // const request: REQ = ctx.switchToHttp().getRequest()
        // const response: RES = ctx.switchToHttp().getResponse()
        // const {originalUrl, body, query, method, headers} = request
        // console.log(originalUrl, body, query, method)
        //TODO 后面可以添加储存缓存机制
        if (event.updatedAt&&event.updatedAt>Date.now()-cacheConfig.ttl) {
            return of(event.data)
        }else{
            //如果缓存过期，就清空缓存
            event.updatedAt=null;
            event.data=null;
        }

        //防止缓存穿透
        if (event.eventStatus == EventStatus.ready) {
            event.eventStatus = EventStatus.pending;
            return next.handle().pipe(
                map((data: ResponseBody<any>) => {
                    //正确截拦
                    this.events.emit(cacheConfig.key, data)
                    //更新缓存
                    event.eventStatus = EventStatus.ready
                    event.data = data;
                    event.updatedAt = Date.now();
                    return data
                }), catchError((err: HttpException) => {
                    //报错截拦
                    event.eventStatus = EventStatus.ready
                    this.events.emit(cacheConfig.key, null, err)
                    return throwError(err);
                }))
        } else {
            return of(new Promise((resolve, reject) => {
                this.events.once(cacheConfig.key, (data, err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(data)
                    }
                })
            }))
        }
    }
}

//
export class EventAdmin{
    public key:string;
    public outKey:string;
    public eventStatus:string=EventStatus.ready;
    public updatedAt?:number;
    public data:any;
}
