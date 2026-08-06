import {
  Copy,
  Palette,
  ImageIcon,
  CircleDashed,
  Layers,
  Scissors,
  Printer,
  ScanLine,
  FileText,
  Candy,
  Lollipop,
  Cookie,
  Popcorn,
  CupSoda,
  Pencil,
  PenLine,
  Eraser,
  Notebook,
  Folder,
  Mail,
  Paperclip,
  Ruler,
  Highlighter,
  Brush,
  Droplet,
  Droplets,
  Sparkles,
} from "lucide-react"
import type { ServiceIconKey } from "@/lib/pos-types"

const MAP = {
  "copy-bw": Copy,
  "copy-color": Palette,
  image: ImageIcon,
  ring: CircleDashed,
  laminate: Layers,
  scissors: Scissors,
  printer: Printer,
  scan: ScanLine,
  file: FileText,
  // Golosinas y snacks
  candy: Candy,
  lollipop: Lollipop,
  cookie: Cookie,
  chips: Popcorn,
  soda: CupSoda,
  // Librería y papelería
  pencil: Pencil,
  pen: PenLine,
  eraser: Eraser,
  notebook: Notebook,
  paper: FileText,
  folder: Folder,
  envelope: Mail,
  tape: Paperclip,
  ruler: Ruler,
  marker: Highlighter,
  // Aseo personal
  toothbrush: Brush,
  toothpaste: Droplet,
  floss: Sparkles,
  soap: Droplets,
  tissue: Layers,
} as const

export const SERVICE_ICON_KEYS = Object.keys(MAP) as ServiceIconKey[]

export function ServiceIcon({
  name,
  className,
}: {
  name: ServiceIconKey
  className?: string
}) {
  const Icon = MAP[name] ?? FileText
  return <Icon className={className} aria-hidden="true" />
}
