import * as Sentry from '@sentry/nestjs';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CourseEntity } from 'src/entities/course.entity';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepo: Repository<CourseEntity>,
  ) {}

  async create(data: CreateCourseDto) {
    try {
      const exits = await this.courseRepo.findOne({
        where: { course_name: data.course_name },
      });

      if (exits) {
        return new ConflictException({
          success: false,
          message: 'course name already taken to chose other name.',
        });
      }

      const course = this.courseRepo.create({ ...data });

      await this.courseRepo.save(course);

      return {
        success: true,
        message: 'course created successfully',
        data: course,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'course create error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findOne(uuid: string) {
    try {
      const course = await this.courseRepo.findOne({
        where: { uuid, is_delete: false },
      });

      if (!course) {
        return new NotFoundException({
          success: false,
          message: 'course not founded',
        });
      }

      return {
        success: true,
        message: 'course data fetched',
        data: course,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'course find error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async findAll(query: { page: string; limit: string }) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;

      const [courses, total] = await this.courseRepo.findAndCount({
        where: { is_delete: false },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        message: 'course data fetched',
        data: courses,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'course find all error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async updateOne(uuid: string, data: UpdateCourseDto) {
    try {
      const courses = await this.courseRepo.findOne({ where: { uuid } });

      if (!courses) {
        return new NotFoundException({
          success: false,
          message: 'course not founded',
        });
      }

      Object.assign(courses, data);

      await this.courseRepo.save(courses);

      return {
        success: true,
        message: 'course details updated',
        data: courses,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'update course detail error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal sserver error!',
      });
    }
  }

  async softDelete(uuid: string) {
    try {
      await this.courseRepo.update({ uuid }, { is_delete: true });

      return {
        success: true,
        message: 'course deleted successfully',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'course deleted error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async finddrop() {
    const data = this.courseRepo.find({
      where: { is_delete: false, is_active: true },
      select: ['uuid', 'course_name', 'price'],
      order: { createdAt: 'DESC' },
    });

    return data;
  }
}
