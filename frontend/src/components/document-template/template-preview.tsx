import type { PageSettings, HeaderSettings, ContentBlock, SignatureSettings, FooterSettings } from '@/types/document-template';
import { useMemo, useState, useEffect } from 'react';

import QRCode from 'qrcode';

interface SignatoryData {
    slot_id: string;
    name: string;
    nip: string;
    signed?: boolean;  // Whether this slot is signed
    signed_at?: string | null;
}

interface PreviewProps {
    pageSettings: PageSettings;
    headerSettings: HeaderSettings;
    contentBlocks: ContentBlock[];
    signatureSettings: SignatureSettings;
    footerSettings: FooterSettings | null;
    scale?: number;
    variableValues?: Record<string, any>;
    signatoriesData?: SignatoryData[];
    verificationUrl?: string;  // URL for QR code verification
    showQrCode?: boolean;  // Whether to show QR code (for fully signed letters)
    hideSignature?: boolean;  // Hide signature section (for letter preview before signing)
}

// Paper sizes in mm
const paperSizes: Record<string, { width: number; height: number }> = {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 },
    F4: { width: 215, height: 330 },
};

// Convert mm to pixels (assuming 96 DPI: 1mm = 3.78px)
const mmToPx = (mm: number) => mm * 3.78;

// Convert pt to pixels (1pt = 1.33px)
const ptToPx = (pt: number) => pt * 1.33;

// Split content blocks into pages based on page-break blocks
interface PageContent {
    blocks: ContentBlock[];
    showHeader: boolean;
    pageNumber: number;
}

export function TemplatePreview({
    pageSettings,
    headerSettings,
    contentBlocks,
    signatureSettings,
    footerSettings,
    scale = 0.6,
    variableValues = {},
    signatoriesData = [],
    verificationUrl,
    showQrCode = false,
    hideSignature = false,
}: PreviewProps) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

    useEffect(() => {
        if (showQrCode && verificationUrl) {
            QRCode.toDataURL(verificationUrl, {
                width: 150,
                margin: 0,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            })
            .then((url: string) => setQrCodeDataUrl(url))
            .catch((err: any) => console.error('Error generating QR code:', err));
        } else {
            setQrCodeDataUrl(null);
        }
    }, [showQrCode, verificationUrl]);

    const paperSize = paperSizes[pageSettings.paper_size];
    const isLandscape = pageSettings.orientation === 'landscape';

    const pageWidth = isLandscape ? paperSize.height : paperSize.width;
    const pageHeight = isLandscape ? paperSize.width : paperSize.height;

    const scaledWidth = mmToPx(pageWidth) * scale;
    const scaledHeight = mmToPx(pageHeight) * scale;

    const defaultFont = pageSettings.default_font;

    // Helper function to replace variables in text
    const replaceVariables = (text: string): string => {
        if (!text) return text;
        const replaced = text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variableValues[key] !== undefined && variableValues[key] !== ''
                ? String(variableValues[key])
                : match;
        });
        // Normalize: sequences of 3+ spaces (from old Input field data) → newline
        return replaced.replace(/ {3,}/g, '\n');
    };

    // Get layout columns count
    const getColumnCount = () => {
        const layout = signatureSettings?.layout || '1-column';
        return parseInt(layout.split('-')[0]) || 1;
    };

    // Split content into pages
    const pages = useMemo<PageContent[]>(() => {
        const result: PageContent[] = [];
        let currentBlocks: ContentBlock[] = [];
        let currentShowHeader = true; // First page always shows header if enabled
        let pageNum = 1;

        contentBlocks.forEach((block) => {
            if (block.type === 'page-break') {
                // Save current page
                result.push({
                    blocks: currentBlocks,
                    showHeader: currentShowHeader,
                    pageNumber: pageNum,
                });
                pageNum++;
                // Start new page
                currentBlocks = [];
                currentShowHeader = block.page_break?.show_header ?? true;
            } else {
                currentBlocks.push(block);
            }
        });

        // Add remaining blocks as last page
        result.push({
            blocks: currentBlocks,
            showHeader: result.length === 0 ? true : currentShowHeader,
            pageNumber: pageNum,
        });

        return result;
    }, [contentBlocks]);

    // Check if signature should appear on a specific page
    const shouldShowSignature = (pageNumber: number, totalPages: number) => {
        // If hideSignature is true, never show signature
        if (hideSignature) return false;

        const pos = signatureSettings?.page_position;

        // Default to last page if not set
        if (pos === undefined || pos === null || pos === 'last') {
            return pageNumber === totalPages;
        }

        // Convert to number for comparison
        const posNum = Number(pos);

        // If invalid number, default to last page
        if (isNaN(posNum) || posNum < 1) {
            return pageNumber === totalPages;
        }

        // If position is greater than total pages, show on last page
        if (posNum > totalPages) {
            return pageNumber === totalPages;
        }

        return pageNumber === posNum;
    };

    // Render header component
    const renderHeader = (showHeader: boolean) => {
        if (!headerSettings.enabled || !showHeader) return null;

        return (
            <div
                className="relative"
                style={{
                    minHeight: headerSettings.use_image ? 'auto' : mmToPx(headerSettings.height),
                    marginBottom: mmToPx(headerSettings.margin_bottom),
                    borderBottom: headerSettings.border_bottom.enabled
                        ? `${headerSettings.border_bottom.width}px ${headerSettings.border_bottom.style === 'double' ? 'double' : 'solid'} ${headerSettings.border_bottom.color}`
                        : 'none',
                    paddingBottom: headerSettings.border_bottom.enabled ? 8 : 0,
                }}
            >
                {/* Mode: Gambar Kop Lengkap (Full Width) */}
                {headerSettings.use_image && (
                    <>
                        {headerSettings.header_image?.src ? (
                            <div style={{ width: '100%' }}>
                                <img
                                    src={headerSettings.header_image.src}
                                    alt="Kop Surat"
                                    style={{
                                        width: '100%',
                                        height: headerSettings.header_image.height
                                            ? mmToPx(headerSettings.header_image.height)
                                            : 'auto',
                                        objectFit: headerSettings.header_image.height ? 'cover' : 'contain',
                                    }}
                                />
                            </div>
                        ) : (
                            <div
                                className="flex items-center justify-center text-gray-300 border border-dashed border-gray-300 rounded"
                                style={{
                                    width: '100%',
                                    height: mmToPx(40),
                                }}
                            >
                                <span className="text-sm">[Upload gambar kop surat]</span>
                            </div>
                        )}
                    </>
                )}

                {/* Mode: Logo + Teks */}
                {!headerSettings.use_image && (
                    <>
                        {/* Logo */}
                        {headerSettings.logo.enabled && headerSettings.logo.src && (
                            <div
                                className="absolute top-0"
                                style={{
                                    left: headerSettings.logo.position === 'left' ? mmToPx(headerSettings.logo.margin || 0) :
                                        headerSettings.logo.position === 'center' ? '50%' : 'auto',
                                    right: headerSettings.logo.position === 'right' ? mmToPx(headerSettings.logo.margin || 0) : 'auto',
                                    transform: headerSettings.logo.position === 'center' ? 'translateX(-50%)' : 'none',
                                }}
                            >
                                <img
                                    src={headerSettings.logo.src}
                                    alt="Logo"
                                    style={{
                                        width: mmToPx(headerSettings.logo.width),
                                        height: headerSettings.logo.height ? mmToPx(headerSettings.logo.height) : 'auto',
                                        objectFit: 'contain',
                                    }}
                                />
                            </div>
                        )}

                        {/* Text Lines */}
                        <div
                            className="flex flex-col"
                            style={{
                                marginLeft: headerSettings.logo.enabled && headerSettings.logo.position === 'left'
                                    ? mmToPx(headerSettings.logo.width + (headerSettings.logo.margin || 5) + 3)
                                    : 0,
                                marginRight: headerSettings.logo.enabled && headerSettings.logo.position === 'right'
                                    ? mmToPx(headerSettings.logo.width + (headerSettings.logo.margin || 5) + 3)
                                    : 0,
                            }}
                        >
                            {headerSettings.text_lines.map((line) => (
                                <div
                                    key={line.id}
                                    style={{
                                        fontFamily: line.font_family || defaultFont.family,
                                        fontSize: ptToPx(line.font_size),
                                        fontWeight: line.font_weight,
                                        fontStyle: line.font_style,
                                        textAlign: line.text_align,
                                        letterSpacing: line.letter_spacing,
                                        marginBottom: mmToPx(line.margin_bottom),
                                    }}
                                >
                                    {line.content || <span className="text-gray-400 italic text-sm">[Teks baris]</span>}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    // Render content blocks
    const renderBlocks = (blocks: ContentBlock[], isFirstPage: boolean = true) => {
        if (blocks.length === 0) {
            // Only show placeholder on first page
            if (isFirstPage) {
                return (
                    <div className="text-gray-400 text-center py-8 text-sm border border-dashed border-gray-300 rounded">
                        Tambahkan blok konten untuk melihat preview
                    </div>
                );
            }
            return null;
        }

        return blocks.map((block) => {
            const style = block.style;
            const commonStyle: React.CSSProperties = {
                fontFamily: style.font_family || defaultFont.family,
                fontSize: style.font_size ? ptToPx(style.font_size) : ptToPx(defaultFont.size),
                fontWeight: style.font_weight,
                fontStyle: style.font_style,
                textAlign: style.text_align,
                lineHeight: style.line_height || defaultFont.line_height,
                marginTop: mmToPx(style.margin_top),
                marginBottom: mmToPx(style.margin_bottom),
                marginLeft: mmToPx(style.margin_left),
                marginRight: mmToPx(style.margin_right),
                letterSpacing: style.letter_spacing,
            };

            if (block.type === 'spacer') {
                return (
                    <div
                        key={block.id}
                        style={{
                            height: mmToPx(style.margin_top + style.margin_bottom + 5),
                        }}
                    />
                );
            }

            if (block.type === 'paragraph') {
                return (
                    <p
                        key={block.id}
                        className="whitespace-pre-wrap"
                        style={{
                            ...commonStyle,
                            textIndent: mmToPx(style.indent_first_line),
                        }}
                    >
                        {block.content ? replaceVariables(block.content) : <span className="text-gray-400 italic text-sm">[Paragraf]</span>}
                    </p>
                );
            }

            // Letter Opening - Format pembuka surat Indonesia
            if (block.type === 'letter-opening') {
                const config = block.letter_opening;
                const dateConfig = config?.date;

                // Format date to Indonesian format
                const formatDateIndonesian = (dateStr: string) => {
                    if (!dateStr) return '';
                    // Already in Indonesian format like "1 Januari 2025"
                    if (/^\d{1,2}\s+\w+\s+\d{4}$/.test(dateStr)) return dateStr;
                    // Try to parse from yyyy-mm-dd
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                        const day = parseInt(parts[2], 10);
                        const month = months[parseInt(parts[1], 10) - 1];
                        const year = parts[0];
                        return `${day} ${month} ${year}`;
                    }
                    return dateStr;
                };

                // Helper function to get slot text
                const getSlotText = (slot: { source: string; text: string; prefix?: string }) => {
                    const prefix = slot.prefix || '';
                    if (slot.source === 'variable') {
                        const varText = slot.text.includes('{{') ? slot.text : `{{${slot.text}}}`;
                        return prefix + replaceVariables(varText);
                    }
                    return prefix + slot.text;
                };

                // Get column slots
                const getColumnSlots = (column: number) => {
                    return (config?.recipient_slots || [])
                        .filter(s => s.column === column)
                        .sort((a, b) => a.order - b.order);
                };

                const columnCount = config?.recipient_layout === '2-column' ? 2 : 1;

                return (
                    <div key={block.id} style={commonStyle}>
                        {/* Tanggal dan Tempat */}
                        {dateConfig?.enabled && (
                            <div style={{
                                textAlign: dateConfig.position || 'right',
                                marginBottom: mmToPx(dateConfig.spacing_bottom || 10),
                            }}>
                                {dateConfig.show_place && (
                                    <span>
                                        {dateConfig.place_source === 'variable'
                                            ? replaceVariables(dateConfig.place_text)
                                            : dateConfig.place_text}
                                    </span>
                                )}
                                {dateConfig.show_place && ', '}
                                {dateConfig.date_source === 'variable'
                                    ? formatDateIndonesian(replaceVariables(dateConfig.date_variable))
                                    : formatDateIndonesian(dateConfig.date_manual) || ''}
                            </div>
                        )}

                        {/* Penerima */}
                        {(config?.recipient_slots?.length || 0) > 0 && (
                            <div style={{ marginBottom: mmToPx(config?.spacing_after_recipient || 10) }}>
                                {columnCount === 1 ? (
                                    <div>
                                        {getColumnSlots(0).map((slot) => (
                                            <div key={slot.id} style={{ textAlign: slot.text_align || 'left' }}>
                                                {getSlotText(slot)}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div style={{ flex: 1 }}>
                                            {getColumnSlots(0).map((slot) => (
                                                <div key={slot.id} style={{ textAlign: slot.text_align || 'left' }}>
                                                    {getSlotText(slot)}
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            {getColumnSlots(1).map((slot) => (
                                                <div key={slot.id} style={{ textAlign: slot.text_align || 'right' }}>
                                                    {getSlotText(slot)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            }

            if (block.type === 'field-group') {
                const fieldGroup = block.field_group;
                const labelWidth = fieldGroup?.label_width || 25;
                const separator = fieldGroup?.separator || ':';
                const items = fieldGroup?.items || [];

                if (items.length === 0) {
                    return (
                        <div key={block.id} style={commonStyle}>
                            <span className="text-gray-400 italic text-sm">[Tambahkan field]</span>
                        </div>
                    );
                }

                return (
                    <div key={block.id} style={commonStyle}>
                        {items.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span style={{
                                    width: mmToPx(labelWidth),
                                    flexShrink: 0,
                                }}>
                                    {item.label ? replaceVariables(item.label) : <span className="text-gray-400">[Label]</span>}
                                </span>
                                <span style={{
                                    width: mmToPx(5),
                                    flexShrink: 0,
                                    textAlign: 'center',
                                }}>
                                    {separator}
                                </span>
                                <div style={{ flex: 1 }}>
                                    {item.value ? (
                                        replaceVariables(item.value).split('\n').map((line, i) => (
                                            <div key={i} style={{ minHeight: '1.2em' }}>{line}</div>
                                        ))
                                    ) : (
                                        <span className="text-gray-400">[Nilai]</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }

            // Table block
            if (block.type === 'table') {
                const tableConfig = block.table_config;
                if (!tableConfig || !tableConfig.rows || tableConfig.rows.length === 0) {
                    return (
                        <div key={block.id} style={commonStyle}>
                            <span className="text-gray-400 italic text-sm">[Tabel kosong]</span>
                        </div>
                    );
                }

                return (
                    <div key={block.id} style={commonStyle}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: style.font_size ? ptToPx(style.font_size) : ptToPx(defaultFont.size),
                            }}
                        >
                            <tbody>
                                {tableConfig.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, colIndex) => {
                                            const isHeader = rowIndex === 0 && tableConfig.header_row;
                                            const CellTag = isHeader ? 'th' : 'td';
                                            return (
                                                <CellTag
                                                    key={colIndex}
                                                    className="whitespace-pre-wrap"
                                                    style={{
                                                        border: tableConfig.border ? `1px solid ${tableConfig.border_color || '#000'}` : 'none',
                                                        padding: mmToPx(tableConfig.cell_padding || 2),
                                                        textAlign: cell.align || 'left',
                                                        fontWeight: isHeader || cell.bold ? 'bold' : 'normal',
                                                        backgroundColor: isHeader ? '#f3f4f6' : 'transparent',
                                                        width: tableConfig.column_widths?.[colIndex]
                                                            ? `${tableConfig.column_widths[colIndex]}%`
                                                            : 'auto',
                                                    }}
                                                    colSpan={cell.colspan || 1}
                                                    rowSpan={cell.rowspan || 1}
                                                >
                                                    {cell.content ? replaceVariables(cell.content) : ''}
                                                </CellTag>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }

            return (
                <div key={block.id} className="whitespace-pre-wrap" style={commonStyle}>
                    {block.content ? replaceVariables(block.content) : <span className="text-gray-400 italic text-sm">[Teks]</span>}
                </div>
            );
        });
    };

    // Render signature section
    const renderSignature = () => {
        // Always show signature section in template builder (even if no slots yet)
        // But hide if hideSignature is explicitly set
        if (hideSignature) return null;

        const columnCount = getColumnCount();
        const hasSlots = signatureSettings?.slots?.length > 0;
        const showQrInSignature = showQrCode && qrCodeDataUrl;

        // Check if we're in "letter mode" (has signatory data) vs "template builder mode"
        const isLetterMode = signatoriesData && signatoriesData.length > 0;

        return (
            <div style={{ marginTop: mmToPx(signatureSettings.margin_top || 20) }}>
                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                        gap: mmToPx(signatureSettings.column_gap || 10),
                    }}
                >
                    {/* Signature columns */}
                    {Array.from({ length: columnCount }).map((_, colIndex) => {
                        const columnSlots = (signatureSettings.slots || [])
                            .filter(s => s.column === colIndex)
                            .sort((a, b) => a.order - b.order);

                        // Show placeholder for empty columns ONLY in template builder mode
                        if (columnSlots.length === 0) {
                            // In letter mode, just return empty div (no placeholder)
                            if (isLetterMode) {
                                return <div key={colIndex} />;
                            }
                            // In template builder, show placeholder
                            return (
                                <div key={colIndex} className="text-center">
                                    <div className="text-gray-300 border border-dashed border-gray-300 p-4 text-xs">
                                        [Slot TTD Kolom {colIndex + 1}]
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={colIndex} className="flex flex-col" style={{ minWidth: 0 }}>
                                {columnSlots.map((slot) => {
                                    // Find signatory data for this slot
                                    const signatoryInfo = signatoriesData.find(s => s.slot_id === slot.id);
                                    const hasSignatory = signatoryInfo && signatoryInfo.name;
                                    const isSigned = signatoryInfo?.signed;

                                    return (
                                        <div
                                            key={slot.id}
                                            style={{
                                                textAlign: slot.text_align,
                                                fontSize: ptToPx(slot.font_size),
                                                wordWrap: 'break-word',
                                            }}
                                        >
                                            {slot.label_above && (
                                                <div>{replaceVariables(slot.label_above)}</div>
                                            )}
                                            {slot.label_position && (
                                                <div className="mb-1">{replaceVariables(slot.label_position)}</div>
                                            )}
                                            <div
                                                style={{
                                                    height: mmToPx(slot.signature_height),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: slot.text_align === 'center' ? 'center'
                                                        : slot.text_align === 'right' ? 'flex-end' : 'flex-start',
                                                }}
                                            >
                                                {/* QR Code in signature area when signed */}
                                                {isSigned && showQrInSignature ? (
                                                    <img
                                                        src={qrCodeDataUrl}
                                                        alt="QR Code"
                                                        style={{ width: mmToPx(18), height: mmToPx(18) }}
                                                    />
                                                ) : isSigned ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-green-700 text-center text-[10px] italic border-b border-green-600 pb-0.5">
                                                            ✓ TTD Digital
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 border-b-2 border-dashed border-gray-400 w-32 text-center text-xs py-2">
                                                        [tanda tangan]
                                                    </div>
                                                )}
                                            </div>
                                            {slot.show_name && (
                                                <div className="font-bold underline mt-1">
                                                    {hasSignatory ? (
                                                        <span>{signatoryInfo.name}</span>
                                                    ) : (
                                                        <span className="text-gray-500">[Nama]</span>
                                                    )}
                                                </div>
                                            )}
                                            {slot.show_nip && (
                                                <div className="text-xs">
                                                    NIP. {hasSignatory && signatoryInfo.nip ? (
                                                        <span>{signatoryInfo.nip}</span>
                                                    ) : (
                                                        <span className="text-gray-500">[NIP]</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render footer
    const renderFooter = () => {
        // Show verification footer if QR code is enabled, regardless of footerSettings
        const showVerificationFooter = showQrCode && qrCodeDataUrl;

        if (!footerSettings?.enabled && !showVerificationFooter) return null;

        return (
            <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                    paddingLeft: mmToPx(pageSettings.margins.left),
                    paddingRight: mmToPx(pageSettings.margins.right),
                    marginBottom: mmToPx(pageSettings.margins.bottom),
                }}
            >
                {/* Original footer content */}
                {footerSettings?.enabled && (
                    <div
                        style={{
                            height: mmToPx(footerSettings.height),
                            textAlign: footerSettings.text_align,
                            fontSize: ptToPx(footerSettings.font_size),
                            color: footerSettings.text_color,
                            borderTop: footerSettings.show_page_numbers ? '1px solid #e5e7eb' : 'none',
                            paddingTop: ptToPx(5),
                        }}
                    >
                        {replaceVariables(footerSettings.content)}
                    </div>
                )}

                {/* QR Code Verification Footer */}
                {showVerificationFooter && (
                    <div
                        className="border-t border-gray-300 pt-2 mt-1 flex items-center gap-2"
                        style={{ fontSize: ptToPx(7) }}
                    >
                        <img
                            src={qrCodeDataUrl}
                            alt="QR Verifikasi"
                            style={{ width: mmToPx(12), height: mmToPx(12) }}
                        />
                        <div className="text-gray-500">
                            <div>Dokumen ini ditandatangani secara elektronik</div>
                            <div>dan sah sesuai UU ITE. Scan QR untuk verifikasi.</div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render a single page
    const renderPage = (page: PageContent, pageIndex: number, totalPages: number) => {
        const showSig = shouldShowSignature(page.pageNumber, totalPages);
        const isFirstPage = pageIndex === 0;

        return (
            <div
                key={pageIndex}
                className="bg-white shadow-lg border border-gray-300 template-preview-content"
                style={{
                    width: scaledWidth,
                    height: scaledHeight,
                    minWidth: scaledWidth,
                    overflow: 'hidden',
                }}
            >
                <div
                    className="origin-top-left"
                    style={{
                        width: mmToPx(pageWidth),
                        height: mmToPx(pageHeight),
                        transform: `scale(${scale})`,
                        fontFamily: defaultFont.family,
                        fontSize: ptToPx(defaultFont.size),
                        lineHeight: defaultFont.line_height,
                        paddingTop: mmToPx(pageSettings.margins.top),
                        paddingBottom: mmToPx(pageSettings.margins.bottom),
                        paddingLeft: mmToPx(pageSettings.margins.left),
                        paddingRight: mmToPx(pageSettings.margins.right),
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Header - only if showHeader is true */}
                    {renderHeader(page.showHeader)}

                    {/* Content Blocks */}
                    <div>
                        {renderBlocks(page.blocks, isFirstPage)}
                    </div>

                    {/* Signature - follows content, based on page_position setting */}
                    {showSig && renderSignature()}

                    {/* Footer - absolute at bottom */}
                    {renderFooter()}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4">
            {pages.map((page, index) => {
                const showSig = shouldShowSignature(page.pageNumber, pages.length);
                const hasContent = page.blocks.length > 0;

                // Always show all pages - don't skip any
                return (
                    <div key={index} className="relative">
                        {/* Page number indicator */}
                        {pages.length > 1 && (
                            <div className="absolute -top-5 left-0 text-xs text-muted-foreground">
                                Halaman {page.pageNumber} dari {pages.length}
                                {!page.showHeader && index > 0 && (
                                    <span className="ml-2 text-amber-600">(tanpa kop)</span>
                                )}
                                {showSig && (
                                    <span className="ml-2 text-blue-600">(TTD)</span>
                                )}
                            </div>
                        )}
                        {renderPage(page, index, pages.length)}
                    </div>
                );
            })}
        </div>
    );
}
