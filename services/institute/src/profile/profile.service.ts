import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BranchEntity } from 'src/entities/branch.entity';
import { InstituteEntity } from 'src/entities/institute.entity';
import { Repository } from 'typeorm';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(InstituteEntity)
    private InstituteRepo: Repository<InstituteEntity>,

    @InjectRepository(BranchEntity)
    private BranchRepo: Repository<BranchEntity>,
  ) {}

  async create(data: CreateProfileDto) {
    try {
      if (!data.email) {
        return new NotFoundException({
          success: false,
          message: 'input missing',
        });
      }

      const exist = await this.InstituteRepo.findOne({
        where: { email: data?.email, institute_name: data.institute_name },
      });

      if (exist) {
        return new ConflictException({
          success: false,
          message: 'email already exist',
        });
      }

      const institute = this.InstituteRepo.create({
        institute_name: data.institute_name,
        email: data.email,
        phone_number: data.phone_number,
        logo: data.logo,
      });

      await this.InstituteRepo.save(institute);

      const branch = this.BranchRepo.create({
        branch_name: data.branch_name,
        institute_id: institute.uuid,
        email: data.branch_email,
        address: data.address,
        phone_number: data.branch_number,
      });

      await this.BranchRepo.save(branch);

      return { success: true, message: 'new institute created successfully' };
    } catch (error) {
      console.log(error, 'institute create error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async findOne(uuid: string) {
    try {
      const institute = await this.InstituteRepo.findOne({
        where: { uuid },
      });

      if (!institute) {
        return new NotFoundException({
          success: false,
          message: 'institute not founded',
        });
      }

      return {
        success: true,
        message: 'institute data fetched',
        data: institute,
      };
    } catch (error) {
      console.log(error, 'institute find error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async updateOne(data: UpdateProfileDto, uuid: string) {
    try {
      const institute = await this.InstituteRepo.findOne({
        where: { uuid },
      });

      if (!institute) {
        return new NotFoundException({
          success: false,
          message: 'Institute not found',
        });
      }

      Object.assign(institute, data);

      await this.InstituteRepo.save(institute);

      return {
        success: true,
        message: 'institute details updated',
        data: institute,
      };
    } catch (error) {
      console.log(error, 'institute update eror');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async findAll() {
    const data = await this.InstituteRepo.find();
    const data2 = await this.BranchRepo.find();

    return {
      institute: data,
      branch: data2,
    };
  }
}
