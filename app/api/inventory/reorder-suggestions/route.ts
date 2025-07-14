// app/api/inventory/reorder-suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMockData } from '../../../../lib/mockData'; // Adjust path based on your project structure
import { ProductReorderSuggestion } from '../../../types'; // Adjust path

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currentDateStr = searchParams.get('current_date');

    // Use current date from param or default to actual current date
    let currentDate = new Date();
    if (currentDateStr) {
      const parsedDate = new Date(currentDateStr);
      if (!isNaN(parsedDate.getTime())) {
        currentDate = parsedDate;
      } else {
        return NextResponse.json({ error: 'Invalid current_date format. Use YYYY-MM-DD.' }, { status: 400 });
      }
    }

    const mockData = getMockData();
    const products = mockData.products;

    const reorderSuggestions: ProductReorderSuggestion[] = [];

    products.forEach(product => {
      // Simple reorder logic: if current quantity is below reorder point
      if (product.currentQuantity < product.reorderPoint) {
        const suggestedOrderQuantity = product.reorderPoint - product.currentQuantity ; // Order to reach reorder point + buffer
        reorderSuggestions.push({
          product_id: product.id,
          product_name: product.name,
          current_quantity_on_hand: product.currentQuantity,
          calculated_reorder_point: product.reorderPoint,
          suggested_order_quantity: suggestedOrderQuantity,
          reason: `Quantity (${product.currentQuantity}) is below reorder point (${product.reorderPoint}).`
        });
      }
    });

    return NextResponse.json({ reorder_suggestions: reorderSuggestions }, { status: 200 });

  } catch (error: any) {
    console.error('Error in get_reorder_suggestions API:', error);
    return NextResponse.json({ error: error.message || 'Failed to get reorder suggestions.' }, { status: 500 });
  }
}
