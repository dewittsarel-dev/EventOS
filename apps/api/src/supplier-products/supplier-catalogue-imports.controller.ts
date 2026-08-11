import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateSupplierCatalogueImportDto,
  UpdateSupplierCatalogueImportDto,
} from './dto/supplier-catalogue-import.dto';
import { SupplierCatalogueImportsService } from './supplier-catalogue-imports.service';

@ApiTags('supplier-catalogue-imports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('suppliers/:supplierId/catalogue-imports')
export class SupplierCatalogueImportsController {
  constructor(private readonly service: SupplierCatalogueImportsService) {}

  @Post()
  create(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Body() dto: CreateSupplierCatalogueImportDto,
  ) {
    return this.service.create(user.id, supplierId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Query('organizationId') organizationId: string,
  ) {
    return this.service.list(user.id, supplierId, organizationId);
  }

  @Patch(':importId')
  update(
    @CurrentUser() user: UserResponseDto,
    @Param('supplierId') supplierId: string,
    @Param('importId') importId: string,
    @Body() dto: UpdateSupplierCatalogueImportDto,
  ) {
    return this.service.update(user.id, supplierId, importId, dto);
  }
}
