import os
import time
from playwright.sync_api import sync_playwright

def inspect_footer():
    os.makedirs("tests/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://localhost:5173", wait_until="domcontentloaded")
        time.sleep(1)
        
        # Scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(1)
        
        page.screenshot(path="tests/screenshots/footer_scroll_check.png", full_page=True)
        
        # Get metrics
        body_height = page.evaluate("document.body.scrollHeight")
        viewport_height = page.evaluate("window.innerHeight")
        footer_rect = page.evaluate("""() => {
            const footer = document.querySelector('footer');
            if (!footer) return null;
            const r = footer.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, height: r.height };
        }""")
        
        print(f"Body scrollHeight: {body_height}px, Viewport height: {viewport_height}px")
        print(f"Footer rect: {footer_rect}")
        browser.close()

if __name__ == "__main__":
    inspect_footer()
