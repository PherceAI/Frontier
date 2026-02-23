import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/api-error';

interface OperationalItem {
    item_id?: string | null;
    quantity?: number;
    metadata?: unknown;
}

interface ValidatedItem {
    item_id: string | null;
    quantity: number;
    metadata?: unknown;
}

interface ValidationResult {
    validItems: ValidatedItem[];
}

export async function validateOperationalItems(
    items: unknown,
    companyId: string
): Promise<ValidationResult> {
    if (!Array.isArray(items)) {
        throw new AppError('VALIDATION', 'Formato de items inválido', 400);
    }

    const validItems: ValidatedItem[] = [];
    const itemIds = new Set<string>();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const item of items) {
        if (typeof item !== 'object' || item === null) {
             throw new AppError('VALIDATION', 'Item inválido', 400);
        }

        const opItem = item as OperationalItem;
        const quantity = opItem.quantity ?? 0;

        if (quantity <= 0) {
            throw new AppError('VALIDATION', 'Cantidad debe ser mayor a 0', 400);
        }

        let finalItemId: string | null = null;

        if (opItem.item_id) {
            if (!uuidRegex.test(opItem.item_id)) {
                throw new AppError('VALIDATION', 'ID de item inválido', 400);
            }
            itemIds.add(opItem.item_id);
            finalItemId = opItem.item_id;
        }

        validItems.push({
            item_id: finalItemId,
            quantity,
            metadata: opItem.metadata
        });
    }

    if (itemIds.size > 0) {
        const validItemsCount = await prisma.catalogItem.count({
            where: {
                id: { in: Array.from(itemIds) },
                company_id: companyId,
            },
        });

        if (validItemsCount !== itemIds.size) {
            throw new AppError('VALIDATION', 'Uno o más items no pertenecen a la compañía', 400);
        }
    }

    return { validItems };
}
