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

    lines.push("# Autorize Export Results");
    lines.push("");
    lines.push("| ID | Method | URL | Baseline | Mutated | No-Auth |");
    lines.push("|:--:|:------:|-----|:--------:|:-------:|:-------:|");

    for (const item of exportData) {
      const baseline = item.baseline
        ? `${item.baseline.code} (${item.baseline.length})`
        : "-";
      const mutated = item.mutated.data
        ? `${item.mutated.data.code} (${item.mutated.data.length}) ${formatAccessState(item.mutated.access)}`
        : "-";
      const noAuth = item.noAuth.data
        ? `${item.noAuth.data.code} (${item.noAuth.data.length}) ${formatAccessState(item.noAuth.access)}`
        : "-";

      const escapedUrl = item.url.replace(/\|/g, "\\|");
      lines.push(
        `| ${item.id} | ${item.method} | ${escapedUrl} | ${baseline} | ${mutated} | ${noAuth} |`,
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

      if (item.mutated.data) {
        lines.push("<details>");
        lines.push(
          `<summary><strong>Mutated</strong> - ${item.mutated.data.code} (${item.mutated.data.length} bytes) - ${formatAccessState(item.mutated.access)}</summary>`,
        );
        lines.push("");
        lines.push("**Request:**");
        lines.push("```http");
        lines.push(item.mutated.data.requestRaw);
        lines.push("```");
        lines.push("");
        lines.push("**Response:**");
        lines.push("```http");
        lines.push(item.mutated.data.responseRaw);
        lines.push("```");
        lines.push("</details>");
        lines.push("");
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
    const headers = [
      "ID",
      "Method",
      "URL",
      "Baseline Code",
      "Baseline Length",
      "Baseline Request",
      "Baseline Response",
      "Mutated Code",
      "Mutated Length",
      "Mutated Access",
      "Mutated Request",
      "Mutated Response",
      "No-Auth Code",
      "No-Auth Length",
      "No-Auth Access",
      "No-Auth Request",
      "No-Auth Response",
    ];

    const headerRow = headers.join(",");

    const dataRows = exportData.map((item) => {
      return [
        item.id,
        item.method,
        escapeCSV(item.url),
        item.baseline?.code ?? "",
        item.baseline?.length ?? "",
        escapeCSV(item.baseline?.requestRaw ?? ""),
        escapeCSV(item.baseline?.responseRaw ?? ""),
        item.mutated.data?.code ?? "",
        item.mutated.data?.length ?? "",
        item.mutated.access ?? "",
        escapeCSV(item.mutated.data?.requestRaw ?? ""),
        escapeCSV(item.mutated.data?.responseRaw ?? ""),
        item.noAuth.data?.code ?? "",
        item.noAuth.data?.length ?? "",
        item.noAuth.access ?? "",
        escapeCSV(item.noAuth.data?.requestRaw ?? ""),
        escapeCSV(item.noAuth.data?.responseRaw ?? ""),
      ].join(",");
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
