"use client";

import { useState } from "react";

type Props = {
  examples: Record<string, string>;
};

export function CodeExampleTabs({ examples }: Props) {
  const labels = Object.keys(examples);
  const [active, setActive] = useState(labels[0] ?? "");

  return (
    <div>
      <div aria-label="Code examples" role="tablist">
        {labels.map((label) => (
          <button
            key={label}
            aria-selected={active === label}
            onClick={() => setActive(label)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <pre>
        <code>{examples[active] ?? ""}</code>
      </pre>
    </div>
  );
}
