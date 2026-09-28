namespace production_plan_api.Helpers;

public static class AppDateTime
{
    public static DateTime Now =>
        DateTime.SpecifyKind(
            DateTime.Now,
            DateTimeKind.Unspecified
        );
}