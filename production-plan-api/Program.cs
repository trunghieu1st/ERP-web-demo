using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using production_plan_api.Data;
using production_plan_api.Infrastructure;
using production_plan_api.Jobs.BackgroundJobs;
using production_plan_api.Jobs.BackgroundJobs.Handlers.ProductionLine;
using production_plan_api.Jobs.BackgroundJobs.Storage;
using production_plan_api.Models;
using production_plan_api.Services;

var builder = WebApplication.CreateBuilder(args);

// ======================================================
// CONFIG VALIDATION
// Secrets must come from environment variables, user-secrets,
// or the production secret store - never source control.
// ======================================================

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection chưa được cấu hình.");

var jwtKey =
    builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key chưa được cấu hình.");

var jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer chưa được cấu hình.");

var jwtAudience =
    builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "Jwt:Audience chưa được cấu hình.");

if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key phải có ít nhất 32 bytes.");
}

// ======================================================
// DATABASE
// ======================================================

builder.Services.AddDbContext<CustomerDbContext>(options =>
{
    options.UseNpgsql(
        connectionString,
        npgsqlOptions =>
        {
            npgsqlOptions.CommandTimeout(30);
        });

    options.EnableSensitiveDataLogging(false);
    options.EnableDetailedErrors(
        builder.Environment.IsDevelopment());
});

// ======================================================
// MVC / PROBLEM DETAILS / EXCEPTION HANDLING
// ======================================================

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// ======================================================
// APPLICATION SERVICES
// ======================================================

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUserService>();
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// ======================================================
// BACKGROUND JOBS
// ======================================================

builder.Services.AddScoped<IBackgroundJobQueue, PostgresBackgroundJobQueue>();
builder.Services.AddSingleton<IJobFileStorage, LocalJobFileStorage>();
builder.Services.AddScoped<IBackgroundJobHandler, ProductionLineExportHandler>();
builder.Services.AddHostedService<BackgroundJobWorker>();

// ======================================================
// JWT AUTHENTICATION
// ======================================================

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero,
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role
        };
    });

builder.Services.AddAuthorization();

// ======================================================
// CORS
// Development: localhost only.
// Production: exact origins from Cors:AllowedOrigins.
// ======================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .SetIsOriginAllowed(origin =>
                {
                    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                        return false;

                    return (uri.Scheme == Uri.UriSchemeHttp ||
                            uri.Scheme == Uri.UriSchemeHttps) &&
                           (uri.Host == "localhost" || uri.Host == "127.0.0.1");
                })
                .AllowAnyHeader()
                .AllowAnyMethod();

            return;
        }

        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? Array.Empty<string>();

        if (origins.Length == 0)
        {
            throw new InvalidOperationException(
                "Cors:AllowedOrigins phải được cấu hình trong Production.");
        }

        policy
            .WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ======================================================
// RATE LIMITING
// api: 300 requests/minute per authenticated user or IP.
// login: 10 attempts/minute per IP.
// ======================================================

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("api", httpContext =>
    {
        var partitionKey =
            httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });

    options.AddPolicy("login", httpContext =>
    {
        var partitionKey =
            httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

// ======================================================
// HEALTH CHECKS
// ======================================================

builder.Services
    .AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("postgresql", tags: new[] { "ready" });

// ======================================================
// REVERSE PROXY / FORWARDED HEADERS
// Defaults trust loopback proxies only. Add explicit production
// proxy IPs under ReverseProxy:KnownProxies when applicable.
// ======================================================

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;

    var proxyValues = builder.Configuration
        .GetSection("ReverseProxy:KnownProxies")
        .Get<string[]>()
        ?? Array.Empty<string>();

    foreach (var value in proxyValues)
    {
        if (IPAddress.TryParse(value, out var address))
            options.KnownProxies.Add(address);
    }
});

// ======================================================
// SWAGGER
// ======================================================

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Forwarded headers must run before HTTPS redirection/auth when behind proxy.
app.UseForwardedHeaders();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Liveness does not depend on PostgreSQL.
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
}).DisableRateLimiting();

// Readiness includes PostgreSQL connectivity.
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready")
}).DisableRateLimiting();

// All controller endpoints get the general API limiter.
// Login overrides this with its named "login" limiter attribute.
app.MapControllers()
    .RequireRateLimiting("api");

app.Run();
