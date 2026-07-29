import fs from 'fs';
import { TAKTool, ToolContext } from '../registry';

export const manageDataPackagesTool: TAKTool = {
  name: 'tak_manage_data_packages',
  description: 'List, upload, download, or delete TAK data packages',
  category: 'data-packages',
  requiresAuth: true,
  requiresWrite: true,
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'upload', 'download', 'delete'],
        default: 'list',
        description: 'Action to perform'
      },
      packageId: {
        type: 'string',
        description: 'Data package ID for download/delete actions'
      },
      filePath: {
        type: 'string',
        description: 'Local file path for upload actions'
      },
      name: {
        type: 'string',
        description: 'Optional package name for uploads'
      },
      description: {
        type: 'string',
        description: 'Optional package description for uploads'
      },
      missionId: {
        type: 'string',
        description: 'Optional mission association for uploads'
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional keywords for uploads'
      },
      mimeType: {
        type: 'string',
        description: 'Optional MIME type override for uploads'
      },
      outputPath: {
        type: 'string',
        description: 'Local output path for downloads'
      }
    }
  },
  async handler(context: ToolContext) {
    const { takClient, params, logger } = context;

    logger.info('Managing data packages', { action: params.action });

    try {
      switch (params.action || 'list') {
        case 'list': {
          const dataPackages = await takClient.getDataPackages();
          return {
            success: true,
            count: dataPackages.length,
            dataPackages
          };
        }

        case 'upload': {
          if (!params.filePath) {
            throw new Error('filePath is required for upload');
          }

          const file = fs.readFileSync(params.filePath);
          const metadata = {
            name: params.name,
            description: params.description,
            missionId: params.missionId,
            keywords: params.keywords,
            mimeType: params.mimeType
          };

          const uploaded = await takClient.uploadDataPackage(file, metadata);
          return {
            success: true,
            dataPackage: uploaded
          };
        }

        case 'download': {
          if (!params.packageId) {
            throw new Error('packageId is required for download');
          }

          const buffer = await takClient.downloadDataPackage(params.packageId);

          if (params.outputPath) {
            fs.writeFileSync(params.outputPath, buffer);
            return {
              success: true,
              packageId: params.packageId,
              outputPath: params.outputPath,
              bytesWritten: buffer.length
            };
          }

          return {
            success: true,
            packageId: params.packageId,
            base64: buffer.toString('base64'),
            bytes: buffer.length
          };
        }

        case 'delete': {
          if (!params.packageId) {
            throw new Error('packageId is required for delete');
          }

          await takClient.deleteDataPackage(params.packageId);
          return {
            success: true,
            packageId: params.packageId,
            deleted: true
          };
        }

        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
    } catch (error) {
      logger.error('Failed to manage data packages', error);
      throw error;
    }
  }
};