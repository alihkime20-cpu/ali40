# Google AdSense readiness research

## Official sources

1. Eligibility requirements: https://support.google.com/adsense/answer/9724?hl=en
   - The applicant needs their own content, content that complies with AdSense policies, and must be 18 or older.
   - Google describes the content as high-quality, original, useful/interesting, and able to attract an audience.
   - The publisher must be able to access the submitted site's HTML source code.
   - Google states that publishers are responsible for staying current with policy and terms changes.

2. Program policies: https://support.google.com/adsense/answer/48182?hl=en
3. Publisher policies: https://support.google.com/adsense/answer/10502938?hl=en
4. AdSense cookies and privacy policy: https://support.google.com/adsense/answer/7549925?hl=en
   - Google says publishers must clearly display a privacy policy notifying visitors about the use of cookies.
5. AdSense terms: https://adsense.google.com/adsense/terms

## Product decisions for Nabd Alalam

The site will add transparent About, Privacy Policy, Terms of Use, Content and Copyright pages, link them in the footer, and include robots.txt and sitemap.xml. It will not place live ad code or claim AdSense approval before the owner has a Google account, a published domain, and Google approval. News must remain attributed to the original source, and RSS-derived pages should add meaningful Arabic summaries and context rather than being a thin copy of feeds.

6. Consent management requirements: https://support.google.com/adsense/answer/13554020?hl=en
   - Google requires publisher products serving personalized ads to users in the EEA and UK to use a Google-certified CMP integrated with the IAB TCF from 16 January 2024.
   - The same requirement applies to personalized ads for users in Switzerland from 31 July 2024.
   - If the requirements are not met, personalized ads are not eligible to be served.

The current site intentionally does not load advertising scripts. A certified CMP should be selected and configured when the owner is ready to activate ads, based on the final audience regions and the Google-certified CMP list.
