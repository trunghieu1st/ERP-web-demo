using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using production_plan_api.Data;
using production_plan_api.Helpers;
using production_plan_api.Models;
using production_plan_api.Services;

namespace production_plan_api.Controllers;

[ApiController]
[Route("api/sales-agreements")]
[Authorize]
public class SalesAgreementsController : ControllerBase
{
    private readonly CustomerDbContext _context;
    private readonly CurrentUserService _currentUser;

    public SalesAgreementsController(
        CustomerDbContext context,
        CurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    // ============================================================
    // GET ALL SALES AGREEMENTS
    // ============================================================
    [HttpGet]
    public async Task<IActionResult> GetSalesAgreements(
        [FromQuery] string? keyword = null)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của tài khoản."
            });
        }

        var query = _context.SalesAgreementHeaders
            .AsNoTracking()
            .Where(x => x.FactoryId == factoryId.Value);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var search = keyword.Trim();

            var isNumber =
                long.TryParse(search, out var agreementNumber);

            query = query.Where(x =>
                EF.Functions.ILike(
                    x.SaleAgreementName,
                    "%" + search + "%") ||
                (isNumber &&
                 x.SaleAgreementNumber == agreementNumber));
        }

        var result = await query
            .OrderByDescending(x => x.HeaderId)
            .Select(x => new
            {
                x.HeaderId,
                x.SaleAgreementName,
                x.SaleAgreementNumber,
                x.CustAccountId,
                x.PriceListId,
                x.CollectionHeaderId,
                x.TransactionalCurrCode,
                x.StartDate,
                x.EndDate,
                x.FactoryId
            })
            .ToListAsync();

        return Ok(result);
    }

    // ============================================================
    // GET SALES AGREEMENT BY ID
    // HEADER + LINES
    // ============================================================
    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetSalesAgreement(long id)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của tài khoản."
            });
        }

        var header = await _context.SalesAgreementHeaders
            .AsNoTracking()
            .Where(x =>
                x.HeaderId == id &&
                x.FactoryId == factoryId.Value)
            .Select(x => new
            {
                x.HeaderId,
                x.SaleAgreementName,
                x.SaleAgreementNumber,
                x.CustAccountId,
                x.PriceListId,
                x.CollectionHeaderId,
                x.TransactionalCurrCode,
                x.StartDate,
                x.EndDate,
                x.FactoryId
            })
            .FirstOrDefaultAsync();

        if (header == null)
        {
            return NotFound(new
            {
                message = "Không tìm thấy hợp đồng."
            });
        }

        var lines = await (
            from line in _context.SalesAgreementLines.AsNoTracking()

            join item in _context.Items.AsNoTracking()
                on line.InventoryItemId equals item.InventoryItemId
                into itemGroup

            from item in itemGroup.DefaultIfEmpty()

            where
                line.HeaderId == id &&
                line.FactoryId == factoryId.Value

            orderby line.LineId

            select new
            {
                line.LineId,
                line.InventoryItemId,

                ItemCode =
                    item == null
                        ? ""
                        : item.ItemCode,

                PrimaryUomCode =
                    item == null
                        ? ""
                        : item.PrimaryUomCode,

                LongDescription =
                    item == null
                        ? ""
                        : item.LongDescription,

                line.StartDate,
                line.EndDate
            })
            .ToListAsync();

        return Ok(new
        {
            header,
            lines
        });
    }

    // ============================================================
    // DROPDOWN OPTIONS
    // ============================================================
    [HttpGet("options")]
    public async Task<IActionResult> GetOptions(
        [FromQuery] string? itemKeyword = null)
    {
        var factoryId = _currentUser.FactoryId;

        if (factoryId == null || factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message = "Không xác định được Factory của tài khoản."
            });
        }

        // --------------------------------------------------------
        // CUSTOMER ACCOUNTS
        // --------------------------------------------------------

        var customers = await (
            from account in _context.CustomerAccounts.AsNoTracking()

            join party in _context.Customers.AsNoTracking()
                on account.PartyId equals party.PartyId

            where
                account.FactoryId == factoryId.Value &&
                (
                    party.FactoryId == factoryId.Value ||
                    party.FactoryId == null
                )

            orderby
                party.PartyName,
                account.AccountName

            select new
            {
                account.CustAccountId,
                party.PartyName,
                account.AccountName
            })
            .ToListAsync();

        // --------------------------------------------------------
        // CURRENCY
        // GLOBAL MASTER
        // --------------------------------------------------------

        var currencies = await _context.Currencies
            .AsNoTracking()
            .Where(x => x.CurrencyCode != null)
            .OrderBy(x => x.CurrencyCode)
            .Select(x => new
            {
                x.CurrencyCode,
                x.CurrencyName
            })
            .ToListAsync();

        // --------------------------------------------------------
        // PRICE LIST
        // FACTORY SCOPED
        // --------------------------------------------------------

        var priceLists = await _context.PriceListHeaders
            .AsNoTracking()
            .Where(x =>
                x.FactoryId == factoryId.Value)
            .OrderBy(x => x.PriceListName)
            .Select(x => new
            {
                x.HeaderId,
                x.PriceListName
            })
            .ToListAsync();

        // --------------------------------------------------------
        // MATERIAL COLLECTION
        // FACTORY SCOPED
        // --------------------------------------------------------

        var collections =
            await _context.MaterialCollectionHeaders
                .AsNoTracking()
                .Where(x =>
                    x.FactoryId == factoryId.Value &&
                    x.IsActive)
                .OrderBy(x => x.CollectionCode)
                .Select(x => new
                {
                    x.CollectionHeaderId,
                    x.CollectionCode,
                    x.CollectionName
                })
                .ToListAsync();

        // --------------------------------------------------------
        // ITEMS
        // FACTORY SCOPED
        // --------------------------------------------------------

        var itemQuery = _context.Items
            .AsNoTracking()
            .Where(x =>
                x.FactoryId == factoryId.Value &&
                x.ItemType == "Basic Finished Goods" &&
                !_context.SalesAgreementLines.Any(line =>
                    line.InventoryItemId ==
                    x.InventoryItemId));

        if (!string.IsNullOrWhiteSpace(itemKeyword))
        {
            var search =
                "%" + itemKeyword.Trim() + "%";

            itemQuery = itemQuery.Where(x =>
                EF.Functions.ILike(
                    x.ItemCode,
                    search) ||

                (
                    x.LongDescription != null &&
                    EF.Functions.ILike(
                        x.LongDescription,
                        search)
                ));
        }

        var items = await itemQuery
            .OrderBy(x => x.ItemCode)
            .Take(200)
            .Select(x => new
            {
                x.InventoryItemId,
                x.ItemCode,
                x.PrimaryUomCode,
                x.LongDescription
            })
            .ToListAsync();

        return Ok(new
        {
            customers,
            currencies,
            priceLists,
            collections,
            items
        });
    }

    // ============================================================
    // VALIDATION
    // ============================================================

    private static string? Validate(
        SaveSalesAgreementRequest request)
    {
        if (string.IsNullOrWhiteSpace(
            request.SaleAgreementName))
        {
            return "Phải nhập Chương trình.";
        }

        if (request.SaleAgreementName.Trim().Length > 250)
        {
            return "Chương trình tối đa 250 ký tự.";
        }

        if (request.TransactionalCurrCode?.Length > 20)
        {
            return "Mã tiền tệ tối đa 20 ký tự.";
        }

        if (
            request.StartDate.HasValue &&
            request.EndDate.HasValue &&
            request.StartDate > request.EndDate)
        {
            return
                "Ngày kết thúc Header phải sau ngày bắt đầu.";
        }

        if (
            request.Lines?.Any(x =>
                !x.InventoryItemId.HasValue ||
                (
                    x.StartDate.HasValue &&
                    x.EndDate.HasValue &&
                    x.StartDate > x.EndDate
                )) == true)
        {
            return
                "Mỗi dòng phải chọn mã hàng và ngày kết thúc không được trước ngày bắt đầu.";
        }

        var lineIds = request.Lines?
            .Where(x => x.LineId.HasValue)
            .Select(x => x.LineId!.Value)
            .ToList();

        if (lineIds?.Count !=
            lineIds?.Distinct().Count())
        {
            return "Line ID bị trùng.";
        }

        return null;
    }

    private async Task<string?> ValidateReferences(
        SaveSalesAgreementRequest request,
        long factoryId)
    {
        if (
            request.CustAccountId.HasValue &&
            !await _context.CustomerAccounts.AnyAsync(x =>
                x.CustAccountId ==
                    request.CustAccountId &&
                x.FactoryId == factoryId))
        {
            return "Khách hàng không hợp lệ.";
        }

        if (
            request.PriceListId.HasValue &&
            !await _context.PriceListHeaders.AnyAsync(x =>
                x.HeaderId ==
                    request.PriceListId &&
                x.FactoryId == factoryId))
        {
            return "Bảng giá không hợp lệ.";
        }

        if (
            request.CollectionHeaderId.HasValue &&
            !await _context.MaterialCollectionHeaders.AnyAsync(x =>
                x.CollectionHeaderId ==
                    request.CollectionHeaderId &&
                x.FactoryId == factoryId &&
                x.IsActive))
        {
            return "Bảng tập hợp NPL không hợp lệ.";
        }

        if (
            !string.IsNullOrWhiteSpace(
                request.TransactionalCurrCode) &&
            !await _context.Currencies.AnyAsync(x =>
                x.CurrencyCode ==
                request.TransactionalCurrCode.Trim()))
        {
            return "Đơn vị tiền tệ không hợp lệ.";
        }

        var ids = (request.Lines ?? new())
            .Select(x => x.InventoryItemId!.Value)
            .Distinct()
            .ToList();

        if (ids.Count !=
            (request.Lines?.Count ?? 0))
        {
            return
                "Mã hàng bị trùng trong cùng chương trình.";
        }

        if (ids.Count > 0)
        {
            var count =
                await _context.Items.CountAsync(x =>
                    ids.Contains(
                        x.InventoryItemId) &&
                    x.FactoryId == factoryId &&
                    x.ItemType ==
                        "Basic Finished Goods");

            if (count != ids.Count)
            {
                return
                    "Có mã hàng không hợp lệ hoặc không thuộc Basic Finished Goods.";
            }
        }

        return null;
    }

    // ============================================================
    // Mỗi mã hàng chỉ được thuộc một chương trình,
    // kể cả khi hai user lưu cùng lúc.
    // ============================================================

    private async Task<string?> ValidateItemAssignments(
        SaveSalesAgreementRequest request,
        long? currentHeaderId)
    {
        var ids = (request.Lines ?? new())
            .Where(x => x.InventoryItemId.HasValue)
            .Select(x => x.InventoryItemId!.Value)
            .ToList();

        if (ids.Count != ids.Distinct().Count())
        {
            return
                "Một mã hàng không được xuất hiện nhiều lần trong chương trình.";
        }

        var occupied =
            await _context.SalesAgreementLines
                .AsNoTracking()
                .AnyAsync(x =>
                    x.InventoryItemId.HasValue &&
                    ids.Contains(
                        x.InventoryItemId.Value) &&
                    (
                        !currentHeaderId.HasValue ||
                        x.HeaderId != currentHeaderId.Value
                    ));

        return occupied
            ? "Có mã hàng đã thuộc chương trình khác."
            : null;
    }

    // ============================================================
    // CREATE SALES AGREEMENT
    // ============================================================

    [HttpPost]
    public async Task<IActionResult> CreateSalesAgreement(
        [FromBody] SaveSalesAgreementRequest request)
    {
        var factoryId = _currentUser.FactoryId;
        var userId = _currentUser.UserId;

        if (
            factoryId == null ||
            factoryId.Value <= 0 ||
            userId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        var error = Validate(request);

        if (error != null)
        {
            return BadRequest(new
            {
                message = error
            });
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            error = await ValidateReferences(
                request,
                factoryId.Value);

            if (error != null)
            {
                return BadRequest(new
                {
                    message = error
                });
            }

            error = await ValidateItemAssignments(
                request,
                null);

            if (error != null)
            {
                return Conflict(new
                {
                    message = error
                });
            }

            var now = AppDateTime.Now;

            var header = new SalesAgreementHeader
            {
                SaleAgreementName =
                    request.SaleAgreementName.Trim(),

                CustAccountId =
                    request.CustAccountId,

                PriceListId =
                    request.PriceListId,

                CollectionHeaderId =
                    request.CollectionHeaderId,

                TransactionalCurrCode =
                    request.TransactionalCurrCode?.Trim(),

                StartDate =
                    request.StartDate,

                EndDate =
                    request.EndDate,

                FactoryId =
                    factoryId.Value,

                CreationDate =
                    now,

                LastUpdateDate =
                    now,

                CreatedBy =
                    userId.Value,

                LastUpdateBy =
                    userId.Value

                // SaleAgreementNumber:
                // PostgreSQL sequence tự sinh.
            };

            _context.SalesAgreementHeaders.Add(header);

            await _context.SaveChangesAsync();

            foreach (var line in request.Lines ?? new())
            {
                _context.SalesAgreementLines.Add(
                    new SalesAgreementLine
                    {
                        HeaderId =
                            header.HeaderId,

                        InventoryItemId =
                            line.InventoryItemId,

                        StartDate =
                            line.StartDate,

                        EndDate =
                            line.EndDate,

                        FactoryId =
                            factoryId.Value,

                        CreationDate =
                            now,

                        LastUpdateDate =
                            now,

                        CreatedBy =
                            userId.Value,

                        LastUpdateBy =
                            userId.Value
                    });
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return CreatedAtAction(
                nameof(GetSalesAgreement),
                new
                {
                    id = header.HeaderId
                },
                new
                {
                    headerId = header.HeaderId
                });
        }
        catch (DbUpdateException ex)
            when (
                ex.InnerException is PostgresException pg &&
                pg.SqlState ==
                    PostgresErrorCodes.UniqueViolation)
        {
            await transaction.RollbackAsync();

            return Conflict(new
            {
                message =
                    "Tên chương trình hoặc số SA đã tồn tại."
            });
        }
    }

    // ============================================================
    // UPDATE SALES AGREEMENT + SYNCHRONIZE LINES
    // ============================================================

    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateSalesAgreement(
        long id,
        [FromBody] SaveSalesAgreementRequest request)
    {
        var factoryId = _currentUser.FactoryId;
        var userId = _currentUser.UserId;

        if (
            factoryId == null ||
            factoryId.Value <= 0 ||
            userId == null)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được người dùng đăng nhập hoặc Factory."
            });
        }

        var error = Validate(request);

        if (error != null)
        {
            return BadRequest(new
            {
                message = error
            });
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        try
        {
            // ----------------------------------------------------
            // Header phải thuộc đúng Factory hiện tại
            // ----------------------------------------------------

            var header =
                await _context.SalesAgreementHeaders
                    .FirstOrDefaultAsync(x =>
                        x.HeaderId == id &&
                        x.FactoryId ==
                            factoryId.Value);

            if (header == null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy hợp đồng."
                });
            }

            error = await ValidateReferences(
                request,
                factoryId.Value);

            if (error != null)
            {
                return BadRequest(new
                {
                    message = error
                });
            }

            error = await ValidateItemAssignments(
                request,
                id);

            if (error != null)
            {
                return Conflict(new
                {
                    message = error
                });
            }

            var existingLines =
                await _context.SalesAgreementLines
                    .Where(x =>
                        x.HeaderId == id &&
                        x.FactoryId ==
                            factoryId.Value)
                    .ToListAsync();

            var existingIds =
                existingLines
                    .Select(x => x.LineId)
                    .ToHashSet();

            if (
                (request.Lines ?? new()).Any(x =>
                    x.LineId.HasValue &&
                    !existingIds.Contains(
                        x.LineId.Value)))
            {
                return BadRequest(new
                {
                    message =
                        "Có Line không thuộc hợp đồng hiện tại."
                });
            }

            var now = AppDateTime.Now;

            // ----------------------------------------------------
            // Chương trình và số SA
            // không được sửa sau khi tạo.
            // ----------------------------------------------------

            if (
                request.SaleAgreementName.Trim() !=
                header.SaleAgreementName)
            {
                return BadRequest(new
                {
                    message =
                        "Không được thay đổi tên Chương trình."
                });
            }

            header.CustAccountId =
                request.CustAccountId;

            header.PriceListId =
                request.PriceListId;

            header.CollectionHeaderId =
                request.CollectionHeaderId;

            header.TransactionalCurrCode =
                request.TransactionalCurrCode?.Trim();

            header.StartDate =
                request.StartDate;

            header.EndDate =
                request.EndDate;

            header.LastUpdateDate =
                now;

            header.LastUpdateBy =
                userId.Value;

            // Không thay đổi:
            // - SaleAgreementNumber
            // - FactoryId
            // - CreationDate
            // - CreatedBy

            var incoming =
                request.Lines ?? new();

            var keepIds =
                incoming
                    .Where(x => x.LineId.HasValue)
                    .Select(x => x.LineId!.Value)
                    .ToHashSet();

            _context.SalesAgreementLines.RemoveRange(
                existingLines.Where(x =>
                    !keepIds.Contains(x.LineId)));

            foreach (var line in incoming)
            {
                if (line.LineId.HasValue)
                {
                    var current =
                        existingLines.First(x =>
                            x.LineId ==
                            line.LineId.Value);

                    current.InventoryItemId =
                        line.InventoryItemId;

                    current.StartDate =
                        line.StartDate;

                    current.EndDate =
                        line.EndDate;

                    current.LastUpdateDate =
                        now;

                    current.LastUpdateBy =
                        userId.Value;
                }
                else
                {
                    _context.SalesAgreementLines.Add(
                        new SalesAgreementLine
                        {
                            HeaderId =
                                id,

                            InventoryItemId =
                                line.InventoryItemId,

                            StartDate =
                                line.StartDate,

                            EndDate =
                                line.EndDate,

                            FactoryId =
                                factoryId.Value,

                            CreationDate =
                                now,

                            LastUpdateDate =
                                now,

                            CreatedBy =
                                userId.Value,

                            LastUpdateBy =
                                userId.Value
                        });
                }
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new
            {
                message =
                    "Cập nhật hợp đồng thành công.",

                headerId = id
            });
        }
        catch (DbUpdateException ex)
            when (
                ex.InnerException is PostgresException pg &&
                pg.SqlState ==
                    PostgresErrorCodes.UniqueViolation)
        {
            await transaction.RollbackAsync();

            return Conflict(new
            {
                message =
                    "Tên chương trình đã tồn tại trong nhà máy này."
            });
        }
    }

    // ============================================================
    // DELETE SALES AGREEMENT
    // ============================================================

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteSalesAgreement(
        long id)
    {
        var factoryId = _currentUser.FactoryId;

        if (
            factoryId == null ||
            factoryId.Value <= 0)
        {
            return Unauthorized(new
            {
                message =
                    "Không xác định được Factory của tài khoản."
            });
        }

        await using var transaction =
            await _context.Database
                .BeginTransactionAsync();

        var header =
            await _context.SalesAgreementHeaders
                .FirstOrDefaultAsync(x =>
                    x.HeaderId == id &&
                    x.FactoryId ==
                        factoryId.Value);

        if (header == null)
        {
            return NotFound(new
            {
                message =
                    "Không tìm thấy hợp đồng."
            });
        }

        var lines =
            await _context.SalesAgreementLines
                .Where(x =>
                    x.HeaderId == id &&
                    x.FactoryId ==
                        factoryId.Value)
                .ToListAsync();

        _context.SalesAgreementLines
            .RemoveRange(lines);

        _context.SalesAgreementHeaders
            .Remove(header);

        await _context.SaveChangesAsync();

        await transaction.CommitAsync();

        return NoContent();
    }
}

// ============================================================
// REQUEST MODELS
// ============================================================

public class SaveSalesAgreementRequest
{
    public string SaleAgreementName { get; set; } = "";

    public long? CustAccountId { get; set; }

    public long? PriceListId { get; set; }

    public long? CollectionHeaderId { get; set; }

    public string? TransactionalCurrCode { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public List<SaveSalesAgreementLineRequest>? Lines { get; set; }
}

public class SaveSalesAgreementLineRequest
{
    public long? LineId { get; set; }

    public long? InventoryItemId { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }
}
