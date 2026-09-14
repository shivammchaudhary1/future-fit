import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, type UserDocument } from "../users/user.schema.js";
import type { AuthenticatedRequest } from "./auth.types.js";
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      !(await this.users.exists({
        _id: request.auth.sub,
        globalRoles: "SUPER_ADMIN",
        status: "ACTIVE",
      }))
    )
      throw new ForbiddenException("Super administrator access required.");
    return true;
  }
}
