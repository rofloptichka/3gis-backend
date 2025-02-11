import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';

@Injectable()
export class FileService {
  constructor(private db: DatabaseService) {}

  async createFile(data: Prisma.FileCreateInput) {
    return this.db.file.create({
      data,
    });
  }

  async getFile(filename: string) {
    return this.db.file.findFirst({
      where: { filename },
    });
  }

  async deleteFile(filename: string) {
    const file = await this.getFile(filename);
    if (!file) {
      throw new Error('File not found');
    }
    
    // Delete from filesystem
    await fs.unlink(file.path);
    
    // Delete from database
    return await this.db.file.delete({
      where: { id: file.id }
    });
  }

  async getAllFiles(driverId: string) {
    return this.db.file.findMany({
      where: {
        driverId: driverId
      }
    });
  }
} 