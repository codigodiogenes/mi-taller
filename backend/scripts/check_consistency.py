import sqlite3

def check_stock_consistency():
    conn = sqlite3.connect('workshop.db')
    cursor = conn.cursor()
    
    print("--- Stock Table ---")
    cursor.execute("SELECT id, name, quantity FROM stock")
    stocks = cursor.fetchall()
    for s in stocks:
        print(f"ID: {s[0]}, Name: {s[1]}, Qty: {s[2]}")
        
    print("\n--- Repair Items (Linked to Stock) ---")
    cursor.execute("""
        SELECT ri.id, ri.description, ri.quantity, ri.stock_item_id, r.id 
        FROM repair_items ri
        JOIN repairs r ON ri.repair_id = r.id
        WHERE ri.stock_item_id IS NOT NULL
    """)
    items = cursor.fetchall()
    for i in items:
        print(f"ID: {i[0]}, Desc: {i[1]}, Qty: {i[2]}, StockID: {i[3]}, RepairID: {i[4]}")
        
    conn.close()

if __name__ == "__main__":
    check_stock_consistency()
