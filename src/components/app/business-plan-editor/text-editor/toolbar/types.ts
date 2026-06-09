import { EditorState, Command } from "prosemirror-state";

export interface ToolbarSectionProps {
  editorState: EditorState;
  executeCommand: (command: Command) => void;
  dossierId?: string;
}

export interface PageFormatState {
  format: string;
  orientation: "portrait" | "landscape";
  showPageNumbers: boolean;
}
