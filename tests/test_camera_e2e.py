from playwright.sync_api import sync_playwright


def test_camera_reader_starts_with_browser_permission():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream",
            ],
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        context.grant_permissions(["camera"], origin="http://127.0.0.1:5173")
        page = context.new_page()
        page.goto("http://127.0.0.1:5173", wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")

        page.get_by_role("button", name="Portaria").click()
        page.get_by_role("button", name="Câmera Vivo").click()
        page.locator("#qr-reader-viewport video").wait_for(state="attached", timeout=15000)

        assert page.locator("#qr-reader-viewport video").count() == 1
        assert page.get_by_text("Erro ao iniciar a câmera", exact=False).count() == 0
        page.screenshot(path="tests/screenshots/08_camera_reader_started.png")
        browser.close()


if __name__ == "__main__":
    test_camera_reader_starts_with_browser_permission()
