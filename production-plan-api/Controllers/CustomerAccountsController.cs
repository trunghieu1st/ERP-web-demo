using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/customer-accounts")]
[Authorize]
public class CustomerAccountsController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public CustomerAccountsController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }


    // =========================================================
    // GET
    // api/customer-accounts/party/{partyId}
    //
    // Lấy danh sách thương hiệu của khách hàng
    // Chỉ được phép xem Customer thuộc Factory của user
    // =========================================================

    [HttpGet("party/{partyId}")]
    public async Task<IActionResult> GetByPartyId(long partyId)
    {
        if (partyId <= 0)
        {
            return BadRequest(new
            {
                message = "PARTY_ID không hợp lệ."
            });
        }

        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được nhà máy của người dùng."
            });
        }

        try
        {
            // Kiểm tra Customer có thuộc Factory của user hay không
            var customerExists = await _context.Customers
                .AnyAsync(x =>
                    x.PartyId == partyId &&
                    x.FactoryId == factoryId.Value);

            if (!customerExists)
            {
                return NotFound(new
                {
                    message =
                        $"Không tìm thấy khách hàng có PARTY_ID = {partyId}."
                });
            }

            var accounts = await _context.CustomerAccounts
                .AsNoTracking()
                .Where(x => x.PartyId == partyId)
                .OrderBy(x => x.CustAccountId)
                .ToListAsync();

            return Ok(accounts);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());

            return StatusCode(500, new
            {
                message = "Lỗi khi lấy danh sách thương hiệu.",
                detail = ex.InnerException?.Message ?? ex.Message
            });
        }
    }


    // =========================================================
    // POST
    // api/customer-accounts
    //
    // Thêm thương hiệu mới
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CreateCustomerAccount(
        [FromBody] CustomerAccount account)
    {
        if (account.PartyId <= 0)
        {
            return BadRequest(new
            {
                message = "PARTY_ID không hợp lệ."
            });
        }

        if (string.IsNullOrWhiteSpace(account.AccountName))
        {
            return BadRequest(new
            {
                message = "Tên thương hiệu không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(account.Active))
        {
            return BadRequest(new
            {
                message = "Trạng thái thương hiệu không được để trống."
            });
        }

        if (
            account.Active != "ACTIVE" &&
            account.Active != "INACTIVE"
        )
        {
            return BadRequest(new
            {
                message = "Trạng thái không hợp lệ."
            });
        }

        account.AccountName =
            account.AccountName.Trim();

        // =====================================================
        // Kiểm tra DataScope
        // =====================================================

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

        // =====================================================
        // Kiểm tra khách hàng
        // Customer phải thuộc Factory của user
        // =====================================================

        var customerExists =
            await _context.Customers
                .AnyAsync(x =>
                    x.PartyId == account.PartyId &&
                    x.FactoryId == factoryId.Value);

        if (!customerExists)
        {
            return NotFound(new
            {
                message =
                    $"Không tìm thấy khách hàng có PARTY_ID = {account.PartyId}."
            });
        }

        // =====================================================
        // Kiểm tra trùng thương hiệu
        //
        // Cùng PARTY_ID không được có
        // cùng ACCOUNT_NAME
        // =====================================================

        var accountExists =
            await _context.CustomerAccounts
                .AnyAsync(x =>
                    x.PartyId == account.PartyId &&
                    x.AccountName == account.AccountName);

        if (accountExists)
        {
            return Conflict(new
            {
                message =
                    $"Thương hiệu '{account.AccountName}' " +
                    $"đã tồn tại trong khách hàng này."
            });
        }

        // =====================================================
        // Dữ liệu hệ thống
        // =====================================================

        account.CustAccountId = 0;

        account.CreationDate =
            AppDateTime.Now;

        account.LastUpdateDate =
            AppDateTime.Now;

        account.CreatedBy =
            currentUserId.Value;

        account.LastUpdateBy =
            currentUserId.Value;

        _context.CustomerAccounts.Add(account);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            Console.WriteLine(ex.ToString());

            return StatusCode(500, new
            {
                message =
                    "Lỗi khi lưu thương hiệu vào database.",

                detail =
                    ex.InnerException?.Message ??
                    ex.Message
            });
        }

        return Ok(account);
    }


    // =========================================================
    // PUT
    // api/customer-accounts/{custAccountId}
    //
    // Cập nhật thương hiệu
    // =========================================================

    [HttpPut("{custAccountId}")]
    public async Task<IActionResult> UpdateCustomerAccount(
        long custAccountId,
        [FromBody] CustomerAccount request)
    {
        if (custAccountId <= 0)
        {
            return BadRequest(new
            {
                message = "CUST_ACCOUNT_ID không hợp lệ."
            });
        }

        if (string.IsNullOrWhiteSpace(request.AccountName))
        {
            return BadRequest(new
            {
                message = "Tên thương hiệu không được để trống."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Active))
        {
            return BadRequest(new
            {
                message = "Trạng thái thương hiệu không được để trống."
            });
        }

        if (
            request.Active != "ACTIVE" &&
            request.Active != "INACTIVE"
        )
        {
            return BadRequest(new
            {
                message = "Trạng thái không hợp lệ."
            });
        }

        request.AccountName =
            request.AccountName.Trim();

        // =====================================================
        // DataScope
        // =====================================================

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

        // =====================================================
        // Tìm thương hiệu cần sửa
        //
        // Đồng thời kiểm tra Customer của thương hiệu
        // có thuộc Factory của user hay không
        // =====================================================

        var account =
            await _context.CustomerAccounts
                .FirstOrDefaultAsync(x =>
                    x.CustAccountId == custAccountId &&
                    _context.Customers.Any(c =>
                        c.PartyId == x.PartyId &&
                        c.FactoryId == factoryId.Value));

        if (account == null)
        {
            return NotFound(new
            {
                message =
                    $"Không tìm thấy thương hiệu có CUST_ACCOUNT_ID = {custAccountId}."
            });
        }

        // =====================================================
        // Kiểm tra trùng ACCOUNT_NAME
        //
        // Không tính chính bản ghi đang sửa
        // =====================================================

        var duplicate =
            await _context.CustomerAccounts
                .AnyAsync(x =>
                    x.CustAccountId != custAccountId &&
                    x.PartyId == account.PartyId &&
                    x.AccountName == request.AccountName);

        if (duplicate)
        {
            return Conflict(new
            {
                message =
                    $"Thương hiệu '{request.AccountName}' " +
                    $"đã tồn tại trong khách hàng này."
            });
        }

        // =====================================================
        // UPDATE
        // =====================================================

        account.AccountName =
            request.AccountName;

        account.Active =
            request.Active;

        account.LastUpdateDate =
            AppDateTime.Now;

        account.LastUpdateBy =
            currentUserId.Value;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            Console.WriteLine(ex.ToString());

            return StatusCode(500, new
            {
                message =
                    "Lỗi khi cập nhật thương hiệu.",

                detail =
                    ex.InnerException?.Message ??
                    ex.Message
            });
        }

        return Ok(account);
    }


    // =========================================================
    // DELETE
    // api/customer-accounts/{custAccountId}
    //
    // Xóa thương hiệu
    // =========================================================

    [HttpDelete("{custAccountId}")]
    public async Task<IActionResult> DeleteCustomerAccount(
        long custAccountId)
    {
        if (custAccountId <= 0)
        {
            return BadRequest(new
            {
                message = "CUST_ACCOUNT_ID không hợp lệ."
            });
        }

        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message = "Không xác định được nhà máy của người dùng."
            });
        }

        // =====================================================
        // Tìm thương hiệu
        //
        // Chỉ được xóa thương hiệu của Customer
        // thuộc Factory của user
        // =====================================================

        var account =
            await _context.CustomerAccounts
                .FirstOrDefaultAsync(x =>
                    x.CustAccountId == custAccountId &&
                    _context.Customers.Any(c =>
                        c.PartyId == x.PartyId &&
                        c.FactoryId == factoryId.Value));

        if (account == null)
        {
            return NotFound(new
            {
                message =
                    $"Không tìm thấy thương hiệu có CUST_ACCOUNT_ID = {custAccountId}."
            });
        }

        _context.CustomerAccounts.Remove(account);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            Console.WriteLine(ex.ToString());

            return StatusCode(500, new
            {
                message =
                    "Không thể xóa thương hiệu. " +
                    "Có thể thương hiệu đang được sử dụng ở dữ liệu khác.",

                detail =
                    ex.InnerException?.Message ??
                    ex.Message
            });
        }

        return Ok(new
        {
            message =
                $"Đã xóa thương hiệu '{account.AccountName}'."
        });
    }
}
