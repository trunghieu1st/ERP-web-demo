using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/order-headers")]
[Authorize]
public class OrderHeadersController : ControllerBase
{
    private const string DefaultOrderType = "ORDER BREAKDOWN";

    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public OrderHeadersController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // =========================================================
    // GET: api/order-headers/options
    // =========================================================
    [HttpGet("options")]
    public async Task<IActionResult> GetOptions()
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng đăng nhập."
            });
        }

        // =====================================================
        // CUSTOMER ACCOUNTS
        // Chỉ lấy Customer Account thuộc Factory hiện tại
        // =====================================================

        var customers = await (
            from account in _context.CustomerAccounts.AsNoTracking()

            join party in _context.Customers.AsNoTracking()
                on account.PartyId equals party.PartyId

            where
                account.FactoryId == factoryId.Value

            orderby
                party.PartyName,
                account.AccountName

            select new
            {
                custAccountId = account.CustAccountId,
                partyName = party.PartyName,
                accountName = account.AccountName
            })
            .ToListAsync();

        // =====================================================
        // SHIPPING METHODS
        // GLOBAL MASTER
        // =====================================================

        var shippingMethods = await _context.ShippingMethods
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.ShippingMethodCode)
            .Select(x => new
            {
                shippingMethodCode =
                    x.ShippingMethodCode,

                description =
                    x.Description
            })
            .ToListAsync();

        // =====================================================
        // PAYMENT TERMS
        // GLOBAL MASTER
        // =====================================================

        var paymentTerms = await _context.PaymentTerms
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.PaymentTermCode)
            .Select(x => new
            {
                paymentTermCode =
                    x.PaymentTermCode,

                description =
                    x.Description
            })
            .ToListAsync();

        return Ok(new
        {
            customers,
            shippingMethods,
            paymentTerms
        });
    }

    // =========================================================
    // GET:
    // api/order-headers/sales-agreements?custAccountId=1
    // =========================================================
    [HttpGet("sales-agreements")]
    public async Task<IActionResult> GetSalesAgreements(
        [FromQuery] long custAccountId)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng đăng nhập."
            });
        }

        // =====================================================
        // CUSTOMER ACCOUNT PHẢI THUỘC FACTORY HIỆN TẠI
        // =====================================================

        var customerExists =
            await _context.CustomerAccounts
                .AsNoTracking()
                .AnyAsync(x =>
                    x.CustAccountId == custAccountId &&
                    x.FactoryId == factoryId.Value);

        if (!customerExists)
        {
            return BadRequest(new
            {
                message =
                    "Khách hàng không thuộc nhà máy hiện tại."
            });
        }

        // =====================================================
        // SALES AGREEMENT
        // Factory + Customer Account
        // =====================================================

        var agreements =
            await _context.SalesAgreementHeaders
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == factoryId.Value &&
                    x.CustAccountId == custAccountId)
                .OrderBy(x =>
                    x.SaleAgreementName)
                .Select(x => new
                {
                    headerId =
                        x.HeaderId,

                    saleAgreementName =
                        x.SaleAgreementName,

                    priceListId =
                        x.PriceListId,

                    collectionHeaderId =
                        x.CollectionHeaderId,

                    transactionalCurrCode =
                        x.TransactionalCurrCode
                })
                .ToListAsync();

        return Ok(agreements);
    }

    // =========================================================
    // GET:
    // api/order-headers/sales-agreements/{headerId}/detail
    // =========================================================
    [HttpGet("sales-agreements/{headerId:long}/detail")]
    public async Task<IActionResult> GetSalesAgreementDetail(
        long headerId)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của người dùng đăng nhập."
            });
        }

        // =====================================================
        // SALES AGREEMENT PHẢI THUỘC FACTORY HIỆN TẠI
        // =====================================================

        var agreement =
            await _context.SalesAgreementHeaders
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.HeaderId == headerId &&
                    x.FactoryId == factoryId.Value);

        if (agreement == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy chương trình/mùa hàng."
            });
        }

        // =====================================================
        // PRICE LIST
        // =====================================================

        var priceListName =
            agreement.PriceListId == null
                ? null
                : await _context.PriceListHeaders
                    .AsNoTracking()
                    .Where(x =>
                        x.HeaderId ==
                        agreement.PriceListId.Value)
                    .Select(x =>
                        x.PriceListName)
                    .FirstOrDefaultAsync();

        // =====================================================
        // MATERIAL COLLECTION
        // =====================================================

        var collectionName =
            agreement.CollectionHeaderId == null
                ? null
                : await _context.MaterialCollectionHeaders
                    .AsNoTracking()
                    .Where(x =>
                        x.CollectionHeaderId ==
                        agreement.CollectionHeaderId.Value)
                    .Select(x =>
                        x.CollectionName)
                    .FirstOrDefaultAsync();

        return Ok(new
        {
            headerId =
                agreement.HeaderId,

            priceListId =
                agreement.PriceListId,

            priceListName,

            collectionHeaderId =
                agreement.CollectionHeaderId,

            collectionName,

            transactionalCurrCode =
                agreement.TransactionalCurrCode
        });
    }

    // =========================================================
    // POST: api/order-headers
    // =========================================================
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateOrderHeaderRequest request)
    {
        var userId = _currentUser.UserId;
        var factoryId = _currentUser.FactoryId;

        if (userId == null || factoryId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        // =====================================================
        // VALIDATE INPUT
        // =====================================================

        if (request.CustAccountId <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng chọn khách hàng."
            });
        }

        if (request.SaleAgreementId <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng chọn chương trình/mùa hàng."
            });
        }

        if (string.IsNullOrWhiteSpace(
            request.ShippingMethodCode))
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng chọn phương thức vận chuyển."
            });
        }

        if (string.IsNullOrWhiteSpace(
            request.PaymentTermCode))
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng chọn phương thức thanh toán."
            });
        }

        // =====================================================
        // SALES AGREEMENT
        //
        // Phải đồng thời đúng:
        // - Agreement
        // - Customer Account
        // - Factory hiện tại
        // =====================================================

        var agreement =
            await _context.SalesAgreementHeaders
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.HeaderId ==
                        request.SaleAgreementId &&

                    x.CustAccountId ==
                        request.CustAccountId &&

                    x.FactoryId ==
                        factoryId.Value);

        if (agreement == null)
        {
            return BadRequest(new
            {
                message =
                    "Chương trình/mùa hàng không thuộc khách hàng đã chọn."
            });
        }

        // =====================================================
        // SHIPPING METHOD
        // GLOBAL MASTER
        // =====================================================

        var shippingCode =
            request.ShippingMethodCode.Trim();

        var shippingExists =
            await _context.ShippingMethods
                .AsNoTracking()
                .AnyAsync(x =>
                    x.IsActive &&
                    x.ShippingMethodCode ==
                        shippingCode);

        if (!shippingExists)
        {
            return BadRequest(new
            {
                message =
                    "Phương thức vận chuyển không hợp lệ."
            });
        }

        // =====================================================
        // PAYMENT TERM
        // GLOBAL MASTER
        // =====================================================

        var paymentCode =
            request.PaymentTermCode.Trim();

        var paymentExists =
            await _context.PaymentTerms
                .AsNoTracking()
                .AnyAsync(x =>
                    x.IsActive &&
                    x.PaymentTermCode ==
                        paymentCode);

        if (!paymentExists)
        {
            return BadRequest(new
            {
                message =
                    "Phương thức thanh toán không hợp lệ."
            });
        }

        // =====================================================
        // CREATE ORDER
        //
        // FactoryId lấy từ JWT.
        // Client không được quyền quyết định FactoryId.
        // =====================================================

        var now = AppDateTime.Now;

        var order = new OrderHeader
        {
            OrderType =
                DefaultOrderType,

            SaleAgreementId =
                agreement.HeaderId,

            ShippingMethodCode =
                shippingCode,

            PaymentTermCode =
                paymentCode,

            CreatedBy =
                userId.Value,

            CreationDate =
                now,

            LastUpdatedBy =
                userId.Value,

            LastUpdateDate =
                now,

            FactoryId =
                factoryId.Value
        };

        _context.OrderHeaders.Add(order);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "Đã tạo kế hoạch sản xuất.",

            headerId =
                order.HeaderId,

            orderNumber =
                order.OrderNumber,

            orderType =
                order.OrderType
        });
    }
}

public class CreateOrderHeaderRequest
{
    public long CustAccountId { get; set; }

    public long SaleAgreementId { get; set; }

    public string? ShippingMethodCode { get; set; }

    public string? PaymentTermCode { get; set; }
}
