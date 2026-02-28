import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Major } from '../majors/schemas/major.schema';
import { Subject } from '../subjects/schemas/subject.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Major.name) private majorModel: Model<Major>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
  ) {}

  async getAllMajors() {
    return this.majorModel
      .find()
      .populate('subjects', '_id name code managingFaculty')
      .exec();
  }

  async getMajorById(id: string) {
    return this.majorModel
      .findById(id)
      .populate('subjects', '_id name code managingFaculty')
      .exec();
  }

  async getAllSubjects() {
    return this.subjectModel.find().sort({ name: 1 }).exec();
  }
}
