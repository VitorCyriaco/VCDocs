import { Injectable, ForbiddenException, NotFoundException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Document, Role, DocumentView, User, Category, Department, DocumentVersion, TemporaryToken } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly TEMP_TOKEN_EXPIRATION_SECONDS = 120;

  async findAll(
    userId: string,
    userRole: Role,
    companyId: string,
    status?: string,
    departmentId?: number,
    title?: string,
    skip: number = 0,
    take: number = 10
  ) {
    const baseFilter: any = {
      companyId,
      status: status || undefined,
      title: title ? { contains: title, mode: 'insensitive' } : undefined,
      categories: departmentId ? { some: { departmentId: departmentId } } : undefined,
    };

    if (userRole === Role.ADMIN) {
      return this.prisma.document.findMany({
        where: baseFilter,
        skip,
        take,
        include: {
          categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
          uploadedBy: { select: { id: true, name: true } },
          restrictedToDepartments: { select: { id: true, name: true } }
        }
      });
    }

    const userWithDepartments = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departments: {
          where: { companyId },
          select: { id: true }
        },
      },
    });

    const userDepartmentIds = userWithDepartments?.departments.map(dept => dept.id) || [];

    if (userDepartmentIds.length === 0) {
      throw new ForbiddenException('Você não pertence a nenhum departamento associado a esta empresa.');
    }

    const permissionFilter: any = {
      AND: [
        {
          categories: {
            some: {
              departmentId: {
                in: userDepartmentIds
              }
            }
          }
        },
        {
          OR: [
            {
              restrictedToDepartments: { none: {} }
            },
            {
              AND: [
                { restrictedToDepartments: { some: {} } },
                {
                  restrictedToDepartments: {
                    some: {
                      id: { in: userDepartmentIds }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    const finalWhere = {
      AND: [
        baseFilter,
        permissionFilter
      ]
    };

    return this.prisma.document.findMany({
      where: finalWhere,
      skip,
      take,
      include: {
        categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
        uploadedBy: { select: { id: true, name: true } },
        restrictedToDepartments: { select: { id: true, name: true } }
      }
    });
  }

  async uploadDocument(
    file: Express.Multer.File,
    userId: string,
    companyId: string,
    categoryIds: number[] = [],
    restrictedDepartmentIds: number[] = []
  ): Promise<Document> {
    if (!file) throw new Error('Nenhum arquivo enviado');
    if (categoryIds.length === 0) throw new Error('Nenhuma categoria selecionada');

    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const relativePath = `uploads/${uniqueFilename}`;
    const fullPath = path.join(uploadsDir, uniqueFilename);

    try {
      fs.writeFileSync(fullPath, file.buffer);
    } catch (writeError) {
      console.error(`Erro ao salvar o arquivo ${fullPath}:`, writeError);
      throw new Error('Erro ao salvar o arquivo no servidor.');
    }

    const parsedFileName = path.parse(file.originalname);
    const documentTitle = parsedFileName.name;

    let createdDocument: Document | null = null;

    try {
      createdDocument = await this.prisma.document.create({
        data: {
          title: documentTitle,
          filePath: relativePath,
          uploadedById: userId,
          companyId: companyId,
          status: 'pending',
          categories: {
            connect: categoryIds.map(id => ({ id })),
          },
          restrictedToDepartments: {
            connect: restrictedDepartmentIds.map(id => ({ id })),
          },
        },
        include: {
          categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
          uploadedBy: { select: { name: true, id: true } },
          restrictedToDepartments: { select: { id: true, name: true } },
          versions: true
        }
      });

      try {
        await this.prisma.documentVersion.create({
          data: {
            version: 1,
            filePath: relativePath,
            documentId: createdDocument.id,
          },
        });
      } catch (versionError) {
        console.error(`Erro ao criar a versão 1 para o documento ${createdDocument?.id}:`, versionError);
        if (createdDocument) {
          try {
            await this.prisma.document.delete({ where: { id: createdDocument.id } });
            console.error(`Documento ${createdDocument.id} deletado após falha na criação da versão.`);
          } catch (deleteError) {
            console.error(`Erro ao deletar documento ${createdDocument.id} após falha na versão:`, deleteError);
          }
        }
        throw new Error('Erro ao criar a versão inicial do documento.');
      }

      return createdDocument;
    } catch (dbError: any) {
      console.error('Erro no processo de upload (criar Documento ou Versão):', dbError);
      if (fullPath && fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) console.error('Erro ao deletar arquivo salvo após falha no upload/BD:', err);
        });
      }
      throw new Error('Falha no processo de upload do documento.');
    }
  }

  async logDocumentView(documentId: string, userId: string, userRole: Role, userCompanyId: string): Promise<DocumentView | null> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        categories: { select: { department: { select: { id: true } } } },
        restrictedToDepartments: { select: { id: true } },
        company: { select: { id: true } }
      },
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID "${documentId}" não encontrado.`);
    }

    if (document.companyId !== userCompanyId) {
      throw new ForbiddenException('Você não tem acesso a documentos de outras empresas.');
    }

    const userWithDepartments = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departments: { select: { id: true } },
      },
    });

    const userDepartmentIds = userWithDepartments?.departments.map(dept => dept.id) || [];

    let hasPermission = false;

    if (userRole === Role.ADMIN) {
      hasPermission = true;
    } else {
      const isLinkedToUserDepartmentViaCategory = document.categories.some(category =>
        userDepartmentIds.includes(category.department.id)
      );

      const isNotRestricted = document.restrictedToDepartments.length === 0;
      const isInRestrictedDepartment = document.restrictedToDepartments.some(restrictedDept =>
        userDepartmentIds.includes(restrictedDept.id)
      );

      hasPermission = isLinkedToUserDepartmentViaCategory && (isNotRestricted || isInRestrictedDepartment);
    }

    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para visualizar este documento.');
    }

    try {
      return await this.prisma.documentView.create({
        data: {
          documentId: document.id,
          viewerId: userId,
        },
      });
    } catch (logError: any) {
      console.error(`Erro ao registrar visualização para Documento ${documentId} por Usuário ${userId}:`, logError);
      return null;
    }
  }

  async findAllDoc() {
    return this.prisma.document.findMany({
      include: { categories: true, restrictedToDepartments: true, uploadedBy: true }
    });
  }

  async getCompanyDocuments(companyId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
        uploadedBy: { select: { name: true, id: true } },
        restrictedToDepartments: { select: { id: true, name: true } }
      }
    });
  }

  async getUserUploadedDocuments(userId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
        uploadedBy: { select: { name: true, id: true } },
        restrictedToDepartments: { select: { id: true, name: true } }
      }
    });
  }

  async approveDocument(documentId: string, approvedById: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID "${documentId}" não encontrado.`);
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'approved',
        approvedById: approvedById,
      },
      include: {
        categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
        uploadedBy: { select: { name: true, id: true } },
        approvedBy: { select: { name: true, id: true } },
        restrictedToDepartments: { select: { id: true, name: true } }
      }
    });
  }

  async rejectDocument(documentId: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID "${documentId}" não encontrado.`);
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'rejected',
      },
      include: {
        categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
        uploadedBy: { select: { name: true, id: true } },
        approvedBy: { select: { name: true, id: true } },
        restrictedToDepartments: { select: { id: true, name: true } }
      }
    });
  }

  async getVersions(documentId: string) {
    const versions = await this.prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
    });

    return versions;
  }

  async updateDocumentFile(documentId: string, file: Express.Multer.File) {
    if (!file) throw new Error('Nenhum arquivo enviado para atualização');

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: { orderBy: { version: 'desc' } } },
    });

    if (!document) throw new NotFoundException('Documento não encontrado');

    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const relativePath = `uploads/${uniqueFilename}`;
    const fullPath = path.join(uploadsDir, uniqueFilename);

    try {
      fs.writeFileSync(fullPath, file.buffer);
    } catch (writeError) {
      console.error(`Erro ao salvar o novo arquivo ${fullPath}:`, writeError);
      throw new Error('Erro ao salvar o novo arquivo no servidor.');
    }

    const latestVersion = document.versions[0];
    const nextVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    try {
      await this.prisma.documentVersion.create({
        data: {
          version: nextVersionNumber,
          filePath: relativePath,
          documentId: document.id,
        },
      });
    } catch (versionError) {
      console.error(`Erro ao criar a versão ${nextVersionNumber} para o documento ${document.id}:`, versionError);
      try {
        await this.prisma.document.delete({ where: { id: document.id } });
        console.error(`Documento ${document.id} deletado após falha na criação da versão.`);
      } catch (deleteError) {
        console.error(`Erro ao deletar documento ${document.id} após falha na versão:`, deleteError);
      }
      throw new Error('Erro ao atualizar versão do documento no banco de dados.');
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: { filePath: relativePath },
      include: {
        categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
        uploadedBy: { select: { name: true, id: true } },
        restrictedToDepartments: { select: { id: true, name: true } }
      }
    });
  }

  async getDocumentById(documentId: string, userId: string, userRole: Role, userCompanyId: string): Promise<Document | null> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true, department: { select: { id: true, name: true } } } },
        restrictedToDepartments: { select: { id: true, name: true } },
        versions: { orderBy: { version: 'desc' } },
      },
    });

    if (!document) {
      throw new NotFoundException(`Documento com ID "${documentId}" não encontrado.`);
    }

    if (document.companyId !== userCompanyId) {
      throw new ForbiddenException('Você não tem acesso a documentos de outras empresas.');
    }

    const userWithDepartments = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departments: { select: { id: true } },
      },
    });

    const userDepartmentIds = userWithDepartments?.departments.map(dept => dept.id) || [];

    let hasPermission = false;

    if (userRole === Role.ADMIN) {
      hasPermission = true;
    } else {
      const isLinkedToUserDepartmentViaCategory = document.categories.some(category =>
        userDepartmentIds.includes(category.department.id)
      );

      const isNotRestricted = document.restrictedToDepartments.length === 0;
      const isInRestrictedDepartment = document.restrictedToDepartments.some(restrictedDept =>
        userDepartmentIds.includes(restrictedDept.id)
      );

      hasPermission = isLinkedToUserDepartmentViaCategory && (isNotRestricted || isInRestrictedDepartment);
    }

    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para visualizar este documento.');
    }

    return document;
  }

  async generateSignedFileUrl(documentId: string, userId: string, userRole: Role, userCompanyId: string): Promise<string> {
    const document = await this.getDocumentById(documentId, userId, userRole, userCompanyId);

    const tempToken = uuidv4();
    const expiresAt = new Date(Date.now() + this.TEMP_TOKEN_EXPIRATION_SECONDS * 1000);

    try {
      if (document)
        await this.prisma.temporaryToken.create({
          data: {
            token: tempToken,
            documentId: document.id,
            userId: userId,
            expiresAt: expiresAt,
          },
        });
    } catch (dbError) {
      console.error(`Erro ao salvar token temporário para o documento ${documentId} e usuário ${userId}:`, dbError);
      throw new Error('Erro ao gerar token de acesso ao arquivo.');
    }

    return `http://localhost:3001/documents/${documentId}/file?token=${tempToken}`;
  }

  async serveDocumentFile(documentId: string, queryToken: string | undefined, res: Response): Promise<void> {
    if (!queryToken) {
      throw new ForbiddenException('Acesso direto ao arquivo requer um token válido.');
    }

    const tokenData = await this.prisma.temporaryToken.findUnique({
      where: { token: queryToken },
    });

    const now = new Date();

    if (!tokenData || tokenData.expiresAt < now || tokenData.documentId !== documentId) {
      if (tokenData) {
        try {
          await this.prisma.temporaryToken.delete({ where: { token: queryToken } });
        } catch (deleteError) {
          console.error(`Erro ao deletar token inválido/expirado ${queryToken}:`, deleteError);
        }
      }
      throw new ForbiddenException('Token de acesso ao arquivo inválido ou expirado.');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { filePath: true, title: true }
    });

    if (!document) {
      try {
        await this.prisma.temporaryToken.delete({ where: { token: queryToken } });
      } catch (deleteError) {
        console.error(`Erro ao deletar token para documento não encontrado ${queryToken}:`, deleteError);
      }
      throw new NotFoundException('Arquivo do documento não encontrado.');
    }

    const fullPath = join(process.cwd(), document.filePath);

    if (!fs.existsSync(fullPath)) {
      try {
        await this.prisma.temporaryToken.delete({ where: { token: queryToken } });
      } catch (deleteError) {
        console.error(`Erro ao deletar token para arquivo físico não encontrado ${queryToken}:`, deleteError);
      }
      throw new NotFoundException('Arquivo do documento não encontrado no servidor.');
    }

    try {
      await this.prisma.temporaryToken.delete({ where: { token: queryToken } });
    } catch (deleteError) {
      console.error(`Erro ao deletar token ${queryToken} após uso:`, deleteError);
    }

    const mimeType = path.extname(document.filePath).toLowerCase() === '.pdf' ? 'application/pdf' : 'application/octet-stream';
    const safeFileName = document.title.replace(/[^a-z0-9_\-\.]/gi, '_');
    const fileExtension = path.extname(document.filePath);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}${fileExtension}"`);

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error(`Erro durante o streaming do arquivo ${fullPath}:`, err);
      if (!res.headersSent) {
        res.status(500).send('Erro interno ao servir arquivo.');
      } else {
        res.end();
      }
    });

    res.on('close', () => {
      stream.destroy();
    });
  }

  async serveDocumentForDownload(documentId: string, queryToken: string | undefined, res: Response): Promise<void> {
    if (!queryToken) {
      throw new ForbiddenException('Download do arquivo requer um token válido.');
    }

    const tokenData = await this.prisma.temporaryToken.findUnique({
      where: { token: queryToken },
    });

    const now = new Date();

    if (!tokenData || tokenData.expiresAt < now || tokenData.documentId !== documentId) {
      if (tokenData) {
        try {
          await this.prisma.temporaryToken.delete({ where: { token: queryToken } });
        } catch (deleteError) {
          console.error(`Erro ao deletar token inválido/expirado para download ${queryToken}:`, deleteError);
        }
      }
      throw new ForbiddenException('Token de acesso para download inválido ou expirado.');
    }

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { filePath: true, title: true }
    });

    if (!document) {
      try {
        await this.prisma.temporaryToken.delete({ where: { token: queryToken } });
      } catch (deleteError) {
        console.error(`Erro ao deletar token para documento não encontrado para download ${queryToken}:`, deleteError);
      }
      throw new NotFoundException('Arquivo do documento não encontrado para download.');
    }

    const fullPath = join(process.cwd(), document.filePath);

    if (!fs.existsSync(fullPath)) {
      try {
        await this.prisma.temporaryToken.delete({ where: { token: queryToken } });
      } catch (deleteError) {
        console.error(`Erro ao deletar token para arquivo físico não encontrado para download ${queryToken}:`, deleteError);
      }
      throw new NotFoundException('Arquivo do documento não encontrado no servidor para download.');
    }

    try {
      await this.prisma.temporaryToken.delete({ where: { token: queryToken } });
    } catch (deleteError) {
      console.error(`Erro ao deletar token ${queryToken} após uso para download:`, deleteError);
    }

    const mimeType = path.extname(document.filePath).toLowerCase() === '.pdf' ? 'application/pdf' : 'application/octet-stream';
    const safeFileName = document.title.replace(/[^a-z0-9_\-\.]/gi, '_');
    const fileExtension = path.extname(document.filePath);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}${fileExtension}"`);

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error(`Erro durante o streaming do arquivo para download ${fullPath}:`, err);
      if (!res.headersSent) {
        res.status(500).send('Erro interno ao servir arquivo para download.');
      } else {
        res.end();
      }
    });

    res.on('close', () => {
      stream.destroy();
    });
  }
}