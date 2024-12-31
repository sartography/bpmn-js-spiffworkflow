import asyncio
from playwright.async_api import async_playwright


async def run(playwright):
    browser = await playwright.chromium.launch(headless=False)
    page = await browser.new_page()
    await page.goto("http://localhost:8080")

    # Wait for the application to load
    await page.wait_for_selector('[data-element-id="Event_end_1"]')

    # Click on the element to open the properties panel
    await page.click('[data-element-id="Event_end_1"]')

    # Click on the toggle button to open the documentation section
    await page.click(
        '[data-group-id="group-documentation"] .bio-properties-panel-arrow'
    )

    # Wait for the documentation field to be visible
    await page.wait_for_selector(
        '#bio-properties-panel-documentation'
    )

    # Type into the documentation field
    await page.fill(
        '#bio-properties-panel-documentation',
        "Some documentation",
    )

    # Check for the black dot indicating the documentation section contains data
    documentation_black_dot = await page.wait_for_selector(
        '.bio-properties-panel-group[data-group-id="group-documentation"] .bio-properties-panel-dot[title="Section contains data"]',
        timeout=5000,
    )
    assert (
        documentation_black_dot is not None
    ), "Black dot indicating documentation section contains data is not present."

    # Click on the toggle button to open the instructions section
    await page.click(
        '[data-group-id="group-instructions"] .bio-properties-panel-arrow'
    )

    # Wait for the instructions field to be visible
    await page.wait_for_selector(
        '[data-entry-id="extension_spiffworkflow:InstructionsForEndUser"] textarea'
    )

    # Type into the instructions field
    await page.fill(
        '[data-entry-id="extension_spiffworkflow:InstructionsForEndUser"] textarea',
        "Some instructions",
    )

    # Check for the black dot indicating the instructions section contains data
    instructions_black_dot = await page.wait_for_selector(
        '.bio-properties-panel-group[data-group-id="group-instructions"] .bio-properties-panel-dot[title="Section contains data"]',
        timeout=5000,
    )
    assert (
        instructions_black_dot is not None
    ), "Black dot indicating instructions section contains data is not present."

    print("Test passed: Black dots are present when documentation and instructions are edited.")

    await browser.close()


async def main():
    async with async_playwright() as playwright:
        await run(playwright)


if __name__ == "__main__":
    asyncio.run(main())
