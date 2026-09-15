import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InjectModel, MongooseModule } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";
import { careerSchema } from "@future-fit/validation";
import { AuthModule } from "../auth/auth.module.js";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { SuperAdminGuard } from "../auth/super-admin.guard.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import {
  Career,
  CareerSchema,
  type CareerDocument,
} from "./career.schema.js";
import {
  CareerSourceRecord,
  CareerSourceRecordSchema,
} from "./career-source-record.schema.js";

class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

@Controller({ path: "careers", version: "1" })
@UseGuards(AccessTokenGuard)
class CareersController {
  constructor(
    @InjectModel(Career.name)
    private readonly careers: Model<CareerDocument>,
  ) {}

  @Get()
  async list(@Query() query: PaginationDto) {
    const filter = { status: "ACTIVE" };

    const [items, total] = await Promise.all([
      this.careers
        .find(filter)
        .sort({ slug: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      this.careers.countDocuments(filter),
    ]);

    return {
      success: true,
      data: items.map((item) => ({
        _id: item._id,
        ...item.content,
      })),
      pagination: {
        ...query,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  @Get(":slug")
  async get(@Param("slug") slug: string) {
    const career = await this.careers
      .findOne({ slug, status: "ACTIVE" })
      .lean();

    if (!career) {
      throw new NotFoundException("Career not found.");
    }

    return {
      success: true,
      data: {
        _id: career._id,
        ...career.content,
      },
    };
  }

  @Get(":slug/education-path")
  async education(@Param("slug") slug: string) {
    return {
      success: true,
      data: (await this.get(slug)).data.educationPath,
    };
  }

  @Get(":slug/skills")
  async skills(@Param("slug") slug: string) {
    return {
      success: true,
      data: (await this.get(slug)).data.skills,
    };
  }
}

@Controller({ path: "admin/careers", version: "1" })
@UseGuards(AccessTokenGuard, SuperAdminGuard)
class AdminCareersController {
  constructor(
    @InjectModel(Career.name)
    private readonly careers: Model<CareerDocument>,
  ) {}

  @Post()
  @UseGuards(CsrfGuard)
  async create(@Body() body: unknown) {
    const parsed = careerSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }

    const career = await this.careers.create({
      slug: parsed.data.slug,
      status: parsed.data.status,
      content: parsed.data,
    });

    return {
      success: true,
      data: career,
    };
  }
}

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      {
        name: Career.name,
        schema: CareerSchema,
      },
      {
        name: CareerSourceRecord.name,
        schema: CareerSourceRecordSchema,
      },
    ]),
  ],
  controllers: [
    CareersController,
    AdminCareersController,
  ],
})
export class CareersModule {}
