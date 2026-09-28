using production_plan_api.Models;

namespace production_plan_api.Jobs.BackgroundJobs;

public interface IBackgroundJobHandler
{
    string JobType { get; }

    Task<string?> HandleAsync(
        BackgroundJob job,
        CancellationToken cancellationToken);
}