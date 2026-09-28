using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Models;

namespace production_plan_api.Jobs.BackgroundJobs;

public class PostgresBackgroundJobQueue : IBackgroundJobQueue
{
    private readonly CustomerDbContext _context;

    public PostgresBackgroundJobQueue(
        CustomerDbContext context)
    {
        _context = context;
    }

    public async Task<BackgroundJob> EnqueueAsync(
        string jobType,
        string? payloadJson,
        long? requestedByUserId,
        long? factoryId,
        int maxRetries = 3,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(jobType))
            throw new ArgumentException(
                "Job type is required.",
                nameof(jobType));

        if (maxRetries < 0)
            throw new ArgumentOutOfRangeException(
                nameof(maxRetries));

        var now = DateTime.UtcNow;

        var job = new BackgroundJob
        {
            JobId = Guid.NewGuid(),
            JobType = jobType.Trim(),

            PayloadJson =
                string.IsNullOrWhiteSpace(payloadJson)
                    ? null
                    : JsonDocument.Parse(payloadJson),

            Status = "PENDING",

            RequestedByUserId = requestedByUserId,
            FactoryId = factoryId,

            CreatedAt = now,
            AvailableAt = now,

            RetryCount = 0,
            MaxRetries = maxRetries
        };

        _context.BackgroundJobs.Add(job);

        await _context.SaveChangesAsync(
            cancellationToken);

        return job;
    }

    public async Task<BackgroundJob?> ClaimNextAsync(
        string workerId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(workerId))
            throw new ArgumentException(
                "Worker ID is required.",
                nameof(workerId));

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        var now = DateTime.UtcNow;

        var jobs = await _context.BackgroundJobs
            .FromSqlInterpolated($@"
                SELECT *
                FROM prs_background_jobs_tb
                WHERE status = 'PENDING'
                  AND available_at <= {now}
                ORDER BY
                    available_at,
                    created_at,
                    job_id
                FOR UPDATE SKIP LOCKED
                LIMIT 1
            ")
            .ToListAsync(cancellationToken);

        var job = jobs.FirstOrDefault();

        if (job == null)
        {
            await transaction.CommitAsync(
                cancellationToken);

            return null;
        }

        job.Status = "PROCESSING";

        job.WorkerId = workerId;
        job.LastWorkerId = workerId;

        job.LockedAt = now;

        job.StartedAt ??= now;

        await _context.SaveChangesAsync(
            cancellationToken);

        await transaction.CommitAsync(
            cancellationToken);

        return job;
    }

    public async Task CompleteAsync(
        Guid jobId,
        string workerId,
        string? resultJson = null,
        CancellationToken cancellationToken = default)
    {
        var job = await _context.BackgroundJobs
            .FirstOrDefaultAsync(
                x =>
                    x.JobId == jobId &&
                    x.Status == "PROCESSING" &&
                    x.WorkerId == workerId,
                cancellationToken);

        if (job == null)
            throw new InvalidOperationException(
                $"Job {jobId} is not owned by worker {workerId}.");

        job.Status = "COMPLETED";
        job.CompletedAt = DateTime.UtcNow;
        job.Progress = 100;

        job.ResultJson =
            string.IsNullOrWhiteSpace(resultJson)
                ? null
                : JsonDocument.Parse(resultJson);

        job.ErrorMessage = null;

        job.WorkerId = null;
        job.LockedAt = null;

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    public async Task FailAsync(
        Guid jobId,
        string workerId,
        string errorMessage,
        CancellationToken cancellationToken = default)
    {
        var job = await _context.BackgroundJobs
            .FirstOrDefaultAsync(
                x =>
                    x.JobId == jobId &&
                    x.Status == "PROCESSING" &&
                    x.WorkerId == workerId,
                cancellationToken);

        if (job == null)
            throw new InvalidOperationException(
                $"Job {jobId} is not owned by worker {workerId}.");

        var now = DateTime.UtcNow;

        job.RetryCount++;

        job.ErrorMessage =
            string.IsNullOrWhiteSpace(errorMessage)
                ? "Unknown background job error."
                : errorMessage;

        job.WorkerId = null;
        job.LockedAt = null;

        if (job.RetryCount <= job.MaxRetries)
        {
            job.Status = "PENDING";

            job.AvailableAt =
                now.Add(
                    GetRetryDelay(
                        job.RetryCount));
        }
        else
        {
            job.Status = "FAILED";
            job.CompletedAt = now;
        }

        await _context.SaveChangesAsync(
            cancellationToken);
    }

    public async Task HeartbeatAsync(
        Guid jobId,
        string workerId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        await _context.BackgroundJobs
            .Where(x =>
                x.JobId == jobId &&
                x.Status == "PROCESSING" &&
                x.WorkerId == workerId)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(
                        x => x.LockedAt,
                        now),
                cancellationToken);
    }

    public async Task<int> RecoverStaleJobsAsync(
        TimeSpan lockTimeout,
        CancellationToken cancellationToken = default)
    {
        if (lockTimeout <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(
                nameof(lockTimeout));

        var now = DateTime.UtcNow;
        var staleBefore = now.Subtract(lockTimeout);

        await using var transaction =
            await _context.Database.BeginTransactionAsync(
                cancellationToken);

        var staleJobs = await _context.BackgroundJobs
            .FromSqlInterpolated($@"
                SELECT *
                FROM prs_background_jobs_tb
                WHERE status = 'PROCESSING'
                  AND locked_at IS NOT NULL
                  AND locked_at < {staleBefore}
                ORDER BY
                    locked_at,
                    job_id
                FOR UPDATE SKIP LOCKED
            ")
            .ToListAsync(cancellationToken);

        if (staleJobs.Count == 0)
        {
            await transaction.CommitAsync(
                cancellationToken);

            return 0;
        }

        foreach (var job in staleJobs)
        {
            job.RetryCount++;

            job.WorkerId = null;
            job.LockedAt = null;

            job.ErrorMessage =
                "Job recovered because the previous worker lock expired.";

            if (job.RetryCount <= job.MaxRetries)
            {
                job.Status = "PENDING";
                job.AvailableAt = now;
            }
            else
            {
                job.Status = "FAILED";
                job.CompletedAt = now;
            }
        }

        await _context.SaveChangesAsync(
            cancellationToken);

        await transaction.CommitAsync(
            cancellationToken);

        return staleJobs.Count;
    }

    public async Task<int> CleanupOldJobsAsync(
        TimeSpan retention,
        CancellationToken cancellationToken = default)
    {
        if (retention <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(
                nameof(retention));

        var cutoff =
            DateTime.UtcNow.Subtract(retention);

        return await _context.BackgroundJobs
            .Where(x =>
                (x.Status == "COMPLETED" ||
                 x.Status == "FAILED") &&
                x.CompletedAt != null &&
                x.CompletedAt < cutoff)
            .ExecuteDeleteAsync(
                cancellationToken);
    }

    private static TimeSpan GetRetryDelay(
        int retryCount)
    {
        return retryCount switch
        {
            1 => TimeSpan.FromMinutes(1),
            2 => TimeSpan.FromMinutes(5),
            _ => TimeSpan.FromMinutes(15)
        };
    }
}