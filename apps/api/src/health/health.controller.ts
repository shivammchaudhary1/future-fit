import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, ConnectionStates } from "mongoose";
import { QueueService } from "../queue/queue.service.js";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("health")
@Controller({ path: "health", version: "1" })
export class HealthController {
  constructor(
    @InjectConnection() private readonly mongo: Connection,
    private readonly queue: QueueService,
  ) {}
  @Get()
  @ApiOperation({ summary: "Service health" })
  health() {
    return { success: true, data: { status: "ok", service: "future-fit-api" } };
  }

  @Get("live")
  live() {
    return { success: true, data: { status: "alive" } };
  }

  @Get("ready")
  async ready() {
    if (this.mongo.readyState !== ConnectionStates.connected)
      throw new ServiceUnavailableException("Database unavailable.");
    try {
      await this.mongo.db!.admin().ping();
      await this.queue.ping();
    } catch {
      throw new ServiceUnavailableException("Dependencies unavailable.");
    }
    return { success: true, data: { status: "ready" } };
  }
}
