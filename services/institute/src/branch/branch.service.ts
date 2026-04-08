import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BranchEntity } from 'src/entities/branch.entity';
import { Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(BranchEntity)
    private BranchRepo: Repository<BranchEntity>,
  ) {}

  async create(data: CreateBranchDto) {
    try {
      const exist = await this.BranchRepo.findOne({
        where: {
          institute_id: data.institute_id,
          branch_name: data.branch_name,
        },
      });

      if (exist) {
        return new ConflictException({
          success: false,
          message: 'branch already existing',
        });
      }

      const branch = await this.BranchRepo.save(data);

      if (!branch) {
        return new InternalServerErrorException({
          success: false,
          message: 'internal server error',
        });
      }

      return {
        success: true,
        message: 'branch created successfully',
        data: branch,
      };
    } catch (error) {
      console.log(error, 'branch create error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async updateOne(data: UpdateBranchDto, uuid: string) {
    try {
      const branch = await this.BranchRepo.findOne({
        where: { uuid },
      });

      if (!branch) {
        return new NotFoundException({
          success: false,
          message: 'branch not found',
        });
      }

      Object.assign(branch, data);

      await this.BranchRepo.save(branch);

      return {
        success: true,
        message: 'institute details updated',
        data: branch,
      };
    } catch (error) {
      console.log(error, 'branch update error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findAllbyInstitute(
    uuid: string,
    query: { page: string; limit: string },
  ) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;

      const [branches, total] = await this.BranchRepo.findAndCount({
        where: { institute_id: uuid },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        message: 'branch data fetched',
        data: branches,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.log(error, 'branch find all error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }
}
