import { UnauthorizedException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { AuthService } from "./auth.service";

describe("AuthService register/login", () => {
  function createService() {
    const usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      findById: jest.fn()
    };

    const jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn()
    };

    const configService = {
      getOrThrow: jest.fn().mockReturnValue("refresh-secret")
    };

    const cacheService = {
      has: jest.fn(),
      set: jest.fn()
    };

    const service = new AuthService(
      usersService as never,
      jwtService as never,
      configService as never,
      cacheService as never
    );

    return { service, usersService, jwtService };
  }

  it("registers a user with requested roles", async () => {
    const { service, usersService, jwtService } = createService();

    usersService.create.mockResolvedValue({
      id: "user-1",
      email: "new@example.com",
      fullName: "New User",
      roles: [{ role: UserRole.PARTNER_VIEWER }]
    });
    jwtService.sign
      .mockReturnValueOnce("access-token")
      .mockReturnValueOnce("refresh-token");

    const result = await service.register({
      email: "new@example.com",
      fullName: "New User",
      password: "Password123",
      roles: [UserRole.PARTNER_VIEWER]
    });

    expect(usersService.create).toHaveBeenCalledWith({
      email: "new@example.com",
      fullName: "New User",
      password: "Password123",
      roles: [UserRole.PARTNER_VIEWER]
    });
    expect(result.user.availableRoles).toEqual([UserRole.PARTNER_VIEWER]);
    expect(result.accessToken).toBe("access-token");
  });

  it("logs in with requested role when assigned", async () => {
    const { service, usersService, jwtService } = createService();

    usersService.findByEmail.mockResolvedValue({
      id: "user-2",
      email: "agent@example.com",
      fullName: "Agent User",
      roles: [{ role: UserRole.CUSTOMER }, { role: UserRole.AGENT }]
    });
    usersService.validatePassword.mockResolvedValue(true);
    jwtService.sign
      .mockReturnValueOnce("access-token")
      .mockReturnValueOnce("refresh-token");

    const result = await service.login({
      email: "agent@example.com",
      password: "Password123",
      role: UserRole.AGENT
    });

    expect(result.user.role).toBe(UserRole.AGENT);
    expect(result.user.availableRoles).toEqual([UserRole.CUSTOMER, UserRole.AGENT]);
  });

  it("rejects login with invalid password", async () => {
    const { service, usersService } = createService();

    usersService.findByEmail.mockResolvedValue({
      id: "user-3",
      email: "bad@example.com",
      fullName: "Bad User",
      roles: [{ role: UserRole.CUSTOMER }]
    });
    usersService.validatePassword.mockResolvedValue(false);

    await expect(
      service.login({ email: "bad@example.com", password: "bad-password" })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
