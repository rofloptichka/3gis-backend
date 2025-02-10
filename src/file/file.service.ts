import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FileService {
  constructor(private db: DatabaseService) {}

  async createFile(data: Prisma.FileCreateInput) {
    return this.db.file.create({
      data,
    });
  }

  async getFile(id: string) {
    return this.db.file.findUnique({
      where: { id },
    });
  }
} 