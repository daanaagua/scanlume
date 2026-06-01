"use client";

import { useState } from "react";

type Props = {
  examples: Record<string, string>;
};

export function CodeExampleTabs({ examples }: Props) {
  const labels = Object.keys(examples);
  const [active, setActive] = useState(labels[0] ?? "");

  return (
    <div className="code-example-tabs">
      <div aria-label="Code examples" className="code-example-tablist" role="tablist">
        {labels.map((label) => (
          <button
            key={label}
            aria-selected={active === label}
            className={active === label ? "is-active" : ""}
            onClick={() => setActive(label)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <pre className="code-example-panel">
        <code>{examples[active] ?? ""}</code>
      </pre>
    </div>
  );
}
