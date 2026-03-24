import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { RoleAuditAction, User, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../../prisma/prisma.service";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: true }
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true }
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(params: {
    email: string;
    fullName: string;
    password: string;
    roles?: UserRole[];
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: params.email }
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
    const assignedRoles = Array.from(
      new Set(params.roles?.length ? params.roles : [UserRole.CUSTOMER])
    );

    return this.prisma.user.create({
      data: {
        email: params.email,
        fullName: params.fullName,
        passwordHash,
        roles: {
          create: assignedRoles.map((role) => ({ role }))
        }
      },
      include: { roles: true }
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async findAllAgents() {
    return this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: UserRole.AGENT
          }
        }
      },
      include: { roles: true }
    });
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const user = await this.findById(userId);
    return user.roles.map((assignment) => assignment.role);
  }

  async addRoles(userId: string, roles: UserRole[]) {
    await this.findById(userId);
    const uniqueRoles = Array.from(new Set(roles));

    await this.prisma.userRoleAssignment.createMany({
      data: uniqueRoles.map((role) => ({ userId, role })),
      skipDuplicates: true
    });

    if (uniqueRoles.length > 0) {
      await this.logRoleAudit(userId, userId, RoleAuditAction.ADD, uniqueRoles);
    }

    return this.findById(userId);
  }

  async removeRoles(userId: string, roles: UserRole[]) {
    const user = await this.findById(userId);
    const removeSet = new Set(roles);
    const remainingRoles = user.roles
      .map((assignment) => assignment.role)
      .filter((role) => !removeSet.has(role));

    if (remainingRoles.length === 0) {
      throw new ConflictException("A user must have at least one role");
    }

    await this.prisma.userRoleAssignment.deleteMany({
      where: {
        userId,
        role: {
          in: roles
        }
      }
    });

    if (roles.length > 0) {
      await this.logRoleAudit(userId, userId, RoleAuditAction.REMOVE, roles);
    }

    return this.findById(userId);
  }

  async getUserRolesByEmail(email: string): Promise<UserRole[]> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user.roles.map((assignment) => assignment.role);
  }

  async addRolesByEmail(actorUserId: string, email: string, roles: UserRole[]) {
    const target = await this.findByEmail(email);
    if (!target) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const uniqueRoles = Array.from(new Set(roles));
    await this.prisma.userRoleAssignment.createMany({
      data: uniqueRoles.map((role) => ({ userId: target.id, role })),
      skipDuplicates: true
    });

    if (uniqueRoles.length > 0) {
      await this.logRoleAudit(actorUserId, target.id, RoleAuditAction.ADD, uniqueRoles);
    }

    return this.findById(target.id);
  }

  async removeRolesByEmail(actorUserId: string, email: string, roles: UserRole[]) {
    const target = await this.findByEmail(email);
    if (!target) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const removeSet = new Set(roles);
    const remainingRoles = target.roles
      .map((assignment) => assignment.role)
      .filter((role) => !removeSet.has(role));

    if (remainingRoles.length === 0) {
      throw new ConflictException("A user must have at least one role");
    }

    await this.prisma.userRoleAssignment.deleteMany({
      where: {
        userId: target.id,
        role: {
          in: roles
        }
      }
    });

    if (roles.length > 0) {
      await this.logRoleAudit(actorUserId, target.id, RoleAuditAction.REMOVE, roles);
    }

    return this.findById(target.id);
  }

  async getRoleAuditLogs(params?: { targetEmail?: string; limit?: number }) {
    const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);
    let targetUserId: string | undefined;

    if (params?.targetEmail) {
      const target = await this.findByEmail(params.targetEmail);
      if (!target) {
        throw new NotFoundException(`User with email ${params.targetEmail} not found`);
      }
      targetUserId = target.id;
    }

    return this.prisma.roleAuditLog.findMany({
      where: targetUserId ? { targetUserId } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: { select: { id: true, email: true } },
        target: { select: { id: true, email: true } }
      }
    });
  }

  private async logRoleAudit(
    actorUserId: string,
    targetUserId: string,
    action: RoleAuditAction,
    roles: UserRole[]
  ) {
    const uniqueRoles = Array.from(new Set(roles));
    if (uniqueRoles.length === 0) return;

    await this.prisma.roleAuditLog.create({
      data: {
        actorUserId,
        targetUserId,
        action,
        roles: uniqueRoles
      }
    });
  }
}
