import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { PartnersService } from "./partners.service";

@Module({
  controllers: [AdminController],
  providers: [PartnersService],
  exports: [PartnersService]
})
export class PartnersModule {}
