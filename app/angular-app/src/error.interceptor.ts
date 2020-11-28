import {Injectable} from '@angular/core';
import {HttpRequest, HttpHandler, HttpEvent, HttpInterceptor} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {MainService} from "./app/main.service";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor
{
	constructor (private service : MainService)
	{
	}

	intercept (request : HttpRequest<any>, next : HttpHandler) : Observable<HttpEvent<any>>
	{
		return next.handle(request).pipe(catchError(err => {
			if (err.status === 401)
			{
				this.service.currentTokenSource.next(null);
			}
			else if (err.status === 403)
			{
				alert('Доступ к данному функционалу ограничен.');
			}

			const error = err.error && err.error.message || err.statusText;
			return throwError(error);
		}));
	}
}
