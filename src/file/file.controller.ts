import { Controller, Get, Post, Param, UseInterceptors, UploadedFile, StreamableFile, Res, Delete, Body, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    }),
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('driverId') driverId: string
  ) {
    return await this.fileService.createFile({
      filename: file.filename,
      path: file.path,
      contentType: file.mimetype,
      driverId
    });
  }

  @Get()
  async getAllFiles(@Query('driverId') driverId?: string) {
    if (!driverId) {
      throw new Error('driverId is required');
    }
    return await this.fileService.getAllFiles(driverId);
  }

  @Get('view/:filename')
  async getFile(
    @Param('filename') filename: string, 
    @Res({ passthrough: true }) res: Response
  ) {
    const file = await this.fileService.getFile(filename);
    if (!file) {
      throw new Error('File not found');
    }

    const stream = createReadStream(join(process.cwd(), file.path));
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `inline; filename="${file.filename}"`,
    });
    
    return new StreamableFile(stream);
  }

  @Delete(':filename')
  async deleteFile(@Param('filename') filename: string) {
    return await this.fileService.deleteFile(filename);
  }
}