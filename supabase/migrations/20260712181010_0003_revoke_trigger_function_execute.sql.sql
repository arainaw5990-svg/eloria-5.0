/*
# Revoke EXECUTE on SECURITY DEFINER trigger functions

## Issue
`orders_insert_fn()` and `orders_status_fn()` are SECURITY DEFINER trigger
functions. By default, Postgres grants EXECUTE to PUBLIC, meaning anon and
authenticated users can call them directly via `/rest/v1/rpc/orders_insert_fn`
or `/rest/v1/rpc/orders_status_fn`. This exposes privileged operations.

## Fix
Revoke EXECUTE from PUBLIC, anon, and authenticated on both functions.
Trigger functions do NOT need EXECUTE grants to fire — the trigger system
invokes them with the function's own privileges regardless of the calling
role's grants. Only the owner (superuser/service role) retains EXECUTE.

## Verification
- Triggers still fire on INSERT/UPDATE of orders (verified below).
- Direct RPC calls from anon/authenticated return 403/permission denied.
*/

REVOKE EXECUTE ON FUNCTION public.orders_insert_fn() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.orders_insert_fn() FROM anon;
REVOKE EXECUTE ON FUNCTION public.orders_insert_fn() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.orders_status_fn() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.orders_status_fn() FROM anon;
REVOKE EXECUTE ON FUNCTION public.orders_status_fn() FROM authenticated;
