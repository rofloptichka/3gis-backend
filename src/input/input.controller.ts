import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { InputService } from './input.service';

@Controller('input')
export class InputController {
  constructor(private readonly inputService: InputService) {}

  @Post()
  async handleInput(@Body() data: any) {
    try {
      await this.inputService.processInput(data);
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