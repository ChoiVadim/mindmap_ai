# Admin Template Management Setup

## Overview

This document explains how to set up and use the admin template management system.

## Prerequisites

1. Supabase database with the `templates` table created
2. Environment variable `ADMIN_EMAILS` configured (optional, see below)

## Database Setup

### 1. Run the Migration

Execute the SQL migration file to create the `templates` table:

```bash
# In Supabase SQL Editor or via Supabase CLI
psql -f supabase/migrations/create_templates_table.sql
```

Or copy the contents of `supabase/migrations/create_templates_table.sql` and run it in the Supabase SQL Editor.

### 2. Verify Table Creation

The `templates` table should have the following structure:
- `id` (UUID, primary key)
- `name` (TEXT)
- `description` (TEXT)
- `icon` (TEXT)
- `nodes` (JSONB)
- `edges` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `created_by` (UUID, foreign key to auth.users)
- `is_active` (BOOLEAN)

## Admin Access Configuration

### Option 1: Environment Variable (Recommended)

Add admin email addresses to your `.env.local` file:

```env
ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

Users with these email addresses will have admin access.

### Option 2: Database Table (Alternative)

If you prefer to manage admins via the database, uncomment the `admin_users` table creation in the migration file and insert admin user IDs:

```sql
INSERT INTO admin_users (user_id) VALUES ('user-uuid-here');
```

## Using the Admin Panel

### Accessing the Admin Panel

1. Log in with an admin account
2. Click the "Admin Panel" button (Settings icon) in the top-right corner
3. You'll be redirected to `/admin/templates`

### Creating Templates

#### Method 1: From Current Board

1. Create a board with nodes and edges
2. Open the board dropdown (top-left)
3. Click "Save as Template" (only visible to admins)
4. Enter template name, description, and icon
5. Template will be created and you'll be redirected to edit page

#### Method 2: From Admin Panel

1. Go to `/admin/templates`
2. Click "Create Template"
3. Fill in the form:
   - Template Name (required)
   - Description (required)
   - Icon (required, emoji)
   - Use current board (optional, if you have nodes on canvas)
   - Active status (whether template is visible to users)
4. Click "Create Template"

### Editing Templates

1. Go to `/admin/templates`
2. Click "Edit" on any template
3. Update name, description, icon, or active status
4. Click "Save Changes"

**Note:** To edit nodes and edges, you'll need to use the canvas editor (future feature).

### Managing Templates

- **Toggle Active/Inactive**: Click the eye icon to show/hide template from users
- **Delete**: Click the trash icon to permanently delete a template
- **View Details**: Click "Edit" to see full template information

## API Endpoints

### Public Endpoints

- `GET /api/templates` - Get all active templates
- `GET /api/templates/[id]` - Get a specific active template

### Admin Endpoints (Require Admin Authentication)

- `GET /api/templates?admin=true` - Get all templates (including inactive)
- `POST /api/templates` - Create a new template
- `PATCH /api/templates/[id]` - Update a template
- `DELETE /api/templates/[id]` - Delete a template
- `GET /api/admin/check` - Check if current user is admin

## Security Notes

1. Admin checks are performed server-side in all API endpoints
2. Client-side checks (`useIsAdmin` hook) are for UI only
3. Always verify admin status on the server
4. RLS policies in Supabase provide additional security layer

## Troubleshooting

### "Forbidden - Admin access required"

- Verify your email is in `ADMIN_EMAILS` environment variable
- Check that you're logged in with the correct account
- Ensure the environment variable is set and the app has been restarted

### "Template not found"

- Check that the template exists in the database
- Verify the template ID is correct
- Ensure you have admin access to view inactive templates

### Templates not showing in Welcome Modal/Empty State

- Check that templates have `is_active = true`
- Verify the API endpoint `/api/templates` is working
- Check browser console for errors

## Future Enhancements

- Visual canvas editor for editing template nodes/edges
- Template preview before publishing
- Template categories/tags
- Template versioning
- Bulk operations (activate/deactivate multiple templates)

