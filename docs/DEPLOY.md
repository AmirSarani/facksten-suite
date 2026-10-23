# Deploy خودکار (CD)

مسیر ثابت: **لوکال ← push به GitHub ← CI سبز روی `main` ← workflow `Deploy` ← سرور خودش commit را از GitHub می‌گیرد.**
هیچ deploy‌ای از لپ‌تاپ انجام نمی‌شود.

- `.github/workflows/deploy.yml`: بعد از CI موفق روی `main` اجرا می‌شود؛ دستی هم با mode `diff` یا `deploy` اجرا می‌شود.
- `scripts/deploy/server-deploy.sh`: روی سرور با SSH اجرا می‌شود. سرور commit را در `/opt/pushrsp/suite` از GitHub می‌گیرد.
  - `diff`: هیچ چیزی را عوض نمی‌کند. فقط گزارش می‌دهد کدام فایل‌ها عوض می‌شوند و کدام فایل‌های **فقط-روی-سرور** پاک می‌شوند (پچ‌هایی که push نشده‌اند).
  - `deploy`: این مراحل را به ترتیب انجام می‌دهد:
    1. بکاپ می‌گیرد در `/opt/pushrsp/backups/<زمان>-<sha>` (۸ تای آخر نگه داشته می‌شوند).
    2. کد را با rsync همگام می‌کند.
    3. `npm ci` را اجرا می‌کند.
    4. `prisma db push` را اجرا می‌کند. اگر تغییری داده‌ای را پاک کند، رد می‌شود و deploy برمی‌گردد.
    5. build می‌گیرد.
    6. کامپایلر آزمایشگاه را راه می‌اندازد: اگر نسخه‌ها عوض شده باشد، `lab-toolchain/setup.ts` اجرا و `LAB_TOOLCHAIN_DIR` به `.env` اضافه می‌شود.
    7. سرویس‌ها را restart و health check می‌کند.

    اگر هر مرحله‌ای بعد از بکاپ شکست بخورد، **خودکار به نسخه‌ی قبلی برمی‌گردد**.
  - **هرگز دست نمی‌خورند:** `.env*`، دیتابیس‌ها (`*.db`)، آپلودها (`app/public/uploads`، `portfolio-web/data`) و `node_modules`.
- `scripts/deploy/bootstrap.sh`: یک بار روی هر سرور تازه (Node داخل ROOT، `.env`ها با secret تازه، سرویس‌های systemd روی 127.0.0.1، nginx در کانتینر جدا روی یک پورت). کنار پروژه‌های دیگر بدون تداخل؛ فایروال را دست نمی‌زند. ریشه با متغیر ریپو `DEPLOY_ROOT` تعیین می‌شود.
- `scripts/deploy/nginx.conf`: کانفیگ nginx همان کانتینر؛ هر deploy نصبش می‌کند (اول `nginx -t` و چک صفحه، وگرنه نسخه‌ی قبلی برمی‌گردد). فیلتر شبکه‌ی سرور هر URL حاوی `chunks` را روی HTTP به صفحه‌ی مسدودی می‌فرستد، پس فایل‌های `_next/static/chunks` با مسیر `_next/static/c` سرو و ارجاع‌ها با `sub_filter` بازنویسی می‌شوند. با HTTPS دیگر لازم نیست.
- `scripts/deploy/selftest.sh`: در CI روی یک سرور جعلی اجرا می‌شود و diff، deploy و rollback را تست می‌کند. پاک نشدن env، دیتابیس و آپلود و برگشتن کد بعد از restart ناموفق را چک می‌کند.

## راه‌اندازی (یک بار — کار شما، چون کلید و دسترسی سرور فقط دست شماست)

۱. روی لپ‌تاپ یک کلید **مخصوص deploy** بسازید (کلید شخصی‌تان را استفاده نکنید):

```bash
ssh-keygen -t ed25519 -N "" -C "github-actions-deploy" -f pushrsp_deploy
```

۲. روی سرور کلید عمومی را اضافه کنید. کاربری که deploy با آن انجام می‌شود باید بتواند در `/opt/pushrsp` بنویسد و `systemctl restart` بزند:

```bash
cat pushrsp_deploy.pub | ssh root@77.221.156.164 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && apt-get install -y rsync sqlite3'
```

۳. secretها را در GitHub بگذارید. کلید host را از خود سرور بگیرید و fingerprintش را با کنسول ارائه‌دهنده‌ی سرور مقایسه کنید:

```bash
gh secret set DEPLOY_HOST -b "77.221.156.164" -R AmirSarani/facksten-suite
gh secret set DEPLOY_USER -b "root" -R AmirSarani/facksten-suite
gh secret set DEPLOY_SSH_KEY -R AmirSarani/facksten-suite < pushrsp_deploy
ssh-keyscan -t ed25519 77.221.156.164 | gh secret set DEPLOY_KNOWN_HOSTS -R AmirSarani/facksten-suite
```

بعد فایل `pushrsp_deploy` (کلید خصوصی) را از لپ‌تاپ پاک کنید.

۴. **اول diff (فاز ۰):** در GitHub ← Actions ← Deploy ← Run workflow ← mode را `diff` بگذارید.
گزارش را بخوانید. هر فایلی که زیر «files on the server that GitHub doesn't have» آمده، پچی است که فقط روی سرور است. اگر لازم است، قبل از deploy آن را به ریپو منتقل کنید.

۵. بعد mode را `deploy` بگذارید. اگر سالم بود، deploy خودکار را روشن کنید:

```bash
gh variable set DEPLOY_ENABLED -b true -R AmirSarani/facksten-suite
```

از این به بعد هر merge به `main` که CI آن سبز شود، خودکار روی سرور می‌رود.

## نکات

- در GitHub ← Settings ← Environments ← `production` می‌توانید «Required reviewers» بگذارید تا هر deploy منتظر تأیید شما بماند.
- برگشت دستی به یک commit قبلی: Run workflow با mode `deploy` و ref همان commit.
- طبق `docs/SERVER_HANDOFF.md`، رمز root سرور قبلاً لو رفته است. قبل از روشن کردن CD عوضش کنید، و اگر شد ورود با رمز را ببندید (`PasswordAuthentication no`).
- از شبکه‌ی لپ‌تاپ، سرور الان روی پورت‌های 22/80/443 جواب نمی‌دهد. اگر runner گیت‌هاب هم به آن نرسد (فایروال یا محدودیت جغرافیایی)، مرحله‌ی «Run on server» با timeout شکست می‌خورد. در آن صورت باید روی سرور اجازه‌ی SSH از بیرون داده شود.
