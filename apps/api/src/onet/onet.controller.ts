import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AccessTokenGuard } from "../auth/access-token.guard.js";
import { CsrfGuard } from "../auth/csrf.guard.js";
import {
  CareerSearchDto,
  CareerTopicDto,
  InterestAnswersDto,
} from "./dto/onet.dto.js";
import { OnetService } from "./onet.service.js";

@ApiTags("O*NET")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller({ path: "onet", version: "1" })
export class OnetController {
  constructor(private readonly onet: OnetService) {}
  @Get("interest-profiler/questions") questions() {
    return this.wrap(this.onet.questions());
  }
  @Post("interest-profiler/profile") @UseGuards(CsrfGuard) profile(
    @Body() input: InterestAnswersDto,
  ) {
    return this.wrap(this.onet.profile(input.answers));
  }
  @Get("careers/search") search(@Query() query: CareerSearchDto) {
    return this.wrap(this.onet.search(query.keyword, query.start, query.end));
  }
  @Get("careers/:code") career(@Param("code") code: string) {
    return this.wrap(this.onet.career(code));
  }
  @Get("careers/:code/:topic") careerTopic(
    @Param("code") code: string,
    @Param() input: CareerTopicDto,
  ) {
    return this.wrap(this.onet.careerTopic(code, input.topic));
  }
  private async wrap(data: Promise<unknown>) {
    return { success: true, data: await data };
  }
}
