import * as React from 'react'

import { Input } from '@/components/ui/input'

export interface TagListInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string[] | undefined
  onChange: (value: string[] | undefined) => void
  /** Separator regex for splitting (default: commas / newlines). */
  separator?: RegExp
}

const toText = (v: string[] | undefined) => (v ?? []).join(', ')

function parse(text: string, separator: RegExp): string[] | undefined {
  const list = text
    .split(separator)
    .map(s => s.trim())
    .filter(Boolean)
  return list.length ? list : undefined
}

const sameList = (a: string[] | undefined, b: string[] | undefined) =>
  (a ?? []).length === (b ?? []).length && (a ?? []).every((x, i) => x === (b ?? [])[i])

/** Comma-separated list input (e.g. include/exclude tags, languages, paths). Keeps raw text while typing. */
export function TagListInput({ value, onChange, separator = /[,\n]/, ...props }: TagListInputProps) {
  const [text, setText] = React.useState(() => toText(value))
  const [prev, setPrev] = React.useState(value)
  if (value !== prev) {
    setPrev(value)
    if (!sameList(parse(text, separator), value)) setText(toText(value))
  }
  return (
    <Input
      value={text}
      onChange={e => {
        setText(e.target.value)
        const next = parse(e.target.value, separator)
        if (!sameList(next, value)) onChange(next)
      }}
      {...props}
    />
  )
}
