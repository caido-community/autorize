export const MUTATION_TYPES = [
  {
    label: "Header: Set",
    value: "HeaderReplace",
    tooltip:
      "Replace a header in the request. If header does not exist, it will be added.",
  },
  {
    label: "Header: Add",
    value: "HeaderAdd",
    tooltip: "Add a header to the request",
  },
  {
    label: "Header: Remove",
    value: "HeaderRemove",
    tooltip: "Remove a header from the request",
  },
  {
    label: "Cookie: Set",
    value: "CookieReplace",
    tooltip:
      "Replace a cookie in the request. If cookie does not exist, it will be added.",
  },
  {
    label: "Cookie: Add",
    value: "CookieAdd",
    tooltip: "Add a cookie to the request",
  },
  {
    label: "Cookie: Remove",
    value: "CookieRemove",
    tooltip: "Remove a cookie from the request",
  },
  {
    label: "Match and Replace",
    value: "RawMatchAndReplace",
    tooltip: "Match a pattern in the request and replace it with a value",
  },
] as const;
