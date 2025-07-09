// app/api/inventory/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMockData, updateMockData, generateId } from '../../../../lib/mockData'; // Adjust path
import { PurchaseOrder } from '../../../../app/types'; // Adjust path
import nodemailer from 'nodemailer';
import { addDays } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { product_id, quantity } = await request.json();

    if (!product_id || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid product_id or quantity provided.' }, { status: 400 });
    }

    const mockData = getMockData();
    const product = mockData.products.find(p => p.id === product_id);

    if (!product) {
      return NextResponse.json({ error: `Product with ID ${product_id} not found.` }, { status: 404 });
    }

    // --- Supplier Selection Logic (Default) ---
    // Since optimization_goal is removed, we'll pick a default supplier.
    // For simplicity, let's pick the first supplier from our mock data.
    // In a real system, you'd have more sophisticated logic here (e.g., round-robin, cheapest, fastest default).
    const chosenSupplier = mockData.suppliers[0];
    if (!chosenSupplier) {
      return NextResponse.json({ error: 'No suppliers available in mock data.' }, { status: 500 });
    }

    const poId = generateId('PO');
    const orderDate = new Date();
    const expectedDeliveryDate = addDays(orderDate, chosenSupplier.leadTimeDays); // Calculate based on supplier's lead time

    const newPurchaseOrder: PurchaseOrder = {
      poId: poId,
      productId: product.id,
      supplierId: chosenSupplier.id,
      quantityOrdered: quantity,
      orderDate: orderDate.toISOString(),
      expectedDeliveryDate: expectedDeliveryDate.toISOString(),
      status: 'pending',
      chosenSupplierReason: `Default selection: ${chosenSupplier.name} (Lead Time: ${chosenSupplier.leadTimeDays} days)`,
      emailNotificationStatus: 'not_attempted', // Initial status
      emailErrorMessage: null,
    };

    // --- Internal Email Sending Logic ---
    let emailStatus: PurchaseOrder['emailNotificationStatus'] = 'not_attempted';
    let emailError: string | null = null;

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn("GMAIL_USER or GMAIL_PASS environment variables are not set. Email notification will not be sent.");
      emailStatus = 'failed';
      emailError = 'Email credentials not configured.';
    } else {
      try {
        const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: 'meet.borisagar@publicissapient.com', // Replace with a real recipient for testing!
          subject: `New Purchase Order Placed: ${newPurchaseOrder.poId} for ${product.name}`,
          text: `
A new purchase order has been placed successfully.

Order ID: ${newPurchaseOrder.poId}
Product: ${product.name} (ID: ${newPurchaseOrder.productId})
Quantity: ${newPurchaseOrder.quantityOrdered}
Supplier: ${chosenSupplier.name} (ID: ${newPurchaseOrder.supplierId})
Order Date: ${new Date(newPurchaseOrder.orderDate).toLocaleDateString()}
Expected Delivery: ${new Date(newPurchaseOrder.expectedDeliveryDate).toLocaleDateString()}

Reason for Supplier Choice: ${newPurchaseOrder.chosenSupplierReason}
Status: ${newPurchaseOrder.status}

Please review and monitor.
          `,
        };

        await transporter.sendMail(mailOptions);
        emailStatus = 'sent';
      } catch (e: any) {
        console.error('Failed to send email notification for new PO:', e);
        emailStatus = 'failed';
        emailError = e.message;
      }
    }

    // Update the newPurchaseOrder object with email status before storing
    newPurchaseOrder.emailNotificationStatus = emailStatus;
    newPurchaseOrder.emailErrorMessage = emailError;

    // --- Update Mock Data ---
    updateMockData({ purchaseOrders: [...mockData.purchaseOrders, newPurchaseOrder] });

    // --- Prepare Response ---
    // Ensure the response matches the expected output schema for the tool
    const responseBody = {
      po_id: newPurchaseOrder.poId,
      supplier_id: newPurchaseOrder.supplierId,
      product_id: newPurchaseOrder.productId,
      quantity_ordered: newPurchaseOrder.quantityOrdered,
      order_date: newPurchaseOrder.orderDate,
      expected_delivery_date: newPurchaseOrder.expectedDeliveryDate,
      status: newPurchaseOrder.status,
      chosen_supplier_reason: newPurchaseOrder.chosenSupplierReason,
      email_notification_status: newPurchaseOrder.emailNotificationStatus,
      email_error_message: newPurchaseOrder.emailErrorMessage,
      message: `Purchase order ${newPurchaseOrder.poId} created successfully.`, // Added for clarity, though not strictly in schema
    };

    return NextResponse.json(responseBody, { status: 200 });

  } catch (error: any) {
    console.error("Error in create_purchase_order API:", error);
    return NextResponse.json({ error: error.message || "Failed to create purchase order." }, { status: 500 });
  }
}