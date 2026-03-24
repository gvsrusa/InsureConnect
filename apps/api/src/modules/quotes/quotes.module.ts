import { Module } from "@nestjs/common";
import { CarriersModule } from "../carriers/carriers.module";
import { QuotesService } from "./quotes.service";

@Module({
  imports: [CarriersModule],
  providers: [QuotesService],
  exports: [QuotesService]
})
export class QuotesModule {}
