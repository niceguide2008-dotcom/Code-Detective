# Code Detective Question Bank

## Reusable schema

Each question uses:

- `id`: globally unique question identifier
- `unitId`: curriculum unit identifier
- `marks`: mark value
- `type`: question type
- `question`: question text
- `topics`: searchable topic tags
- `answerOutline`: reusable answer structure
- `difficulty`: difficulty label

Unit-specific files can append questions without changing the schema. Unit 2 additions are exported from `index.js` and exposed as `window.CODE_DETECTIVE_QUESTION_BANK` for browser consumers.
