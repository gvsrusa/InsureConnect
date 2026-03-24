import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QuotesQueueProcessor } from "./quotes-queue.processor";
import { QuotesQueueService } from "./quotes-queue.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get("REDIS_PORT", 6379),
          password: configService.get("REDIS_PASSWORD"),
          db: configService.get("REDIS_DB", 0)
        }
      })
    }),
    BullModule.registerQueue({
      name: "quotes"
    }),
    PrismaModule
  ],
  providers: [QuotesQueueProcessor, QuotesQueueService],
  exports: [QuotesQueueService]
})
export class QueueModule {}
