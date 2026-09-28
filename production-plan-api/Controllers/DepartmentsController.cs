
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Models;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize(Roles = "ADMIN")]
public class DepartmentsController : ControllerBase
{
    private readonly CustomerDbContext _context;

    public DepartmentsController(CustomerDbContext context)
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

    // =========================================================
    // GET: api/departments
    // =========================================================
    [HttpGet]
    public async Task<IActionResult> GetDepartments()
    {
        var departments = await _context.Departments
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.DepartmentId)
            .Select(x => new
            {
                departmentId = x.DepartmentId,
                departmentCode = x.DepartmentCode,
                departmentName = x.DepartmentName,
                interfaceType = x.InterfaceType,
                isActive = x.IsActive
            })
            .ToListAsync();

        return Ok(departments);
    }

    // =========================================================
    // GET: api/departments/{id}
    // =========================================================
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetDepartment(long id)
    {
        var department = await _context.Departments
            .AsNoTracking()
            .Where(x => x.DepartmentId == id)
            .Select(x => new
            {
                departmentId = x.DepartmentId,
                departmentCode = x.DepartmentCode,
                departmentName = x.DepartmentName,
                interfaceType = x.InterfaceType,
                isActive = x.IsActive
            })
            .FirstOrDefaultAsync();

        if (department == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy phòng ban."
            });
        }

        return Ok(department);
    }

    // =========================================================
    // POST: api/departments
    // =========================================================
    [HttpPost]
    public async Task<IActionResult> CreateDepartment(
        [FromBody] DepartmentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DepartmentCode))
        {
            return BadRequest(new
            {
                message = "Mã phòng ban không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.DepartmentName))
        {
            return BadRequest(new
            {
                message = "Tên phòng ban không được để trống."
            });
        }

        var interfaceType = request.InterfaceType?.Trim().ToUpper();

        if (interfaceType != "WEB" && interfaceType != "PWA")
        {
            return BadRequest(new
            {
                message = "INTERFACE_TYPE chỉ được phép là WEB hoặc PWA."
            });
        }

        var code = request.DepartmentCode.Trim();

        var exists = await _context.Departments
            .AnyAsync(x => x.DepartmentCode == code);

        if (exists)
        {
            return BadRequest(new
            {
                message = "Mã phòng ban đã tồn tại."
            });
        }
        

        var department = new Department
        {
            DepartmentCode = code,
            DepartmentName = request.DepartmentName.Trim(),
            InterfaceType = interfaceType,
            IsActive = true
        };

        _context.Departments.Add(department);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            departmentId = department.DepartmentId,
            departmentCode = department.DepartmentCode,
            departmentName = department.DepartmentName,
            interfaceType = department.InterfaceType,
            isActive = department.IsActive
        });
    }

    // =========================================================
    // PUT: api/departments/{id}
    // =========================================================
    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateDepartment(
        long id,
        [FromBody] DepartmentRequest request)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(x => x.DepartmentId == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy phòng ban."
            });
        }

        if (string.IsNullOrWhiteSpace(request.DepartmentCode))
        {
            return BadRequest(new
            {
                message = "Mã phòng ban không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.DepartmentName))
        {
            return BadRequest(new
            {
                message = "Tên phòng ban không được để trống."
            });
        }

        var interfaceType = request.InterfaceType?.Trim().ToUpper();

        if (interfaceType != "WEB" && interfaceType != "PWA")
        {
            return BadRequest(new
            {
                message = "INTERFACE_TYPE chỉ được phép là WEB hoặc PWA."
            });
        }

        var code = request.DepartmentCode.Trim();

        var duplicate = await _context.Departments
            .AnyAsync(x =>
                x.DepartmentId != id &&
                x.DepartmentCode == code);

        if (duplicate)
        {
            return BadRequest(new
            {
                message = "Mã phòng ban đã tồn tại."
            });
        }

        department.DepartmentCode = code;
        department.DepartmentName = request.DepartmentName.Trim();
        department.InterfaceType = interfaceType;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            departmentId = department.DepartmentId,
            departmentCode = department.DepartmentCode,
            departmentName = department.DepartmentName,
            interfaceType = department.InterfaceType,
            isActive = department.IsActive
        });
    }

    // =========================================================
    // DELETE: api/departments/{id}
    // Soft delete
    // =========================================================
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteDepartment(long id)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(x => x.DepartmentId == id);

        if (department == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy phòng ban."
            });
        }

        department.IsActive = false;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Đã ngừng sử dụng phòng ban."
        });
    }
}

// =========================================================
// Request model
// =========================================================
public class DepartmentRequest
{
    public string DepartmentCode { get; set; } = "";

    public string DepartmentName { get; set; } = "";

    public string InterfaceType { get; set; } = "WEB";
}
