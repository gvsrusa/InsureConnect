import { ConflictException, NotFoundException } from "@nestjs/common";
import { RoleAuditAction, UserRole } from "@prisma/client";

import { UsersService } from "./users.service";

describe("UsersService role management", () => {
  function createPrismaMock() {
    return {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn()
      },
      userRoleAssignment: {
        createMany: jest.fn(),
        deleteMany: jest.fn()
      },
      roleAuditLog: {
        create: jest.fn(),
        findMany: jest.fn()
      }
    };
  }

  it("adds roles by email and writes audit log", async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never);

    prisma.user.findUnique
      .mockResolvedValueOnce({
        id: "target-1",
        email: "target@example.com",
        roles: [{ role: UserRole.CUSTOMER }]
      })
      .mockResolvedValueOnce({
        id: "target-1",
        email: "target@example.com",
        fullName: "Target User",
        passwordHash: "hash",
        roles: [{ role: UserRole.CUSTOMER }, { role: UserRole.AGENT }]
      });

    const result = await service.addRolesByEmail(
      "admin-1",
      "target@example.com",
      [UserRole.AGENT, UserRole.AGENT]
    );

    expect(prisma.userRoleAssignment.createMany).toHaveBeenCalledWith({
      data: [{ userId: "target-1", role: UserRole.AGENT }],
      skipDuplicates: true
    });
    expect(prisma.roleAuditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        targetUserId: "target-1",
        action: RoleAuditAction.ADD,
        roles: [UserRole.AGENT]
      }
    });
    expect(result.roles.map((r) => r.role)).toEqual([UserRole.CUSTOMER, UserRole.AGENT]);
  });

  it("prevents removing the last role by email", async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never);

    prisma.user.findUnique.mockResolvedValue({
      id: "target-1",
      email: "target@example.com",
      roles: [{ role: UserRole.CUSTOMER }]
    });

    await expect(
      service.removeRolesByEmail("admin-1", "target@example.com", [UserRole.CUSTOMER])
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("throws not found for unknown email in admin role lookup", async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never);

    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getUserRolesByEmail("missing@example.com")).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it("returns audit logs filtered by target email", async () => {
    const prisma = createPrismaMock();
    const service = new UsersService(prisma as never);

    prisma.user.findUnique.mockResolvedValue({
      id: "target-1",
      email: "target@example.com",
      roles: [{ role: UserRole.CUSTOMER }]
    });
    prisma.roleAuditLog.findMany.mockResolvedValue([
      {
        id: "log-1",
        action: RoleAuditAction.ADD,
        roles: [UserRole.AGENT],
        createdAt: new Date("2026-03-24T00:00:00.000Z"),
        actor: { id: "admin-1", email: "admin@example.com" },
        target: { id: "target-1", email: "target@example.com" }
      }
    ]);

    const result = await service.getRoleAuditLogs({
      targetEmail: "target@example.com",
      limit: 10
    });

    expect(prisma.roleAuditLog.findMany).toHaveBeenCalledWith({
      where: { targetUserId: "target-1" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { id: true, email: true } },
        target: { select: { id: true, email: true } }
      }
    });
    expect(result).toHaveLength(1);
  });
});
