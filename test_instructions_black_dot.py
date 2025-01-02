import asyncio
from playwright.async_api import async_playwright


async def run(playwright):
    browser = await playwright.chromium.launch(headless=False)
    page = await browser.new_page()
    await page.goto("http://localhost:8080")

    # Wait for the application to load
    await page.wait_for_selector('[data-element-id="my_user_task"]')

    # Click on the element to open the properties panel
    await page.click('[data-element-id="my_user_task"]')

    # Click on the toggle button to open the Pre/Post Scripts section
    await page.click(
        '[data-group-id="group-spiff_pre_post_scripts"] .bio-properties-panel-arrow'
    )

    # Wait for the Pre-Script field to be visible
    await page.wait_for_selector(
        "#bio-properties-panel-pythonScript_spiffworkflow\\:PreScript"
    )

    # Type into the Pre-Script field
    await page.fill(
        "#bio-properties-panel-pythonScript_spiffworkflow\\:PreScript",
        "Some pre-script code",
    )

    # Wait for the Post-Script field to be visible
    await page.wait_for_selector(
        "#bio-properties-panel-pythonScript_spiffworkflow\\:PostScript"
    )

    # Type into the Post-Script field
    await page.fill(
        "#bio-properties-panel-pythonScript_spiffworkflow\\:PostScript",
        "Some post-script code",
    )

    # Check for the black dot indicating the Pre/Post Scripts section contains data
    pre_post_scripts_black_dot = await page.wait_for_selector(
        '.bio-properties-panel-group[data-group-id="group-spiff_pre_post_scripts"] .bio-properties-panel-dot[title="Section contains data"]',
        timeout=5000,
    )
    assert (
        pre_post_scripts_black_dot is not None
    ), "Black dot indicating Pre/Post Scripts section contains data is not present."

    # Click on the toggle button to open the instructions section
    await page.click('[data-group-id="group-instructions"] .bio-properties-panel-arrow')

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

    print(
        "Test passed: Black dot is present for Pre/Post Scripts, but not for instructions."
    )

    await browser.close()


async def main():
    async with async_playwright() as playwright:
        await run(playwright)


if __name__ == "__main__":
    asyncio.run(main())
