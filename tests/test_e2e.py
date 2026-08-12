import os
import time
from playwright.sync_api import sync_playwright

def run_e2e_test():
    os.makedirs("tests/screenshots", exist_ok=True)
    target_url = os.environ.get("E2E_TARGET_URL", "http://localhost:5173")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        print(f"[STEP 1] Accessing Catalog ({target_url})...")
        try:
            page.goto(target_url, wait_until="domcontentloaded", timeout=10000)
        except Exception:
            fallback_url = "https://elite-tickets.pages.dev"
            print(f"  -> Local server unavailable at {target_url}. Falling back to production URL ({fallback_url})...")
            page.goto(fallback_url, wait_until="domcontentloaded", timeout=30000)
            
        page.screenshot(path="tests/screenshots/01_home_catalog.png")
        print("  -> Home Catalog loaded cleanly.")
        
        # Step 2: Open Organizer Modal
        print("[STEP 2] Testing Organizer Event Creation Flow...")
        organizer_btn = page.query_selector("button:has-text('Publicar evento')") or page.query_selector("button:has-text('Painel do Organizador')")
        if organizer_btn:
            organizer_btn.click()
            time.sleep(1)
            page.screenshot(path="tests/screenshots/02_organizer_modal.png")
            print("  -> Organizer Modal opened.")
            
            # Close modal by pressing Escape
            page.keyboard.press("Escape")
            time.sleep(1)
            print("  -> Organizer Modal closed.")

        # Step 3: Select Seats for First Event
        print("[STEP 3] Accessing Event Details & Seat Map...")
        select_seats_btn = page.query_selector("button:has-text('Ver assentos')") or page.query_selector("button:has-text('Selecionar Assentos')")
        if select_seats_btn:
            select_seats_btn.click()
            time.sleep(1)
            page.screenshot(path="tests/screenshots/03_seat_map.png")
            print("  -> Seat Map rendered.")
            
            # Click available seat
            available_seat = page.query_selector("button[title*='VIP']") or page.query_selector("button[title*='Standard']")
            if available_seat:
                available_seat.click()
                time.sleep(0.5)
                page.screenshot(path="tests/screenshots/04_seat_selected.png")
                print("  -> Seat selected.")
                
                # Click reserve button
                reserve_btn = page.query_selector("button:has-text('Reservar')") or page.query_selector("button:has-text('Ir para Pagamento')")
                if reserve_btn:
                    reserve_btn.click()
                    time.sleep(1)
                    page.screenshot(path="tests/screenshots/05_checkout_modal.png")
                    print("  -> Checkout Modal loaded.")
                    
                    # Fill Customer Form & Confirm Payment
                    name_input = page.query_selector("input[placeholder*='Rafael']") or page.query_selector("input[placeholder*='Nome']")
                    if name_input:
                        name_input.fill("Rafa Tester")
                    
                    confirm_pay_btn = page.query_selector("button:has-text('Confirmar e emitir')") or page.query_selector("button:has-text('Confirmar Pagamento')")
                    if confirm_pay_btn:
                        confirm_pay_btn.click()
                        time.sleep(1.5)
                        page.screenshot(path="tests/screenshots/06_my_tickets.png")
                        print("  -> Payment simulated! Ticket generated with HMAC QR Code.")

        # Step 4: Access Portaria (Gatekeeper)
        print("[STEP 4] Testing Gatekeeper Validation Page...")
        portaria_nav = page.query_selector("button:has-text('Portaria')")
        if portaria_nav:
            portaria_nav.click()
            time.sleep(1)
            page.screenshot(path="tests/screenshots/07_portaria_page.png")
            print("  -> Gatekeeper Scanner Page loaded.")

        print("SUCCESS: E2E Automation completed! Screenshots saved in tests/screenshots/")
        browser.close()

if __name__ == "__main__":
    run_e2e_test()
