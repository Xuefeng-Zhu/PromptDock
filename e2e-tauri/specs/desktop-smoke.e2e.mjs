function xpathLiteral(value) {
  if (!value.includes("'")) return `'${value}'`;
  if (!value.includes('"')) return `"${value}"`;

  return `concat('${value.replace(/'/g, "', \"'\", '")}')`;
}

function buttonNamed(name) {
  const literal = xpathLiteral(name);
  return $(`//button[@aria-label=${literal} or normalize-space(.)=${literal}]`);
}

function headingWithText(text) {
  return $(
    `//*[self::h1 or self::h2 or self::h3][normalize-space(.)=${xpathLiteral(text)}]`,
  );
}

function promptTitle(text) {
  return $(`//*[self::h2 or self::h3 or self::span][normalize-space(.)=${xpathLiteral(text)}]`);
}

async function waitForDocumentReady() {
  await browser.waitUntil(
    () => browser.execute(() => document.readyState === 'complete'),
    {
      timeout: 20_000,
      timeoutMsg: 'PromptDock document did not finish loading.',
    },
  );
}

async function resetOnboardingState() {
  await waitForDocumentReady();
  await browser.execute(() => window.localStorage.clear());
  await browser.refresh();
  await waitForDocumentReady();
}

async function invokeTauri(command, args = {}) {
  return browser.execute(
    (tauriCommand, tauriArgs) => {
      const internals = window.__TAURI_INTERNALS__;
      if (!internals || typeof internals.invoke !== 'function') {
        throw new Error('Tauri invoke bridge is unavailable.');
      }

      return internals.invoke(tauriCommand, tauriArgs);
    },
    command,
    args,
  );
}

async function switchToWindowTitle(expectedTitle) {
  const seenTitles = new Set();

  await browser.waitUntil(
    async () => {
      const handles = await browser.getWindowHandles();
      for (const handle of handles) {
        await browser.switchToWindow(handle);
        const title = await browser.getTitle();
        seenTitles.add(title);
        if (title === expectedTitle) return true;
      }
      return false;
    },
    {
      timeout: 10_000,
      timeoutMsg: `Could not find window titled "${expectedTitle}". Saw: ${[...seenTitles].join(', ')}`,
    },
  );
}

describe('PromptDock Tauri desktop shell', () => {
  it('boots in Tauri, exposes desktop settings, and opens the native quick launcher', async () => {
    await resetOnboardingState();

    const isTauriRuntime = await browser.execute(() => '__TAURI_INTERNALS__' in window);
    expect(isTauriRuntime).toBe(true);

    await headingWithText('Get started').waitForDisplayed({ timeout: 20_000 });
    await buttonNamed('Start locally').click();

    await headingWithText('All Prompts').waitForDisplayed({ timeout: 20_000 });
    await promptTitle('Summarize Text').waitForDisplayed({ timeout: 20_000 });

    await buttonNamed('Settings').click();
    await headingWithText('Settings').waitForDisplayed({ timeout: 10_000 });
    await headingWithText('Hotkey').waitForDisplayed({ timeout: 10_000 });
    await $(
      `//label[.//span[normalize-space(.)=${xpathLiteral('Paste into Active App')}]]`,
    ).waitForDisplayed({ timeout: 10_000 });

    await invokeTauri('toggle_quick_launcher');
    await switchToWindowTitle('Quick Launcher');

    const launcherSearch = await $('//input[@aria-label="Search prompts"]');
    await launcherSearch.waitForDisplayed({ timeout: 20_000 });
    await launcherSearch.setValue('Email');

    await $(
      `//button[@role="option" and .//*[normalize-space(.)=${xpathLiteral('Email Draft')}]]`,
    ).waitForDisplayed({ timeout: 20_000 });

    await browser.keys('Enter');
    await $(
      `//dialog[@aria-label=${xpathLiteral('Fill variables for Email Draft')}]`,
    ).waitForDisplayed({ timeout: 10_000 });

    await browser.keys('Escape');
    await $('//input[@aria-label="Search prompts"]').waitForDisplayed({ timeout: 10_000 });
    await browser.keys('Escape');
  });
});
