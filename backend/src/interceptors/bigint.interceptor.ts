import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { convertBigIntToString } from '../common/bigIntToString';

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(map((data) => convertBigIntToString(data)));
    }
}
