import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { H5Customer } from './h5-customer.entity';
import { H5Pet } from './h5-pet.entity';
import { H5PetService } from './h5-pet.service';
import { H5PetController } from './h5-pet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([H5Customer, H5Pet])],
  controllers: [H5PetController],
  providers: [H5PetService],
  exports: [TypeOrmModule, H5PetService],
})
export class H5CustomerModule {}
