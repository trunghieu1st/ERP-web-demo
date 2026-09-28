namespace production_plan_api.Jobs.BackgroundJobs.Storage;

public class LocalJobFileStorage : IJobFileStorage
{
    private readonly string _rootPath;

    public LocalJobFileStorage(
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var configuredPath =
            configuration["BackgroundJobs:StoragePath"];

        if (string.IsNullOrWhiteSpace(configuredPath))
            configuredPath = "JobStorage";

        _rootPath =
            Path.IsPathRooted(configuredPath)
                ? Path.GetFullPath(configuredPath)
                : Path.GetFullPath(
                    Path.Combine(
                        environment.ContentRootPath,
                        configuredPath));

        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(
        string relativePath,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        var storageKey =
            NormalizeStorageKey(relativePath);

        var fullPath =
            ResolveFullPath(storageKey);

        var directory =
            Path.GetDirectoryName(fullPath);

        if (!string.IsNullOrWhiteSpace(directory))
            Directory.CreateDirectory(directory);

        await using var fileStream =
            new FileStream(
                fullPath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                81920,
                true);

        if (content.CanSeek)
            content.Position = 0;

        await content.CopyToAsync(
            fileStream,
            cancellationToken);

        await fileStream.FlushAsync(
            cancellationToken);

        return storageKey;
    }

    public Task<Stream> OpenReadAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        var fullPath =
            ResolveFullPath(
                NormalizeStorageKey(storageKey));

        if (!File.Exists(fullPath))
            throw new FileNotFoundException(
                "Background job file was not found.",
                fullPath);

        Stream stream =
            new FileStream(
                fullPath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.Read,
                81920,
                true);

        return Task.FromResult(stream);
    }

    public Task<bool> ExistsAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        var fullPath =
            ResolveFullPath(
                NormalizeStorageKey(storageKey));

        return Task.FromResult(
            File.Exists(fullPath));
    }

    public Task DeleteAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        var fullPath =
            ResolveFullPath(
                NormalizeStorageKey(storageKey));

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    private string ResolveFullPath(
        string storageKey)
    {
        var relativePath =
            storageKey.Replace(
                '/',
                Path.DirectorySeparatorChar);

        var fullPath =
            Path.GetFullPath(
                Path.Combine(
                    _rootPath,
                    relativePath));

        var root =
            _rootPath.TrimEnd(
                Path.DirectorySeparatorChar,
                Path.AltDirectorySeparatorChar)
            + Path.DirectorySeparatorChar;

        if (!fullPath.StartsWith(
                root,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Invalid background job storage path.");
        }

        return fullPath;
    }

    private static string NormalizeStorageKey(
        string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey))
            throw new ArgumentException(
                "Storage key is required.",
                nameof(storageKey));

        return storageKey
            .Replace('\\', '/')
            .TrimStart('/');
    }
}