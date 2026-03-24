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
}
