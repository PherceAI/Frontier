import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateOperationalItems } from '@/lib/validation/operational-validation';

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            catalogItem: {
                count: vi.fn(),
            },
        },
    };
});

vi.mock('@/lib/prisma', () => ({
    prisma: mockPrisma,
}));

describe('validateOperationalItems', () => {
    const validUuid = '12345678-1234-1234-1234-1234567890ab';
    const companyId = 'company-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should throw if items is not an array', async () => {
        await expect(validateOperationalItems({}, companyId)).rejects.toThrow('Formato de items inválido');
    });

    it('should throw if item quantity is <= 0', async () => {
        const items = [{ quantity: 0 }];
        await expect(validateOperationalItems(items, companyId)).rejects.toThrow('Cantidad debe ser mayor a 0');
    });

    it('should throw if item_id is invalid uuid', async () => {
        const items = [{ quantity: 1, item_id: 'invalid-uuid' }];
        await expect(validateOperationalItems(items, companyId)).rejects.toThrow('ID de item inválido');
    });

    it('should return valid items if input is correct (no item_id)', async () => {
        const items = [{ quantity: 5 }];
        const result = await validateOperationalItems(items, companyId);
        expect(result.validItems).toHaveLength(1);
        expect(result.validItems[0]).toEqual({
            item_id: null,
            quantity: 5,
            metadata: undefined
        });
        expect(mockPrisma.catalogItem.count).not.toHaveBeenCalled();
    });

    it('should return valid items if input is correct (with item_id)', async () => {
        const items = [{ quantity: 5, item_id: validUuid }];
        mockPrisma.catalogItem.count.mockResolvedValue(1);

        const result = await validateOperationalItems(items, companyId);
        expect(result.validItems).toHaveLength(1);
        expect(result.validItems[0].item_id).toBe(validUuid);
        expect(mockPrisma.catalogItem.count).toHaveBeenCalledWith({
            where: {
                id: { in: [validUuid] },
                company_id: companyId,
            },
        });
    });

    it('should throw if item does not belong to company', async () => {
        const items = [{ quantity: 5, item_id: validUuid }];
        mockPrisma.catalogItem.count.mockResolvedValue(0); // Simulate item not found or wrong company

        await expect(validateOperationalItems(items, companyId)).rejects.toThrow('Uno o más items no pertenecen a la compañía');
    });
});
