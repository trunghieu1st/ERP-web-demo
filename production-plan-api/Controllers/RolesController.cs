using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly CustomerDbContext _context;

    public RolesController(CustomerDbContext context)
    {
        _context = context;
    }

    private long? GetCurrentUserId()
    {
        var userIdValue =
            User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (long.TryParse(userIdValue, out var userId))
        {
            return userId;
        }

        return null;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.Roles
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.RoleId)
            .Select(x => new
            {
                roleCode = x.RoleCode,
                roleName = x.RoleName
            })
            .ToListAsync();

        return Ok(roles);
    }
}