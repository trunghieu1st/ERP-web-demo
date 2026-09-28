using production_plan_api.Models;

namespace production_plan_api.Jobs.BackgroundJobs;

// Hi
public class BackgroundJobWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BackgroundJobWorker> _logger;

    private readonly string _workerId =
        $"{Environment.MachineName}-{Guid.NewGuid():N}";

    private static readonly TimeSpan PollInterval =
        TimeSpan.FromSeconds(2);

    private static readonly TimeSpan HeartbeatInterval =
        TimeSpan.FromSeconds(30);

    private static readonly TimeSpan RecoveryInterval =
        TimeSpan.FromMinutes(1);

    private static readonly TimeSpan LockTimeout =
        TimeSpan.FromMinutes(2);

    private static readonly TimeSpan CleanupInterval =
        TimeSpan.FromHours(24);

    private static readonly TimeSpan JobRetention =
        TimeSpan.FromDays(30);

    public BackgroundJobWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<BackgroundJobWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Background worker {WorkerId} started.",
            _workerId);

        var processingTask =
            RunProcessingLoopAsync(stoppingToken);

        var recoveryTask =
            RunRecoveryLoopAsync(stoppingToken);

        var cleanupTask =
            RunCleanupLoopAsync(stoppingToken);

        await Task.WhenAll(
            processingTask,
            recoveryTask,
            cleanupTask);
    }

    private async Task RunProcessingLoopAsync(
        CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                BackgroundJob? job;

                using (var scope =
                       _scopeFactory.CreateScope())
                {
                    var queue =
                        scope.ServiceProvider
                            .GetRequiredService<IBackgroundJobQueue>();

                    job = await queue.ClaimNextAsync(
                        _workerId,
                        stoppingToken);
                }

                if (job == null)
                {
                    await DelaySafelyAsync(
                        PollInterval,
                        stoppingToken);

                    continue;
                }

                await ProcessJobAsync(
                    job,
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected background job worker error.");

                await DelaySafelyAsync(
                    TimeSpan.FromSeconds(5),
                    stoppingToken);
            }
        }

        _logger.LogInformation(
            "Background worker {WorkerId} stopped.",
            _workerId);
    }

    private async Task ProcessJobAsync(
        BackgroundJob job,
        CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Worker {WorkerId} processing job {JobId} ({JobType}).",
            _workerId,
            job.JobId,
            job.JobType);

        using var heartbeatCts =
            CancellationTokenSource.CreateLinkedTokenSource(
                stoppingToken);

        var heartbeatTask =
            RunHeartbeatAsync(
                job.JobId,
                heartbeatCts.Token);

        try
        {
            string? resultJson;

            using (var scope =
                   _scopeFactory.CreateScope())
            {
                var handlers =
                    scope.ServiceProvider
                        .GetServices<IBackgroundJobHandler>();

                var handler =
                    handlers.FirstOrDefault(
                        x => x.JobType == job.JobType);

                if (handler == null)
                    throw new InvalidOperationException(
                        $"No handler registered for job type '{job.JobType}'.");

                resultJson =
                    await handler.HandleAsync(
                        job,
                        stoppingToken);
            }

            heartbeatCts.Cancel();

            await WaitHeartbeatSafelyAsync(
                heartbeatTask);

            using (var scope =
                   _scopeFactory.CreateScope())
            {
                var queue =
                    scope.ServiceProvider
                        .GetRequiredService<IBackgroundJobQueue>();

                await queue.CompleteAsync(
                    job.JobId,
                    _workerId,
                    resultJson,
                    stoppingToken);
            }

            _logger.LogInformation(
                "Job {JobId} completed by worker {WorkerId}.",
                job.JobId,
                _workerId);
        }
        catch (OperationCanceledException)
            when (stoppingToken.IsCancellationRequested)
        {
            heartbeatCts.Cancel();

            await WaitHeartbeatSafelyAsync(
                heartbeatTask);

            _logger.LogWarning(
                "Job {JobId} interrupted because worker {WorkerId} is shutting down.",
                job.JobId,
                _workerId);
        }
        catch (Exception ex)
        {
            heartbeatCts.Cancel();

            await WaitHeartbeatSafelyAsync(
                heartbeatTask);

            _logger.LogError(
                ex,
                "Job {JobId} failed on worker {WorkerId}.",
                job.JobId,
                _workerId);

            try
            {
                using var scope =
                    _scopeFactory.CreateScope();

                var queue =
                    scope.ServiceProvider
                        .GetRequiredService<IBackgroundJobQueue>();

                await queue.FailAsync(
                    job.JobId,
                    _workerId,
                    ex.ToString(),
                    CancellationToken.None);
            }
            catch (Exception failException)
            {
                _logger.LogError(
                    failException,
                    "Unable to mark job {JobId} as failed.",
                    job.JobId);
            }
        }
        finally
        {
            heartbeatCts.Cancel();

            await WaitHeartbeatSafelyAsync(
                heartbeatTask);
        }
    }

    private async Task RunHeartbeatAsync(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                await Task.Delay(
                    HeartbeatInterval,
                    cancellationToken);

                using var scope =
                    _scopeFactory.CreateScope();

                var queue =
                    scope.ServiceProvider
                        .GetRequiredService<IBackgroundJobQueue>();

                await queue.HeartbeatAsync(
                    jobId,
                    _workerId,
                    cancellationToken);
            }
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Heartbeat failed for job {JobId}.",
                jobId);
        }
    }

    private async Task RunRecoveryLoopAsync(
        CancellationToken stoppingToken)
    {
        await DelaySafelyAsync(
            RecoveryInterval,
            stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope =
                    _scopeFactory.CreateScope();

                var queue =
                    scope.ServiceProvider
                        .GetRequiredService<IBackgroundJobQueue>();

                var recovered =
                    await queue.RecoverStaleJobsAsync(
                        LockTimeout,
                        stoppingToken);

                if (recovered > 0)
                {
                    _logger.LogWarning(
                        "Recovered {Count} stale background job(s).",
                        recovered);
                }
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Background job stale recovery failed.");
            }

            await DelaySafelyAsync(
                RecoveryInterval,
                stoppingToken);
        }
    }

    private async Task RunCleanupLoopAsync(
        CancellationToken stoppingToken)
    {
        await DelaySafelyAsync(
            CleanupInterval,
            stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope =
                    _scopeFactory.CreateScope();

                var queue =
                    scope.ServiceProvider
                        .GetRequiredService<IBackgroundJobQueue>();

                var deleted =
                    await queue.CleanupOldJobsAsync(
                        JobRetention,
                        stoppingToken);

                if (deleted > 0)
                {
                    _logger.LogInformation(
                        "Deleted {Count} old background job(s).",
                        deleted);
                }
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Background job cleanup failed.");
            }

            await DelaySafelyAsync(
                CleanupInterval,
                stoppingToken);
        }
    }

    private static async Task WaitHeartbeatSafelyAsync(
        Task heartbeatTask)
    {
        try
        {
            await heartbeatTask;
        }
        catch (OperationCanceledException)
        {
        }
        catch
        {
        }
    }

    private static async Task DelaySafelyAsync(
        TimeSpan delay,
        CancellationToken cancellationToken)
    {
        try
        {
            await Task.Delay(
                delay,
                cancellationToken);
        }
        catch (OperationCanceledException)
            when (cancellationToken.IsCancellationRequested)
        {
        }
    }
}