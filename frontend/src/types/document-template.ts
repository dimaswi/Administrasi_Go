export interface PageSettings {
    paper_size: 'A4' | 'Letter' | 'Legal' | 'F4';
    orientation: 'portrait' | 'landscape';
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    default_font: {
        family: string;
        size: number;
        line_height: number;
    };
}

export interface HeaderLogo {
    enabled: boolean;
    position: 'left' | 'center' | 'right';
    width: number;
    height: number | null;
    src: string | null;
    margin: number;
}

export interface HeaderTextLine {
    id: string;
    content: string;
    font_family: string | null;
    font_size: number;
    font_weight: 'normal' | 'bold';
    font_style: 'normal' | 'italic';
    text_align: 'left' | 'center' | 'right';
    letter_spacing: number;
    margin_bottom: number;
}

export interface HeaderBorder {
    enabled: boolean;
    style: 'single' | 'double' | 'none';
    width: number;
    color: string;
}

export interface HeaderImage {
    enabled: boolean;
    src: string | null;
    height: number | null; // null = auto
}

export interface HeaderSettings {
    enabled: boolean;
    height: number;
    margin_bottom: number;
    use_image: boolean; // true = pakai gambar kop lengkap, false = pakai logo + teks
    header_image: HeaderImage;
    logo: HeaderLogo;
    text_lines: HeaderTextLine[];
    border_bottom: HeaderBorder;
}

export interface BlockStyle {
    font_family: string | null;
    font_size: number | null;
    font_weight: 'normal' | 'bold';
    font_style: 'normal' | 'italic';
    text_align: 'left' | 'center' | 'right' | 'justify';
    line_height: number | null;
    margin_top: number;
    margin_bottom: number;
    margin_left: number;
    margin_right: number;
    indent_first_line: number;
    letter_spacing: number;
}

export interface FieldItem {
    id: string;
    label: string;
    value: string;
}

export interface FieldGroupConfig {
    label_width: number; // width in mm
    separator: string; // default ':'
    items: FieldItem[];
}

export interface PageBreakConfig {
    show_header: boolean; // true = tampilkan kop di halaman baru
}

// Letter Opening Config - Format pembuka surat Indonesia
export interface LetterDateConfig {
    enabled: boolean;
    position: 'left' | 'right';
    show_place: boolean;
    place_source: 'manual' | 'variable';
    place_text: string; // Teks manual atau variabel {{tempat}}
    date_source: 'manual' | 'variable';
    date_variable: string; // variabel seperti {{tanggal_surat}}
    date_manual: string; // tanggal manual jika tidak pakai variabel
    spacing_bottom: number; // mm
}

export interface RecipientSlot {
    id: string;
    column: number; // 0 = kiri, 1 = kanan (untuk 2 kolom)
    order: number;
    type: 'label' | 'title' | 'name' | 'address' | 'custom';
    source: 'manual' | 'variable';
    text: string; // teks manual atau variabel
    prefix: string; // seperti "di-" untuk alamat
    text_align: 'left' | 'center' | 'right'; // rata teks per slot
}

export interface LetterOpeningConfig {
    date: LetterDateConfig;
    recipient_layout: '1-column' | '2-column';
    recipient_column_position: 'left' | 'right'; // untuk 1 kolom
    recipient_slots: RecipientSlot[];
    spacing_after_recipient: number; // mm
}

export interface ContentBlock {
    id: string;
    type: 'text' | 'paragraph' | 'spacer' | 'table' | 'list' | 'field-group' | 'page-break' | 'letter-opening';
    content: string;
    style: BlockStyle;
    table_config?: TableConfig;
    field_group?: FieldGroupConfig;
    page_break?: PageBreakConfig;
    letter_opening?: LetterOpeningConfig;
}

export interface TableCell {
    content: string;
    colspan?: number;
    rowspan?: number;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
}

export interface TableConfig {
    columns: number;
    rows: TableCell[][];
    border: boolean;
    border_color: string;
    header_row: boolean; // First row as header with bold text and background
    column_widths: number[]; // Width in percentage (should sum to 100)
    cell_padding: number; // in mm
}

export interface FooterSettings {
    enabled: boolean;
    height: number;
    content: string;
    text_align: 'left' | 'center' | 'right';
    font_size: number;
    text_color?: string;
    show_page_numbers?: boolean;
}

export interface SignatureSlot {
    id: string;
    column: number;
    order: number;
    label_above: string;
    label_position: string;
    show_name: boolean;
    show_nip: boolean;
    signature_height: number;
    text_align: 'left' | 'center' | 'right';
    font_size: number;
}

export interface SignatureSettings {
    margin_top: number;
    layout: '1-column' | '2-column' | '3-column' | '4-column';
    column_gap: number;
    page_position: 'last' | number; // 'last' = halaman terakhir, angka = halaman tertentu
    slots: SignatureSlot[];
}

export interface TemplateVariable {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'date' | 'number' | 'select';
    source: 'manual' | 'auto_number' | 'auto_date' | 'auto_user' | 'auto_unit';
    required: boolean;
    readonly: boolean;
    default_value: string | null;
    options: string[];
    placeholder: string;
}

export interface DocumentTemplate {
    id?: number;
    name: string;
    code: string;
    category: string | null;
    organization_unit_id: number | null;
    numbering_group_id: number | null;
    description: string | null;
    page_settings: PageSettings;
    header_settings: HeaderSettings;
    content_blocks: ContentBlock[];
    footer_settings: FooterSettings | null;
    signature_settings: SignatureSettings;
    variables: TemplateVariable[];
    numbering_format: string | null;
    is_active: boolean;
}

export interface PaperSize {
    width: number;
    height: number;
}

export interface PaperSizes {
    [key: string]: PaperSize;
}

// Default values
export const defaultBlockStyle: BlockStyle = {
    font_family: null,
    font_size: null,
    font_weight: 'normal',
    font_style: 'normal',
    text_align: 'left',
    line_height: null,
    margin_top: 0,
    margin_bottom: 0,
    margin_left: 0,
    margin_right: 0,
    indent_first_line: 0,
    letter_spacing: 0,
};

export const defaultContentBlock: ContentBlock = {
    id: '',
    type: 'text',
    content: '',
    style: { ...defaultBlockStyle },
};

export const defaultTableCell: TableCell = {
    content: '',
    colspan: 1,
    rowspan: 1,
    align: 'left',
    bold: false,
};

export const defaultTableConfig: TableConfig = {
    columns: 3,
    rows: [
        [{ content: 'Header 1', align: 'center', bold: true }, { content: 'Header 2', align: 'center', bold: true }, { content: 'Header 3', align: 'center', bold: true }],
        [{ content: '', align: 'left' }, { content: '', align: 'left' }, { content: '', align: 'left' }],
    ],
    border: true,
    border_color: '#000000',
    header_row: true,
    column_widths: [33.33, 33.33, 33.34],
    cell_padding: 2,
};

export const defaultFieldGroupConfig: FieldGroupConfig = {
    label_width: 25,
    separator: ':',
    items: [],
};

export const defaultPageBreakConfig: PageBreakConfig = {
    show_header: true,
};

export const defaultLetterDateConfig: LetterDateConfig = {
    enabled: true,
    position: 'right',
    show_place: true,
    place_source: 'variable',
    place_text: '{{tempat}}',
    date_source: 'variable',
    date_variable: '{{tanggal_surat}}',
    date_manual: '',
    spacing_bottom: 10,
};

export const defaultRecipientSlot: RecipientSlot = {
    id: '',
    column: 0,
    order: 0,
    type: 'label',
    source: 'manual',
    text: '',
    prefix: '',
    text_align: 'left',
};

export const defaultLetterOpeningConfig: LetterOpeningConfig = {
    date: { ...defaultLetterDateConfig },
    recipient_layout: '1-column',
    recipient_column_position: 'left',
    recipient_slots: [],
    spacing_after_recipient: 10,
};

export const defaultFieldItem: FieldItem = {
    id: '',
    label: '',
    value: '',
};

export const defaultSignatureSlot: SignatureSlot = {
    id: '',
    column: 0,
    order: 0,
    label_above: '',
    label_position: '',
    show_name: true,
    show_nip: true,
    signature_height: 25,
    text_align: 'center',
    font_size: 12,
};

export const defaultVariable: TemplateVariable = {
    key: '',
    label: '',
    type: 'text',
    source: 'manual',
    required: false,
    readonly: false,
    default_value: null,
    options: [],
    placeholder: '',
};
