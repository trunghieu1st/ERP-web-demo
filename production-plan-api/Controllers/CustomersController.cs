
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public CustomersController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // GET: api/customers
    [HttpGet]
    public async Task<IActionResult> GetCustomers()
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được nhà máy của người dùng."
            });
        }

        var customers = await _context.Customers
            .AsNoTracking()
            .Where(x => x.FactoryId == factoryId.Value)
            .OrderBy(x => x.PartyId)
            .ToListAsync();

        return Ok(customers);
    }

    // POST: api/customers
    [HttpPost]
    public async Task<IActionResult> CreateCustomer(
        [FromBody] Customer customer)
    {
        // =========================
        // 1. Kiểm tra Factory
        // =========================

        var factoryId = _currentUser.FactoryId;
        var currentUserId = _currentUser.UserId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được nhà máy của người dùng."
            });
        }

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        // =========================
        // 2. Kiểm tra PartyCode
        // =========================

        if (string.IsNullOrWhiteSpace(customer.PartyCode))
        {
            return BadRequest(new
            {
                message = "Mã khách hàng (PartyCode) không được để trống."
            });
        }

        // Xóa khoảng trắng đầu/cuối
        customer.PartyCode = customer.PartyCode.Trim();

        // =========================
        // 3. Kiểm tra PartyCode đã tồn tại
        // =========================

        var exists = await _context.Customers
            .AnyAsync(x =>
                x.PartyCode == customer.PartyCode &&
                x.FactoryId == factoryId.Value);

        if (exists)
        {
            return Conflict(new
            {
                message = $"Mã khách hàng '{customer.PartyCode}' đã tồn tại."
            });
        }

        // =========================
        // 4. Thông tin hệ thống
        // =========================

        customer.FactoryId = factoryId.Value;

        customer.CreationDate = AppDateTime.Now;
        customer.LastUpdateDate = AppDateTime.Now;

        customer.CreatedBy = currentUserId.Value;
        customer.LastUpdateBy = currentUserId.Value;

        // =========================
        // 5. Insert
        // =========================

        _context.Customers.Add(customer);

        await _context.SaveChangesAsync();

        return Ok(customer);
    }

    // PUT: api/customers/{partyId}
    [HttpPut("{partyId}")]
    public async Task<IActionResult> UpdateCustomer(
        int partyId,
        [FromBody] Customer request)
    {
        // =========================
        // 1. Kiểm tra DataScope
        // =========================

        var factoryId = _currentUser.FactoryId;
        var currentUserId = _currentUser.UserId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được nhà máy của người dùng."
            });
        }

        if (currentUserId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được người dùng đăng nhập."
            });
        }

        // =========================
        // 2. Tìm customer
        //    Chỉ trong Factory của user
        // =========================

        var customer = await _context.Customers
            .FirstOrDefaultAsync(x =>
                x.PartyId == partyId &&
                x.FactoryId == factoryId.Value);

        if (customer == null)
        {
            return NotFound(new
            {
                message = $"Không tìm thấy customer có PartyId = {partyId}."
            });
        }

        // =========================
        // 3. Cập nhật thông tin
        // =========================

        customer.PartyCode = request.PartyCode;
        customer.PartyName = request.PartyName;
        customer.CountryCode = request.CountryCode;
        customer.Address = request.Address;

        // Không cho client thay đổi FactoryId
        customer.FactoryId = factoryId.Value;

        customer.Active = request.Active;

        // =========================
        // 4. Thông tin update
        // =========================

        customer.LastUpdateDate = AppDateTime.Now;
        customer.LastUpdateBy = currentUserId.Value;

        await _context.SaveChangesAsync();

        return Ok(customer);
    }

    // DELETE: api/customers/{partyId}
    [HttpDelete("{partyId}")]
    public async Task<IActionResult> DeleteCustomer(int partyId)
    {
        // =========================
        // 1. Kiểm tra DataScope
        // =========================

        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được nhà máy của người dùng."
            });
        }

        // =========================
        // 2. Tìm customer
        //    Chỉ trong Factory của user
        // =========================

        var customer = await _context.Customers
            .FirstOrDefaultAsync(x =>
                x.PartyId == partyId &&
                x.FactoryId == factoryId.Value);

        if (customer == null)
        {
            return NotFound(new
            {
                message = $"Không tìm thấy khách hàng có PartyId = {partyId}."
            });
        }

        // =========================
        // 3. Xóa customer
        // =========================

        _context.Customers.Remove(customer);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Đã xóa khách hàng '{customer.PartyCode} - {customer.PartyName}'.",
            partyId = partyId
        });
    }
}
