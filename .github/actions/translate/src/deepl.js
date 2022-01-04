module.exports = {
  translate: async (
    page,
    sentence,
    sourceLanguage = "auto",
    targetLanguage
  ) => {
    if (!/^(auto|[a-z]{2})$/.test(sourceLanguage))
      throw new Error("INVALID_SOURCE_LANGUAGE");
    if (!/^[a-z]{2}-[A-Z]{2}$/.test(targetLanguage))
      throw new Error("INVALID_TARGET_LANGUAGE");
    const sourceLangSelect = "button[dl-test=translator-source-lang-btn]",
      targetLangSelect = "button[dl-test=translator-target-lang-btn]",
      sourceLangMenu = "div[dl-test=translator-source-lang-list]",
      targetLangMenu = "div[dl-test=translator-target-lang-list]",
      sourceLangButton = `button[dl-test=translator-lang-option-${sourceLanguage}]`,
      targetLangButton = `button[dl-test=translator-lang-option-${targetLanguage}]`,
      originalSentenceField = "textarea[dl-test=translator-source-input]",
      targetSentenceField =
        "textarea[dl-test=translator-target-input]"; /*,
			 targetSentencesContainer = '.lmt__translations_as_text'*/

    // click  black
    // await page.screenshot({ path: "screens/1.png" });

    await page.click(sourceLangSelect);
    await page.waitForTimeout(500);

    // await page.screenshot({ path: "screens/2.png" });

    // const element = await page.$eval(
    //   "[dl-test=translator-source-lang]",
    //   (el) => el.innerHTML
    // );
    // console.log("element", element);

    await page.waitForSelector(sourceLangMenu, { visible: true });
    await page.waitForTimeout(500);

    try {
      await page.click(sourceLangButton);
    } catch (_) {
      throw new Error("UNSUPPORTED_SOURCE_LANGUAGE");
    }
    // await page.screenshot({ path: "screens/3.png" });

    await page.waitForSelector(sourceLangMenu, { hidden: true });

    await page.click(targetLangSelect);
    await page.waitForTimeout(1000);

    // a/b test
    const uiType = await page.evaluate(() => {
      return {
        smallerLangSwitch:
          document.querySelector("div[dl-test=translator-source-lang-list]") !==
          null,
      };
    });
    const isSmallerLangSwitch = uiType.smallerLangSwitch;
    if (isSmallerLangSwitch) {
      await page.waitForSelector(sourceLangMenu, { visible: true });
    } else {
      await page.waitForSelector(targetLangMenu, { visible: true });
    }
    await page.waitForTimeout(1000);
    try {
      await page.click(targetLangButton);
    } catch (_) {
      throw new Error("UNSUPPORTED_TARGET_LANGUAGE");
    }
    if (isSmallerLangSwitch) {
      await page.waitForSelector(sourceLangMenu, { hidden: true });
    } else {
      await page.waitForSelector(targetLangMenu, { hidden: true });
    }
    // await page.screenshot({ path: "buddy-screenshot.png" });
    await page.waitForSelector(originalSentenceField);
    await page.type(originalSentenceField, sentence);
    // await page.screenshot({ path: "buddy-screenshot2.png" });

    let sentences = [];
    let _res = {};
    page.on("requestfinished", (request) =>
      request
        .response()
        .json()
        .then((res) => {
          if (!res["result"]) return;
          sentences.push(
            ...res["result"]["translations"][0]["beams"].map((item) => ({
              value: item["postprocessed_sentence"],
              confidence: item["totalLogProb"],
            }))
          );
          _res = {
            source: {
              lang: res["result"]["source_lang"].toLowerCase(),
              ...(sourceLanguage === "auto"
                ? {
                    confident: !!res["result"]["source_lang_is_confident"],
                  }
                : {}),
              sentence,
            },
            target: {
              lang: res["result"]["target_lang"].toLowerCase(),
              sentences: sentences
                .sort((a, b) => a.confidence - b.confidence)
                .map((item) => item.value),
            },
          };
        })
        .catch(() => {})
    );
    await page.waitForSelector(".lmt--active_translation_request");
    await page.waitForSelector(".lmt--active_translation_request", {
      hidden: true,
    });
    _res.target.translation = await page.$eval(
      targetSentenceField,
      (el) => el.value
    );
    // page.close().catch(() => {});
    await page.evaluate(
      () =>
        (document.querySelector(
          "textarea[dl-test=translator-source-input]"
        ).value = "")
    );

    return _res;
  },
  quit: async () => {},
  getSupportedLanguages: async () => {
    const { data } = await require("axios").get(homepage);
    const res = {
      sourceLanguages: [],
      targetLanguages: [],
    };
    {
      const regExp = /dl-lang='([a-z]{2})/g;
      let match;
      while ((match = regExp.exec(data))) res.sourceLanguages.push(match[1]);
    }
    {
      const regExp = /translator\/selectLang\.target\.(?:([a-z]{2})'|[a-z]{2}\.([a-z]{2}-[A-Z]{2}))/g;
      let match;
      while ((match = regExp.exec(data)))
        res.targetLanguages.push(
          match[2] || `${match[1]}-${match[1].toUpperCase()}`
        );
      for (let i = res.targetLanguages.length - 1; i >= 0; i--) {
        const targetLanguageTags = res.targetLanguages[i].split("-");
        if (
          targetLanguageTags[1] === targetLanguageTags[0].toUpperCase() &&
          res.targetLanguages.find((_targetLanguage) => {
            const _targetLanguageTags = _targetLanguage.split("-");
            return (
              targetLanguageTags[0] === _targetLanguageTags[0] &&
              _targetLanguageTags[1] !== _targetLanguageTags[0].toUpperCase()
            );
          })
        ) {
          res.targetLanguages.splice(i, 1);
        }
      }
    }
    return res;
  },
};
