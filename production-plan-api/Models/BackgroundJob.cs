using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace production_plan_api.Models;

[Table("prs_background_jobs_tb")]
public class BackgroundJob
{
    [Key]
    [Column("job_id")]
    public Guid JobId { get; set; }

    [Required]
    [Column("job_type")]
    [MaxLength(100)]
    public string JobType { get; set; } = string.Empty;

    [Column("payload_json", TypeName = "jsonb")]
    public JsonDocument? PayloadJson { get; set; }

    [Required]
    [Column("status")]
    [MaxLength(30)]
    public string Status { get; set; } = "PENDING";

    [Column("requested_by_user_id")]
    public long? RequestedByUserId { get; set; }

    [Column("factory_id")]
    public long? FactoryId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("available_at")]
    public DateTime AvailableAt { get; set; }

    [Column("started_at")]
    public DateTime? StartedAt { get; set; }

    [Column("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [Column("retry_count")]
    public int RetryCount { get; set; }

    [Column("max_retries")]
    public int MaxRetries { get; set; } = 3;

    [Column("worker_id")]
    [MaxLength(200)]
    public string? WorkerId { get; set; }

    [Column("last_worker_id")]
    [MaxLength(200)]
    public string? LastWorkerId { get; set; }

    [Column("locked_at")]
    public DateTime? LockedAt { get; set; }

    [Column("progress")]
    public int? Progress { get; set; }

    [Column("result_json", TypeName = "jsonb")]
    public JsonDocument? ResultJson { get; set; }

    [Column("error_message")]
    public string? ErrorMessage { get; set; }
}