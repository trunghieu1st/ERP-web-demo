# Backend infrastructure - final baseline

## Required secrets/config
Do not put DB passwords or JWT signing keys in appsettings.json.

Environment variables (PowerShell examples):

```powershell
$env:ConnectionStrings__DefaultConnection="Host=...;Port=5432;Database=...;Username=...;Password=..."
$env:Jwt__Key="use-a-long-random-secret-at-least-32-bytes"
```

For production, also configure exact frontend origins, for example:

```powershell
$env:Cors__AllowedOrigins__0="https://erp.example.com"
```

If ASP.NET Core is behind a reverse proxy on another host, configure its IP:

```powershell
$env:ReverseProxy__KnownProxies__0="10.0.0.10"
```

## Health endpoints
- `/health/live`: process liveness only.
- `/health/ready`: includes PostgreSQL connectivity.

## Rate limiting
- General controllers: 300 requests/minute per authenticated user (fallback IP).
- Login: 10 attempts/minute per IP.

## Background jobs
Run `Database/background_jobs.sql` only if it is acceptable to delete existing background-job history. The final schema uses `TIMESTAMPTZ` and the C# job infrastructure uses `DateTime.UtcNow`.

LocalJobFileStorage is still single-machine storage. Before deploying multiple physical/container nodes, configure shared storage (NAS/NFS/SMB) or replace `IJobFileStorage` with an object-storage implementation.

## Security review note
The uploaded project contained a real-looking PostgreSQL password and JWT signing key in `appsettings.json`. They have been removed from this reviewed copy. Rotate both values before treating the system as production-ready.

`DepartmentReportController` remains `[Authorize]` and accepts factory IDs from requests in multiple actions. This was not automatically changed because its intended cross-factory business authorization is unclear. Review that controller before production; if ordinary users must be factory-scoped, derive/validate FactoryId from `CurrentUserService` as done in the hardened controllers.

## Build/test
```powershell
dotnet clean
dotnet restore
dotnet build
dotnet run
```

Then verify login, 401/403 behavior, factory isolation, `/health/live`, `/health/ready`, 429 login limiting, export -> status -> download, stale recovery, and two API instances sharing PostgreSQL.
