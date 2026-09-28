using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using production_plan_api.Data;
using production_plan_api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthController(
        CustomerDbContext context,
        IConfiguration configuration,
        IPasswordHasher<User> passwordHasher)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
    }

    // =========================================
    // LOGIN
    // =========================================

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        // =====================================
        // VALIDATE
        // =====================================

        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Username và password không được để trống."
            });
        }

        var username = request.Username.Trim();

        // =====================================
        // FIND USER
        // =====================================

        var user = await _context.Users
            .FirstOrDefaultAsync(x =>
                x.Username == username &&
                x.IsActive);

        if (user == null)
        {
            return Unauthorized(new
            {
                message = "Username hoặc password không đúng."
            });
        }

        // =====================================
        // VERIFY HASHED PASSWORD
        // =====================================

        PasswordVerificationResult verifyResult;

        try
        {
            verifyResult =
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.PasswordHash,
                    request.Password
                );
        }
        catch
        {
            // PasswordHash trong DB không hợp lệ.
            // Không fallback sang plain text nữa.
            return Unauthorized(new
            {
                message = "Username hoặc password không đúng."
            });
        }

        if (verifyResult ==
            PasswordVerificationResult.Failed)
        {
            return Unauthorized(new
            {
                message = "Username hoặc password không đúng."
            });
        }

        // =====================================
        // REHASH NẾU FRAMEWORK YÊU CẦU
        // =====================================

        if (verifyResult ==
            PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    request.Password
                );

            await _context.SaveChangesAsync();
        }

        // =====================================
        // GET FACTORY
        // =====================================

        var factoryName = "";

        if (user.FactoryId.HasValue)
        {
            factoryName =
                await _context.Factories
                    .AsNoTracking()
                    .Where(x =>
                        x.FactoryId ==
                        user.FactoryId.Value)
                    .Select(x =>
                        x.FactoryName)
                    .FirstOrDefaultAsync()
                ?? "";
        }

        // =====================================
        // GET DEPARTMENT
        // =====================================

        var departmentName = "";
        string? interfaceType = null;

        if (user.DepartmentId.HasValue)
        {
            var department =
                await _context.Departments
                    .AsNoTracking()
                    .Where(x =>
                        x.DepartmentId ==
                        user.DepartmentId.Value)
                    .Select(x => new
                    {
                        x.DepartmentName,
                        x.InterfaceType
                    })
                    .FirstOrDefaultAsync();

            if (department != null)
            {
                departmentName =
                    department.DepartmentName;

                interfaceType =
                    department.InterfaceType;
            }
        }

        // =====================================
        // GET ROLE
        // =====================================

        var roleName = "";

        if (!string.IsNullOrWhiteSpace(
                user.RoleCode))
        {
            roleName =
                await _context.Roles
                    .AsNoTracking()
                    .Where(x =>
                        x.RoleCode ==
                        user.RoleCode)
                    .Select(x =>
                        x.RoleName)
                    .FirstOrDefaultAsync()
                ?? "";
        }

        // =====================================
        // CREATE ACCESS TOKEN
        // =====================================

        var accessToken =
            CreateAccessToken(
                user.UserId,
                user.Username,
                user.FullName,
                user.FactoryId,
                user.DepartmentId,
                user.RoleCode ?? ""
            );

        // =====================================
        // RESPONSE
        // =====================================

        return Ok(new
        {
            accessToken,

            user = new
            {
                userId = user.UserId,

                username = user.Username,

                fullName = user.FullName,

                factoryId = user.FactoryId,
                factoryName,

                departmentId = user.DepartmentId,
                departmentName,

                interfaceType,

                role = user.RoleCode,
                roleName
            }
        });
    }

    // =========================================
    // CREATE JWT ACCESS TOKEN
    // =========================================

    private string CreateAccessToken(
        long userId,
        string username,
        string fullName,
        long? factoryId,
        long? departmentId,
        string roleCode)
    {
        var jwtKey =
            _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException(
                "Jwt:Key chưa được cấu hình."
            );

        var claims =
            new List<Claim>
            {
                new(
                    ClaimTypes.NameIdentifier,
                    userId.ToString()
                ),

                new(
                    ClaimTypes.Name,
                    username
                ),

                new(
                    "fullName",
                    fullName ?? ""
                ),

                new(
                    ClaimTypes.Role,
                    roleCode
                )
            };

        if (factoryId.HasValue)
        {
            claims.Add(
                new Claim(
                    "factoryId",
                    factoryId.Value.ToString()
                )
            );
        }

        if (departmentId.HasValue)
        {
            claims.Add(
                new Claim(
                    "departmentId",
                    departmentId.Value.ToString()
                )
            );
        }

        var key =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            );

        var credentials =
            new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

        var expireMinutes =
            int.TryParse(
                _configuration[
                    "Jwt:ExpireMinutes"
                ],
                out var minutes
            )
                ? minutes
                : 60;

        var token =
            new JwtSecurityToken(
                issuer:
                    _configuration["Jwt:Issuer"],

                audience:
                    _configuration["Jwt:Audience"],

                claims:
                    claims,

                expires:
                    DateTime.UtcNow.AddMinutes(
                        expireMinutes
                    ),

                signingCredentials:
                    credentials
            );

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}


// =============================================
// LOGIN REQUEST
// =============================================

public class LoginRequest
{
    public string Username { get; set; } = "";

    public string Password { get; set; } = "";
}