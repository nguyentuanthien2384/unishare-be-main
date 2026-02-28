import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('subjects')
  getAllSubjects() {
    return this.categoriesService.getAllSubjects();
  }

  @Get('majors')
  getAllMajors() {
    return this.categoriesService.getAllMajors();
  }

  @Get('majors/:id')
  getMajorById(@Param('id') id: string) {
    return this.categoriesService.getMajorById(id);
  }
}
