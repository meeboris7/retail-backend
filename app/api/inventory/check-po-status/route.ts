// app/api/inventory/check-po-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMockData } from '../../../../lib/mockData'; // Adjust path
import { PoStatusReport, PurchaseOrder } from '../../../../app/types'; // Adjust path
import { parseISO, differenceInDays, isBefore, isValid } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const mockData = getMockData();
    // Filter to only include "outstanding" POs (not delivered)
    const outstandingPurchaseOrders = mockData.purchaseOrders.filter(
      po => po.status !== 'delivered'
    );

    const statusReports: PoStatusReport[] = [];
    const now = new Date(); // Current date and time for comparison

    for (const po of outstandingPurchaseOrders) { // Loop through filtered POs
      const expectedDate = parseISO(po.expectedDeliveryDate);

      if (!isValid(expectedDate)) {
        console.warn(`Invalid expected_delivery_date for PO ${po.poId}: ${po.expectedDeliveryDate}`);
        // Optionally, you might want to report this PO with an error status or skip it
        continue;
      }

      let currentStatus: PoStatusReport['current_status'] = po.status;
      let daysOverdue: number | null = null;
      let message = '';

      if (isBefore(expectedDate, now)) {
        // If expected delivery date is in the past
        daysOverdue = differenceInDays(now, expectedDate);
        if (daysOverdue > 0) {
          currentStatus = 'delayed';
          message = `PO is delayed by ${daysOverdue} days. Expected by ${expectedDate.toLocaleDateString()}.`;
        } else {
          // Expected today or very recently, but not yet truly 'overdue' (daysOverdue > 0)
          currentStatus = po.status; // Revert to its original 'pending'/'shipped' status if not yet overdue
          message = `PO expected today or very soon. Current status: ${po.status}.`;
        }
      } else {
        // Expected delivery date is in the future
        currentStatus = po.status; // Maintain existing status (pending, shipped)
        message = `PO is currently ${po.status}. Expected delivery on ${expectedDate.toLocaleDateString()}.`;
      }

      statusReports.push({
        po_id: po.poId,
        product_id: po.productId,
        supplier_id: po.supplierId,
        current_status: currentStatus,
        days_overdue: daysOverdue,
        message: message,
      });
    }

    return NextResponse.json({ purchase_order_statuses: statusReports }, { status: 200 });

  } catch (error: any) {
    console.error("Error in check_po_status API:", error);
    return NextResponse.json({ error: error.message || "Failed to check purchase order status." }, { status: 500 });
  }
}