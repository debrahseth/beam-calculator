"use client";

import { useState, useEffect } from "react";

export default function DynamicHtml({ children }) {
  const [cursorStyle, setCursorStyle] = useState(true);
  const [effectActive, setEffectActive] = useState(true);

  useEffect(() => {}, []);

  return (
    <html
      lang="en"
      data-cursorstyle={cursorStyle}
      data-effect-ective={effectActive}
    >
      {children}
    </html>
  );
}
