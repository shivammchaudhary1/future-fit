import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { OnetController } from "./onet.controller.js";
import { OnetService } from "./onet.service.js";

@Module({
  imports: [AuthModule],
  controllers: [OnetController],
  providers: [OnetService],
  exports: [OnetService],
})
export class OnetModule {}
