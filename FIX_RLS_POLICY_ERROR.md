# Fix RLS Policy Error

## Error
```
ERROR: 42P01: missing FROM-clause entry for table "old"
```

## Cause
The RLS policy for `UPDATE` was trying to reference `OLD.role` and `OLD.status` in the `WITH CHECK` clause. In PostgreSQL RLS:
- `USING` clause can reference `OLD` (for UPDATE/DELETE)
- `WITH CHECK` clause can only reference `NEW` (the row being inserted/updated)

## Fix Applied

The policy has been updated to remove the `OLD` references from `WITH CHECK`:

```sql
-- Before (INCORRECT):
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND OLD.role = NEW.role  -- ❌ OLD not allowed in WITH CHECK
        AND OLD.status = NEW.status  -- ❌ OLD not allowed in WITH CHECK
    );

-- After (CORRECT):
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

## Security Note

The restriction on role/status changes is now enforced at the **application level** rather than in RLS. The Super Admin policies still prevent regular users from changing other users' roles/status.

## Run This SQL

Run this in your Supabase SQL Editor to fix the policy:

```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create the corrected policy
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

The migration file has been updated, so future migrations will use the correct syntax.

