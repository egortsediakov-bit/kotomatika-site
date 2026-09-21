# Ссылки для рекламы Яндекс Бизнес — Котоматика

Архитектура V2: главная остаётся общей конверсионной страницей, а конкретные объявления ведут на релевантные посадочные страницы.

| Реклама | URL |
|---|---|
| Онлайн-школа математики / общий оффер | https://kotomatika.ru/ |
| Индивидуальные занятия / репетитор | https://kotomatika.ru/individual/ |
| Подготовка к ОГЭ | https://kotomatika.ru/oge/ |
| Подготовка к ЕГЭ | https://kotomatika.ru/ege/ |
| Групповые занятия | https://kotomatika.ru/groups/ |
| Олимпиадная математика | https://kotomatika.ru/olympiad/ |
| Математика 1–11 класс | https://kotomatika.ru/classes/ |
| Конкретный класс, например 6 | https://kotomatika.ru/classes/6/ |

## UTM-варианты

Рекомендуется добавлять метки, например:

- Общая: `https://kotomatika.ru/?utm_source=yandex_business&utm_medium=cpc&utm_campaign=general`
- ОГЭ: `https://kotomatika.ru/oge/?utm_source=yandex_business&utm_medium=cpc&utm_campaign=oge`
- ЕГЭ: `https://kotomatika.ru/ege/?utm_source=yandex_business&utm_medium=cpc&utm_campaign=ege`
- Индивидуально: `https://kotomatika.ru/individual/?utm_source=yandex_business&utm_medium=cpc&utm_campaign=individual`
- Группы: `https://kotomatika.ru/groups/?utm_source=yandex_business&utm_medium=cpc&utm_campaign=groups`

Форма уже отправляет в CRM полный `window.location.href`, поэтому UTM-метки сохраняются в поле источника заявки. Бэкенд менять не требуется.

## Метрика

V2 отправляет отдельные события: `oge_form_start/submit/success`, `ege_form_*`, `individual_form_*`, `groups_form_*`, а также общие `landing_form_start/submit/success`. Кнопки CTA тоже имеют отдельные цели.
