import {
  ArgumentsHost,
  Catch,
  HttpException,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { HTTP_ERROR_CODES } from "./http.constants.js";
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const record = error as { name?: string; code?: number } | null;
    const status =
      error instanceof HttpException
        ? error.getStatus()
        : record?.name === "CastError"
          ? 400
          : record?.code === 11000
            ? 409
            : 500;
    const detail =
      error instanceof HttpException ? error.getResponse() : undefined;
    const message =
      status >= 500
        ? "The service could not complete this request."
        : typeof detail === "string"
          ? detail
          : detail && typeof detail === "object" && "message" in detail
            ? detail.message
            : status === 409
              ? "The resource already exists."
              : "Invalid request.";
    response.status(status).json({
      success: false,
      error: { code: HTTP_ERROR_CODES[status] ?? "REQUEST_FAILED", message },
      requestId: request.headers["x-request-id"],
    });
  }
}
