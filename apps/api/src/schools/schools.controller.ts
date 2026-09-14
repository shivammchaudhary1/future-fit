import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import type { JwtPayload } from "../auth/auth.types.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import { CurrentAuth } from "../auth/current-auth.decorator.js";
import {
  CreateAcademicYearDto,
  CreateAssignmentDto,
  CreateClassDto,
  UserIdsDto,
} from "./dto/school.dto.js";
import { SchoolsService } from "./schools.service.js";

@ApiTags("school")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller({ path: "organizations/:organizationId", version: "1" })
export class SchoolsController {
  constructor(private readonly schools: SchoolsService) {}
  @Post("academic-years") @UseGuards(CsrfGuard) async createYear(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") org: string,
    @Body() input: CreateAcademicYearDto,
  ) {
    return this.wrap(await this.schools.createYear(auth.sub, org, input));
  }
  @Get("academic-years") async years(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") org: string,
  ) {
    return this.wrap(await this.schools.listYears(auth.sub, org));
  }
  @Post("classes") @UseGuards(CsrfGuard) async createClass(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") org: string,
    @Body() input: CreateClassDto,
  ) {
    return this.wrap(await this.schools.createClass(auth.sub, org, input));
  }
  @Get("classes") async classes(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") org: string,
  ) {
    return this.wrap(await this.schools.listClasses(auth.sub, org));
  }
  @Post("assessment-assignments") @UseGuards(CsrfGuard) async createAssignment(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") org: string,
    @Body() input: CreateAssignmentDto,
  ) {
    return this.wrap(await this.schools.createAssignment(auth.sub, org, input));
  }
  @Get("assessment-assignments") async assignments(
    @CurrentAuth() auth: JwtPayload,
    @Param("organizationId") org: string,
  ) {
    return this.wrap(await this.schools.listAssignments(auth.sub, org));
  }
  private wrap<T>(data: T) {
    return { success: true, data };
  }
}

@ApiTags("classes")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, CsrfGuard)
@Controller({ path: "classes", version: "1" })
export class ClassesController {
  constructor(private readonly schools: SchoolsService) {}
  @Post(":classId/students") async students(
    @CurrentAuth() auth: JwtPayload,
    @Param("classId") id: string,
    @Body() input: UserIdsDto,
  ) {
    return {
      success: true,
      data: await this.schools.addStudents(auth.sub, id, input.userIds),
    };
  }
  @Post(":classId/teachers") async teachers(
    @CurrentAuth() auth: JwtPayload,
    @Param("classId") id: string,
    @Body() input: UserIdsDto,
  ) {
    return {
      success: true,
      data: await this.schools.addTeachers(auth.sub, id, input.userIds),
    };
  }
}
