using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "ADMIN")]
public class UsersController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly CurrentUserService _currentUser;

    public UsersController(
        CustomerDbContext context,
        IPasswordHasher<User> passwordHasher,
        CurrentUserService currentUser)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    // ============================================================
    // GET ALL USERS
    //
    // Đây là màn quản trị User.
    // Tạm thời giữ nguyên nghiệp vụ hiện tại:
    // không áp Factory DataScope tại đây.
    // ============================================================

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .AsNoTracking()
            .Join(
                _context.Factories.AsNoTracking(),
                user => user.FactoryId,
                factory => factory.FactoryId,
                (user, factory) => new
                {
                    User = user,
                    FactoryName = factory.FactoryName
                })
            .Join(
                _context.Departments.AsNoTracking(),
                x => x.User.DepartmentId,
                department => department.DepartmentId,
                (x, department) => new
                {
                    User = x.User,
                    FactoryName = x.FactoryName,
                    DepartmentName = department.DepartmentName
                })
            .Join(
                _context.Roles.AsNoTracking(),
                x => x.User.RoleCode,
                role => role.RoleCode,
                (x, role) => new
                {
                    userId = x.User.UserId,
                    username = x.User.Username,
                    fullName = x.User.FullName,

                    factoryId = x.User.FactoryId,
                    factoryName = x.FactoryName,

                    departmentId = x.User.DepartmentId,
                    departmentName = x.DepartmentName,

                    role = x.User.RoleCode,
                    roleName = role.RoleName,

                    isActive = x.User.IsActive
                })
            .OrderBy(x => x.userId)
            .ToListAsync();

        return Ok(users);
    }

    // ============================================================
    // GET USER BY ID
    // ============================================================

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetUser(long id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Where(x => x.UserId == id)
            .Select(x => new
            {
                userId = x.UserId,
                username = x.Username,
                fullName = x.FullName,

                factoryId = x.FactoryId,

                departmentId = x.DepartmentId,

                role = x.RoleCode,

                isActive = x.IsActive
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy người dùng."
            });
        }

        return Ok(user);
    }

    // ============================================================
    // CREATE USER
    // ============================================================

    [HttpPost]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserRequest request)
    {
        // ========================================
        // VALIDATE USERNAME
        // ========================================

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new
            {
                message = "Username không được để trống."
            });
        }

        // ========================================
        // VALIDATE PASSWORD
        // ========================================

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Password không được để trống."
            });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new
            {
                message = "Password phải có ít nhất 6 ký tự."
            });
        }

        // ========================================
        // VALIDATE FULL NAME
        // ========================================

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message = "Họ tên không được để trống."
            });
        }

        // ========================================
        // VALIDATE FACTORY
        // ========================================

        if (request.FactoryId == null)
        {
            return BadRequest(new
            {
                message = "Phải chọn Factory."
            });
        }

        // ========================================
        // VALIDATE DEPARTMENT
        // ========================================

        if (request.DepartmentId == null)
        {
            return BadRequest(new
            {
                message = "Phải chọn Department."
            });
        }

        // ========================================
        // VALIDATE ROLE
        // ========================================

        if (string.IsNullOrWhiteSpace(request.RoleCode))
        {
            return BadRequest(new
            {
                message = "Phải chọn Role."
            });
        }

        // ========================================
        // CHECK USERNAME
        // Username giữ unique toàn hệ thống.
        // ========================================

        var normalizedUsername =
            request.Username.Trim();

        var usernameExists =
            await _context.Users
                .AnyAsync(x =>
                    x.Username == normalizedUsername);

        if (usernameExists)
        {
            return Conflict(new
            {
                message = "Username đã tồn tại."
            });
        }

        // ========================================
        // CHECK FACTORY
        // ========================================

        var factoryExists =
            await _context.Factories
                .AnyAsync(x =>
                    x.FactoryId == request.FactoryId &&
                    x.IsActive);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message =
                    "Factory không tồn tại hoặc đã bị khóa."
            });
        }

        // ========================================
        // CHECK DEPARTMENT
        //
        // Department là GLOBAL master.
        // ========================================

        var departmentExists =
            await _context.Departments
                .AnyAsync(x =>
                    x.DepartmentId == request.DepartmentId &&
                    x.IsActive);

        if (!departmentExists)
        {
            return BadRequest(new
            {
                message =
                    "Department không tồn tại hoặc đã bị khóa."
            });
        }

        // ========================================
        // CHECK ROLE
        //
        // Role là GLOBAL master.
        // ========================================

        var roleCode =
            request.RoleCode.Trim();

        var roleExists =
            await _context.Roles
                .AnyAsync(x =>
                    x.RoleCode == roleCode &&
                    x.IsActive);

        if (!roleExists)
        {
            return BadRequest(new
            {
                message =
                    "Role không tồn tại hoặc đã bị khóa."
            });
        }

        // ========================================
        // CREATE USER
        // ========================================

        var user = new User
        {
            Username = normalizedUsername,

            FullName =
                request.FullName.Trim(),

            FactoryId =
                request.FactoryId,

            DepartmentId =
                request.DepartmentId,

            RoleCode =
                roleCode,

            IsActive =
                request.IsActive
        };

        // ========================================
        // HASH PASSWORD
        // ========================================

        user.PasswordHash =
            _passwordHasher.HashPassword(
                user,
                request.Password);

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Tạo người dùng thành công.",
            userId = user.UserId
        });
    }

    // ============================================================
    // UPDATE USER
    // ============================================================

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateUser(
        long id,
        [FromBody] UpdateUserRequest request)
    {
        var user =
            await _context.Users
                .FirstOrDefaultAsync(x =>
                    x.UserId == id);

        if (user == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy người dùng."
            });
        }

        // ========================================
        // VALIDATE FULL NAME
        // ========================================

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message = "Họ tên không được để trống."
            });
        }

        // ========================================
        // VALIDATE FACTORY
        // ========================================

        if (request.FactoryId == null)
        {
            return BadRequest(new
            {
                message = "Phải chọn Factory."
            });
        }

        // ========================================
        // VALIDATE DEPARTMENT
        // ========================================

        if (request.DepartmentId == null)
        {
            return BadRequest(new
            {
                message = "Phải chọn Department."
            });
        }

        // ========================================
        // VALIDATE ROLE
        // ========================================

        if (string.IsNullOrWhiteSpace(request.RoleCode))
        {
            return BadRequest(new
            {
                message = "Phải chọn Role."
            });
        }

        // ========================================
        // VALIDATE PASSWORD MỚI NẾU CÓ NHẬP
        // ========================================

        if (
            !string.IsNullOrWhiteSpace(request.Password) &&
            request.Password.Length < 6)
        {
            return BadRequest(new
            {
                message =
                    "Password mới phải có ít nhất 6 ký tự."
            });
        }

        // ========================================
        // CHECK FACTORY
        // ========================================

        var factoryExists =
            await _context.Factories
                .AnyAsync(x =>
                    x.FactoryId == request.FactoryId &&
                    x.IsActive);

        if (!factoryExists)
        {
            return BadRequest(new
            {
                message =
                    "Factory không tồn tại hoặc đã bị khóa."
            });
        }

        // ========================================
        // CHECK DEPARTMENT
        // ========================================

        var departmentExists =
            await _context.Departments
                .AnyAsync(x =>
                    x.DepartmentId == request.DepartmentId &&
                    x.IsActive);

        if (!departmentExists)
        {
            return BadRequest(new
            {
                message =
                    "Department không tồn tại hoặc đã bị khóa."
            });
        }

        // ========================================
        // CHECK ROLE
        // ========================================

        var roleCode =
            request.RoleCode.Trim();

        var roleExists =
            await _context.Roles
                .AnyAsync(x =>
                    x.RoleCode == roleCode &&
                    x.IsActive);

        if (!roleExists)
        {
            return BadRequest(new
            {
                message =
                    "Role không tồn tại hoặc đã bị khóa."
            });
        }

        // ========================================
        // UPDATE INFORMATION
        // ========================================

        user.FullName =
            request.FullName.Trim();

        // Giữ nguyên nghiệp vụ quản trị hiện tại:
        // màn Users được phép chuyển Factory của User.
        user.FactoryId =
            request.FactoryId;

        user.DepartmentId =
            request.DepartmentId;

        user.RoleCode =
            roleCode;

        user.IsActive =
            request.IsActive;

        // ========================================
        // UPDATE PASSWORD NẾU CÓ NHẬP
        // ========================================

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Cập nhật người dùng thành công."
        });
    }

    // ============================================================
    // DELETE USER
    // ============================================================

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteUser(long id)
    {
        var user =
            await _context.Users
                .FirstOrDefaultAsync(x =>
                    x.UserId == id);

        if (user == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy người dùng."
            });
        }

        _context.Users.Remove(user);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Xóa người dùng thành công."
        });
    }

    // ============================================================
    // CHANGE PASSWORD
    //
    // UserId lấy trực tiếp từ JWT thông qua CurrentUserService.
    // Frontend KHÔNG truyền UserId.
    //
    // PUT: /api/users/change-password
    // ============================================================

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request)
    {
        // ========================================
        // VALIDATE CURRENT PASSWORD
        // ========================================

        if (string.IsNullOrWhiteSpace(
            request.CurrentPassword))
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng nhập mật khẩu hiện tại."
            });
        }

        // ========================================
        // VALIDATE NEW PASSWORD
        // ========================================

        if (string.IsNullOrWhiteSpace(
            request.NewPassword))
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng nhập mật khẩu mới."
            });
        }

        // ========================================
        // VALIDATE CONFIRM PASSWORD
        // ========================================

        if (string.IsNullOrWhiteSpace(
            request.ConfirmPassword))
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng xác nhận mật khẩu mới."
            });
        }

        // ========================================
        // CONFIRM PASSWORD PHẢI KHỚP
        // ========================================

        if (
            request.NewPassword !=
            request.ConfirmPassword)
        {
            return BadRequest(new
            {
                message =
                    "Xác nhận mật khẩu mới không khớp."
            });
        }

        // ========================================
        // PASSWORD LENGTH
        // ========================================

        if (request.NewPassword.Length < 6)
        {
            return BadRequest(new
            {
                message =
                    "Mật khẩu mới phải có ít nhất 6 ký tự."
            });
        }

        // ========================================
        // PASSWORD MỚI KHÔNG ĐƯỢC GIỐNG
        // PASSWORD HIỆN TẠI
        // ========================================

        if (
            request.CurrentPassword ==
            request.NewPassword)
        {
            return BadRequest(new
            {
                message =
                    "Mật khẩu mới phải khác mật khẩu hiện tại."
            });
        }

        // ========================================
        // GET USER ID FROM JWT
        // ========================================

        var userId =
            _currentUser.UserId;

        if (userId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Token đăng nhập không hợp lệ."
            });
        }

        // ========================================
        // FIND CURRENT USER
        // ========================================

        var user =
            await _context.Users
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId.Value &&
                    x.IsActive);

        if (user == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy người dùng."
            });
        }

        // ========================================
        // VERIFY CURRENT PASSWORD
        // ========================================

        PasswordVerificationResult verifyResult;

        try
        {
            verifyResult =
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.CurrentPassword);
        }
        catch
        {
            return BadRequest(new
            {
                message =
                    "Mật khẩu hiện tại không đúng."
            });
        }

        if (
            verifyResult ==
            PasswordVerificationResult.Failed)
        {
            return BadRequest(new
            {
                message =
                    "Mật khẩu hiện tại không đúng."
            });
        }

        // ========================================
        // HASH NEW PASSWORD
        // ========================================

        user.PasswordHash =
            _passwordHasher.HashPassword(
                user,
                request.NewPassword);

        // ========================================
        // SAVE
        // ========================================

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đổi mật khẩu thành công."
        });
    }
}

// ============================================================
// REQUEST MODELS
// ============================================================

public class CreateUserRequest
{
    public string Username { get; set; } = "";

    public string Password { get; set; } = "";

    public string FullName { get; set; } = "";

    public long? FactoryId { get; set; }

    public long? DepartmentId { get; set; }

    public string RoleCode { get; set; } = "";

    public bool IsActive { get; set; } = true;
}

public class UpdateUserRequest
{
    public string? Password { get; set; }

    public string FullName { get; set; } = "";

    public long? FactoryId { get; set; }

    public long? DepartmentId { get; set; }

    public string RoleCode { get; set; } = "";

    public bool IsActive { get; set; } = true;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = "";

    public string NewPassword { get; set; } = "";

    public string ConfirmPassword { get; set; } = "";
}
