import { Controller, Get, Post, Param, UseInterceptors, UploadedFile, StreamableFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('files')
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
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return await this.fileService.createFile({
      filename: file.filename,
      path: file.path,
    });
  }

  @Get(':id')
  async getFile(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const file = await this.fileService.getFile(id);
    if (!file) {
      throw new Error('File not found');
    }

    const stream = createReadStream(join(process.cwd(), file.path));
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    
    return new StreamableFile(stream);
  }
} 