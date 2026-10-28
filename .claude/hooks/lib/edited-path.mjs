#!/usr/bin/env node
// Reads a Claude Code or Cursor hook payload on stdin and prints the edited path.
// Prints nothing when the payload has no file path.

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  process.stdout.write(extractPath(raw));
});

function extractPath(input) {
  if (!input.trim()) {
    return "";
  }

  let data;
  try {
    data = JSON.parse(input);
  } catch {
    return "";
  }

  const toolInput = asObject(data.tool_input ?? data.toolInput);
  const candidates = [
    toolInput.file_path,
    toolInput.filePath,
    toolInput.path,
    toolInput.target_file,
    toolInput.targetFile,
    toolInput.file,
    data.file_path,
    data.filePath,
    data.path,
  ];
  const found = candidates.find(
    (value) => typeof value === "string" && value.length > 0,
  );
  return found ?? "";
}

function asObject(value) {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  if (value && typeof value === "object") {
    return value;
  }

  return {};
}
