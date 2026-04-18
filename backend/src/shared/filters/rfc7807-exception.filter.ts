import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class Rfc7807ExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred';
    let type = 'about:blank';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      
      title = exceptionResponse.error || exceptionResponse.message || exception.name;
      detail = Array.isArray(exceptionResponse.message) 
        ? exceptionResponse.message.join(', ') 
        : (exceptionResponse.message || exception.message);
      type = exceptionResponse.type || `https://httpstatuses.com/${status}`;
    } else if (exception instanceof Error) {
      title = exception.name;
      detail = exception.message;
    }

    const problemDetails = {
      type,
      title,
      status,
      detail,
      instance: request.url,
      traceId: request.id,
    };

    response
      .status(status)
      .contentType('application/problem+json')
      .json(problemDetails);
  }
}
