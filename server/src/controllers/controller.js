const crypto = require('crypto');
const fs = require('fs');

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
const RESULT_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour
const RESULT_ID_LENGTH = 32;

/**
 * Controller for batch user creation plugin
 */
const controller = ({ strapi }) => ({
  /**
   * Download Excel template for user import
   * @param {Object} ctx - Koa context
   * @returns {Buffer} Excel template file
   */
  async downloadTemplate(ctx) {
    try {
      const service = strapi.plugin('admin-users-import').service('service');
      const buffer = service.generateTemplate();

      ctx.type = ALLOWED_MIME_TYPES[0];
      ctx.set('Content-Disposition', 'attachment; filename="user-import-template.xlsx"');
      ctx.set('Content-Length', buffer.length);
      ctx.body = buffer;
    } catch (error) {
      strapi.log.error('Failed to generate template:', error);
      ctx.throw(500, `Failed to generate template: ${error.message}`);
    }
  },

  /**
   * Validate uploaded file
   * @private
   */
  _validateFile(file) {
    const fileName = file.name || file.originalFilename || '';
    const fileSize = file.size || (file.buffer && file.buffer.length) || 0;
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new Error(`Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`);
    }
  },

  /**
   * Extract file buffer from various file formats
   * @private
   */
  _getFileBuffer(file) {
    if (Buffer.isBuffer(file)) {
      return { buffer: file, tempPath: null };
    }
    if (file.buffer) {
      return { buffer: file.buffer, tempPath: null };
    }
    if (file.path || file.filepath) {
      const tempPath = file.path || file.filepath;
      return { buffer: fs.readFileSync(tempPath), tempPath };
    }
    if (file._buf) {
      return { buffer: file._buf, tempPath: null };
    }
    throw new Error('Invalid file format - unable to read file buffer');
  },

  /**
   * Clean up old import results
   * @private
   */
  _cleanupOldResults() {
    if (!global.importResults) return;

    const expiryTime = Date.now() - RESULT_EXPIRY_TIME;
    Object.keys(global.importResults).forEach(id => {
      if (global.importResults[id].timestamp < expiryTime) {
        delete global.importResults[id];
      }
    });
  },

  /**
   * Import users from Excel file
   * @param {Object} ctx - Koa context
   * @returns {Object} Import results
   */
  async importUsers(ctx) {
    let tempFilePath = null;

    try {
      const { files, body } = ctx.request;

      // Validate request
      if (!files || !files.file) {
        return ctx.badRequest('No file uploaded');
      }

      const file = files.file;

      // Validate file
      try {
        this._validateFile(file);
      } catch (error) {
        return ctx.badRequest(error.message);
      }

      // Validate role
      const roleId = parseInt(body.roleId);
      if (!roleId || isNaN(roleId)) {
        return ctx.badRequest('Valid role ID is required');
      }

      const role = await strapi.query('admin::role').findOne({ where: { id: roleId } });
      if (!role) {
        return ctx.badRequest('Invalid role ID');
      }

      // Get service
      const service = strapi.plugin('admin-users-import').service('service');

      // Extract file buffer
      const { buffer, tempPath } = this._getFileBuffer(file);
      tempFilePath = tempPath;

      // Parse and import users
      const usersData = service.parseExcelFile(buffer);
      const { results, errors } = await service.importUsers(usersData, roleId);

      // Generate and store results
      const resultsBuffer = service.generateResultsFile(results);
      const resultId = crypto.randomBytes(RESULT_ID_LENGTH / 2).toString('hex');

      global.importResults = global.importResults || {};
      global.importResults[resultId] = {
        buffer: resultsBuffer,
        timestamp: Date.now(),
        userId: ctx.state.user.id,
      };

      // Clean up expired results
      this._cleanupOldResults();

      ctx.body = {
        success: true,
        message: `Successfully imported ${results.length} users`,
        totalProcessed: usersData.length,
        successCount: results.length,
        errorCount: errors.length,
        errors,
        resultId,
      };
    } catch (error) {
      strapi.log.error('Failed to import users:', error);
      ctx.throw(500, `Failed to import users: ${error.message}`);
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          strapi.log.error('Failed to cleanup temporary file:', cleanupError);
        }
      }
    }
  },

  /**
   * Download import results Excel file
   * @param {Object} ctx - Koa context
   * @returns {Buffer} Results Excel file
   */
  async downloadResults(ctx) {
    try {
      const { resultId } = ctx.params;

      // Validate resultId format (hex string of specific length)
      const validIdRegex = new RegExp(`^[a-f0-9]{${RESULT_ID_LENGTH}}$`);
      if (!validIdRegex.test(resultId)) {
        return ctx.badRequest('Invalid result ID format');
      }

      if (!global.importResults || !global.importResults[resultId]) {
        return ctx.notFound('Results not found or expired');
      }

      const result = global.importResults[resultId];

      // Verify ownership
      if (result.userId !== ctx.state.user.id) {
        return ctx.forbidden('You do not have permission to access this result');
      }

      // Set response headers
      ctx.type = ALLOWED_MIME_TYPES[0];
      ctx.set('Content-Disposition', 'attachment; filename="user-import-results.xlsx"');
      ctx.set('Content-Length', result.buffer.length);
      ctx.body = result.buffer;

      // Clean up after successful download
      delete global.importResults[resultId];
    } catch (error) {
      strapi.log.error('Failed to download results:', error);
      ctx.throw(500, `Failed to download results: ${error.message}`);
    }
  },

  /**
   * Get available admin roles
   * @param {Object} ctx - Koa context
   * @returns {Object} List of roles
   */
  async getRoles(ctx) {
    try {
      const service = strapi.plugin('admin-users-import').service('service');
      const roles = await service.getRoles();

      ctx.body = {
        roles: roles.map(role => ({
          id: role.id,
          name: role.name,
          code: role.code,
        })),
      };
    } catch (error) {
      strapi.log.error('Failed to fetch roles:', error);
      ctx.throw(500, `Failed to fetch roles: ${error.message}`);
    }
  },
});

export default controller;
