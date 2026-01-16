import type { TemplateExportData } from "backend";
import type { Template } from "shared";

import { useSDK } from "@/plugins/sdk";
import { useTemplatesStore } from "@/stores/templates";

export function useExport() {
  const sdk = useSDK();
  const store = useTemplatesStore();

  const formatAccessState = (access: string | undefined): string => {
    if (access === undefined) return "-";
    return access.toUpperCase();
  };

  const escapeCSV = (text: string): string => {
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const generateMarkdownTable = (exportData: TemplateExportData[]): string => {
    const lines: string[] = [];

    const allUserProfiles = new Map<string, string>();
    for (const item of exportData) {
      for (const result of item.mutatedResults) {
        const key = result.userProfileId ?? "default";
        const name = result.userProfileName ?? "Mutated";
        if (!allUserProfiles.has(key)) {
          allUserProfiles.set(key, name);
        }
      }
    }

    const userProfileNames = Array.from(allUserProfiles.values());
    const mutatedHeaders =
      userProfileNames.length > 0 ? userProfileNames.join(" | ") : "Mutated";

    lines.push("# Autorize Export Results");
    lines.push("");
    lines.push(
      `| ID | Method | URL | Baseline | ${mutatedHeaders} | No-Auth |`,
    );
    lines.push(
      `|:--:|:------:|-----|:--------:|${userProfileNames.map(() => ":-------:").join("|") || ":-------:"}|:-------:|`,
    );

    for (const item of exportData) {
      const baseline = item.baseline
        ? `${item.baseline.code} (${item.baseline.length})`
        : "-";

      const mutatedCols: string[] = [];
      for (const [key] of allUserProfiles) {
        const result = item.mutatedResults.find(
          (r) => (r.userProfileId ?? "default") === key,
        );
        if (result?.data) {
          mutatedCols.push(
            `${result.data.code} (${result.data.length}) ${formatAccessState(result.access)}`,
          );
        } else {
          mutatedCols.push("-");
        }
      }

      const mutatedStr =
        mutatedCols.length > 0
          ? mutatedCols.join(" | ")
          : item.mutatedResults[0]?.data
            ? `${item.mutatedResults[0].data.code} (${item.mutatedResults[0].data.length}) ${formatAccessState(item.mutatedResults[0].access)}`
            : "-";

      const noAuth = item.noAuth.data
        ? `${item.noAuth.data.code} (${item.noAuth.data.length}) ${formatAccessState(item.noAuth.access)}`
        : "-";

      const escapedUrl = item.url.replace(/\|/g, "\\|");
      lines.push(
        `| ${item.id} | ${item.method} | ${escapedUrl} | ${baseline} | ${mutatedStr} | ${noAuth} |`,
      );
    }

    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Detailed Request/Response Data");
    lines.push("");

    for (const item of exportData) {
      lines.push(`### Template #${item.id}`);
      lines.push("");

      if (item.baseline) {
        lines.push("<details>");
        lines.push(
          `<summary><strong>Baseline</strong> - ${item.baseline.code} (${item.baseline.length} bytes)</summary>`,
        );
        lines.push("");
        lines.push("**Request:**");
        lines.push("```http");
        lines.push(item.baseline.requestRaw);
        lines.push("```");
        lines.push("");
        lines.push("**Response:**");
        lines.push("```http");
        lines.push(item.baseline.responseRaw);
        lines.push("```");
        lines.push("</details>");
        lines.push("");
      }

      for (const mutatedResult of item.mutatedResults) {
        if (mutatedResult.data) {
          const userName = mutatedResult.userProfileName ?? "Mutated";
          lines.push("<details>");
          lines.push(
            `<summary><strong>${userName}</strong> - ${mutatedResult.data.code} (${mutatedResult.data.length} bytes) - ${formatAccessState(mutatedResult.access)}</summary>`,
          );
          lines.push("");
          lines.push("**Request:**");
          lines.push("```http");
          lines.push(mutatedResult.data.requestRaw);
          lines.push("```");
          lines.push("");
          lines.push("**Response:**");
          lines.push("```http");
          lines.push(mutatedResult.data.responseRaw);
          lines.push("```");
          lines.push("</details>");
          lines.push("");
        }
      }

      if (item.noAuth.data) {
        lines.push("<details>");
        lines.push(
          `<summary><strong>No-Auth</strong> - ${item.noAuth.data.code} (${item.noAuth.data.length} bytes) - ${formatAccessState(item.noAuth.access)}</summary>`,
        );
        lines.push("");
        lines.push("**Request:**");
        lines.push("```http");
        lines.push(item.noAuth.data.requestRaw);
        lines.push("```");
        lines.push("");
        lines.push("**Response:**");
        lines.push("```http");
        lines.push(item.noAuth.data.responseRaw);
        lines.push("```");
        lines.push("</details>");
        lines.push("");
      }

      lines.push("---");
      lines.push("");
    }

    return lines.join("\n");
  };

  const generateCSV = (exportData: TemplateExportData[]): string => {
    const allUserProfiles = new Map<string, string>();
    for (const item of exportData) {
      for (const result of item.mutatedResults) {
        const key = result.userProfileId ?? "default";
        const name = result.userProfileName ?? "Mutated";
        if (!allUserProfiles.has(key)) {
          allUserProfiles.set(key, name);
        }
      }
    }

    const userProfileEntries = Array.from(allUserProfiles.entries());

    const headers = [
      "ID",
      "Method",
      "URL",
      "Baseline Code",
      "Baseline Length",
      "Baseline Request",
      "Baseline Response",
    ];

    for (const [, name] of userProfileEntries) {
      headers.push(`${name} Code`);
      headers.push(`${name} Length`);
      headers.push(`${name} Access`);
      headers.push(`${name} Request`);
      headers.push(`${name} Response`);
    }

    if (userProfileEntries.length === 0) {
      headers.push("Mutated Code");
      headers.push("Mutated Length");
      headers.push("Mutated Access");
      headers.push("Mutated Request");
      headers.push("Mutated Response");
    }

    headers.push("No-Auth Code");
    headers.push("No-Auth Length");
    headers.push("No-Auth Access");
    headers.push("No-Auth Request");
    headers.push("No-Auth Response");

    const headerRow = headers.join(",");

    const dataRows = exportData.map((item) => {
      const row: (string | number)[] = [
        item.id,
        item.method,
        escapeCSV(item.url),
        item.baseline?.code ?? "",
        item.baseline?.length ?? "",
        escapeCSV(item.baseline?.requestRaw ?? ""),
        escapeCSV(item.baseline?.responseRaw ?? ""),
      ];

      for (const [key] of userProfileEntries) {
        const result = item.mutatedResults.find(
          (r) => (r.userProfileId ?? "default") === key,
        );
        row.push(result?.data?.code ?? "");
        row.push(result?.data?.length ?? "");
        row.push(result?.access ?? "");
        row.push(escapeCSV(result?.data?.requestRaw ?? ""));
        row.push(escapeCSV(result?.data?.responseRaw ?? ""));
      }

      if (userProfileEntries.length === 0) {
        const firstMutated = item.mutatedResults[0];
        row.push(firstMutated?.data?.code ?? "");
        row.push(firstMutated?.data?.length ?? "");
        row.push(firstMutated?.access ?? "");
        row.push(escapeCSV(firstMutated?.data?.requestRaw ?? ""));
        row.push(escapeCSV(firstMutated?.data?.responseRaw ?? ""));
      }

      row.push(item.noAuth.data?.code ?? "");
      row.push(item.noAuth.data?.length ?? "");
      row.push(item.noAuth.access ?? "");
      row.push(escapeCSV(item.noAuth.data?.requestRaw ?? ""));
      row.push(escapeCSV(item.noAuth.data?.responseRaw ?? ""));

      return row.join(",");
    });

    return [headerRow, ...dataRows].join("\n");
  };

  const copyAsMarkdown = async (templates: Template[]) => {
    if (templates.length === 0) {
      sdk.window.showToast("No templates selected", { variant: "warning" });
      return;
    }

    const templateIds = templates.map((t) => t.id);
    const result = await sdk.backend.getTemplatesExportData(templateIds);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    const markdown = generateMarkdownTable(result.value);

    try {
      await navigator.clipboard.writeText(markdown);
      sdk.window.showToast(`Copied ${templates.length} templates as Markdown`, {
        variant: "success",
      });
    } catch {
      sdk.window.showToast("Failed to copy to clipboard", { variant: "error" });
    }
  };

  const exportAsCSV = async (templates: Template[]) => {
    if (templates.length === 0) {
      sdk.window.showToast("No templates selected", { variant: "warning" });
      return;
    }

    const templateIds = templates.map((t) => t.id);
    const result = await sdk.backend.getTemplatesExportData(templateIds);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    const csv = generateCSV(result.value);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `autorize-export-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    sdk.window.showToast(`Exported ${templates.length} templates as CSV`, {
      variant: "success",
    });
  };

  const copySelectedAsMarkdown = async () => {
    const selected = store.getSelectedTemplates();
    await copyAsMarkdown(selected);
  };

  const exportSelectedAsCSV = async () => {
    const selected = store.getSelectedTemplates();
    await exportAsCSV(selected);
  };

  const exportAsMarkdown = async (templates: Template[]) => {
    if (templates.length === 0) {
      sdk.window.showToast("No templates selected", { variant: "warning" });
      return;
    }

    const templateIds = templates.map((t) => t.id);
    const result = await sdk.backend.getTemplatesExportData(templateIds);

    if (result.kind === "Error") {
      sdk.window.showToast(result.error, { variant: "error" });
      return;
    }

    const markdown = generateMarkdownTable(result.value);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `autorize-export-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    sdk.window.showToast(`Exported ${templates.length} templates as Markdown`, {
      variant: "success",
    });
  };

  const exportSelectedAsMarkdown = async () => {
    const selected = store.getSelectedTemplates();
    await exportAsMarkdown(selected);
  };

  return {
    copyAsMarkdown,
    exportAsCSV,
    exportAsMarkdown,
    copySelectedAsMarkdown,
    exportSelectedAsCSV,
    exportSelectedAsMarkdown,
  };
}
