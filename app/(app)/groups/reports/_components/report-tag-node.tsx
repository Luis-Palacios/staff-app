"use client";

import type { PersonKey } from "@/lib/report-items";

import { mergeAttributes, Node } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import { createContext, useContext } from "react";

import { ReportPersonChip } from "./report-person-chip";

import { toPersonKey } from "@/lib/report-items";

/** The chip labels of the report being edited (rule 11), so two *Pablo*s tell themselves apart. */
export const ShortNamesContext = createContext<ReadonlyMap<PersonKey, string>>(
  new Map(),
);

function TagView({ node }: NodeViewProps) {
  const shortNames = useContext(ShortNamesContext);
  const person = {
    type: node.attrs.personType as "member" | "guest",
    id: node.attrs.personId as number,
    name: node.attrs.name as string,
  };

  return (
    <NodeViewWrapper as="span" className="mx-px" contentEditable={false}>
      <ReportPersonChip
        label={
          shortNames.get(toPersonKey(person)) ??
          person.name.split(/\s+/)[0] ??
          person.name
        }
        person={person}
      />
    </NodeViewWrapper>
  );
}

/** A tagged person inside an item: one atom, so the caret moves over it and Backspace removes it. */
export const PersonTag = Node.create({
  name: "personTag",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  addAttributes() {
    return {
      personType: { default: "member" },
      personId: { default: 0 },
      name: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-person-tag]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-person-tag": "" }, HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TagView, { as: "span" });
  },
});
