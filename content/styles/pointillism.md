
```dataview
TABLE date as "Date", style as "style", "![anyName|300](" + image + ")" AS "Cover"
FROM "art"
WHERE contains(style,"pointillism")
SORT date
```
