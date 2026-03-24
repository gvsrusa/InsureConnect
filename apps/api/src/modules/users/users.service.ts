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

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(params: {
    email: string;
    fullName: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: params.email }
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: params.email,
        fullName: params.fullName,
        passwordHash,
        role: params.role ?? UserRole.ADMIN
      }
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async findAllAgents(): Promise<User[]> {
    return this.prisma.user.findMany({ where: { role: UserRole.AGENT } });
  }
}
