# Quick Start Guide - Batch Create Users Plugin

## Overview

This plugin enables bulk user creation in Strapi 5 through Excel file imports, automatically generating invitation links for each user.

## Quick Steps

### 1. Download Template
- Open the plugin in Strapi admin
- Click "Download Template"
- Save the Excel file

### 2. Prepare Your Data
Fill in the Excel template with user information:
- **email** (required): user@example.com
- **firstname** (optional): First name
- **lastname** (optional): Last name

### 3. Import Users
- Click "Import Users" button
- Upload your filled Excel file
- Select a role for the users (e.g., Authenticated)
- Click "Import Users"

### 4. Download Results
- After successful import, click "Download Results with Invitation Links"
- You'll get an Excel file with:
  - All user details
  - Unique invitation links for each user
  - Import status

### 5. Share Invitation Links
- Send the invitation links to your users
- Users can click the link to set their password and activate their account

## Important Notes

### Email Must Be Unique
- Each user must have a unique email
- If a user already exists, they will be skipped

### Password Reset Tokens
- The plugin generates password reset tokens for invitation links
- These tokens allow users to set their initial password

### Role Assignment
- All users in a single import are assigned the same role
- You can choose from available roles in your Strapi instance
- Common roles: Authenticated, Public, or custom roles

### Server Configuration
Make sure your `config/server.js` has the correct URL:

```javascript
module.exports = ({ env }) => ({
  url: env('SERVER_URL', 'http://localhost:1337'),
});
```

Or set the `SERVER_URL` environment variable.

## Example Excel Data

| email | firstname | lastname |
|-------|-----------|----------|
| john@company.com | John | Doe |
| jane@company.com | Jane | Smith |
| bob@company.com | Bob | Wilson |

## Troubleshooting

**Problem**: Import fails with "User already exists"
- **Solution**: Check if the email is already in your database

**Problem**: Invitation links don't work
- **Solution**: Verify your server URL configuration

**Problem**: Can't select a role
- **Solution**: Create roles in Settings > Users & Permissions plugin > Roles

**Problem**: Excel file not accepted
- **Solution**: Ensure you're uploading a .xlsx file (not .xls or .csv)

## Support

For issues and questions, please refer to the main README.md file or contact the plugin maintainer.
