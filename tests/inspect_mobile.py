import os
import time
from playwright.sync_api import sync_playwright

def inspect_mobile():
    os.makedirs("tests/screenshots_mobile", exist_ok=True)
    target_url = os.environ.get("TARGET_URL", "http://localhost:5173")

    with sync_playwright() as p:
        device = p.devices['iPhone 14']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(**device)
        page = context.new_page()

        print(f"[1] Testing Mobile Home/Catalog ({target_url})...")
        try:
            page.goto(target_url, wait_until="domcontentloaded", timeout=15000)
        except Exception:
            page.goto("https://elite-tickets.pages.dev", wait_until="domcontentloaded", timeout=30000)

        time.sleep(1)
        page.screenshot(path="tests/screenshots_mobile/01_mobile_catalog.png", full_page=True)

        # Check Persona Switcher
        persona_btn = page.query_selector("button[title*='Alternar Papel']")
        if persona_btn:
            persona_btn.click()
            time.sleep(0.5)
            page.screenshot(path="tests/screenshots_mobile/02_mobile_persona_menu.png")
            page.keyboard.press("Escape")

        # Step 2: Open Event Details & Seat Map
        print("[2] Testing Mobile Event Details & Seat Map...")
        select_seats_btn = page.query_selector("button:has-text('Ver assentos')")
        if select_seats_btn:
            select_seats_btn.click()
            time.sleep(1)
            page.screenshot(path="tests/screenshots_mobile/03_mobile_seat_map.png", full_page=True)

            # Click available seat
            seats = page.locator("button[title*='VIP'], button[title*='Premium'], button[title*='Standard']").all()
            for s in seats:
                if s.is_enabled():
                    s.click()
                    time.sleep(0.3)
                    break
            
            page.screenshot(path="tests/screenshots_mobile/04_mobile_seat_selected.png", full_page=True)

            # Click reserve button
            reserve_btn = page.query_selector("button:has-text('Ir para Pagamento')") or page.query_selector("button:has-text('Reservar')")
            if reserve_btn:
                reserve_btn.click()
                time.sleep(1)
                page.screenshot(path="tests/screenshots_mobile/05_mobile_checkout_sheet.png")

                # Close checkout
                close_btn = page.query_selector("button[aria-label='Fechar']") or page.query_selector("button:has-text('Cancelar')")
                if close_btn:
                    close_btn.click()
                    time.sleep(0.5)

        # Step 3: Check My Tickets tab via Mobile Bottom Bar
        print("[3] Testing Mobile My Tickets via Bottom Bar...")
        tickets_tab = page.query_selector("div.md\\:hidden button:has-text('Ingressos')")
        if tickets_tab:
            tickets_tab.click()
            time.sleep(1)
            page.screenshot(path="tests/screenshots_mobile/06_mobile_my_tickets.png", full_page=True)

        # Step 4: Check Portaria tab via Mobile Bottom Bar
        print("[4] Testing Mobile Portaria via Bottom Bar...")
        portaria_tab = page.query_selector("div.md\\:hidden button:has-text('Portaria')")
        if portaria_tab:
            portaria_tab.click()
            time.sleep(1)
            page.screenshot(path="tests/screenshots_mobile/07_mobile_portaria.png", full_page=True)

        browser.close()
        print("Mobile screenshots saved successfully!")

if __name__ == "__main__":
    inspect_mobile()
