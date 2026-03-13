# SDK

Generated artifacts:

- `warhammerApiV1Client.mjs`
- `warhammerApiV1Client.d.ts`

Generation:

```bash
npm run sdk:generate
```

Verification:

```bash
npm run sdk:check
```

Package-style import:

```js
import { createWarhammerApiClient } from "warhammer-api/sdk";

const client = createWarhammerApiClient({
  baseUrl: "http://localhost:3000",
});

const { data } = await client.getOverview();
```

Direct asset import:

```js
import { createWarhammerApiClient } from "/sdk/warhammerApiV1Client.mjs";
```
