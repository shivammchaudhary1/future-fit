import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Service health" })
  health() { return { success: true, data: { status: "ok", service: "future-fit-api" } }; }

  @Get("live")
  live() { return { success: true, data: { status: "alive" } }; }

  @Get("ready")
  ready() { return { success: true, data: { status: "ready" } }; }
}
