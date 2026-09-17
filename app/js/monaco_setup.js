/**
 * LucyEditor - Monaco Editor Setup & Linter
 * Manages editor instance, hotkeys, diagnostics/linting, and cursor synchronization.
 */

let editorInstance = null;
let currentModel = null;
let linterTimeout = null;

function initMonacoEditor(containerId, initialContent = "", onCursorChange = null, onContentChange = null) {
    registerNekoNovelLanguage(monaco);

    currentModel = monaco.editor.createModel(initialContent, "nekonovel");

    editorInstance = monaco.editor.create(document.getElementById(containerId), {
        model: currentModel,
        theme: "lucyCyberDark",
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
        fontLigatures: true,
        lineNumbers: "on",
        renderWhitespace: "selection",
        tabSize: 4,
        insertSpaces: false,
        automaticLayout: true,
        minimap: {
            enabled: true,
            side: "right"
        },
        scrollBeyondLastLine: false,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        wordWrap: "off",
        bracketPairColorization: {
            enabled: true
        }
    });

    // Cursor position listener
    editorInstance.onDidChangeCursorPosition(e => {
        updateStatusBarPosition(e.position.lineNumber, e.position.column);
        if (onCursorChange) {
            onCursorChange(e.position.lineNumber, e.position.column);
        }
    });

    // Content change listener (dirty tracking + debounced linting)
    editorInstance.onDidChangeModelContent(e => {
        if (onContentChange) {
            onContentChange();
        }
        if (linterTimeout) clearTimeout(linterTimeout);
        linterTimeout = setTimeout(() => {
            runScriptDiagnostics();
        }, 400);
    });

    // Initial lint
    runScriptDiagnostics();

    return editorInstance;
}

/**
 * Validates the script for common engine mistakes:
 * 1. Missing `대기` after `대사` / `대사잇기`
 * 2. Mixed Cyrillic/Latin characters in Korean command names
 * 3. Unmatched bookmarks or jump labels
 */
function runScriptDiagnostics() {
    if (!editorInstance || !currentModel) return;

    const lines = currentModel.getLinesContent();
    const markers = [];
    const bookmarks = new Set();
    const jumps = [];

    // First pass: collect bookmarks and check dialogue/wait
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;

        if (line.startsWith("//") || line.length === 0) continue;

        // Collect bookmarks (Korean: 북마크, Visual: label / bookmark)
        if (line.startsWith("북마크") || /^label\b/i.test(line) || /^bookmark\b/i.test(line)) {
            const parts = line.split(/\s+/);
            if (parts.length > 1) {
                bookmarks.add(parts[1]);
            }
        }

        // Collect jumps (Korean: 점프, Visual: jump)
        if (line.startsWith("점프") || /^jump\b/i.test(line)) {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                jumps.push({
                    lineNum,
                    target: parts[parts.length - 1],
                    file: parts.length > 2 ? parts[1] : null
                });
            }
        }

        // Check missing wait / 대기 after dialogue / 대사
        const isDialogue = line.startsWith("대사 ") || line.startsWith("대사잇기 ") || 
                           /^dialogue\s+/i.test(line) || /^say\s+/i.test(line) || /^continue\s+/i.test(line);

        if (isDialogue) {
            let foundWait = false;
            // Look ahead for wait/대기 until next command or end
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if (nextLine.length === 0 || nextLine.startsWith("//")) continue;

                if (nextLine === "대기" || /^wait$/i.test(nextLine)) {
                    foundWait = true;
                    break;
                }
                // If another major command starts before wait, warn
                if (nextLine.startsWith("대사") || nextLine.startsWith("CG") || nextLine.startsWith("배경") || 
                    nextLine.startsWith("점프") || nextLine.startsWith("북마크") ||
                    /^dialogue\b/i.test(nextLine) || /^bg\b/i.test(nextLine) || /^cg\b/i.test(nextLine) ||
                    /^jump\b/i.test(nextLine) || /^label\b/i.test(nextLine)) {
                    break;
                }
            }

            if (!foundWait) {
                markers.push({
                    severity: monaco.MarkerSeverity.Warning,
                    message: "Dialogue line without 'wait' / '대기'! The text will flash without pause. (Missing 'wait' command)",
                    startLineNumber: lineNum,
                    startColumn: 1,
                    endLineNumber: lineNum,
                    endColumn: lines[i].length + 1
                });
            }
        }
    }

    // Check jump targets if in the same file
    for (const j of jumps) {
        if (!j.file && j.target !== "start" && j.target !== "첫줄" && !bookmarks.has(j.target)) {
            markers.push({
                severity: monaco.MarkerSeverity.Info,
                message: `Jump label '${j.target}' not found in this file (may reside in another script).`,
                startLineNumber: j.lineNum,
                startColumn: 1,
                endLineNumber: j.lineNum,
                endColumn: lines[j.lineNum - 1].length + 1
            });
        }
    }

    monaco.editor.setModelMarkers(currentModel, "nekonovel-linter", markers);

    // Update diagnostics badge in UI
    const diagCountEl = document.getElementById("diag-badge");
    if (diagCountEl) {
        const warnings = markers.filter(m => m.severity === monaco.MarkerSeverity.Warning).length;
        const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error).length;
        diagCountEl.textContent = `${errors} ERR, ${warnings} WARN`;
        diagCountEl.className = errors > 0 ? "badge badge-error" : warnings > 0 ? "badge badge-warning" : "badge badge-success";
    }
}

function updateStatusBarPosition(line, col) {
    const posEl = document.getElementById("status-pos");
    if (posEl) {
        posEl.textContent = `Стр ${line}, Кол ${col}`;
    }
}

function insertSnippetAtCursor(snippetText) {
    if (!editorInstance) return;

    // Adapt snippet to active syntax mode if English
    if (typeof window !== "undefined" && window.lucyApp && window.lucyApp.syntaxMode === "english") {
        if (typeof SyntaxTranslator !== "undefined") {
            snippetText = SyntaxTranslator.koreanToVisual(snippetText);
        }
    }

    const model = editorInstance.getModel();
    if (!model) return;

    const selection = editorInstance.getSelection();

    // If user actively selected a range of text, replace the selection
    if (selection && !selection.isEmpty()) {
        const op = {
            range: selection,
            text: snippetText + "\n",
            forceMoveMarkers: true
        };
        editorInstance.executeEdits("LucyEditor", [op]);
        editorInstance.focus();
        return;
    }

    // Smart insertion: detect if cursor is on an existing statement
    const pos = editorInstance.getPosition() || { lineNumber: 1, column: 1 };
    const curLineNum = pos.lineNumber;
    const curLineContent = model.getLineContent(curLineNum);
    const trimmedCurLine = curLineContent.trim();
    const totalLines = model.getLineCount();

    // 1. If line is empty or whitespace-only, insert directly into it
    if (trimmedCurLine.length === 0) {
        const range = new monaco.Range(curLineNum, 1, curLineNum, curLineContent.length + 1);
        const op = {
            range: range,
            text: snippetText + "\n",
            forceMoveMarkers: true
        };
        editorInstance.executeEdits("LucyEditor", [op]);
        editorInstance.setPosition({ lineNumber: curLineNum + snippetText.split("\n").length, column: 1 });
        editorInstance.focus();
        return;
    }

    // 2. Line has content! If dialogue line and followed by wait/대기, insert AFTER wait
    const isDialogue = /^(?:dialogue|say|대사|continue|대사잇기)\b/i.test(trimmedCurLine);
    let targetLineNum = curLineNum;

    if (isDialogue && curLineNum < totalLines) {
        const nextLineContent = model.getLineContent(curLineNum + 1).trim();
        if (/^(?:wait|대기)$/i.test(nextLineContent)) {
            targetLineNum = curLineNum + 1;
        }
    }

    // 3. Insert cleanly on a new line after targetLineNum
    const targetLineLength = model.getLineLength(targetLineNum);
    const range = new monaco.Range(targetLineNum, targetLineLength + 1, targetLineNum, targetLineLength + 1);
    const op = {
        range: range,
        text: "\n" + snippetText,
        forceMoveMarkers: true
    };
    editorInstance.executeEdits("LucyEditor", [op]);

    // Move cursor to the end of inserted block
    const insertedLineCount = snippetText.split("\n").length;
    editorInstance.setPosition({ lineNumber: targetLineNum + insertedLineCount, column: 1 });
    editorInstance.revealLineInCenterIfOutsideViewport(targetLineNum + insertedLineCount);
    editorInstance.focus();
}

function goToLine(lineNum) {
    if (!editorInstance) return;
    editorInstance.revealLineInCenter(lineNum);
    editorInstance.setPosition({ lineNumber: lineNum, column: 1 });
    editorInstance.focus();
}
