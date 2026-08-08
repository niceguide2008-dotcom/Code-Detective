# Fix: `Could not send notification — no schema for public.notifications`

The frontend is already calling the real Supabase `public.notifications` table. The error means that table has not been created in your Supabase project yet.

## Do this once

1. Open your Supabase project.
2. Open **SQL Editor**.
3. Create a new query.
4. Open `notifications_schema.sql` from this project.
5. Copy the entire SQL file into the SQL Editor.
6. Click **Run**.
7. The final verification query should return:

```text
public.notifications
```

8. Return to Code Detective and refresh/reload the Admin page.
9. Send a test notification.

## Important

Do not create a second notifications table with a different name. The application uses:

```text
public.notifications
```

The SQL also creates the required RLS policies and Realtime publication entry.

## If SQL Editor reports a different error

Stop and send the exact error text/screenshot. Do not disable RLS or delete existing tables.
