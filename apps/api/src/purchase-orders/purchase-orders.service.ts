import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PurchaseOrderStatus as PrismaPurchaseOrderStatus,
} from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import {
  CreatePurchaseOrderDto,
  CreatePurchaseOrderLineItemDto,
} from './dto/create-purchase-order.dto';
import { FindGoodsReceiptsQueryDto } from './dto/find-goods-receipts-query.dto';
import { FindPurchaseOrdersQueryDto } from './dto/find-purchase-orders-query.dto';
import { PurchaseOrderSortBy } from './dto/purchase-order-sort.enum';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

type PermissionAction = 'View' | 'Create' | 'Edit' | 'Delete';
type RolePermissionMap = Record<string, Record<string, boolean>>;

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  private readonly purchaseOrderInclude = {
    supplier: {
      select: {
        id: true,
        companyName: true,
      },
    },
    deliveryLocation: {
      select: {
        id: true,
        name: true,
      },
    },
    createdBy: {
      select: {
        id: true,
        name: true,
      },
    },
    approvedBy: {
      select: {
        id: true,
        name: true,
      },
    },
    lineItems: {
      include: {
        supplierProduct: {
          select: {
            id: true,
            productName: true,
            sku: true,
            brand: true,
          },
        },
        inventoryItem: {
          select: {
            id: true,
            name: true,
            sku: true,
            active: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
  } as const;

  private readonly goodsReceiptInclude = {
    purchaseOrder: {
      select: {
        id: true,
        purchaseOrderNumber: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    },
    storageLocation: {
      select: {
        id: true,
        name: true,
      },
    },
    receivedBy: {
      select: {
        id: true,
        name: true,
      },
    },
    lines: {
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc' as const,
      },
    },
  } as const;

  async create(userId: string, dto: CreatePurchaseOrderDto) {
    return this.prisma.$transaction((tx) =>
      this.createWithDatabaseClient(tx, userId, dto),
    );
  }

  async createInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    return this.createWithDatabaseClient(tx, userId, dto);
  }

  private async createWithDatabaseClient(
    db: Prisma.TransactionClient | PrismaService,
    userId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    await this.ensureOrganizationPermission(
      userId,
      dto.organizationId,
      'Create',
      db,
    );
    await this.ensureSupplierOwnership(
      dto.supplierId,
      dto.organizationId,
      true,
      db,
    );
    await this.ensureLocationOwnership(
      dto.deliveryLocationId,
      dto.organizationId,
      true,
      db,
    );

    const normalizedLines = await this.prepareLineItems(
      dto.organizationId,
      dto.supplierId,
      dto.lineItems,
      db,
    );
    const totals = this.calculateOrderTotals(normalizedLines);

    const created = await db.purchaseOrder.create({
      data: {
        organizationId: dto.organizationId,
        purchaseOrderNumber: dto.purchaseOrderNumber.trim(),
        supplierId: dto.supplierId,
        orderDate: new Date(dto.orderDate),
        quotationDate: dto.quotationDate ? new Date(dto.quotationDate) : null,
        validUntilDate: dto.validUntilDate
          ? new Date(dto.validUntilDate)
          : null,
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : null,
        deliveryLocationId: dto.deliveryLocationId,
        status: PrismaPurchaseOrderStatus.Draft,
        currency: (dto.currency ?? 'ZAR').trim().toUpperCase(),
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        deliveryFee: dto.deliveryFee ?? 0,
        totalAmount: this.round2(totals.totalAmount + (dto.deliveryFee ?? 0)),
        supplierReference: this.normalizeNullable(dto.supplierReference),
        internalReference: this.normalizeNullable(dto.internalReference),
        paymentTerms: this.normalizeNullable(dto.paymentTerms),
        deliveryAddress: this.normalizeNullable(dto.deliveryAddress),
        eventReference: this.normalizeNullable(dto.eventReference),
        notes: this.normalizeNullable(dto.notes),
        createdByUserId: userId,
        lineItems: {
          create: normalizedLines.map((line) => ({
            supplierProductId: line.supplierProductId,
            inventoryItemId: line.inventoryItemId,
            productNameSnapshot: line.productNameSnapshot,
            productSkuSnapshot: line.productSkuSnapshot,
            productBrandSnapshot: line.productBrandSnapshot,
            productCostSnapshot: line.productCostSnapshot,
            productVatSnapshot: line.productVatSnapshot,
            quantityOrdered: line.quantityOrdered,
            quantityReceived: 0,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            discountRate: line.discountRate,
            lineSubtotal: line.lineSubtotal,
            lineDiscount: line.lineDiscount,
            lineTax: line.lineTax,
            lineTotal: line.lineTotal,
            notes: line.notes,
          })),
        },
      },
      include: this.purchaseOrderInclude,
    });

    return this.mapPurchaseOrder(created);
  }

  async findAll(userId: string, query: FindPurchaseOrdersQueryDto) {
    await this.ensureOrganizationPermission(
      userId,
      query.organizationId,
      'View',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.PurchaseOrderWhereInput = {
      organizationId: query.organizationId,
      archivedAt: null,
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                purchaseOrderNumber: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                supplier: {
                  companyName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                supplierReference: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                internalReference: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.orderDateFrom || query.orderDateTo
        ? {
            orderDate: {
              ...(query.orderDateFrom
                ? { gte: new Date(query.orderDateFrom) }
                : {}),
              ...(query.orderDateTo
                ? { lte: new Date(query.orderDateTo) }
                : {}),
            },
          }
        : {}),
      ...(query.expectedDeliveryFrom || query.expectedDeliveryTo
        ? {
            expectedDeliveryDate: {
              ...(query.expectedDeliveryFrom
                ? { gte: new Date(query.expectedDeliveryFrom) }
                : {}),
              ...(query.expectedDeliveryTo
                ? { lte: new Date(query.expectedDeliveryTo) }
                : {}),
            },
          }
        : {}),
      ...(query.overdueOnly
        ? {
            status: {
              in: [
                PrismaPurchaseOrderStatus.PendingApproval,
                PrismaPurchaseOrderStatus.Approved,
                PrismaPurchaseOrderStatus.Sent,
                PrismaPurchaseOrderStatus.PartiallyReceived,
              ],
            },
            expectedDeliveryDate: {
              lt: new Date(),
            },
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        include: this.purchaseOrderInclude,
        orderBy: this.resolvePurchaseOrderSort(
          query.sortBy ?? PurchaseOrderSortBy.Newest,
        ),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapPurchaseOrder(row)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findOne(userId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: this.purchaseOrderInclude,
    });

    if (!po) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(userId, po.organizationId, 'View');
    return this.mapPurchaseOrder(po);
  }

  async updateDraft(userId: string, id: string, dto: UpdatePurchaseOrderDto) {
    const current = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        lineItems: true,
      },
    });

    if (!current) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      current.organizationId,
      'Edit',
    );

    if (current.status !== PrismaPurchaseOrderStatus.Draft) {
      throw new BadRequestException('Only draft purchase orders may be edited');
    }

    if (current.archivedAt) {
      throw new BadRequestException(
        'Archived purchase orders cannot be edited',
      );
    }

    const supplierId = dto.supplierId ?? current.supplierId;

    if (dto.supplierId) {
      await this.ensureSupplierOwnership(
        dto.supplierId,
        current.organizationId,
        true,
      );
    }

    if (dto.deliveryLocationId) {
      await this.ensureLocationOwnership(
        dto.deliveryLocationId,
        current.organizationId,
        true,
      );
    }

    let lineItemsPayload: Array<{
      supplierProductId: string;
      inventoryItemId: string | null;
      productNameSnapshot: string;
      productSkuSnapshot: string | null;
      productBrandSnapshot: string | null;
      productCostSnapshot: number;
      productVatSnapshot: number | null;
      quantityOrdered: number;
      unitPrice: number;
      taxRate: number;
      discountRate: number;
      lineSubtotal: number;
      lineDiscount: number;
      lineTax: number;
      lineTotal: number;
      notes: string | null;
    }> | null = null;

    if (dto.lineItems) {
      lineItemsPayload = await this.prepareLineItems(
        current.organizationId,
        supplierId,
        dto.lineItems,
      );
    }

    const totals = this.calculateOrderTotals(
      lineItemsPayload ??
        current.lineItems.map((line) => ({
          lineSubtotal: line.lineSubtotal,
          lineDiscount: line.lineDiscount,
          lineTax: line.lineTax,
          lineTotal: line.lineTotal,
        })),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      if (lineItemsPayload) {
        await tx.purchaseOrderLineItem.deleteMany({
          where: {
            purchaseOrderId: current.id,
          },
        });
      }

      const row = await tx.purchaseOrder.update({
        where: { id: current.id },
        data: {
          purchaseOrderNumber:
            dto.purchaseOrderNumber === undefined
              ? undefined
              : dto.purchaseOrderNumber.trim(),
          supplierId: dto.supplierId,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : undefined,
          quotationDate:
            dto.quotationDate === undefined
              ? undefined
              : dto.quotationDate
                ? new Date(dto.quotationDate)
                : null,
          validUntilDate:
            dto.validUntilDate === undefined
              ? undefined
              : dto.validUntilDate
                ? new Date(dto.validUntilDate)
                : null,
          expectedDeliveryDate:
            dto.expectedDeliveryDate === undefined
              ? undefined
              : dto.expectedDeliveryDate
                ? new Date(dto.expectedDeliveryDate)
                : null,
          deliveryLocationId: dto.deliveryLocationId,
          currency:
            dto.currency === undefined
              ? undefined
              : dto.currency.trim().toUpperCase(),
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          deliveryFee: dto.deliveryFee,
          totalAmount: this.round2(
            totals.totalAmount + (dto.deliveryFee ?? current.deliveryFee),
          ),
          supplierReference:
            dto.supplierReference === undefined
              ? undefined
              : this.normalizeNullable(dto.supplierReference),
          internalReference:
            dto.internalReference === undefined
              ? undefined
              : this.normalizeNullable(dto.internalReference),
          paymentTerms:
            dto.paymentTerms === undefined
              ? undefined
              : this.normalizeNullable(dto.paymentTerms),
          deliveryAddress:
            dto.deliveryAddress === undefined
              ? undefined
              : this.normalizeNullable(dto.deliveryAddress),
          eventReference:
            dto.eventReference === undefined
              ? undefined
              : this.normalizeNullable(dto.eventReference),
          notes:
            dto.notes === undefined
              ? undefined
              : this.normalizeNullable(dto.notes),
          lineItems: lineItemsPayload
            ? {
                create: lineItemsPayload.map((line) => ({
                  supplierProductId: line.supplierProductId,
                  inventoryItemId: line.inventoryItemId,
                  productNameSnapshot: line.productNameSnapshot,
                  productSkuSnapshot: line.productSkuSnapshot,
                  productBrandSnapshot: line.productBrandSnapshot,
                  productCostSnapshot: line.productCostSnapshot,
                  productVatSnapshot: line.productVatSnapshot,
                  quantityOrdered: line.quantityOrdered,
                  quantityReceived: 0,
                  unitPrice: line.unitPrice,
                  taxRate: line.taxRate,
                  discountRate: line.discountRate,
                  lineSubtotal: line.lineSubtotal,
                  lineDiscount: line.lineDiscount,
                  lineTax: line.lineTax,
                  lineTotal: line.lineTotal,
                  notes: line.notes,
                })),
              }
            : undefined,
        },
        include: this.purchaseOrderInclude,
      });

      return row;
    });

    return this.mapPurchaseOrder(updated);
  }

  async archive(userId: string, id: string) {
    const po = await this.findPurchaseOrderForTransition(userId, id, 'Edit');

    if (po.archivedAt) {
      throw new BadRequestException('Purchase order is already archived');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        archivedAt: new Date(),
      },
      include: this.purchaseOrderInclude,
    });

    return this.mapPurchaseOrder(updated);
  }

  async restore(userId: string, id: string) {
    const po = await this.findPurchaseOrderForTransition(userId, id, 'Edit');

    if (!po.archivedAt) {
      throw new BadRequestException('Purchase order is not archived');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        archivedAt: null,
      },
      include: this.purchaseOrderInclude,
    });

    return this.mapPurchaseOrder(updated);
  }

  async delete(userId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        goodsReceipts: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }

    await this.ensureAdminPermission(userId, po.organizationId);

    if (po.goodsReceipts.length > 0) {
      throw new BadRequestException(
        'Purchase order with receipts cannot be deleted',
      );
    }

    await this.prisma.purchaseOrder.delete({
      where: { id: po.id },
    });
  }

  async submitForApproval(userId: string, id: string) {
    const po = await this.findPurchaseOrderForTransition(userId, id, 'Edit');

    if (po.status !== PrismaPurchaseOrderStatus.Draft) {
      throw new BadRequestException(
        'Only draft purchase orders may be submitted for approval',
      );
    }

    if (po.archivedAt) {
      throw new BadRequestException(
        'Archived purchase orders cannot be submitted',
      );
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: PrismaPurchaseOrderStatus.PendingApproval,
      },
      include: this.purchaseOrderInclude,
    });

    return this.mapPurchaseOrder(updated);
  }

  async approve(userId: string, id: string) {
    const po = await this.findPurchaseOrderForTransition(userId, id, 'Edit');

    if (po.status !== PrismaPurchaseOrderStatus.PendingApproval) {
      throw new BadRequestException(
        'Only pending approval purchase orders may be approved',
      );
    }

    if (po.archivedAt) {
      throw new BadRequestException(
        'Archived purchase orders cannot be approved',
      );
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: PrismaPurchaseOrderStatus.Approved,
        approvedByUserId: userId,
        approvedAt: new Date(),
      },
      include: this.purchaseOrderInclude,
    });

    return this.mapPurchaseOrder(updated);
  }

  async returnToDraft(userId: string, id: string) {
    const po = await this.findPurchaseOrderForTransition(userId, id, 'Edit');

    if (po.status !== PrismaPurchaseOrderStatus.PendingApproval) {
      throw new BadRequestException(
        'Only pending approval purchase orders may be returned to draft',
      );
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: PrismaPurchaseOrderStatus.Draft,
        approvedByUserId: null,
        approvedAt: null,
      },
      include: this.purchaseOrderInclude,
    });

    return this.mapPurchaseOrder(updated);
  }

  async markSent(userId: string, id: string) {
    const po = await this.findPurchaseOrderForTransition(userId, id, 'Edit');

    if (po.status !== PrismaPurchaseOrderStatus.Approved) {
      throw new BadRequestException(
        'Only approved purchase orders may be marked as sent',
      );
    }

    if (po.archivedAt) {
      throw new BadRequestException('Archived purchase orders cannot be sent');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: PrismaPurchaseOrderStatus.Sent,
        sentAt: new Date(),
      },
      include: this.purchaseOrderInclude,
    });

    return this.mapPurchaseOrder(updated);
  }

  async cancel(userId: string, id: string) {
    const po = await this.findPurchaseOrderForTransition(userId, id, 'Delete');

    if (po.status === PrismaPurchaseOrderStatus.FullyReceived) {
      throw new BadRequestException(
        'Fully received purchase orders cannot be cancelled',
      );
    }

    if (po.status === PrismaPurchaseOrderStatus.Cancelled) {
      throw new BadRequestException('Purchase order is already cancelled');
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: PrismaPurchaseOrderStatus.Cancelled,
        cancelledAt: new Date(),
      },
      include: this.purchaseOrderInclude,
    });

    return this.mapPurchaseOrder(updated);
  }

  async createGoodsReceipt(userId: string, dto: CreateGoodsReceiptDto) {
    await this.ensureOrganizationPermission(
      userId,
      dto.organizationId,
      'Create',
    );

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
        include: {
          supplier: true,
          deliveryLocation: true,
          lineItems: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  organizationId: true,
                  active: true,
                },
              },
            },
          },
        },
      });

      if (!po || po.organizationId !== dto.organizationId) {
        throw new ForbiddenException(
          'Purchase order is outside this organization',
        );
      }

      if (po.archivedAt) {
        throw new BadRequestException(
          'Archived purchase orders may not be received',
        );
      }

      if (po.status === PrismaPurchaseOrderStatus.Cancelled) {
        throw new BadRequestException(
          'Cancelled purchase orders may not be received',
        );
      }

      if (po.status === PrismaPurchaseOrderStatus.FullyReceived) {
        throw new BadRequestException(
          'Fully received purchase orders may not receive additional quantities',
        );
      }

      await this.ensureLocationOwnership(
        dto.storageLocationId,
        dto.organizationId,
        true,
        tx,
      );

      const lineMap = new Map(po.lineItems.map((line) => [line.id, line]));
      const receiptLines: Array<{
        purchaseOrderLineItemId: string;
        inventoryItemId: string;
        quantityReceived: number;
        quantityAccepted: number;
        quantityDamaged: number;
        notes: string | null;
      }> = [];

      for (const line of dto.lines) {
        const poLine = lineMap.get(line.purchaseOrderLineItemId);

        if (!poLine) {
          throw new BadRequestException(
            'Receipt line references purchase-order line outside this purchase order',
          );
        }

        if (!poLine.inventoryItemId) {
          throw new BadRequestException(
            'Purchase-order line is not linked to an inventory item',
          );
        }

        if (poLine.inventoryItemId !== line.inventoryItemId) {
          throw new BadRequestException(
            'Receipt line inventory item does not match purchase-order line',
          );
        }

        if (line.quantityDamaged > line.quantityReceived) {
          throw new BadRequestException(
            'Damaged quantity must not exceed received quantity',
          );
        }

        if (
          Math.abs(
            line.quantityAccepted +
              line.quantityDamaged -
              line.quantityReceived,
          ) > 0.0001
        ) {
          throw new BadRequestException(
            'Accepted quantity plus damaged quantity must equal received quantity',
          );
        }

        const outstanding = poLine.quantityOrdered - poLine.quantityReceived;
        if (line.quantityReceived > outstanding + 0.0001) {
          throw new BadRequestException(
            'Received quantity exceeds outstanding quantity on purchase-order line',
          );
        }

        receiptLines.push({
          purchaseOrderLineItemId: line.purchaseOrderLineItemId,
          inventoryItemId: line.inventoryItemId,
          quantityReceived: line.quantityReceived,
          quantityAccepted: line.quantityAccepted,
          quantityDamaged: line.quantityDamaged,
          notes: this.normalizeNullable(line.notes),
        });
      }

      const receiptNumber =
        dto.receiptNumber?.trim() || this.generateReceiptNumber();

      const createdReceipt = await tx.goodsReceipt.create({
        data: {
          organizationId: dto.organizationId,
          purchaseOrderId: po.id,
          receiptNumber,
          receivedDate: new Date(dto.receivedDate),
          storageLocationId: dto.storageLocationId,
          supplierDeliveryNote: this.normalizeNullable(
            dto.supplierDeliveryNote,
          ),
          receivedByUserId: userId,
          notes: this.normalizeNullable(dto.notes),
          lines: {
            create: receiptLines.map((line) => ({
              purchaseOrderLineItemId: line.purchaseOrderLineItemId,
              inventoryItemId: line.inventoryItemId,
              quantityReceived: line.quantityReceived,
              quantityAccepted: line.quantityAccepted,
              quantityDamaged: line.quantityDamaged,
              notes: line.notes,
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      for (const line of receiptLines) {
        await tx.purchaseOrderLineItem.update({
          where: {
            id: line.purchaseOrderLineItemId,
          },
          data: {
            quantityReceived: {
              increment: line.quantityReceived,
            },
          },
        });

        await this.inventoryService.applyGoodsReceiptMovements(tx, userId, {
          organizationId: dto.organizationId,
          purchaseOrderNumber: po.purchaseOrderNumber,
          goodsReceiptNumber: createdReceipt.receiptNumber,
          inventoryItemId: line.inventoryItemId,
          storageLocationId: dto.storageLocationId,
          quantityAccepted: line.quantityAccepted,
          quantityDamaged: line.quantityDamaged,
          notes: line.notes,
        });
      }

      const refreshedLines = await tx.purchaseOrderLineItem.findMany({
        where: {
          purchaseOrderId: po.id,
        },
      });

      const allReceived = refreshedLines.every(
        (line) => line.quantityReceived >= line.quantityOrdered,
      );
      const anyReceived = refreshedLines.some(
        (line) => line.quantityReceived > 0,
      );

      const nextStatus: PrismaPurchaseOrderStatus = allReceived
        ? PrismaPurchaseOrderStatus.FullyReceived
        : anyReceived
          ? PrismaPurchaseOrderStatus.PartiallyReceived
          : po.status;

      if (nextStatus !== po.status) {
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: {
            status: nextStatus,
          },
        });
      }

      const receipt = await tx.goodsReceipt.findUnique({
        where: {
          id: createdReceipt.id,
        },
        include: this.goodsReceiptInclude,
      });

      if (!receipt) {
        throw new NotFoundException(
          'Goods receipt could not be loaded after creation',
        );
      }

      return this.mapGoodsReceipt(receipt);
    });
  }

  async listGoodsReceipts(userId: string, query: FindGoodsReceiptsQueryDto) {
    await this.ensureOrganizationPermission(
      userId,
      query.organizationId,
      'View',
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.GoodsReceiptWhereInput = {
      organizationId: query.organizationId,
      ...(query.purchaseOrderId
        ? { purchaseOrderId: query.purchaseOrderId }
        : {}),
      ...(query.supplierId
        ? {
            purchaseOrder: {
              supplierId: query.supplierId,
            },
          }
        : {}),
      ...(query.receivedDateFrom || query.receivedDateTo
        ? {
            receivedDate: {
              ...(query.receivedDateFrom
                ? { gte: new Date(query.receivedDateFrom) }
                : {}),
              ...(query.receivedDateTo
                ? { lte: new Date(query.receivedDateTo) }
                : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                receiptNumber: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                supplierDeliveryNote: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                purchaseOrder: {
                  purchaseOrderNumber: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.goodsReceipt.findMany({
        where,
        include: this.goodsReceiptInclude,
        orderBy: { receivedDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.goodsReceipt.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapGoodsReceipt(row)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findGoodsReceipt(userId: string, id: string) {
    const receipt = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: this.goodsReceiptInclude,
    });

    if (!receipt) {
      throw new NotFoundException(`Goods receipt with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(
      userId,
      receipt.organizationId,
      'View',
    );
    return this.mapGoodsReceipt(receipt);
  }

  async listPurchaseOrderReceipts(userId: string, purchaseOrderId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!po) {
      throw new NotFoundException(
        `Purchase order with id ${purchaseOrderId} not found`,
      );
    }

    await this.ensureOrganizationPermission(userId, po.organizationId, 'View');

    const rows = await this.prisma.goodsReceipt.findMany({
      where: {
        purchaseOrderId,
      },
      include: this.goodsReceiptInclude,
      orderBy: { receivedDate: 'desc' },
    });

    return rows.map((row) => this.mapGoodsReceipt(row));
  }

  async getOutstanding(userId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: this.purchaseOrderInclude,
    });

    if (!po) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(userId, po.organizationId, 'View');

    return {
      purchaseOrderId: po.id,
      purchaseOrderNumber: po.purchaseOrderNumber,
      status: po.status,
      lines: po.lineItems
        .filter((line) => Boolean(line.inventoryItemId && line.inventoryItem))
        .map((line) => ({
          purchaseOrderLineItemId: line.id,
          inventoryItemId: line.inventoryItemId as string,
          inventoryItemName: line.inventoryItem?.name ?? 'Unlinked item',
          quantityOrdered: line.quantityOrdered,
          quantityReceived: line.quantityReceived,
          quantityOutstanding: Math.max(
            0,
            line.quantityOrdered - line.quantityReceived,
          ),
        })),
    };
  }

  async getSupplierHistory(
    userId: string,
    organizationId: string,
    supplierId: string,
  ) {
    await this.ensureOrganizationPermission(userId, organizationId, 'View');
    await this.ensureSupplierOwnership(supplierId, organizationId, false);

    const [supplier, orders, openCount, recentReceipts] = await Promise.all([
      this.prisma.supplier.findUnique({
        where: { id: supplierId },
        select: {
          id: true,
          companyName: true,
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: {
          organizationId,
          supplierId,
        },
        include: this.purchaseOrderInclude,
        orderBy: {
          orderDate: 'desc',
        },
      }),
      this.prisma.purchaseOrder.count({
        where: {
          organizationId,
          supplierId,
          status: {
            in: [
              PrismaPurchaseOrderStatus.PendingApproval,
              PrismaPurchaseOrderStatus.Approved,
              PrismaPurchaseOrderStatus.Sent,
              PrismaPurchaseOrderStatus.PartiallyReceived,
            ],
          },
        },
      }),
      this.prisma.goodsReceipt.findMany({
        where: {
          organizationId,
          purchaseOrder: {
            supplierId,
          },
        },
        include: this.goodsReceiptInclude,
        orderBy: {
          receivedDate: 'desc',
        },
        take: 10,
      }),
    ]);

    const totalOrderValue = orders.reduce(
      (sum, row) => sum + row.totalAmount,
      0,
    );
    const outstandingDeliveries = orders.reduce((sum, row) => {
      const outstanding = row.lineItems.reduce(
        (lineSum, line) =>
          lineSum + Math.max(0, line.quantityOrdered - line.quantityReceived),
        0,
      );
      return sum + outstanding;
    }, 0);

    return {
      supplierId,
      supplierName: supplier?.companyName ?? null,
      totalOrderValue,
      openPurchaseOrders: openCount,
      outstandingDeliveries,
      purchaseOrders: orders.map((row) => this.mapPurchaseOrder(row)),
      recentReceipts: recentReceipts.map((row) => this.mapGoodsReceipt(row)),
    };
  }

  private resolvePurchaseOrderSort(sortBy: PurchaseOrderSortBy) {
    if (sortBy === PurchaseOrderSortBy.Oldest) {
      return [{ orderDate: 'asc' as const }];
    }

    if (sortBy === PurchaseOrderSortBy.Number) {
      return [{ purchaseOrderNumber: 'asc' as const }];
    }

    if (sortBy === PurchaseOrderSortBy.Supplier) {
      return [{ supplier: { companyName: 'asc' as const } }];
    }

    if (sortBy === PurchaseOrderSortBy.ExpectedDelivery) {
      return [{ expectedDeliveryDate: 'asc' as const }];
    }

    return [{ orderDate: 'desc' as const }];
  }

  private async prepareLineItems(
    organizationId: string,
    supplierId: string,
    lineItems: CreatePurchaseOrderLineItemDto[],
    db?: Prisma.TransactionClient | PrismaService,
  ) {
    const client = db ?? this.prisma;
    const seen = new Set<string>();

    const ids = lineItems.map((line) => line.supplierProductId);
    const supplierProducts = await client.supplierProduct.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        organizationId: true,
        supplierId: true,
        active: true,
        productName: true,
        sku: true,
        brand: true,
        costPrice: true,
        vatPercent: true,
      },
    });

    const productsById = new Map(
      supplierProducts.map((item) => [item.id, item]),
    );

    const productSkus = supplierProducts
      .map((product) => product.sku?.trim())
      .filter((value): value is string => Boolean(value));

    const inventoryBySku = new Map<string, { id: string }>();
    if (productSkus.length > 0) {
      const inventoryMatches = await client.inventoryItem.findMany({
        where: {
          organizationId,
          active: true,
          sku: {
            in: productSkus,
          },
        },
        select: {
          id: true,
          sku: true,
        },
      });

      for (const item of inventoryMatches) {
        const key = item.sku.trim().toLowerCase();
        if (!inventoryBySku.has(key)) {
          inventoryBySku.set(key, { id: item.id });
        }
      }
    }

    return lineItems.map((line) => {
      if (seen.has(line.supplierProductId)) {
        throw new BadRequestException(
          'Duplicate supplier products are not allowed on purchase order',
        );
      }
      seen.add(line.supplierProductId);

      const product = productsById.get(line.supplierProductId);
      if (!product || product.organizationId !== organizationId) {
        throw new ForbiddenException(
          'Supplier product is outside this organization',
        );
      }

      if (product.supplierId !== supplierId) {
        throw new BadRequestException(
          'Supplier product does not belong to the selected supplier',
        );
      }

      if (!product.active) {
        throw new BadRequestException(
          'Only active supplier products may be ordered',
        );
      }

      const quantityOrdered = line.quantity;
      const unitPrice = line.unitCost;
      const taxRate = line.vatPercent ?? product.vatPercent ?? 0;
      const discountRate = line.discountPercent ?? 0;

      const lineSubtotal = this.round2(quantityOrdered * unitPrice);
      const lineDiscount = this.round2((lineSubtotal * discountRate) / 100);
      const taxableBase = this.round2(lineSubtotal - lineDiscount);
      const lineTax = this.round2((taxableBase * taxRate) / 100);
      const lineTotal = this.round2(taxableBase + lineTax);

      const inventoryItemId = product.sku
        ? (inventoryBySku.get(product.sku.trim().toLowerCase())?.id ?? null)
        : null;

      return {
        supplierProductId: product.id,
        inventoryItemId,
        productNameSnapshot: product.productName,
        productSkuSnapshot: product.sku,
        productBrandSnapshot: product.brand,
        productCostSnapshot: product.costPrice,
        productVatSnapshot: product.vatPercent,
        quantityOrdered,
        unitPrice,
        taxRate,
        discountRate,
        lineSubtotal,
        lineDiscount,
        lineTax,
        lineTotal,
        notes: this.normalizeNullable(line.notes),
      };
    });
  }

  private calculateOrderTotals(
    lines: Array<{
      lineSubtotal: number;
      lineDiscount: number;
      lineTax: number;
      lineTotal: number;
    }>,
  ) {
    const subtotal = this.round2(
      lines.reduce((sum, line) => sum + line.lineSubtotal, 0),
    );
    const discountAmount = this.round2(
      lines.reduce((sum, line) => sum + line.lineDiscount, 0),
    );
    const taxAmount = this.round2(
      lines.reduce((sum, line) => sum + line.lineTax, 0),
    );
    const totalAmount = this.round2(
      lines.reduce((sum, line) => sum + line.lineTotal, 0),
    );

    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    };
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }

  private normalizeNullable(value: string | null | undefined) {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }

  private mapPurchaseOrder(po: {
    id: string;
    organizationId: string;
    purchaseOrderNumber: string;
    supplierId: string;
    orderDate: Date;
    quotationDate: Date | null;
    validUntilDate: Date | null;
    expectedDeliveryDate: Date | null;
    deliveryLocationId: string;
    status: PrismaPurchaseOrderStatus;
    currency: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    deliveryFee: number;
    totalAmount: number;
    supplierReference: string | null;
    internalReference: string | null;
    paymentTerms: string | null;
    deliveryAddress: string | null;
    eventReference: string | null;
    notes: string | null;
    createdByUserId: string;
    approvedByUserId: string | null;
    approvedAt: Date | null;
    sentAt: Date | null;
    cancelledAt: Date | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    supplier: { id: string; companyName: string };
    deliveryLocation: { id: string; name: string };
    createdBy: { id: string; name: string | null };
    approvedBy: { id: string; name: string | null } | null;
    lineItems: Array<{
      id: string;
      purchaseOrderId: string;
      supplierProductId: string;
      inventoryItemId: string | null;
      productNameSnapshot: string;
      productSkuSnapshot: string | null;
      productBrandSnapshot: string | null;
      productCostSnapshot: number;
      productVatSnapshot: number | null;
      quantityOrdered: number;
      quantityReceived: number;
      unitPrice: number;
      taxRate: number;
      discountRate: number;
      lineSubtotal: number;
      lineDiscount: number;
      lineTax: number;
      lineTotal: number;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      supplierProduct: {
        id: string;
        productName: string;
        sku: string | null;
        brand: string | null;
      };
      inventoryItem: {
        id: string;
        name: string;
        sku: string;
        active: boolean;
      } | null;
    }>;
  }) {
    const ordered = po.lineItems.reduce(
      (sum, line) => sum + line.quantityOrdered,
      0,
    );
    const received = po.lineItems.reduce(
      (sum, line) => sum + line.quantityReceived,
      0,
    );

    const receivedPercent =
      ordered <= 0 ? 0 : Math.min(100, this.round2((received / ordered) * 100));

    return {
      id: po.id,
      organizationId: po.organizationId,
      purchaseOrderNumber: po.purchaseOrderNumber,
      supplierId: po.supplierId,
      supplierName: po.supplier.companyName,
      orderDate: po.orderDate,
      quotationDate: po.quotationDate,
      validUntilDate: po.validUntilDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      deliveryLocationId: po.deliveryLocationId,
      deliveryLocationName: po.deliveryLocation.name,
      status: po.status,
      currency: po.currency,
      subtotal: po.subtotal,
      taxAmount: po.taxAmount,
      discountAmount: po.discountAmount,
      deliveryFee: po.deliveryFee,
      totalAmount: po.totalAmount,
      supplierReference: po.supplierReference,
      internalReference: po.internalReference,
      paymentTerms: po.paymentTerms,
      deliveryAddress: po.deliveryAddress,
      eventReference: po.eventReference,
      notes: po.notes,
      createdByUserId: po.createdByUserId,
      createdByUserName: po.createdBy.name,
      approvedByUserId: po.approvedByUserId,
      approvedByUserName: po.approvedBy?.name ?? null,
      approvedAt: po.approvedAt,
      sentAt: po.sentAt,
      cancelledAt: po.cancelledAt,
      archivedAt: po.archivedAt,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      receivedPercent,
      lineItems: po.lineItems.map((line) => ({
        id: line.id,
        purchaseOrderId: line.purchaseOrderId,
        supplierProductId: line.supplierProductId,
        supplierProductName: line.productNameSnapshot,
        supplierProductSku: line.productSkuSnapshot,
        supplierProductBrand: line.productBrandSnapshot,
        inventoryItemId: line.inventoryItemId,
        inventoryItemName: line.inventoryItem?.name ?? null,
        inventoryItemSku: line.inventoryItem?.sku ?? null,
        quantityOrdered: line.quantityOrdered,
        quantityReceived: line.quantityReceived,
        quantityOutstanding: Math.max(
          0,
          line.quantityOrdered - line.quantityReceived,
        ),
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        discountRate: line.discountRate,
        lineSubtotal: line.lineSubtotal,
        lineDiscount: line.lineDiscount,
        lineTax: line.lineTax,
        lineTotal: line.lineTotal,
        notes: line.notes,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
      })),
    };
  }

  private mapGoodsReceipt(receipt: {
    id: string;
    organizationId: string;
    purchaseOrderId: string;
    receiptNumber: string;
    receivedDate: Date;
    storageLocationId: string;
    supplierDeliveryNote: string | null;
    receivedByUserId: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    purchaseOrder: {
      id: string;
      purchaseOrderNumber: string;
      supplier: { id: string; companyName: string };
    };
    storageLocation: { id: string; name: string };
    receivedBy: { id: string; name: string | null };
    lines: Array<{
      id: string;
      goodsReceiptId: string;
      purchaseOrderLineItemId: string;
      inventoryItemId: string;
      quantityReceived: number;
      quantityAccepted: number;
      quantityDamaged: number;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      inventoryItem: { id: string; name: string };
    }>;
  }) {
    return {
      id: receipt.id,
      organizationId: receipt.organizationId,
      purchaseOrderId: receipt.purchaseOrderId,
      purchaseOrderNumber: receipt.purchaseOrder.purchaseOrderNumber,
      supplierId: receipt.purchaseOrder.supplier.id,
      supplierName: receipt.purchaseOrder.supplier.companyName,
      receiptNumber: receipt.receiptNumber,
      receivedDate: receipt.receivedDate,
      storageLocationId: receipt.storageLocationId,
      storageLocationName: receipt.storageLocation.name,
      supplierDeliveryNote: receipt.supplierDeliveryNote,
      receivedByUserId: receipt.receivedByUserId,
      receivedByUserName: receipt.receivedBy.name,
      notes: receipt.notes,
      createdAt: receipt.createdAt,
      updatedAt: receipt.updatedAt,
      lines: receipt.lines.map((line) => ({
        id: line.id,
        goodsReceiptId: line.goodsReceiptId,
        purchaseOrderLineItemId: line.purchaseOrderLineItemId,
        inventoryItemId: line.inventoryItemId,
        inventoryItemName: line.inventoryItem.name,
        quantityReceived: line.quantityReceived,
        quantityAccepted: line.quantityAccepted,
        quantityDamaged: line.quantityDamaged,
        notes: line.notes,
        createdAt: line.createdAt,
        updatedAt: line.updatedAt,
      })),
    };
  }

  private async findPurchaseOrderForTransition(
    userId: string,
    id: string,
    action: PermissionAction,
  ) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: this.purchaseOrderInclude,
    });

    if (!po) {
      throw new NotFoundException(`Purchase order with id ${id} not found`);
    }

    await this.ensureOrganizationPermission(userId, po.organizationId, action);
    return po;
  }

  private async ensureSupplierOwnership(
    supplierId: string,
    organizationId: string,
    requireActive: boolean,
    tx?: Prisma.TransactionClient | PrismaService,
  ) {
    const db = tx ?? this.prisma;
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        organizationId: true,
        active: true,
      },
    });

    if (!supplier || supplier.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Supplier does not belong to this organization',
      );
    }

    if (requireActive && !supplier.active) {
      throw new BadRequestException('Only active suppliers may be selected');
    }
  }

  private async ensureLocationOwnership(
    locationId: string,
    organizationId: string,
    requireActive: boolean,
    tx?: Prisma.TransactionClient | PrismaService,
  ) {
    const db = tx ?? this.prisma;
    const location = await db.storageLocation.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        organizationId: true,
        active: true,
      },
    });

    if (!location || location.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Storage location does not belong to this organization',
      );
    }

    if (requireActive && !location.active) {
      throw new BadRequestException(
        'Receiving into an inactive location is not allowed',
      );
    }
  }

  private async ensureAdminPermission(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    const normalizedRole = membership.role.trim().toLowerCase();
    if (normalizedRole === 'owner' || normalizedRole === 'administrator') {
      return;
    }

    throw new ForbiddenException(
      'Only organization administrators can delete purchase orders',
    );
  }

  private async ensureOrganizationPermission(
    userId: string,
    organizationId: string,
    action: PermissionAction,
    tx?: Prisma.TransactionClient | PrismaService,
  ) {
    const db = tx ?? this.prisma;
    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    const normalizedRole = membership.role.trim().toLowerCase();
    if (normalizedRole === 'owner' || normalizedRole === 'administrator') {
      return;
    }

    const role = await db.role.findFirst({
      where: {
        organizationId,
        name: membership.role,
      },
      select: {
        permissions: true,
      },
    });

    if (!role) {
      throw new ForbiddenException('No role permissions found for this user');
    }

    let permissions: RolePermissionMap = {};

    try {
      permissions = JSON.parse(role.permissions) as RolePermissionMap;
    } catch {
      permissions = {};
    }

    const allowed = Boolean(
      permissions['Purchase Orders']?.[action] ??
      permissions.Purchasing?.[action],
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Missing Purchase Orders ${action} permission`,
      );
    }
  }

  private generateReceiptNumber() {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `GR-${stamp}-${rand}`;
  }
}
