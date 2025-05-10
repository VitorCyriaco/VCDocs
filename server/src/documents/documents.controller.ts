import {
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Request,
    Get,
    Param,
    Patch,
    Query,
    Body,
    HttpException,
    HttpStatus,
    NotFoundException,
    ForbiddenException,
    Res,
    StreamableFile
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { Express } from 'express';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, DocumentView, User } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    @Post('upload')
    @Roles(Role.ADMIN, Role.VALIDATOR, Role.EDITOR)
    @UseGuards(RolesGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
        @Body() body: { categoryIds?: string; restrictedDepartmentIds?: string },
    ) {
        const user = req.user as User;
        let categoryIds: number[] = [];
        let restrictedDepartmentIds: number[] = [];

        try {
            if (body.categoryIds) {
                const categoryIdsString = String(body.categoryIds);
                categoryIds = JSON.parse(categoryIdsString).map(Number);
                if (!Array.isArray(categoryIds) || categoryIds.some(isNaN)) {
                    throw new Error('Formato inválido para IDs de categoria.');
                }
            }

            if (body.restrictedDepartmentIds) {
                const restrictedDepartmentIdsString = String(body.restrictedDepartmentIds);
                restrictedDepartmentIds = JSON.parse(restrictedDepartmentIdsString).map(Number);
                if (!Array.isArray(restrictedDepartmentIds) || restrictedDepartmentIds.some(isNaN)) {
                    throw new Error('Formato inválido para IDs de departamento de restrição.');
                }
            }

        } catch (error: any) {
            throw new HttpException(`Dados inválidos no corpo da requisição: ${error.message}`, HttpStatus.BAD_REQUEST);
        }

        try {
            return await this.documentsService.uploadDocument(
                file,
                user.id,
                user.companyId,
                categoryIds,
                restrictedDepartmentIds
            );
        } catch (serviceError: any) {
             throw new HttpException(
                 serviceError.message || 'Falha no processo de upload do documento.',
                 HttpStatus.INTERNAL_SERVER_ERROR
             );
         }
    }

    @Get('company')
    async getCompanyDocuments(@Request() req: any) {
        const user = req.user as User;
        if (!user.companyId) {
             throw new ForbiddenException('Usuário não associado a uma empresa.');
         }
        return this.documentsService.getCompanyDocuments(user.companyId);
    }

    @Get()
    async findAll(
        @Request() req: any,
        @Query('status') status?: string,
        @Query('departmentId') departmentId?: number,
        @Query('title') title?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        const user = req.user as User;
         if (!user.companyId) {
             throw new ForbiddenException('Usuário não associado a uma empresa.');
         }

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const departmentIdNum = departmentId ? Number(departmentId) : undefined;

        if (isNaN(pageNum) || pageNum < 1) throw new HttpException('Número da página inválido.', HttpStatus.BAD_REQUEST);
        if (isNaN(limitNum) || limitNum < 1) throw new HttpException('Limite por página inválido.', HttpStatus.BAD_REQUEST);
        if (departmentId !== undefined && isNaN(departmentIdNum as number)) throw new HttpException('ID do departamento inválido.', HttpStatus.BAD_REQUEST);


        return this.documentsService.findAll(
            user.id,
            user.role,
            user.companyId,
            status,
            departmentIdNum,
            title,
            (pageNum - 1) * limitNum,
            limitNum
        );
    }

    @Get('all')
    @Roles(Role.ADMIN)
    @UseGuards(RolesGuard)
    async findAllDoc() {
        return this.documentsService.findAllDoc();
    }

    @Get('my-uploads')
    async getUserUploadedDocuments(@Request() req: any) {
        const user = req.user as User;
        return this.documentsService.getUserUploadedDocuments(user.id);
    }

    @Patch(':id/approve')
    @Roles(Role.ADMIN, Role.VALIDATOR)
    @UseGuards(RolesGuard)
    async approve(@Param('id') id: string, @Request() req: any) {
        const user = req.user as User;
        return this.documentsService.approveDocument(id, user.id);
    }

    @Patch(':id/reject')
    @Roles(Role.ADMIN, Role.VALIDATOR)
    @UseGuards(RolesGuard)
    async reject(@Param('id') id: string) {
        return this.documentsService.rejectDocument(id);
    }

    @Get(':id/versions')
    async getVersions(@Param('id') id: string) {
        return this.documentsService.getVersions(id);
    }

    @Post(':id/log-view')
    async logView(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        const user = req.user as User;
         if (!user.companyId) {
             throw new ForbiddenException('Usuário não associado a uma empresa.');
         }

        try {
            const viewLog = await this.documentsService.logDocumentView(id, user.id, user.role, user.companyId);
            return {
                success: viewLog !== null,
                log: viewLog
            };
        } catch (error: any) {
             if (error instanceof NotFoundException) {
                 throw new NotFoundException(error.message);
             }
             if (error instanceof ForbiddenException) {
                 throw new ForbiddenException(error.message);
             }
             throw new HttpException(
                 error.message || 'Erro interno ao registrar visualização.',
                 HttpStatus.INTERNAL_SERVER_ERROR
             );
         }
    }


    @Get(':id')
    async getDocumentDetails(
        @Param('id') id: string,
        @Request() req: any,
    ) {
        const user = req.user as User;
         if (!user.companyId) {
             throw new ForbiddenException('Usuário não associado a uma empresa.');
         }

        try {
            const document = await this.documentsService.getDocumentById(id, user.id, user.role, user.companyId);
            return document;
        } catch (error: any) {
              if (error instanceof NotFoundException) {
                  throw new NotFoundException(error.message);
              }
              if (error instanceof ForbiddenException) {
                  throw new ForbiddenException(error.message);
              }
              throw new HttpException(
                  error.message || 'Erro interno ao obter detalhes do documento.',
                  HttpStatus.INTERNAL_SERVER_ERROR
              );
          }
    }

    @Get(':id/signed-url')
    async generateDocumentSignedUrl(
        @Param('id') id: string,
        @Request() req: any
    ): Promise<{ url: string }> {
        const user = req.user as User;
         if (!user.companyId) {
             throw new ForbiddenException('Usuário não associado a uma empresa.');
         }

        try {
            const signedUrl = await this.documentsService.generateSignedFileUrl(id, user.id, user.role, user.companyId);
            return { url: signedUrl };
        } catch (error: any) {
              if (error instanceof NotFoundException) {
                  throw new NotFoundException(error.message);
              }
              if (error instanceof ForbiddenException) {
                  throw new ForbiddenException(error.message);
              }
              throw new HttpException(
                  error.message || 'Erro interno ao gerar URL assinada.',
                  HttpStatus.INTERNAL_SERVER_ERROR
              );
          }
    }

    @Get(':documentId/file')
    @UseGuards()
    async serveFile(
        @Param('documentId') documentId: string,
        @Query('token') token: string | undefined,
        @Res() res: Response
    ): Promise<void> {
        try {
            await this.documentsService.serveDocumentFile(documentId, token, res);
        } catch (error: any) {
             if (error instanceof NotFoundException) {
                 res.status(HttpStatus.NOT_FOUND).send(error.message);
             } else if (error instanceof ForbiddenException) {
                 res.status(HttpStatus.FORBIDDEN).send(error.message);
             } else {
                 res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message || 'Erro interno ao servir o arquivo do documento.');
             }
         }
    }

    @Get(':documentId/download')
    @UseGuards()
    async downloadDocument(
      @Param('documentId') documentId: string,
      @Query('token') token: string | undefined,
      @Res() res: Response
    ): Promise<void> {
       try {
         await this.documentsService.serveDocumentForDownload(documentId, token, res);
       } catch (error: any) {
         if (error instanceof NotFoundException) {
             res.status(HttpStatus.NOT_FOUND).send(error.message);
         } else if (error instanceof ForbiddenException) {
             res.status(HttpStatus.FORBIDDEN).send(error.message);
         } else {
             res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message || 'Erro interno ao servir o arquivo para download.');
         }
       }
    }
}