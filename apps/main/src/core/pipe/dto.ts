import {plainToInstance} from 'class-transformer';
import {validate, ValidationError} from 'class-validator';
import {ArgumentMetadata, Injectable, PipeTransform, HttpException} from '@nestjs/common';

/**
 * A pipe used to validate DTO parameter properties
 *
 * @see: [pipes](https://docs.nestjs.com/pipes)
 */
@Injectable()
export class DtoPipe implements PipeTransform<any> {

  public async transform(value: any, {metatype}: ArgumentMetadata) {
    if (!metatype) return value;

    const baseTypes = [String, Boolean, Number, Array, Object];
    const isBaseType = !!baseTypes.find((type) => metatype === type);
    if (isBaseType) return value;

    const details = plainToInstance(metatype, value);
    const errors: ValidationError[] = await validate(details,{
      forbidUnknownValues:false
    });
    if (!errors || !errors.length) return value;

    // throw message
    errors.forEach(error => {
      this.disposeError(error)
    });
  }

  public disposeError(error: ValidationError) {
    if (error.constraints) {
      const message = Object.values(error.constraints)[0];
      throw new HttpException(message, 400001);
    } else if (error.children.length) {
      this.disposeError(error.children[0])
    }
  }
}
