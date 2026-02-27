import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './pet.entity';
import { ReminderTemplate } from './reminder-template.entity';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pet, ReminderTemplate])],
  controllers: [PetController],
  providers: [PetService],
  exports: [PetService],
})
export class PetModule {}
