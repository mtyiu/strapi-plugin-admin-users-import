# Strapi Plugin Admin Users Import

A Strapi 5 plugin that allows administrators to import admin panel users in batch from Excel files and generate invitation links for each user.

## Features

- 📥 **Download Excel Template**: Get a pre-formatted Excel template with required user fields
- 📤 **Batch Admin User Import**: Upload an Excel file to create multiple admin users at once
- 👥 **Role Assignment**: Assign a specific admin role to all imported users
- 🔗 **Invitation Links**: Automatically generate unique registration links for each admin user
- 📊 **Results Export**: Download a detailed Excel file with all imported users and their invitation links
- ✅ **Error Handling**: Get detailed feedback on successful imports and any errors

**Note**: This plugin creates admin panel users (who can access `/admin`), not frontend API users.

## Installation

```bash
npm install strapi-plugin-admin-users-import
```

## Access Control

**Important**: This plugin is only accessible to Super Admin users. No other admin roles can access or use this plugin, regardless of their permissions.

This is a security measure to ensure that batch user creation capabilities are restricted to the highest level of administrative access.

## Usage

### 1. Access the Plugin

After installation, Super Admin users can navigate to the "Batch Create Users" plugin in the Strapi admin panel. Other admin users will not see this plugin in their menu.

### 2. Download Template

Click the "Download Template" button to get an Excel template with the required format. The template includes the following columns:

- **email** (required): User's email address
- **firstname** (optional): User's first name
- **lastname** (optional): User's last name

### 3. Fill in User Data

Open the downloaded template in Excel or any spreadsheet application and fill in the user information. Each row represents one user to be imported.

### 4. Import Users

1. Click the "Import Users" button
2. In the modal that appears:
   - Upload your completed Excel file
   - Select the role you want to assign to all imported users
3. Click "Import Users" to start the import process

### 5. Download Results

After a successful import, you'll see a success message with:
- Number of successfully imported users
- Number of failed imports (if any)
- A "Download Results with Invitation Links" button

Click this button to download an Excel file containing:
- All imported user information
- Unique invitation links for each user
- Import status for each user

### 6. Share Invitation Links

Share the invitation links with your users. When users click their invitation link, they can:
- Set their password
- Activate their account
- Start using your application

## API Endpoints

The plugin provides the following endpoints:

- `GET /admin-users-import/template` - Download Excel template
- `POST /admin-users-import/import` - Import users from Excel
- `GET /admin-users-import/results/:resultId` - Download import results
- `GET /admin-users-import/roles` - Get available user roles

## Configuration

### Server URL

The plugin uses your Strapi server URL to generate invitation links. Make sure your `config/server.js` has the correct URL:

```javascript
module.exports = ({ env }) => ({
  url: env('SERVER_URL', 'http://localhost:1337'),
  // ... other config
});
```

## Development

### Building the Plugin

```bash
npm run build
```

### Watching for Changes

```bash
npm run watch
```

## Excel File Format

### Template Structure

| email | firstname | lastname |
|-------|-----------|----------|
| user1@example.com | John | Doe |
| user2@example.com | Jane | Smith |

### Results Structure

| email | First Name | Last Name | Invitation Link | Status |
|-------|------------|-----------|-----------------|--------|
| user1@example.com | John | Doe | http://localhost:1337/admin/auth/reset-password?code=... | success |
| user2@example.com | Jane | Smith | http://localhost:1337/admin/auth/reset-password?code=... | success |

## Troubleshooting

### Import Fails

- Ensure the Excel file follows the template format
- Check that required field (email) are filled for all users
- Verify that emails are unique and not already in use

### Invitation Links Don't Work

- Verify that `server.url` is correctly configured in your Strapi configuration
- Ensure the URL is accessible to your users

### Role Not Available

- Make sure you have created user roles in Strapi's Users & Permissions plugin
- Check that the selected role exists and is active

## License

MIT

## Author

Matt Yiu <matt.yiu@wavenex.com.hk>
