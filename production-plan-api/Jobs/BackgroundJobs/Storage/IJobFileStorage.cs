namespace production_plan_api.Jobs.BackgroundJobs.Storage;

public interface IJobFileStorage
{
    Task<string> SaveAsync(
        string relativePath,
        Stream content,
        CancellationToken cancellationToken = default);

    Task<Stream> OpenReadAsync(
        string storageKey,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(
        string storageKey,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        string storageKey,
        CancellationToken cancellationToken = default);
}