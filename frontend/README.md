# ZILAL TRAVEL — визуальный прототип

Главная страница на Next.js App Router, TypeScript и Tailwind CSS. Только локальные данные, без API, авторизации или отправки заявок.

## Запуск в Windows (PowerShell)

Установите Node.js 24 LTS. В PowerShell перейдите в папку проекта, затем:

```powershell
cd frontend
npm ci
npm run dev
```

Откройте http://localhost:3000. Остановить сайт: Ctrl+C. При блокировке `npm.ps1` используйте `npm.cmd ci` и `npm.cmd run dev`.

Проверка перед выпуском:

```powershell
npm run build
npm run typecheck
```

## Контент и оформление

- `data/content/ru.ts` — тексты интерфейса и главной.
- `data/content/en.ts` — английский словарь с проверкой структуры; переключатель языков и отдельные маршруты пока не добавлены.
- `data/content/index.ts` — выбор текущего словаря.
- `data/*.ts` — русские демонстрационные туры, направления, впечатления, журнал, галерея и отзывы. При добавлении английской версии коллекции также нужно перевести.
- `app/globals.css` — цвета, типографика, сетка и адаптивные стили; Tailwind v4 подключён через PostCSS, цвета и шрифты зарегистрированы через `@theme`.
- `public/images/*.svg` — оригинальные пейзажные плейсхолдеры. Это иллюстрации, а не фотографии.

Обновлённая светлая палитра: молочный фон `#FFFDF8`, тёмный `#173849`, озёрный акцент `#007F89`, разделители `#DCE7E7`. Cormorant Garamond и Manrope с кириллицей поставляются локально через Fontsource. Fontsource нужен для автономной загрузки шрифтов; дополнительных библиотек интерфейса или анимации нет.

Hero использует локальную иллюстрацию: старый сайт и `images/hero.jpg` в текущем checkout отсутствовали. Когда фото будет доступно, сохраните оригинал в корне, скопируйте фото в `frontend/public/images/hero.jpg` и замените путь в `components/home/Home.tsx`. Все изображения отображаются через `next/image`; SVG не требуют растрового сжатия. Растровые фото Next.js будет оптимизировать автоматически.

Навигация ведёт к разделам этой главной. Карточки впечатлений и направлений ведут к финальному блоку; карточки журнала пока не открывают статьи. Кнопка в финальном блоке открывает доступный диалог с выбором интересов. Данные не отправляются и не сохраняются после перезагрузки. Все цены и отзывы обозначены как демонстрационные, контакты не выдуманы. Поисковая индексация прототипа отключена.

## Созданные файлы

```text
frontend/
  .gitignore
  README.md
  package.json
  package-lock.json
  tsconfig.json
  next-env.d.ts
  postcss.config.mjs
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    ui/Primitives.tsx
    ui/Reveal.tsx
    layout/Header.tsx
    layout/Footer.tsx
    home/Home.tsx
    home/TravelIdea.tsx
  data/
    content/ru.ts
    content/en.ts
    content/index.ts
    tours.ts
    destinations.ts
    experiences.ts
    journal.ts
    gallery.ts
    reviews.ts
  types/content.ts
  public/images/
    lake.svg
    mountains.svg
    steppe.svg
    valley.svg
```

`node_modules/`, `.next/` и `*.tsbuildinfo` — локальные зависимости и результаты сборки, исключены из Git.
