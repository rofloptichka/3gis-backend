import { Controller, Get, Post, Body, HttpException, HttpStatus} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Post()
    async handleInput(@Body() data: any) {
      try {
        await this.appService.processInput(data);
        return { message: 'Data processed successfully' };
      } catch (error) {
        this.handleError(error);
      }
    }
  
    private handleError(error: any): void {
      console.error('Error:', error.message);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message || 'Bad Request', HttpStatus.BAD_REQUEST);
    }
}
