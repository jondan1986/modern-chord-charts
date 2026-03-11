
"use client";

import React, { useState, useEffect } from "react";
import { MCSParser } from "@/src/mcs-core/parser";
import { SongViewer } from "@/src/components/viewer/SongViewer";
import { DEFAULT_THEME, DARK_THEME } from "@/src/components/viewer/themes";
import { Song, Theme, SongMetadata } from "@/src/mcs-core/model";
import Link from "next/link";
import { useAppStore } from "@/src/state/store";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import { InsertSectionModal } from "@/src/components/editor/InsertSectionModal";
import { EditMetadataModal } from "@/src/components/modals/EditMetadataModal";
import { ManageArrangementsModal } from "@/src/components/editor/ManageArrangementsModal";
import { parseDocument } from "yaml";

export default function EditorPage() {
    // Global Store
    const activeYaml = useAppStore((state) => state.activeYaml);
    const setActiveYaml = useAppStore((state) => state.setActiveYaml);
    const saveCurrentSong = useAppStore((state) => state.saveCurrentSong);
    const activeSongId = useAppStore((state) => state.activeSongId);
    const resetSong = useAppStore((state) => state.resetSong);
    const router = useRouter();

    // Local State
    const [parsedSong, setParsedSong] = useState<Song | null>(null);
    const [error, setError] = useState<string | null>(null);
    const theme = useAppStore((state) => state.theme);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [selectedTextForModal, setSelectedTextForModal] = useState("");
    const [selectedRangeForModal, setSelectedRangeForModal] = useState<any>(null);
    const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
    const [isArrangementsModalOpen, setIsArrangementsModalOpen] = useState(false);

    // Check if component mounted client-side
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Check for Ctrl+S or Cmd+S
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
                e.preventDefault(); // Stop browser save dialog
                e.stopPropagation(); // Stop event bubbling

                if (e.shiftKey) {
                    // Save As New (Ctrl+Shift+S)
                    const currentYaml = useAppStore.getState().activeYaml;
                    const newId = await import("@/src/services/storage").then(m => m.songStorage.saveSong(currentYaml));
                    useAppStore.setState({ activeSongId: newId, lastSavedYaml: currentYaml });
                    console.log("Saved as new song:", newId);
                } else {
                    // Save Existing (Ctrl+S)
                    await useAppStore.getState().saveCurrentSong();
                    console.log("Saved song");
                }
            }

            // Open: Ctrl+O
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyO') {
                e.preventDefault();
                router.push("/");
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [router]);

    const editorRef = React.useRef<any>(null); // Type 'any' for now to avoid specific Monaco types dependency
    const monacoRef = React.useRef<any>(null);

    const updateMarkers = (err: any) => {
        if (!monacoRef.current || !editorRef.current) return;
        const monaco = monacoRef.current;
        const model = editorRef.current.getModel();

        if (!err) {
            monaco.editor.setModelMarkers(model, "owner", []);
            return;
        }

        const markers = [];

        // Handle YAML Syntax Errors
        if (err.code === "YAML_SYNTAX_ERROR" && err.linePos) {
            const startLine = err.linePos[0].line;
            const startCol = err.linePos[0].col;
            const endLine = err.linePos[1].line;
            const endCol = err.linePos[1].col;

            markers.push({
                startLineNumber: startLine,
                startColumn: startCol,
                endLineNumber: endLine,
                endColumn: endCol,
                message: err.message,
                severity: monaco.MarkerSeverity.Error,
            });
        }
        // Handle Zod Validation Errors (generic for now, mapped to line 1 unless we map paths)
        else if (err.code === "ZOD_VALIDATION_ERROR") {
            markers.push({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1000,
                message: err.message,
                severity: monaco.MarkerSeverity.Error,
            });
        }
        // Fallback
        else {
            markers.push({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
                message: err.message || "Unknown error",
                severity: monaco.MarkerSeverity.Error,
            });
        }

        monaco.editor.setModelMarkers(model, "owner", markers);
    };

    const insertSnippet = (snippet: string, range?: any) => {
        if (!editorRef.current) return;

        const editor = editorRef.current;
        const selection = range || editor.getSelection();
        const text = snippet;
        const op = { range: selection, text: text, forceMoveMarkers: true };
        editor.executeEdits("my-source", [op]);
        editor.focus();
    };

    const handleSectionInsert = (snippet: string) => {
        if (selectedRangeForModal && editorRef.current) {
            const editor = editorRef.current;
            const model = editor.getModel();
            const lineCount = model.getLineCount();

            // 1. Remove the selection (Cut)
            const deleteOp = { range: selectedRangeForModal, text: "", forceMoveMarkers: true };

            // 2. Append to end of file
            // Check if last line is empty or not to determine if we need a newline
            const lastLineContent = model.getLineContent(lineCount);
            let appendText = snippet;
            if (lastLineContent.trim() !== "") {
                appendText = "\n" + snippet;
            } else {
                // If last line is just whitespace or empty
                // We might want to ensure we are appending distinctly.
                // safe bet is usually just \n
                appendText = "\n" + snippet;
            }

            const endRange = {
                startLineNumber: lineCount + 1,
                startColumn: 1,
                endLineNumber: lineCount + 1,
                endColumn: 1
            };

            editor.executeEdits("my-source", [
                deleteOp,
                { range: endRange, text: appendText, forceMoveMarkers: true }
            ]);

            // Scroll to bottom to show new section
            editor.revealLine(lineCount + 10); // +10 to be safe
            editor.focus();
        } else {
            // No selection captured (e.g. just clicked button without selection)
            // Just insert at cursor or append? 
            // Default behavior was insert at cursor. User request implies "the highlighted section...".
            // If no highlight, maybe regular insert is fine.
            insertSnippet(snippet);
        }

        // Clear selection state after insert
        setSelectedRangeForModal(null);
        setSelectedTextForModal("");
    };

    const handleMetadataSave = (newMetadata: SongMetadata) => {
        try {
            const doc = parseDocument(activeYaml);

            if (!doc.has("metadata")) {
                doc.set("metadata", {});
            }

            // Iterate over keys and set them
            Object.keys(newMetadata).forEach(key => {
                const val = (newMetadata as any)[key];
                // Handle different types if needed, but yaml lib handles primitives well
                if (val !== undefined && val !== "") {
                    doc.setIn(["metadata", key], val);
                } else {
                    if (val === undefined) {
                        doc.deleteIn(["metadata", key]);
                    } else {
                        doc.setIn(["metadata", key], val);
                    }
                }
            });

            const newYaml = doc.toString();
            handleYamlChange(newYaml);

        } catch (e) {
            console.error("Failed to update metadata", e);
            alert("Failed to update metadata. Check console.");
        }
    };


    const handleArrangementsSave = (arrangements: any[]) => {
        try {
            // Need to import Arrangement type for strictness but any is okay for quick dev as we pass it back
            const doc = parseDocument(activeYaml);

            if (arrangements.length === 0) {
                if (doc.has("arrangements")) {
                    doc.delete("arrangements");
                }
            } else {
                doc.set("arrangements", arrangements);
            }

            const newYaml = doc.toString();
            handleYamlChange(newYaml);

        } catch (e) {
            console.error("Failed to update arrangements", e);
            alert("Failed to update arrangements. Check console.");
        }
    };

    // Initial Load from Store
    useEffect(() => {
        // Attempt to parse the starting YAML immediately
        try {
            const song = MCSParser.parse(activeYaml);
            setParsedSong(song);
        } catch (err) {
            // If initial store is invalid, that's okay, just don't crash
        }
    }, []);

    const handleYamlChange = (newYaml: string) => {
        setActiveYaml(newYaml); // Update global store

        try {
            const song = MCSParser.parse(newYaml);
            setParsedSong(song);
            setError(null); // Clear error on success

            // Clear markers
            updateMarkers(null);

        } catch (err: any) {
            setError(err.message);
            // Don't update parsedSong, keep old view

            // Set markers
            updateMarkers(err);
        }
    };



    const handleOpenSectionModal = () => {
        if (editorRef.current) {
            const selection = editorRef.current.getSelection();
            if (selection && !selection.isEmpty()) {
                const text = editorRef.current.getModel()?.getValueInRange(selection);
                setSelectedTextForModal(text || "");
                setSelectedRangeForModal(selection);
            } else {
                setSelectedTextForModal("");
                setSelectedRangeForModal(null);
            }
        }
        setIsSectionModalOpen(true);
    };

    return (
        <div
            className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900"
        >
            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Editor Pane (Left) */}
                <div
                    className="w-1/2 flex flex-col border-r relative border-gray-400 dark:border-gray-600"
                >
                    {/* Toolbar */}
                    <div
                        className="flex items-center gap-2 p-2 border-b overflow-x-auto bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-600"
                    >
                        <button
                            onClick={handleOpenSectionModal}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
                        >
                            + New Section
                        </button>

                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                        <button
                            onClick={() => setIsMetadataModalOpen(true)}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
                        >
                            Edit Metadata
                        </button>
                        <button
                            onClick={() => setIsArrangementsModalOpen(true)}
                            className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
                        >
                            Arrangements
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-2 text-xs font-mono border-b border-red-200">
                            Syntax Error: {error.split('\n')[0]}
                        </div>
                    )}

                    <div
                        className="flex-1 w-full relative bg-white dark:bg-[#1e1e1e]"
                    >
                        <Editor
                            height="100%"
                            defaultLanguage="yaml"
                            theme={theme.name === 'Dark Mode' ? 'vs-dark' : 'light'}
                            value={activeYaml}
                            onChange={(value) => handleYamlChange(value || "")}
                            onMount={(editor, monaco) => {
                                editorRef.current = editor;
                                monacoRef.current = monaco;

                                editor.addAction({
                                    id: 'create-section-from-selection',
                                    label: 'Create New Section from Selection',
                                    contextMenuGroupId: '1_modification',
                                    contextMenuOrder: 1,
                                    run: (ed: any) => {
                                        const selection = ed.getSelection();
                                        if (selection && !selection.isEmpty()) {
                                            const text = ed.getModel()?.getValueInRange(selection);
                                            setSelectedTextForModal(text || "");
                                            setSelectedRangeForModal(selection);
                                            setIsSectionModalOpen(true);
                                        } else {
                                            // If no selection, just open empty
                                            setSelectedTextForModal("");
                                            setSelectedRangeForModal(null);
                                            setIsSectionModalOpen(true);
                                        }
                                    }
                                });
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: true,
                                automaticLayout: true,
                                tabSize: 2,
                                renderWhitespace: 'selection',
                            }}
                        />
                    </div>
                </div>

                {/* Preview Pane (Right) */}
                <div
                    className="w-1/2 overflow-y-auto relative bg-white dark:bg-gray-900"
                >
                    {parsedSong ? (
                        <div className="p-8 pb-40">
                            <SongViewer song={parsedSong} theme={theme} forceSingleColumn />
                        </div>
                    ) : (
                        <div className="p-10 text-gray-400 text-center">
                            {/* Fallback if no song is parsed yet */}
                            Start typing to see the Chart...
                        </div>
                    )}
                </div>
            </div>

            <InsertSectionModal
                isOpen={isSectionModalOpen}
                onClose={() => setIsSectionModalOpen(false)}
                onInsert={handleSectionInsert}
                initialLines={selectedTextForModal}
            />

            <EditMetadataModal
                isOpen={isMetadataModalOpen}
                onClose={() => setIsMetadataModalOpen(false)}
                initialMetadata={parsedSong?.metadata}
                onSave={handleMetadataSave}
            />

            <ManageArrangementsModal
                isOpen={isArrangementsModalOpen}
                onClose={() => setIsArrangementsModalOpen(false)}
                sections={parsedSong?.sections || []}
                existingArrangements={parsedSong?.arrangements || []}
                onSave={handleArrangementsSave}
            />        </div>
    );
}
