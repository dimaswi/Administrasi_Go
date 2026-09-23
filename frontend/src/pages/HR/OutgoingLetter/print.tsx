import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TemplatePreview } from '@/components/document-template/template-preview';

export default function OutgoingLetterPrint() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    const [letter, setLetter] = useState<any>(null);
    const [template, setTemplate] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                if (!token) throw new Error("No token provided");
                
                // Fetch Letter
                const resLetter = await fetch(`http://localhost:8080/api/outgoing-letters/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (resLetter.ok) {
                    const data = await resLetter.json();
                    setLetter(data.data);
                    
                    // Fetch Template based on letter.template_id
                    if (data.data && data.data.template_id) {
                        const resTpl = await fetch(`http://localhost:8080/api/document-templates/${data.data.template_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (resTpl.ok) {
                            const tplData = await resTpl.json();
                            const tpl = tplData.data;
                            
                            const parseJson = (str: any, defaultVal: any) => {
                                try { return typeof str === 'string' ? JSON.parse(str) : (str || defaultVal); } 
                                catch(e) { return defaultVal; }
                            };
                
                            tpl.parsedVars = parseJson(tpl.variables, []);
                            tpl.parsedSig = parseJson(tpl.signature_settings, { slots: [] });
                            tpl.parsedHeader = parseJson(tpl.header_settings, { enabled: false, text_lines: [], logo: {} });
                            tpl.parsedPage = parseJson(tpl.page_settings, { paper_size: 'A4', orientation: 'portrait', default_font: { family: 'Arial', size: 12 } });
                            tpl.parsedContent = parseJson(tpl.content_blocks, []);
                            tpl.parsedFooter = parseJson(tpl.footer_settings, { enabled: false, text: '' });
                            setTemplate(tpl);
                        }
                    }
                }

                // Fetch Users for Signatories mapping
                const resUsers = await fetch(`http://localhost:8080/api/users?perPage=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resUsers.ok) {
                    const dataUsers = await resUsers.json();
                    setUsers(dataUsers.data || []);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id, token]);

    if (loading || !letter || !template) {
        return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Memuat...</div>;
    }

    const varValues = letter.variable_values ? (typeof letter.variable_values === 'string' ? JSON.parse(letter.variable_values) : letter.variable_values) : {};
    const previewVariableValues = { ...varValues };
    
    if (template.parsedVars) {
        template.parsedVars.forEach((v: any) => {
            if (v.source && v.source !== 'manual') {
                const key = v.key || v.name;
                const isPlaceholder = !previewVariableValues[key] || previewVariableValues[key].toString().includes('[Diisi Otomatis');
                
                if (v.source === 'auto_number') {
                    previewVariableValues[key] = letter.letter_number || (isPlaceholder ? '[Diisi Otomatis oleh Sistem]' : previewVariableValues[key]);
                }
                else if (v.source === 'auto_date') {
                    if (letter.letter_date) {
                        previewVariableValues[key] = new Date(letter.letter_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                    } else if (isPlaceholder) {
                        previewVariableValues[key] = '[Diisi Saat TTD Terakhir]';
                    }
                }
            }
        });
    }

    const verificationUrl = `http://localhost:5173/verify/${letter.id}`;

    // Map Signatories Data directly from letter to ensure it works even if user list fails
    const signatoriesData = letter.signatories?.map((sig: any) => ({
        slot_id: sig.slot_id,
        signed: sig.status === 'signed',
        signed_at: sig.signed_at
    })) || [];
    
    // Calculate dynamic paper size in mm
    const pageSettings = template?.parsedPage || { paper_size: 'A4', orientation: 'portrait' };
    const paperSizes: Record<string, { width: number; height: number }> = {
        A4: { width: 210, height: 297 },
        Legal: { width: 216, height: 356 },
        F4: { width: 215, height: 330 },
    };
    const pSize = paperSizes[pageSettings.paper_size as keyof typeof paperSizes] || paperSizes.A4;
    const isLandscape = pageSettings.orientation === 'landscape';
    const pageWidth = isLandscape ? pSize.height : pSize.width;
    const pageHeight = isLandscape ? pSize.width : pSize.height;

    return (
        <div id="print-ready" style={{ width: '100%', minHeight: '100vh', backgroundColor: 'white' }}>
            <style>
                {`
                    @media print {
                        @page {
                            margin: 0;
                            size: ${pageWidth}mm ${pageHeight}mm;
                        }
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            margin: 0;
                            padding: 0;
                        }
                    }
                `}
            </style>
            <TemplatePreview 
                pageSettings={template.parsedPage}
                headerSettings={template.parsedHeader}
                contentBlocks={template.parsedContent}
                signatureSettings={template.parsedSig}
                footerSettings={template.parsedFooter}
                scale={1.0}
                variableValues={previewVariableValues}
                signatoriesData={signatoriesData}
                verificationUrl={verificationUrl}
                showQrCode={letter.status === 'fully_signed' || letter.status === 'approved'}
                isPrintMode={true}
            />
        </div>
    );
}
