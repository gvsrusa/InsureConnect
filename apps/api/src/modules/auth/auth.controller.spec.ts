import { UserRole } from "@prisma/client";

import { AuthController } from "./auth.controller";

describe("AuthController role management", () => {
  function createController() {
    const authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn()
    };

    const usersService = {
      getUserRoles: jest.fn(),
      addRoles: jest.fn(),
      removeRoles: jest.fn(),
      getUserRolesByEmail: jest.fn(),
      addRolesByEmail: jest.fn(),
      removeRolesByEmail: jest.fn(),
      getRoleAuditLogs: jest.fn()
    };

    const controller = new AuthController(authService as never, usersService as never);
    return { controller, usersService };
  }

  it("returns current user roles", async () => {
    const { controller, usersService } = createController();

    usersService.getUserRoles.mockResolvedValue([UserRole.CUSTOMER]);

    const result = await controller.getMyRoles({
      userId: "user-1",
      email: "u@example.com",
      role: UserRole.CUSTOMER
    });

    expect(result).toEqual({
      userId: "user-1",
      email: "u@example.com",
      roles: [UserRole.CUSTOMER]
    });
  });

  it("adds roles for target user by email as admin", async () => {
    const { controller, usersService } = createController();

    usersService.addRolesByEmail.mockResolvedValue({
      id: "target-1",
      email: "target@example.com",
      roles: [{ role: UserRole.CUSTOMER }, { role: UserRole.AGENT }]
    });

    const result = await controller.addRolesByEmail(
      { userId: "admin-1", email: "admin@example.com", role: UserRole.ADMIN },
      "target@example.com",
      { roles: [UserRole.AGENT] }
    );

    expect(usersService.addRolesByEmail).toHaveBeenCalledWith(
      "admin-1",
      "target@example.com",
      [UserRole.AGENT]
    );
    expect(result.roles).toEqual([UserRole.CUSTOMER, UserRole.AGENT]);
  });

  it("removes roles for target user by email as admin", async () => {
    const { controller, usersService } = createController();

    usersService.removeRolesByEmail.mockResolvedValue({
      id: "target-1",
      email: "target@example.com",
      roles: [{ role: UserRole.CUSTOMER }]
    });

    const result = await controller.removeRolesByEmail(
      { userId: "admin-1", email: "admin@example.com", role: UserRole.ADMIN },
      "target@example.com",
      { roles: [UserRole.AGENT] }
    );

    expect(usersService.removeRolesByEmail).toHaveBeenCalledWith(
      "admin-1",
      "target@example.com",
      [UserRole.AGENT]
    );
    expect(result.roles).toEqual([UserRole.CUSTOMER]);
  });

  it("returns role audit history for admin", async () => {
    const { controller, usersService } = createController();

    usersService.getRoleAuditLogs.mockResolvedValue([
      {
        id: "log-1",
        action: "ADD",
        roles: [UserRole.AGENT],
        createdAt: new Date("2026-03-24T00:00:00.000Z"),
        actor: { id: "admin-1", email: "admin@example.com" },
        target: { id: "target-1", email: "target@example.com" }
      }
    ]);

    const result = await controller.getRoleAudit("target@example.com", "25");

    expect(usersService.getRoleAuditLogs).toHaveBeenCalledWith({
      targetEmail: "target@example.com",
      limit: 25
    });
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0]?.actor.email).toBe("admin@example.com");
  });
});
