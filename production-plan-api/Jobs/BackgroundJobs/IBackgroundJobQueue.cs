using production_plan_api.Models;

namespace production_plan_api.Jobs.BackgroundJobs;

public interface IBackgroundJobQueue
{
    Task<BackgroundJob> EnqueueAsync(
        string jobType,
        string? payloadJson,
        long? requestedByUserId,
        long? factoryId,
        int maxRetries = 3,
        CancellationToken cancellationToken = default);

    Task<BackgroundJob?> ClaimNextAsync(
        string workerId,
        CancellationToken cancellationToken = default);

    Task CompleteAsync(
        Guid jobId,
        string workerId,
        string? resultJson = null,
        CancellationToken cancellationToken = default);

    Task FailAsync(
        Guid jobId,
        string workerId,
        string errorMessage,
        CancellationToken cancellationToken = default);

    Task HeartbeatAsync(
        Guid jobId,
        string workerId,
        CancellationToken cancellationToken = default);

    Task<int> RecoverStaleJobsAsync(
        TimeSpan lockTimeout,
        CancellationToken cancellationToken = default);

    Task<int> CleanupOldJobsAsync(
        TimeSpan retention,
        CancellationToken cancellationToken = default);
}