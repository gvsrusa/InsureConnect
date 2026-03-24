import { Controller, Get } from "@nestjs/common";

@Controller("api/v1/health")
export class HealthController {
  @Get()
  getHealth(): { service: string; status: string; timestamp: string } {
    return {
      service: "insureconnect-api",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }
}