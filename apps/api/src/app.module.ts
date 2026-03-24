import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";

import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { CacheModule } from "./common/cache/cache.module";
import { QueueModule } from "./common/queue/queue.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { CarriersModule } from "./modules/carriers/carriers.module";
import { QuotesModule } from "./modules/quotes/quotes.module";
import { AgentsModule } from "./modules/agents/agents.module";
import { PoliciesModule } from "./modules/policies/policies.module";
import { PartnerApiModule } from "./modules/partner-api/partner-api.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"]
    }),
    PrismaModule,
    CacheModule,
    QueueModule,
    AuthModule,
    UsersModule,
    PartnersModule,
    CarriersModule,
    QuotesModule,
    AgentsModule,
    PoliciesModule,
    PartnerApiModule,
    AnalyticsModule,
    WebhooksModule
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule {}