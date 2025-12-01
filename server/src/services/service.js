import XLSX from 'xlsx';
import crypto from 'crypto';

// Constants
const MAX_USERS_PER_IMPORT = 100;
const MAX_STRING_LENGTH = 255;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_LENGTH = 16;
const TOKEN_LENGTH = 20;

// Template configuration
const TEMPLATE_COLUMNS = ['email', 'firstname', 'lastname'];
const TEMPLATE_SAMPLE_DATA = [
  ['user1@example.com', 'John', 'Doe'],
  ['user2@example.com', 'Jane', 'Smith'],
];

// Results file configuration
const RESULTS_COLUMNS = ['Email', 'First Name', 'Last Name', 'Invitation Link', 'Status'];
const RESULTS_COLUMN_WIDTHS = [
  { wch: 30 }, // Email
  { wch: 20 }, // First Name
  { wch: 20 }, // Last Name
  { wch: 80 }, // Invitation Link
  { wch: 10 }, // Status
];

/**
 * Service for batch user creation
 */
const service = ({ strapi }) => ({
  /**
   * Generate an Excel template for user import
   * @returns {Buffer} Excel template buffer
   */
  generateTemplate() {
    const templateData = [TEMPLATE_COLUMNS, ...TEMPLATE_SAMPLE_DATA];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },

  /**
   * Validate and sanitize a string field
   * @private
   */
  _sanitizeString(value, maxLength = MAX_STRING_LENGTH) {
    if (!value) return '';
    return String(value).trim().substring(0, maxLength);
  },

  /**
   * Validate email format
   * @private
   */
  _validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Missing or invalid email field');
    }

    const sanitizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      throw new Error(`Invalid email format: ${sanitizedEmail}`);
    }

    return sanitizedEmail;
  },

  /**
   * Parse Excel file and extract user data
   * @param {Buffer} fileBuffer - Excel file buffer
   * @returns {Array} Array of sanitized user objects
   */
  parseExcelFile(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    if (!workbook.SheetNames.length) {
      throw new Error('Excel file contains no sheets');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const users = XLSX.utils.sheet_to_json(worksheet);

    if (users.length === 0) {
      throw new Error('Excel file contains no user data');
    }

    if (users.length > MAX_USERS_PER_IMPORT) {
      throw new Error(`Import limit exceeded. Maximum ${MAX_USERS_PER_IMPORT} users per import`);
    }

    // Validate and sanitize each user
    return users.map((user, index) => {
      try {
        return {
          email: this._validateEmail(user.email),
          firstname: this._sanitizeString(user.firstname),
          lastname: this._sanitizeString(user.lastname),
        };
      } catch (error) {
        throw new Error(`Row ${index + 2}: ${error.message}`);
      }
    });
  },

  /**
   * Generate a secure random password
   * @returns {String} Random password
   */
  generatePassword() {
    return crypto.randomBytes(PASSWORD_LENGTH).toString('hex');
  },

  /**
   * Generate invitation link for a user
   * @private
   */
  _generateInvitationLink(registrationToken) {
    const appUrl = strapi.config.get('server.url', 'http://localhost:1337');
    return `${appUrl}/admin/auth/register?registrationToken=${registrationToken}`;
  },

  /**
   * Create a single admin user
   * @private
   */
  async _createAdminUser(userData, roleId) {
    // Check for existing user
    const existingUser = await strapi.query('admin::user').findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('Admin user already exists');
    }

    // Generate credentials
    const password = this.generatePassword();
    const hashedPassword = await strapi.service('admin::auth').hashPassword(password);
    const registrationToken = crypto.randomBytes(TOKEN_LENGTH).toString('hex');

    // Create user
    await strapi.query('admin::user').create({
      data: {
        email: userData.email,
        firstname: userData.firstname,
        lastname: userData.lastname,
        password: hashedPassword,
        isActive: false,
        registrationToken,
        roles: [roleId],
      },
    });

    return {
      email: userData.email,
      firstname: userData.firstname,
      lastname: userData.lastname,
      invitationLink: this._generateInvitationLink(registrationToken),
      status: 'success',
    };
  },

  /**
   * Create admin users in batch with the specified role
   * @param {Array} usersData - Array of user data objects
   * @param {Number} roleId - Role ID to assign to users
   * @returns {Object} Results and errors
   */
  async importUsers(usersData, roleId) {
    const results = [];
    const errors = [];

    for (const userData of usersData) {
      try {
        const result = await this._createAdminUser(userData, roleId);
        results.push(result);
      } catch (error) {
        strapi.log.error(`Failed to create user ${userData.email}:`, error);
        errors.push({
          email: userData.email,
          error: error.message,
        });
      }
    }

    return { results, errors };
  },

  /**
   * Generate Excel file with import results and invitation links
   * @param {Array} results - Array of import results
   * @returns {Buffer} Excel results buffer
   */
  generateResultsFile(results) {
    const data = [
      RESULTS_COLUMNS,
      ...results.map(user => [
        user.email,
        user.firstname,
        user.lastname,
        user.invitationLink,
        user.status,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!cols'] = RESULTS_COLUMN_WIDTHS;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Results');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },

  /**
   * Get all available admin roles
   * @returns {Array} Array of role objects
   */
  async getRoles() {
    return await strapi.query('admin::role').findMany({
      orderBy: { name: 'asc' },
    });
  },
});

export default service;
