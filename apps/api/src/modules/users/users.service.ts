import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { User, UserRole } from "@prisma/client";
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

    return this.findById(userId);
  }
}
